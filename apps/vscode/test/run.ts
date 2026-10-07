import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const extension = resolve(import.meta.dir, '..');
const fixture = Bun.spawnSync(['bun', 'test/prepare.ts'], { cwd: extension, stdout: 'pipe', stderr: 'inherit' });
if (fixture.exitCode) process.exit(fixture.exitCode);
const { directory, workspace } = JSON.parse(new TextDecoder().decode(fixture.stdout));
const executable = await downloadAndUnzipVSCode('1.95.3');
const resultFile = join(directory, 'result.json');
const code = await new Promise<number>((resolveCode, reject) => {
  const child = spawn(executable, [workspace, `--extensionDevelopmentPath=${extension}`, `--extensionTestsPath=${join(extension, 'dist/smoke.cjs')}`,
    `--user-data-dir=${join(directory, 'user')}`, `--extensions-dir=${join(directory, 'extensions')}`,
    '--disable-workspace-trust', '--disable-gpu', '--skip-welcome', '--skip-release-notes'], {
    windowsHide: true, stdio: 'inherit', env: { ...process.env, VVS_SMOKE_RESULT: resultFile },
  });
  child.on('error', reject);
  child.on('exit', code => resolveCode(code ?? 1));
});
if (code) process.exit(code);
const result = JSON.parse(readFileSync(resultFile, 'utf8'));
if (!result.passed) throw new Error('Host smoke suite failed');
console.log(JSON.stringify(result));
