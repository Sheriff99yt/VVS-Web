import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const STMT_PATH = join(import.meta.dir, 'stmt.ts');
const BLOCKS_PATH = join(import.meta.dir, 'blocks.ts');
const STMT_SOURCE = readFileSync(STMT_PATH, 'utf8');
const BLOCKS_SOURCE = readFileSync(BLOCKS_PATH, 'utf8');

describe('pack migration CI gate', () => {
  test('print/blocks.ts has no deleted legacy emit helpers', () => {
    expect(BLOCKS_SOURCE.includes('legacyEmit')).toBe(false);
  });

  test('print/stmt.ts has no deleted legacy emitters', () => {
    expect(STMT_SOURCE.includes('emitSwitchLegacy')).toBe(false);
    expect(STMT_SOURCE.includes('legacyImportText')).toBe(false);
    expect(STMT_SOURCE.includes('packOrLegacy')).toBe(false);
    expect(STMT_SOURCE.includes('console.log')).toBe(false);
  });

  test('print/expr.ts uses pack templates only for v1 families', () => {
    const exprSource = readFileSync(join(import.meta.dir, 'expr.ts'), 'utf8');
    expect(exprSource.includes('CONVERT_TO_STRING_LEGACY')).toBe(false);
    expect(exprSource.includes('nullLiteralLegacy')).toBe(false);
  });

  test('emit/ has no deleted per-language module files', () => {
    const emitDir = join(import.meta.dir, '..', 'emit');
    for (const name of ['python.ts', 'javascript.ts', 'cpp.ts', 'verse.ts']) {
      expect(() => readFileSync(join(emitDir, name), 'utf8')).toThrow();
    }
  });

  test('classModule.ts uses pack shell renderer', () => {
    const source = readFileSync(join(import.meta.dir, '..', 'emit', 'classModule.ts'), 'utf8');
    expect(source.includes("renderClassModuleOpen")).toBe(true);
    expect(source.includes('def on_')).toBe(false);
  });

  test('sinkStatements.ts uses shared blockHelpers', () => {
    const source = readFileSync(join(import.meta.dir, '..', 'emit', 'sinkStatements.ts'), 'utf8');
    expect(source.includes('blockCloseLine')).toBe(true);
    expect(source.includes('ifElseLine')).toBe(true);
    expect(source.includes('condSpanOffset')).toBe(true);
    expect(source.includes('${ctx.indent}}')).toBe(false);
  });
});
