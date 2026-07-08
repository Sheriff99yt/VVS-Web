import { runRosettaSuite } from '../src/rosettaSuite';
import type { LanguageFamily } from '../src/rosettaHarness';

const args = process.argv.slice(2);
const families: LanguageFamily[] = [];
const fixtures: string[] = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--family' && args[i + 1]) {
    families.push(args[++i] as LanguageFamily);
    continue;
  }
  if (arg === '--fixture' && args[i + 1]) {
    fixtures.push(args[++i]!);
  }
}

const result = runRosettaSuite({
  families: families.length ? families : undefined,
  fixtures: fixtures.length ? fixtures : undefined,
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
