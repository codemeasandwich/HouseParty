import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface TestContext {
  tempDir: string;
  homeDir: string;
  claudeDir: string;
  binDir: string;
  skillsDir: string;
  stateFile: string;
  cleanup: () => void;
}

export function createTestContext(): TestContext {
  const tempDir = mkdtempSync(join(tmpdir(), 'claude-persona-test-'));
  const homeDir = join(tempDir, 'home');
  const claudeDir = join(homeDir, '.claude');
  const binDir = join(claudeDir, 'bin');
  const skillsDir = join(claudeDir, 'skills');
  const stateFile = join(claudeDir, 'persona-state.json');

  mkdirSync(homeDir, { recursive: true });
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });

  return {
    tempDir,
    homeDir,
    claudeDir,
    binDir,
    skillsDir,
    stateFile,
    cleanup: () => rmSync(tempDir, { recursive: true, force: true })
  };
}

export function createProjectDir(baseDir: string, type: 'js' | 'unity' | 'empty'): string {
  const projectDir = join(baseDir, `project-${type}-${Date.now()}`);
  mkdirSync(projectDir, { recursive: true });

  switch (type) {
    case 'js':
      writeFileSync(join(projectDir, 'package.json'), JSON.stringify({ name: 'test' }));
      break;
    case 'unity':
      mkdirSync(join(projectDir, 'ProjectSettings'), { recursive: true });
      break;
    case 'empty':
      break;
  }

  return projectDir;
}
