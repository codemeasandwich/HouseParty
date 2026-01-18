import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { spawn } from 'bun';
import { createTestContext, type TestContext } from './utils/tempDir';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';

const UNINSTALL_SCRIPT = join(import.meta.dir, '..', 'scripts', 'uninstall.js');
const PROJECT_ROOT = join(import.meta.dir, '..');

describe('Uninstall Script', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();

    // Set up installed state
    writeFileSync(join(ctx.binDir, 'claude-wrapper'), '#!/bin/bash\necho "test"');

    const extDir = join(ctx.homeDir, '.vscode', 'extensions', 'claude-persona-switcher');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(join(extDir, 'package.json'), '{}');

    const vscodeSettingsDir = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User');
    mkdirSync(vscodeSettingsDir, { recursive: true });
    writeFileSync(join(vscodeSettingsDir, 'settings.json'), JSON.stringify({
      'claudeCode.claudeProcessWrapper': join(ctx.binDir, 'claude-wrapper'),
      'other.setting': true
    }));

    writeFileSync(ctx.stateFile, JSON.stringify({ version: 1, default: 'stem', folders: {} }));
  });

  afterEach(() => {
    ctx.cleanup();
  });

  async function runUninstall(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const proc = spawn({
      cmd: ['node', UNINSTALL_SCRIPT],
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        HOME: ctx.homeDir
      },
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return { stdout, stderr, exitCode };
  }

  describe('Wrapper Removal', () => {
    test('removes wrapper script', async () => {
      const wrapperPath = join(ctx.binDir, 'claude-wrapper');
      expect(existsSync(wrapperPath)).toBe(true);

      await runUninstall();

      expect(existsSync(wrapperPath)).toBe(false);
    });

    test('handles already removed wrapper gracefully', async () => {
      unlinkSync(join(ctx.binDir, 'claude-wrapper'));

      const result = await runUninstall();

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('not found');
    });
  });

  describe('Extension Removal', () => {
    test('removes VSCode extension directory', async () => {
      const extDir = join(ctx.homeDir, '.vscode', 'extensions', 'claude-persona-switcher');
      expect(existsSync(extDir)).toBe(true);

      await runUninstall();

      expect(existsSync(extDir)).toBe(false);
    });

    test('handles already removed extension gracefully', async () => {
      const extDir = join(ctx.homeDir, '.vscode', 'extensions', 'claude-persona-switcher');
      rmSync(extDir, { recursive: true });

      const result = await runUninstall();

      expect(result.exitCode).toBe(0);
    });
  });

  describe('VSCode Settings Cleanup', () => {
    test('removes claudeCode.claudeProcessWrapper from settings', async () => {
      await runUninstall();

      const settingsPath = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

      expect(settings['claudeCode.claudeProcessWrapper']).toBeUndefined();
    });

    test('preserves other VSCode settings', async () => {
      await runUninstall();

      const settingsPath = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

      expect(settings['other.setting']).toBe(true);
    });

    test('handles missing settings.json gracefully', async () => {
      const settingsPath = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
      unlinkSync(settingsPath);

      const result = await runUninstall();

      expect(result.exitCode).toBe(0);
    });
  });

  describe('State File Preservation', () => {
    test('preserves persona-state.json', async () => {
      expect(existsSync(ctx.stateFile)).toBe(true);

      await runUninstall();

      expect(existsSync(ctx.stateFile)).toBe(true);
    });

    test('outputs note about preserved state file', async () => {
      const result = await runUninstall();

      expect(result.stdout).toContain('persona-state.json was preserved');
    });
  });

  describe('Output Messages', () => {
    test('shows uninstall complete message', async () => {
      const result = await runUninstall();

      expect(result.stdout).toContain('Uninstall complete');
    });
  });
});
