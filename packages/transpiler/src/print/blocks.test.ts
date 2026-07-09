import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractGoldenBody,
  loadRosettaFixture,
  rosettaDir,
  transpileRosettaFixture,
} from '../../../syntax-packs/src/rosettaHarness';

const BLOCK_FIXTURES = ['branch', 'for', 'while', 'switch'] as const;

const BLOCK_FAMILIES = ['python', 'cpp', 'javascript', 'verse'] as const;

describe('blocks.ts vs Rosetta goldens', () => {
  for (const fixtureName of BLOCK_FIXTURES) {
    for (const family of BLOCK_FAMILIES) {
      test(`${fixtureName} × ${family}`, () => {
        const fixture = loadRosettaFixture(fixtureName);
        const golden = readFileSync(
          join(rosettaDir(), `${fixtureName}.${family}.golden.txt`),
          'utf8'
        );
        const result = transpileRosettaFixture(fixture, family);
        const actual = extractGoldenBody(
          result.files[0]!.content,
          family,
          fixture.goldenExtract ?? 'on_start'
        );
        expect(actual).toBe(golden);
      });
    }
  }
});
