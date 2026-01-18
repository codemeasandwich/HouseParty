import { spawn } from 'bun';

export interface BashResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runWrapper(
  wrapperPath: string,
  args: string[],
  env: Record<string, string>
): Promise<BashResult> {
  const proc = spawn({
    cmd: ['bash', wrapperPath, ...args],
    env: {
      ...process.env,
      ...env
    },
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

export async function runWrapperWithMockHome(
  wrapperPath: string,
  homeDir: string,
  workDir: string,
  args: string[] = ['echo', 'test']
): Promise<BashResult> {
  return runWrapper(wrapperPath, args, {
    HOME: homeDir,
    CLAUDE_WORKING_DIR: workDir
  });
}
