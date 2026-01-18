import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { spawn } from 'bun';
import { createTestContext, createProjectDir, type TestContext } from '../utils/tempDir';
import { runWrapperWithMockHome } from '../utils/bashRunner';
import { existsSync, readFileSync, writeFileSync, copyFileSync, chmodSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(import.meta.dir, '..', '..');

describe('End-to-End Flows', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Fresh Installation Flow', () => {
    test('complete install -> use -> uninstall cycle', async () => {
      // 1. Create VSCode settings directory
      const vscodeSettingsDir = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User');
      mkdirSync(vscodeSettingsDir, { recursive: true });
      writeFileSync(join(vscodeSettingsDir, 'settings.json'), '{}');

      // 2. Run postinstall
      const installProc = spawn({
        cmd: ['node', join(PROJECT_ROOT, 'scripts/postinstall.js')],
        cwd: PROJECT_ROOT,
        env: { ...process.env, HOME: ctx.homeDir },
        stdout: 'pipe',
        stderr: 'pipe'
      });
      await installProc.exited;

      // 3. Verify installation
      expect(existsSync(join(ctx.binDir, 'claude-wrapper'))).toBe(true);
      expect(existsSync(ctx.stateFile)).toBe(true);

      // 4. Create persona files and use wrapper
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'You are TARS.');
      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'You are STEM.');

      const jsProject = createProjectDir(ctx.tempDir, 'js');

      const wrapperResult = await runWrapperWithMockHome(
        join(ctx.binDir, 'claude-wrapper'),
        ctx.homeDir,
        jsProject,
        ['echo', 'hello']
      );
      expect(wrapperResult.exitCode).toBe(0);

      // 5. Run uninstall
      const uninstallProc = spawn({
        cmd: ['node', join(PROJECT_ROOT, 'scripts/uninstall.js')],
        cwd: PROJECT_ROOT,
        env: { ...process.env, HOME: ctx.homeDir },
        stdout: 'pipe',
        stderr: 'pipe'
      });
      await uninstallProc.exited;

      // 6. Verify cleanup
      expect(existsSync(join(ctx.binDir, 'claude-wrapper'))).toBe(false);
      expect(existsSync(ctx.stateFile)).toBe(true); // State preserved
    });
  });

  describe('Multi-Folder Persona Switching', () => {
    test('different personas for different project types', async () => {
      // Setup
      const wrapperPath = join(ctx.binDir, 'claude-wrapper');
      copyFileSync(join(PROJECT_ROOT, 'bin/claude-wrapper'), wrapperPath);
      chmodSync(wrapperPath, '755');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {}
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS content');
      writeFileSync(join(ctx.skillsDir, 'persona-red-queen.md'), 'Red Queen content');
      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'STEM content');

      // Create different project types
      const jsProject = createProjectDir(ctx.tempDir, 'js');
      const unityProject = createProjectDir(ctx.tempDir, 'unity');
      const docsProject = createProjectDir(ctx.tempDir, 'empty');

      // Test auto-detection for each
      const jsResult = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, jsProject, ['echo', 'test']
      );
      expect(jsResult.exitCode).toBe(0);

      const unityResult = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, unityProject, ['echo', 'test']
      );
      expect(unityResult.exitCode).toBe(0);

      const docsResult = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, docsProject, ['echo', 'test']
      );
      expect(docsResult.exitCode).toBe(0);
    });
  });

  describe('Manual Persona Override', () => {
    test('manual setting overrides auto-detection', async () => {
      const wrapperPath = join(ctx.binDir, 'claude-wrapper');
      copyFileSync(join(PROJECT_ROOT, 'bin/claude-wrapper'), wrapperPath);
      chmodSync(wrapperPath, '755');

      const jsProject = createProjectDir(ctx.tempDir, 'js');

      // Manually set STEM for a JS project (override auto-detect)
      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {
          [jsProject]: { persona: 'stem', lastUsed: new Date().toISOString() }
        }
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'STEM persona content');
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS persona content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, jsProject, ['bash', '-c', 'echo "$@"', '--']
      );

      expect(result.exitCode).toBe(0);
      // STEM should be used instead of auto-detected TARS
      expect(result.stdout).toContain('STEM persona content');
    });
  });

  describe('Upgrade Scenario', () => {
    // Increased timeout: runs postinstall twice (2x npm install + compile cycles)
    test('upgrade preserves existing state and settings', async () => {
      // Create VSCode settings directory
      const vscodeSettingsDir = join(ctx.homeDir, 'Library', 'Application Support', 'Code', 'User');
      mkdirSync(vscodeSettingsDir, { recursive: true });
      writeFileSync(join(vscodeSettingsDir, 'settings.json'), '{}');

      // Initial install
      const install1 = spawn({
        cmd: ['node', join(PROJECT_ROOT, 'scripts/postinstall.js')],
        cwd: PROJECT_ROOT,
        env: { ...process.env, HOME: ctx.homeDir },
        stdout: 'pipe',
        stderr: 'pipe'
      });
      await install1.exited;

      // Modify state (simulate user usage)
      const customState = {
        version: 1,
        default: 'tars',
        folders: {
          '/my/project': { persona: 'red-queen', lastUsed: '2024-01-01' }
        }
      };
      writeFileSync(ctx.stateFile, JSON.stringify(customState));

      // Run install again (upgrade)
      const install2 = spawn({
        cmd: ['node', join(PROJECT_ROOT, 'scripts/postinstall.js')],
        cwd: PROJECT_ROOT,
        env: { ...process.env, HOME: ctx.homeDir },
        stdout: 'pipe',
        stderr: 'pipe'
      });
      await install2.exited;

      // Verify state preserved
      const state = JSON.parse(readFileSync(ctx.stateFile, 'utf-8'));
      expect(state.default).toBe('tars');
      expect(state.folders['/my/project'].persona).toBe('red-queen');
    }, 15000);
  });

  describe('StateManager Integration', () => {
    test('StateManager changes are reflected in wrapper execution', async () => {
      const wrapperPath = join(ctx.binDir, 'claude-wrapper');
      copyFileSync(join(PROJECT_ROOT, 'bin/claude-wrapper'), wrapperPath);
      chmodSync(wrapperPath, '755');

      const projectDir = createProjectDir(ctx.tempDir, 'empty');

      // Start with default state
      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {}
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'STEM persona');
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS persona');

      // First run - should use STEM (default)
      const result1 = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['bash', '-c', 'echo "$@"', '--']
      );
      expect(result1.stdout).toContain('STEM persona');

      // Update state to TARS
      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {
          [projectDir]: { persona: 'tars', lastUsed: new Date().toISOString() }
        }
      }));

      // Second run - should use TARS
      const result2 = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['bash', '-c', 'echo "$@"', '--']
      );
      expect(result2.stdout).toContain('TARS persona');
    });
  });
});
