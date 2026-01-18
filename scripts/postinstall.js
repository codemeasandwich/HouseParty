#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const BIN_DIR = path.join(CLAUDE_DIR, 'bin');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const PERSONAS_DIR = path.join(CLAUDE_DIR, 'personas');
const STATE_FILE = path.join(CLAUDE_DIR, 'persona-state.json');
const WRAPPER_PATH = path.join(BIN_DIR, 'claude-wrapper');
const CLAUDE_MD_PATH = path.join(CLAUDE_DIR, 'CLAUDE.md');

// Source directory for persona files
const SOURCE_DIR = path.join(__dirname, '..', 'PUT_YOUR_MDs_HERE');
const SOURCE_CLAUDE_MD = path.join(SOURCE_DIR, '.claude.md');
const SOURCE_SKILLS_DIR = path.join(SOURCE_DIR, 'skills');
const SOURCE_PERSONAS_DIR = path.join(SOURCE_DIR, 'personas');

// Platform-specific paths
const platform = os.platform();
const VSCODE_EXT_DIR = path.join(os.homedir(), '.vscode', 'extensions', 'claude-persona-switcher');

function getVSCodeSettingsPath() {
    switch (platform) {
        case 'darwin':
            return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
        case 'linux':
            return path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json');
        case 'win32':
            return path.join(process.env.APPDATA || '', 'Code', 'User', 'settings.json');
        default:
            return null;
    }
}

// ANSI colors
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const dim = (text) => `\x1b[2m${text}\x1b[0m`;

// Files to exclude from copying (documentation files)
const EXCLUDED_FILES = ['readme.md', 'files.md'];

// Helper to copy directory recursively
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        // Skip documentation files
        if (EXCLUDED_FILES.includes(file.toLowerCase())) {
            continue;
        }
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper to copy skills directory, flattening subfolders with prefix
// e.g., packages/api-ape-client.md -> packages_api-ape-client.md
function copySkillsFlattened(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let count = 0;

    for (const entry of fs.readdirSync(src)) {
        if (EXCLUDED_FILES.includes(entry.toLowerCase())) {
            continue;
        }
        const srcPath = path.join(src, entry);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            // Subfolder: flatten with prefix
            for (const file of fs.readdirSync(srcPath)) {
                if (EXCLUDED_FILES.includes(file.toLowerCase())) {
                    continue;
                }
                const fileSrcPath = path.join(srcPath, file);
                if (fs.statSync(fileSrcPath).isFile() && file.endsWith('.md')) {
                    const destPath = path.join(dest, `${entry}_${file}`);
                    fs.copyFileSync(fileSrcPath, destPath);
                    count++;
                }
            }
        } else if (entry.endsWith('.md')) {
            // Root-level file: copy as-is
            const destPath = path.join(dest, entry);
            fs.copyFileSync(srcPath, destPath);
            count++;
        }
    }
    return count;
}

// Check if already installed
const isUpgrade = fs.existsSync(WRAPPER_PATH) || fs.existsSync(VSCODE_EXT_DIR);

if (isUpgrade) {
    console.log('\n' + cyan('Claude Persona Switcher - Upgrading') + '\n');
} else {
    console.log('\n' + cyan('Claude Persona Switcher - Installation') + '\n');
}

// 1. Create directories
console.log(dim('Creating directories...'));
fs.mkdirSync(BIN_DIR, { recursive: true });
fs.mkdirSync(VSCODE_EXT_DIR, { recursive: true });

// 2. Copy wrapper script
const wrapperSrc = path.join(__dirname, '..', 'bin', 'claude-wrapper');
const wrapperDest = WRAPPER_PATH;

if (isUpgrade && fs.existsSync(wrapperDest)) {
    console.log(dim('Updating wrapper script...'));
} else {
    console.log(dim('Installing wrapper script...'));
}
fs.copyFileSync(wrapperSrc, wrapperDest);
fs.chmodSync(wrapperDest, '755');
console.log(green('  ✓') + ` ${isUpgrade ? 'Updated' : 'Installed'} ${wrapperDest}`);

