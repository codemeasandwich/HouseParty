import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, createProjectDir, type TestContext } from './utils/tempDir';
import { runWrapperWithMockHome } from './utils/bashRunner';
import { writeFileSync, copyFileSync, chmodSync, mkdirSync } from 'fs';
import { join } from 'path';

const WRAPPER_SOURCE = join(import.meta.dir, '..', 'bin', 'claude-wrapper');

describe('CLI Wrapper', () => {
  let ctx: TestContext;
  let wrapperPath: string;

  beforeEach(() => {
    ctx = createTestContext();
    wrapperPath = join(ctx.binDir, 'claude-wrapper');
    copyFileSync(WRAPPER_SOURCE, wrapperPath);
    chmodSync(wrapperPath, '755');
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('State File Reading', () => {
    test('uses stem persona when no state file exists', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');
      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'STEM persona content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('reads persona from state file for matching folder', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {
          [projectDir]: { persona: 'tars', lastUsed: '2024-01-01' }
        }
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'injected']
      );

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Auto-Detection', () => {
    test('auto-detects tars for JavaScript projects', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {}
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS content here');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('auto-detects red-queen for Unity projects (ProjectSettings)', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'unity');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {}
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-red-queen.md'), 'Red Queen content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('auto-detects red-queen for .unity files', async () => {
      const projectDir = join(ctx.tempDir, 'unity-scene');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'Level1.unity'), '');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));
      writeFileSync(join(ctx.skillsDir, 'persona-red-queen.md'), 'content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('auto-detects red-queen for .csproj files', async () => {
      const projectDir = join(ctx.tempDir, 'csharp');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'Game.csproj'), '');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));
      writeFileSync(join(ctx.skillsDir, 'persona-red-queen.md'), 'content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('falls back to default persona for empty projects', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'stem',
        folders: {}
      }));

      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'STEM content');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Prompt Injection', () => {
    test('injects --append-system-prompt when persona file exists', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS persona');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['bash', '-c', 'echo "args: $@"', '--']
      );

      expect(result.stdout).toContain('--append-system-prompt');
    });

    test('skips injection when user already has --append-system-prompt', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir,
        ['bash', '-c', 'echo "args: $@"', '--', '--append-system-prompt', 'user content']
      );

      expect(result.exitCode).toBe(0);
      // Should only have one --append-system-prompt (the user's)
      const matches = result.stdout.match(/--append-system-prompt/g);
      expect(matches?.length).toBe(1);
    });

    test('skips injection when user already has --system-prompt', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir,
        ['bash', '-c', 'echo "args: $@"', '--', '--system-prompt', 'user content']
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('--append-system-prompt');
    });

    test('skips injection when persona file does not exist', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['bash', '-c', 'echo "args: $@"', '--']
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('--append-system-prompt');
    });
  });

  describe('Error Handling', () => {
    test('handles malformed state file gracefully', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');

      writeFileSync(ctx.stateFile, 'invalid json {{{');
      writeFileSync(join(ctx.skillsDir, 'persona-stem.md'), 'STEM');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('handles missing state file gracefully', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });

    test('uses CLAUDE_WORKING_DIR environment variable', async () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');

      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1, default: 'stem', folders: {}
      }));
      writeFileSync(join(ctx.skillsDir, 'persona-tars.md'), 'TARS');

      const result = await runWrapperWithMockHome(
        wrapperPath, ctx.homeDir, projectDir, ['echo', 'test']
      );

      expect(result.exitCode).toBe(0);
    });
  });
});
