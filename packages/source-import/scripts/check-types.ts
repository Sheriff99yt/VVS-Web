import { existsSync } from 'node:fs';
import { join } from 'node:path';
const root = join(import.meta.dir, '../../..');
const compiler = [join(root, 'apps/web/node_modules/typescript/bin/tsc'), join(root, 'node_modules/typescript/bin/tsc')].find(existsSync);
if (!compiler) throw new Error('The locked workspace TypeScript compiler is required');
const child = Bun.spawn(['bun', compiler, '--project', join(import.meta.dir, '../tsconfig.json')], { stdout: 'inherit', stderr: 'inherit' });
process.exitCode = await child.exited;
