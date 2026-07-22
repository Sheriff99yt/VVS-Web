import { validateGeneratedParse } from '../src/parseValidation';
import type { LanguageFamily } from '../src/rosettaHarness';

const args = process.argv.slice(2);
const families: LanguageFamily[] = [];
const fixtures: string[] = [];
let strict = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--strict') {
    strict = true;
    continue;
  }
  if (arg === '--family' && args[i + 1]) {
    families.push(args[++i] as LanguageFamily);
    continue;
  }
  if (arg === '--fixture' && args[i + 1]) {
    fixtures.push(args[++i]!);
  }
}

const result = validateGeneratedParse({
  families: families.length ? families : undefined,
  fixtures: fixtures.length ? fixtures : undefined,
});

console.log(JSON.stringify(result, null, 2));

if (!result.runtimeAvailable) {
  const message =
    'Tree-sitter native runtime unavailable — skipped parse validation (install/rebuild tree-sitter prebuilds for CI).';
  console.warn(message);
  process.exit(0);
}

process.exit(result.ok ? 0 : 1);