// 3. Initialize state file if not exists
if (!fs.existsSync(STATE_FILE)) {
    console.log(dim('Initializing persona state...'));
    const initialState = {
        version: 1,
        default: 'stem',
        folders: {}
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
    console.log(green('  ✓') + ` Created ${STATE_FILE}`);
} else {
    console.log(dim('Persona state already exists, skipping...'));
}

// 4. Build and install VSCode extension
console.log(dim('Building VSCode extension...'));
const extSrcDir = path.join(__dirname, '..', 'vscode-extension');

try {
    // Install extension dependencies
    execSync('npm install', { cwd: extSrcDir, stdio: 'pipe' });

    // Compile TypeScript
    execSync('npm run compile', { cwd: extSrcDir, stdio: 'pipe' });

    // Copy compiled extension to VSCode extensions folder
    const extPackageJson = path.join(extSrcDir, 'package.json');
    const extOutDir = path.join(extSrcDir, 'out');

    fs.copyFileSync(extPackageJson, path.join(VSCODE_EXT_DIR, 'package.json'));

    // Copy out directory
    copyDir(extOutDir, path.join(VSCODE_EXT_DIR, 'out'));
    console.log(green('  ✓') + ` ${isUpgrade ? 'Updated' : 'Installed'} VSCode extension to ${VSCODE_EXT_DIR}`);
} catch (err) {
    console.log(yellow('  ⚠') + ' VSCode extension build failed (optional). You can build it manually later.');
    console.log(dim(`    Error: ${err.message}`));
}

// 5. Copy persona files from PUT_YOUR_MDs_HERE/
console.log(dim('Installing persona files...'));

// Copy CLAUDE.md (from .claude.md source)
if (fs.existsSync(SOURCE_CLAUDE_MD)) {
    fs.copyFileSync(SOURCE_CLAUDE_MD, CLAUDE_MD_PATH);
    console.log(green('  ✓') + ` Copied CLAUDE.md to ${CLAUDE_DIR}`);
} else {
    console.log(yellow('  ⚠') + ` Source file not found: ${SOURCE_CLAUDE_MD}`);
}

// Copy skills directory (flattening subfolders with prefix)
if (fs.existsSync(SOURCE_SKILLS_DIR)) {
    const skillCount = copySkillsFlattened(SOURCE_SKILLS_DIR, SKILLS_DIR);
    console.log(green('  ✓') + ` Copied ${skillCount} skill files to ${SKILLS_DIR}`);
} else {
    console.log(yellow('  ⚠') + ` Source directory not found: ${SOURCE_SKILLS_DIR}`);
}

// Copy personas directory (adding persona- prefix to filenames)
if (fs.existsSync(SOURCE_PERSONAS_DIR)) {
    fs.mkdirSync(PERSONAS_DIR, { recursive: true });
    const personaFiles = fs.readdirSync(SOURCE_PERSONAS_DIR).filter(f => f.endsWith('.md') && !EXCLUDED_FILES.includes(f.toLowerCase()));
    for (const file of personaFiles) {
        const srcPath = path.join(SOURCE_PERSONAS_DIR, file);
        const destPath = path.join(PERSONAS_DIR, `persona-${file}`);
        fs.copyFileSync(srcPath, destPath);
    }
    console.log(green('  ✓') + ` Copied ${personaFiles.length} persona files to ${PERSONAS_DIR}`);
} else {
    console.log(yellow('  ⚠') + ` Source directory not found: ${SOURCE_PERSONAS_DIR}`);
}

// List installed personas
const installedPersonas = fs.existsSync(PERSONAS_DIR)
    ? fs.readdirSync(PERSONAS_DIR).filter(f => f.endsWith('.md'))
    : [];
if (installedPersonas.length > 0) {
    console.log(green('  ✓') + ` Personas: ${installedPersonas.map(f => f.replace('persona-', '').replace('.md', '')).join(', ')}`);
}

// List installed skills by category
const installedSkills = fs.existsSync(SKILLS_DIR)
    ? fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'))
    : [];
if (installedSkills.length > 0) {
    const categories = {};
    for (const skill of installedSkills) {
        const [category] = skill.includes('_') ? skill.split('_') : ['root'];
        categories[category] = (categories[category] || 0) + 1;
    }
    const summary = Object.entries(categories).map(([cat, count]) => `${cat}(${count})`).join(', ');
    console.log(green('  ✓') + ` Skills: ${summary}`);
}

// 6. Configure VSCode settings
console.log(dim('Configuring VSCode...'));
const vscodeSettingsPath = getVSCodeSettingsPath();

if (!vscodeSettingsPath) {
    console.log(yellow('  ⚠') + ` Unsupported platform: ${platform}`);
    console.log(dim('    Add this to your VSCode settings.json:'));
    console.log(dim(`    "claudeCode.claudeProcessWrapper": "${wrapperDest}"`));
} else if (fs.existsSync(vscodeSettingsPath)) {
    try {
        const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf-8'));

        if (!settings['claudeCode.claudeProcessWrapper']) {
            settings['claudeCode.claudeProcessWrapper'] = wrapperDest;
            fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2));
            console.log(green('  ✓') + ' Added claudeCode.claudeProcessWrapper to VSCode settings');
        } else {
            console.log(dim('  claudeCode.claudeProcessWrapper already configured'));
        }
    } catch (err) {
        console.log(yellow('  ⚠') + ' Could not update VSCode settings automatically.');
        console.log(dim('    Add this to your VSCode settings.json:'));
        console.log(dim(`    "claudeCode.claudeProcessWrapper": "${wrapperDest}"`));
    }
} else {
    console.log(yellow('  ⚠') + ' VSCode settings.json not found. Is VSCode installed?');
    console.log(dim('    Add this to your VSCode settings.json:'));
    console.log(dim(`    "claudeCode.claudeProcessWrapper": "${wrapperDest}"`));
}

// Done
if (isUpgrade) {
    console.log('\n' + green('Upgrade complete!') + '\n');
    console.log('Changes will take effect after restarting VSCode.\n');
} else {
    console.log('\n' + green('Installation complete!') + '\n');
    console.log('Next steps:');
    console.log('  1. ' + cyan('Restart VSCode') + ' (or Cmd+Shift+P → "Developer: Reload Window")');
    console.log('  2. Look for the persona indicator in the status bar');
    console.log('  3. Click it to switch personas, or use "Claude: Switch Persona" command');
    console.log('  4. Start a new Claude conversation to use the selected persona\n');
}
