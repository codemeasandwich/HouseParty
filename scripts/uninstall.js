#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const BIN_DIR = path.join(CLAUDE_DIR, 'bin');
const VSCODE_EXT_DIR = path.join(os.homedir(), '.vscode', 'extensions', 'claude-persona-switcher');
const WRAPPER_PATH = path.join(BIN_DIR, 'claude-wrapper');

// Platform-specific paths
const platform = os.platform();

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

console.log('\n' + cyan('Claude Persona Switcher - Uninstall') + '\n');

// 1. Remove wrapper script
if (fs.existsSync(WRAPPER_PATH)) {
    fs.unlinkSync(WRAPPER_PATH);
    console.log(green('  ✓') + ` Removed ${WRAPPER_PATH}`);
} else {
    console.log(dim('  Wrapper script not found, skipping...'));
}

// 2. Remove VSCode extension
if (fs.existsSync(VSCODE_EXT_DIR)) {
    fs.rmSync(VSCODE_EXT_DIR, { recursive: true });
    console.log(green('  ✓') + ` Removed ${VSCODE_EXT_DIR}`);
} else {
    console.log(dim('  VSCode extension not found, skipping...'));
}

// 3. Remove VSCode setting
const vscodeSettingsPath = getVSCodeSettingsPath();

if (vscodeSettingsPath && fs.existsSync(vscodeSettingsPath)) {
    try {
        const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf-8'));

        if (settings['claudeCode.claudeProcessWrapper']) {
            delete settings['claudeCode.claudeProcessWrapper'];
            fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2));
            console.log(green('  ✓') + ' Removed claudeCode.claudeProcessWrapper from VSCode settings');
        }
    } catch (err) {
        console.log(yellow('  ⚠') + ' Could not update VSCode settings automatically.');
        console.log(dim('    Please remove claudeCode.claudeProcessWrapper from settings.json manually.'));
    }
}

// Note: We don't remove persona-state.json to preserve user's persona preferences
console.log(dim('\n  Note: ~/.claude/persona-state.json was preserved (contains your persona settings)'));

console.log('\n' + green('Uninstall complete!') + '\n');
console.log('Restart VSCode to complete the removal.\n');
