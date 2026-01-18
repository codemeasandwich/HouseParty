import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, createProjectDir, type TestContext } from './utils/tempDir';
import { StateManager } from '../vscode-extension/src/stateManager';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('StateManager', () => {
  let ctx: TestContext;
  let stateManager: StateManager;

  beforeEach(() => {
    ctx = createTestContext();
    stateManager = new StateManager({ claudeDir: ctx.claudeDir });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('readState / getStateFilePath', () => {
    test('returns correct state file path', () => {
      expect(stateManager.getStateFilePath()).toBe(ctx.stateFile);
    });

    test('returns default state when file does not exist', () => {
      const persona = stateManager.getPersona('/some/path');
      expect(persona).toBe('stem');
    });

    test('reads existing state file correctly', () => {
      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'tars',
        folders: {
          '/project/foo': { persona: 'red-queen', lastUsed: '2024-01-01' }
        }
      }));

      const persona = stateManager.getPersona('/project/foo');
      expect(persona).toBe('red-queen');
    });

    test('handles malformed JSON gracefully', () => {
      writeFileSync(ctx.stateFile, '{ invalid json }');
      const persona = stateManager.getPersona('/some/path');
      expect(persona).toBe('stem');
    });
  });

  describe('setPersona', () => {
    test('creates state file if not exists', () => {
      stateManager.setPersona('/project/test', 'tars');
      const persona = stateManager.getPersona('/project/test');
      expect(persona).toBe('tars');
    });

    test('updates existing persona for folder', () => {
      stateManager.setPersona('/project/test', 'tars');
      stateManager.setPersona('/project/test', 'stem');
      expect(stateManager.getPersona('/project/test')).toBe('stem');
    });

    test('preserves other folders when updating one', () => {
      stateManager.setPersona('/project/a', 'tars');
      stateManager.setPersona('/project/b', 'red-queen');
      stateManager.setPersona('/project/a', 'stem');

      expect(stateManager.getPersona('/project/a')).toBe('stem');
      expect(stateManager.getPersona('/project/b')).toBe('red-queen');
    });

    test('sets lastUsed timestamp', () => {
      const before = Date.now();
      stateManager.setPersona('/project/test', 'tars');
      const after = Date.now();

      const state = JSON.parse(require('fs').readFileSync(ctx.stateFile, 'utf-8'));
      const lastUsed = new Date(state.folders['/project/test'].lastUsed).getTime();

      expect(lastUsed).toBeGreaterThanOrEqual(before);
      expect(lastUsed).toBeLessThanOrEqual(after);
    });
  });

  describe('detectPersona', () => {
    test('detects JavaScript project (package.json)', () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');
      expect(stateManager.detectPersona(projectDir)).toBe('tars');
    });

    test('detects JavaScript project (bun.lockb)', () => {
      const projectDir = join(ctx.tempDir, 'bun-project');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'bun.lockb'), '');

      expect(stateManager.detectPersona(projectDir)).toBe('tars');
    });

    test('detects Unity project (ProjectSettings directory)', () => {
      const projectDir = createProjectDir(ctx.tempDir, 'unity');
      expect(stateManager.detectPersona(projectDir)).toBe('red-queen');
    });

    test('detects Unity project (.unity file)', () => {
      const projectDir = join(ctx.tempDir, 'unity-scene');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'Scene.unity'), '');

      expect(stateManager.detectPersona(projectDir)).toBe('red-queen');
    });

    test('detects Unity project (.csproj file)', () => {
      const projectDir = join(ctx.tempDir, 'csharp-project');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'Game.csproj'), '');

      expect(stateManager.detectPersona(projectDir)).toBe('red-queen');
    });

    test('detects Unreal project (.uproject file)', () => {
      const projectDir = join(ctx.tempDir, 'unreal-project');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'Game.uproject'), '');

      expect(stateManager.detectPersona(projectDir)).toBe('red-queen');
    });

    test('returns default for empty folder', () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');
      expect(stateManager.detectPersona(projectDir)).toBe('stem');
    });

    test('returns custom default when provided', () => {
      const projectDir = createProjectDir(ctx.tempDir, 'empty');
      expect(stateManager.detectPersona(projectDir, 'tars')).toBe('tars');
    });

    test('handles non-existent directory gracefully', () => {
      expect(stateManager.detectPersona('/non/existent/path')).toBe('stem');
    });
  });

  describe('getPersona (integration)', () => {
    test('returns saved persona over auto-detect', () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');
      stateManager.setPersona(projectDir, 'stem');

      expect(stateManager.getPersona(projectDir)).toBe('stem');
    });

    test('auto-detects when no saved persona', () => {
      const projectDir = createProjectDir(ctx.tempDir, 'js');
      expect(stateManager.getPersona(projectDir)).toBe('tars');
    });

    test('uses default from state file when no match', () => {
      writeFileSync(ctx.stateFile, JSON.stringify({
        version: 1,
        default: 'red-queen',
        folders: {}
      }));

      const projectDir = createProjectDir(ctx.tempDir, 'empty');
      expect(stateManager.getPersona(projectDir)).toBe('red-queen');
    });
  });

  describe('getPersonaInfo', () => {
    test('returns correct info for tars', () => {
      const info = stateManager.getPersonaInfo('tars');
      expect(info?.displayName).toBe('TARS');
      expect(info?.icon).toBe('$(robot)');
    });

    test('returns correct info for red-queen', () => {
      const info = stateManager.getPersonaInfo('red-queen');
      expect(info?.displayName).toBe('Red Queen');
      expect(info?.icon).toBe('$(device-camera-video)');
    });

    test('returns correct info for stem', () => {
      const info = stateManager.getPersonaInfo('stem');
      expect(info?.displayName).toBe('STEM');
      expect(info?.icon).toBe('$(book)');
    });

    test('returns undefined for unknown persona', () => {
      const info = stateManager.getPersonaInfo('unknown');
      expect(info).toBeUndefined();
    });
  });

  describe('listPersonas', () => {
    test('returns all three personas', () => {
      const personas = stateManager.listPersonas();
      expect(personas).toHaveLength(3);
      expect(personas.map(p => p.name)).toEqual(['tars', 'red-queen', 'stem']);
    });
  });
});
