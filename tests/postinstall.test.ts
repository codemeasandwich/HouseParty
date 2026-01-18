import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'bun';
import { createTestContext, type TestContext } from './utils/tempDir';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

const POSTINSTALL_SCRIPT = join(import.meta.dir, '..', 'scripts', 'postinstall.js');
const PROJECT_ROOT = join(import.meta.dir, '..');

// Shared context for tests that don't need isolated state
let sharedCtx: TestContext;
let sharedResult: { stdout: string; stderr: string; exitCode: number };

describe('Postinstall Script', () => {
  // Run postinstall once for shared tests
  beforeAll(async () => {
    sharedCtx = createTestContext();
    const vscodeSettingsDir = join(sharedCtx.homeDir, 'Library', 'Application Support', 'Code', 'User');
    mkdirSync(vscodeSettingsDir, { recursive: true });
    writeFileSync(join(vscodeSettingsDir, 'settings.json'), '{}');

    const proc = spawn({
      cmd: ['node', POSTINSTALL_SCRIPT],
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        HOME: sharedCtx.homeDir
      },
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    sharedResult = { stdout, stderr, exitCode };
  }, 60000); // 60 second timeout for setup

  afterAll(() => {
    sharedCtx?.cleanup();
  });

  describe('Directory Creation', () => {
    test('creates ~/.claude/bin directory', () => {
      expect(existsSync(sharedCtx.binDir)).toBe(true);
    });

    test('creates VSCode extension directory', () => {
      const extDir = join(sharedCtx.homeDir, '.vscode', 'extensions', 'claude-persona-switcher');
      expect(existsSync(extDir)).toBe(true);
    });
  });

  describe('Wrapper Installation', () => {
    test('copies wrapper script to ~/.claude/bin', () => {
      const wrapperPath = join(sharedCtx.binDir, 'claude-wrapper');
      expect(existsSync(wrapperPath)).toBe(true);
    });

    test('sets executable permissions on wrapper', () => {
      const wrapperPath = join(sharedCtx.binDir, 'claude-wrapper');
      const stats = statSync(wrapperPath);
      expect(stats.mode & 0o111).toBeGreaterThan(0);
    });
  });

  describe('State File Initialization', () => {
    test('creates persona-state.json if not exists', () => {
      expect(existsSync(sharedCtx.stateFile)).toBe(true);
    });

    test('initializes state with correct structure', () => {
      const state = JSON.parse(readFileSync(sharedCtx.stateFile, 'utf-8'));

      expect(state.version).toBe(1);
      expect(state.default).toBe('stem');
      expect(state.folders).toEqual({});
    });

    test('does not overwrite existing state file', async () => {
      // This test needs isolated context
      const ctx = createTestContext();
      try {
        const vscodeSettingsDir = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User');
        mkdirSync(vscodeSettingsDir, { recursive: true });
        writeFileSync(join(vscodeSettingsDir, 'settings.json'), '{}');

        const existingState = { version: 1, default: 'tars', folders: { '/test': { persona: 'stem', lastUsed: '2024-01-01' } } };
        writeFileSync(ctx.stateFile, JSON.stringify(existingState));

        const proc = spawn({
          cmd: ['node', POSTINSTALL_SCRIPT],
          cwd: PROJECT_ROOT,
          env: { ...process.env, HOME: ctx.homeDir },
          stdout: 'pipe',
          stderr: 'pipe'
        });
        await proc.exited;

        const state = JSON.parse(readFileSync(ctx.stateFile, 'utf-8'));
        expect(state.default).toBe('tars');
        expect(state.folders['/test']).toBeDefined();
      } finally {
        ctx.cleanup();
      }
    }, 60000);
  });

  describe('VSCode Settings', () => {
    test('adds claudeCode.claudeProcessWrapper to settings.json', () => {
      const settingsPath = join(sharedCtx.homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

      expect(settings['claudeCode.claudeProcessWrapper']).toBe(join(sharedCtx.binDir, 'claude-wrapper'));
    });

    test('does not overwrite existing claudeCode.claudeProcessWrapper', async () => {
      const ctx = createTestContext();
      try {
        const vscodeSettingsDir = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User');
        mkdirSync(vscodeSettingsDir, { recursive: true });
        writeFileSync(join(vscodeSettingsDir, 'settings.json'), JSON.stringify({
          'claudeCode.claudeProcessWrapper': '/custom/path'
        }));

        const proc = spawn({
          cmd: ['node', POSTINSTALL_SCRIPT],
          cwd: PROJECT_ROOT,
          env: { ...process.env, HOME: ctx.homeDir },
          stdout: 'pipe',
          stderr: 'pipe'
        });
        await proc.exited;

        const settings = JSON.parse(readFileSync(join(vscodeSettingsDir, 'settings.json'), 'utf-8'));
        expect(settings['claudeCode.claudeProcessWrapper']).toBe('/custom/path');
      } finally {
        ctx.cleanup();
      }
    }, 60000);

    test('handles missing VSCode settings.json gracefully', async () => {
      const ctx = createTestContext();
      try {
        // Don't create settings.json
        const proc = spawn({
          cmd: ['node', POSTINSTALL_SCRIPT],
          cwd: PROJECT_ROOT,
          env: { ...process.env, HOME: ctx.homeDir },
          stdout: 'pipe',
          stderr: 'pipe'
        });
        const exitCode = await proc.exited;

        expect(exitCode).toBe(0);
      } finally {
        ctx.cleanup();
      }
    }, 60000);
  });

  describe('Persona Files Installation', () => {
    test('copies CLAUDE.md to ~/.claude/', () => {
      const claudeMdPath = join(sharedCtx.homeDir, '.claude', 'CLAUDE.md');
      expect(existsSync(claudeMdPath)).toBe(true);
    });

    test('copies skills directory to ~/.claude/skills/', () => {
      const skillsDir = join(sharedCtx.homeDir, '.claude', 'skills');
      expect(existsSync(skillsDir)).toBe(true);
    });

    test('copies persona files to ~/.claude/personas/', () => {
      const personasDir = join(sharedCtx.homeDir, '.claude', 'personas');
      expect(existsSync(personasDir)).toBe(true);
      expect(existsSync(join(personasDir, 'persona-tars.md'))).toBe(true);
      expect(existsSync(join(personasDir, 'persona-red-queen.md'))).toBe(true);
      expect(existsSync(join(personasDir, 'persona-stem.md'))).toBe(true);
    });

    test('copies workflow skill files with flattened prefix', () => {
      const skillsDir = join(sharedCtx.homeDir, '.claude', 'skills');
      expect(existsSync(join(skillsDir, 'workflow_1-capture.md'))).toBe(true);
      expect(existsSync(join(skillsDir, 'workflow_2-requirements.md'))).toBe(true);
      expect(existsSync(join(skillsDir, 'workflow_6-completion.md'))).toBe(true);
    });
  });

  describe('Output Messages', () => {
    test('shows installation complete message', () => {
      expect(sharedResult.stdout).toContain('Installation complete');
    });

    test('shows wrapper installation path', () => {
      expect(sharedResult.stdout).toContain('claude-wrapper');
    });

    test('shows persona files copied message', () => {
      expect(sharedResult.stdout).toContain('Copied CLAUDE.md');
    });

    test('shows skill files copied message', () => {
      expect(sharedResult.stdout).toContain('skill files');
    });
  });
});
