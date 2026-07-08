import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  type LanguageFamily,
  ROSETTA_FAMILIES,
  extractGoldenBody,
  loadRosettaFixture,
  rosettaDir,
  transpileRosettaFixture,
} from './rosettaHarness';

export interface RosettaSuiteFilter {
  families?: LanguageFamily[];
  fixtures?: string[];
}

export interface RosettaCaseResult {
  fixture: string;
  family: LanguageFamily;
  passed: boolean;
  goldenPath: string;
  message?: string;
}

export interface RosettaSuiteResult {
  ok: boolean;
  total: number;
  passed: number;
  failed: number;
  results: RosettaCaseResult[];
}

function allFixtureNames(): string[] {
  return readdirSync(rosettaDir())
    .filter((f) => f.endsWith('.fixture.json'))
    .map((f) => f.replace('.fixture.json', ''))
    .sort();
}

export function runRosettaSuite(filter: RosettaSuiteFilter = {}): RosettaSuiteResult {
  const fixtures = filter.fixtures?.length ? filter.fixtures : allFixtureNames();
  const families = filter.families?.length ? filter.families : ROSETTA_FAMILIES;
  const dir = rosettaDir();
  const results: RosettaCaseResult[] = [];

  for (const fixtureName of fixtures) {
    const fixture = loadRosettaFixture(fixtureName);
    for (const family of families) {
      const goldenPath = join(dir, `${fixtureName}.${family}.golden.txt`);
      const golden = readFileSync(goldenPath, 'utf8');
      const result = transpileRosettaFixture(fixture, family);
      const actual = extractGoldenBody(
        result.files[0]!.content,
        family,
        fixture.goldenExtract ?? 'on_start'
      );
      results.push({
        fixture: fixtureName,
        family,
        passed: actual === golden,
        goldenPath,
        message:
          actual === golden
            ? undefined
            : `Golden mismatch for ${fixtureName} × ${family}`,
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    ok: passed === results.length,
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
