import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Run the whole batch, retaining failures rather than stopping after the first.
const directory = join(import.meta.dir, '../scratch/batch-validation');
mkdirSync(directory, { recursive: true });
const steps: [string, string[]][] = [
  ['docs-source', ['bun', 'apps/web/scripts/write-public-seo.ts']],
  ['reverse-import-feedback', ['bun', 'packages/source-import/scripts/report-expansion.ts', '--write']],
  ['coverage-ledger', ['bun', 'packages/source-import/scripts/report-coverage.ts', '--write']],
  ['csharp-native', ['bun', 'packages/source-import/scripts/validate-csharp-native.ts', '--write']],
  ['source-import-types', ['bun', 'packages/source-import/scripts/check-types.ts']],
  ['packages', ['bun', 'test', 'packages/syntax-packs', 'packages/transpiler', 'packages/graph-types', 'packages/language-profiles', 'packages/syntax-registry', 'packages/source-import']],
  ['server-build', ['go', 'build', './...']],
  ['server-tests', ['go', 'test', './...']],
  ['web', ['bun', 'run', '--filter', 'web', 'test']],
  ['lint', ['bun', 'run', 'lint']],
  ['native-types', ['bun', 'run', '--filter', 'vvs-vscode', 'check']],
  ['go-native', ['bun', 'packages/source-import/scripts/validate-go-native.ts']],
  ['native-readiness', ['python', 'tools/validate_native_readiness.py']],
  ['native-bindings', ['bun', 'packages/source-import/scripts/validate-native-bindings.ts']],
  ['native-initialization', ['bun', 'packages/source-import/scripts/validate-native-initialization.ts']],
  ['native-scalars', ['bun', 'packages/source-import/scripts/validate-native-scalars.ts']],
  ['native-constants', ['bun', 'packages/source-import/scripts/validate-native-constants.ts']],
  ['native-source-expressions', ['bun', 'packages/source-import/scripts/validate-native-source-expressions.ts']],
  ['native-signatures', ['bun', 'packages/source-import/scripts/validate-native-signatures.ts']],
  ['native-signature-print', ['bun', 'packages/source-import/scripts/validate-native-signature-print.ts']],
  ['native-scalar-graphs', ['bun', 'apps/web/scripts/validate_native_scalar_graphs.ts']],
  ['native-source-graphs', ['bun', 'apps/web/scripts/validate_native_source_graphs.ts']],
  ['native-runtime-types', ['bun', 'packages/source-import/scripts/validate-native-runtime-types.ts']],
  ['native-local-inference', ['bun', 'packages/source-import/scripts/validate-native-local-inference.ts']],
  ['native-local-source', ['bun', 'packages/source-import/scripts/validate-native-local-source.ts']],
  ['native-constant-graphs', ['bun', 'apps/web/scripts/validate_native_constant_graphs.ts']],
  ['native-scalar-names', ['bun', 'packages/source-import/scripts/validate-native-scalar-names.ts']],
  ['native-fixture-paths', ['python', '-X', 'utf8', 'tools/test_native_fixture_paths.py']],
  ['native-grammar-build', ['python', 'tools/build_gdscript_grammar.py']],
  ['native-host', ['bun', 'run', '--filter', 'vvs-vscode', 'test:host']],
  ['build', ['bun', 'run', 'build']],
  ['goldens', ['bun', 'apps/web/scripts/validate_test_projects_folder.ts']],
  ['code-panel', ['bun', 'apps/web/scripts/extract_test_project_outputs.ts']],
  ['browser-import', ['python', '-u', 'apps/web/scripts/verify-source-import-browser.py']],
  ['native-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-browser.py']],
  ['native-runtime-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-browser.py', '--runtime-only']],
  ['native-group-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-browser.py', '--groups-only']],
  ['native-local-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-browser.py', '--locals-only']],
  ['csharp-browser', ['python', '-u', 'apps/web/scripts/verify-source-import-csharp.py']],
  ['strict-parse', ['bun', 'run', '--filter', '@vvs/syntax-packs', 'validate:parse', '--strict']],
  ['pages-build', ['bun', 'run', '--filter', 'web', 'pages:build']],
  ['docs-artifacts', ['bun', 'apps/web/scripts/verify-doc-artifacts.ts']],
  ['native-pages-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-export.py']],
  ['native-runtime-pages-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-export.py', '--runtime-only']],
  ['native-group-pages-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-export.py', '--groups-only']],
  ['native-local-pages-browser', ['python', '-u', 'apps/web/scripts/verify-native-scalar-export.py', '--locals-only']],
];
const selectedNames = process.argv.find(argument => argument.startsWith('--only='))?.slice(7).split(',');
const constantRetry = process.argv.find(argument => argument.startsWith('--retry-native-constants='))?.slice('--retry-native-constants='.length);
if (constantRetry) steps.find(step => step[0] === 'native-constants')![1].push(`--retry-native=${constantRetry}`);
const signatureRetry = process.argv.find(argument => argument.startsWith('--retry-native-signatures='))?.slice('--retry-native-signatures='.length);
const sourceGraphRetry = process.argv.find(argument => argument.startsWith('--retry-native-source-graphs='))?.slice('--retry-native-source-graphs='.length);
const runtimeTypeRetry = process.argv.find(argument => argument.startsWith('--retry-native-runtime-types='))?.slice('--retry-native-runtime-types='.length);
const localInferenceRetry = process.argv.find(argument => argument.startsWith('--retry-native-local-inference='))?.slice('--retry-native-local-inference='.length);
if (localInferenceRetry !== undefined) steps.find(step => step[0] === 'native-local-inference')![1].push(`--retry-native=${localInferenceRetry}`);
const localSourceRetry = process.argv.find(argument => argument.startsWith('--retry-native-local-source='))?.slice('--retry-native-local-source='.length);
if (localSourceRetry !== undefined) steps.find(step => step[0] === 'native-local-source')![1].push(`--retry-native=${localSourceRetry}`);
if (runtimeTypeRetry !== undefined) steps.find(step => step[0] === 'native-runtime-types')![1].push(`--retry-native=${runtimeTypeRetry}`);
if (sourceGraphRetry !== undefined) steps.find(step => step[0] === 'native-source-graphs')![1].push(`--retry-native=${sourceGraphRetry}`);
const constantGraphRetry = process.argv.find(argument => argument.startsWith('--retry-native-constant-graphs='))?.slice('--retry-native-constant-graphs='.length);
if (constantGraphRetry) steps.find(step => step[0] === 'native-constant-graphs')![1].push(`--retry-native=${constantGraphRetry}`);
if (process.argv.includes('--retry-failed-native-scalar-names')) steps.find(step => step[0] === 'native-scalar-names')![1].push('--retry-failed-native');
if (signatureRetry) steps.find(step => step[0] === 'native-signatures')![1].push(`--retry-native=${signatureRetry}`);
if (selectedNames?.some(name => !steps.some(step => step[0] === name))) throw new Error('Unknown validation stage');
// Pages overwrites .next with export/base-path configuration. A partial production
// browser retry must restore the normal artifact before starting Next's server.
if (selectedNames?.some(name => ['browser-import', 'csharp-browser', 'native-browser', 'native-runtime-browser', 'native-local-browser', 'native-group-browser'].includes(name)) && !selectedNames.includes('build')) {
  const artifact = join(import.meta.dir, '../apps/web/.next/required-server-files.json');
  const config = existsSync(artifact) ? JSON.parse(readFileSync(artifact, 'utf8')).config : undefined;
  if (!config || config.output === 'export' || config.env?.NEXT_PUBLIC_SITE_BASE_PATH) {
    selectedNames.push('build');
    console.log('Production browser checks require a normal build; adding the build prerequisite.');
  }
}
const previous = selectedNames && existsSync(join(directory, 'results.json')) ? JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8')) as { name: string; exitCode: number }[] : [];
const results = previous.filter(result => !selectedNames?.includes(result.name));
// Consumers must not spend a build/browser cycle on a batch whose required
// contracts or artifact preparation already failed. Only fresh selected gates
// are prerequisites; retained historical failures describe different evidence.
const prerequisites: Record<string, string[]> = {
  'native-signature-print': ['packages', 'source-import-types'],
  'native-scalar-graphs': ['packages', 'source-import-types'],
  'native-source-graphs': ['packages', 'source-import-types', 'web'],
  'native-runtime-types': ['packages', 'source-import-types'],
  'native-local-inference': ['packages', 'source-import-types'],
  'native-local-source': ['packages', 'source-import-types'],
  'native-constant-graphs': ['packages', 'source-import-types', 'web'],
  'native-scalar-names': ['packages', 'source-import-types'],
  'native-source-expressions': ['native-constants'],
  'native-bindings': ['native-readiness'],
  build: ['packages', 'web', 'lint', 'source-import-types', 'native-types', 'csharp-native', 'go-native', 'native-readiness', 'native-bindings', 'native-initialization', 'native-scalars', 'native-constants', 'native-source-expressions', 'native-signatures', 'native-signature-print', 'native-scalar-graphs', 'native-source-graphs', 'native-constant-graphs', 'native-scalar-names', 'native-grammar-build'],
  'browser-import': ['build', 'csharp-native', 'packages', 'web'],
  'native-browser': ['build', 'packages', 'web', 'native-source-graphs'],
  'native-runtime-browser': ['build', 'packages', 'web', 'native-source-graphs'],
  'native-group-browser': ['build', 'packages', 'web', 'native-source-graphs'],
  'native-local-browser': ['build', 'packages', 'web', 'native-source-graphs'],
  'native-pages-browser': ['pages-build', 'packages', 'web', 'native-source-graphs'],
  'native-runtime-pages-browser': ['pages-build', 'packages', 'web', 'native-source-graphs'],
  'native-group-pages-browser': ['pages-build', 'packages', 'web', 'native-source-graphs'],
  'native-local-pages-browser': ['pages-build', 'packages', 'web', 'native-source-graphs'],
  'csharp-browser': ['build', 'csharp-native', 'packages', 'web'],
  'pages-build': ['docs-source', 'build', 'csharp-native', 'packages', 'web', 'lint'],
  'docs-artifacts': ['pages-build'],
};
const freshResults = new Map<string, number>();
for (const [name, command] of steps.filter(step => selectedNames ? selectedNames.includes(step[0]) : !['csharp-browser', 'native-browser', 'native-pages-browser', 'native-runtime-browser', 'native-runtime-pages-browser', 'native-local-browser', 'native-local-pages-browser', 'native-group-browser', 'native-group-pages-browser', 'native-readiness', 'native-bindings', 'native-initialization', 'native-scalars', 'native-constants', 'native-source-expressions', 'native-signatures', 'native-signature-print', 'native-scalar-graphs', 'native-source-graphs', 'native-runtime-types', 'native-local-source', 'native-local-inference', 'native-constant-graphs', 'native-scalar-names', 'native-grammar-build'].includes(step[0]))) {
  const failed = (prerequisites[name] ?? []).filter(required => freshResults.has(required) && freshResults.get(required) !== 0);
  if (failed.length) {
    writeFileSync(join(directory, `${name}.log`), `Skipped: failed batch prerequisites ${failed.join(', ')}.\n`);
    results.push({ name, exitCode: 1 }); freshResults.set(name, 1);
    console.log(`${name}: SKIP (failed prerequisites: ${failed.join(', ')})`);
    continue;
  }
  console.log(`Starting ${name}`);
  writeFileSync(join(directory, `${name}.log`), '');
  const log = Bun.file(join(directory, `${name}.log`));
  let server: ReturnType<typeof Bun.spawn> | undefined;
  let exitCode = 1;
  try {
    if (name === 'browser-import' || name === 'csharp-browser' || name === 'native-browser' || name === 'native-runtime-browser' || name === 'native-local-browser' || name === 'native-group-browser') {
      writeFileSync(join(directory, 'browser-server.log'), '');
      server = Bun.spawn(['node', 'node_modules/next/dist/bin/next', 'start', '-p', '3137'], { cwd: join(import.meta.dir, '../apps/web'), stdout: Bun.file(join(directory, 'browser-server.log')), stderr: Bun.file(join(directory, 'browser-server.log')) });
      let ready = false;
      for (let attempt = 0; attempt < 60 && !ready; attempt++) {
        if (server.exitCode !== null) throw new Error('Production server exited before verification');
        try { ready = (await fetch('http://localhost:3137')).ok; } catch { /* Await server readiness. */ }
        if (!ready) await Bun.sleep(500);
      }
      if (!ready) throw new Error('Production server did not start');
    }
    const child = Bun.spawn(command, { cwd: join(import.meta.dir, name.startsWith('server-') ? '../server' : '..'), stdout: log, stderr: log, env: { ...Bun.env, VVS_TEST_URL: 'http://localhost:3137' } });
    exitCode = await child.exited;
  } catch (error) { console.error(`${name}: ${String(error)}`); }
  finally { server?.kill(); }
  results.push({ name, exitCode });
  freshResults.set(name, exitCode);
  console.log(`${name}: ${exitCode === 0 ? 'PASS' : 'FAIL'} (${exitCode})`);
}
writeFileSync(join(directory, 'results.json'), JSON.stringify(results, null, 2));
// A focused retry reports its own outcome while retaining older failures in the
// ledger. It must not silently certify the full suite that originally failed.
process.exitCode = results.some(result => result.exitCode !== 0 && (!selectedNames || selectedNames.includes(result.name))) ? 1 : 0;
