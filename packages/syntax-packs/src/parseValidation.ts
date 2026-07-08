import { readdirSync } from 'fs';
import { createRequire } from 'module';
import {
  type LanguageFamily,
  ROSETTA_FAMILIES,
  loadRosettaFixture,
  rosettaDir,
  transpileRosettaFixture,
} from './rosettaHarness';

export interface ParseValidationFilter {
  families?: LanguageFamily[];
  fixtures?: string[];
}

export interface ParseIssue {
  kind: 'ERROR' | 'MISSING';
  row: number;
  column: number;
  text: string;
}

export interface ParseValidationCaseResult {
  fixture: string;
  family: LanguageFamily;
  supported: boolean;
  passed: boolean;
  issues: ParseIssue[];
}

export interface ParseValidationResult {
  ok: boolean;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  results: ParseValidationCaseResult[];
}

const SUPPORTED_FAMILIES: LanguageFamily[] = ['python', 'javascript'];

type ParseNode = {
  isError: boolean;
  isMissing: boolean;
  startPosition: { row: number; column: number };
  text: string;
  children: ParseNode[];
};

type LoadedParser = {
  parse(input: string): { rootNode: ParseNode };
};

function allFixtureNames(): string[] {
  return readdirSync(rosettaDir())
    .filter((f) => f.endsWith('.fixture.json'))
    .map((f) => f.replace('.fixture.json', ''))
    .sort();
}

function parserForFamily(family: LanguageFamily): LoadedParser | null {
  try {
    const require = createRequire(import.meta.url);
    const Parser = require('tree-sitter');
    const parser = new Parser();
    if (family === 'python') {
      parser.setLanguage(require('tree-sitter-python'));
      return parser as LoadedParser;
    }
    if (family === 'javascript') {
      parser.setLanguage(require('tree-sitter-javascript'));
      return parser as LoadedParser;
    }
  } catch {
    return null;
  }
  return null;
}

function collectIssues(node: ParseNode, issues: ParseIssue[]): void {
  if (node.isError) {
    issues.push({
      kind: 'ERROR',
      row: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
      text: node.text.slice(0, 120),
    });
  }
  if (node.isMissing) {
    issues.push({
      kind: 'MISSING',
      row: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
      text: node.text.slice(0, 120),
    });
  }
  for (const child of node.children) {
    collectIssues(child, issues);
  }
}

export function validateGeneratedParse(filter: ParseValidationFilter = {}): ParseValidationResult {
  const fixtures = filter.fixtures?.length ? filter.fixtures : allFixtureNames();
  const requestedFamilies = filter.families?.length ? filter.families : ROSETTA_FAMILIES;
  const results: ParseValidationCaseResult[] = [];

  for (const fixtureName of fixtures) {
    const fixture = loadRosettaFixture(fixtureName);
    for (const family of requestedFamilies) {
      const parser = parserForFamily(family);
      if (!parser) {
        results.push({
          fixture: fixtureName,
          family,
          supported: false,
          passed: true,
          issues: [],
        });
        continue;
      }
      const output = transpileRosettaFixture(fixture, family);
      const tree = parser.parse(output.files[0]!.content);
      const issues: ParseIssue[] = [];
      collectIssues(tree.rootNode, issues);
      results.push({
        fixture: fixtureName,
        family,
        supported: true,
        passed: issues.length === 0,
        issues,
      });
    }
  }

  const supported = results.filter((r) => r.supported);
  const passed = supported.filter((r) => r.passed).length;
  const skipped = results.length - supported.length;
  return {
    ok: supported.every((r) => r.passed),
    total: supported.length,
    passed,
    failed: supported.length - passed,
    skipped,
    results,
  };
}

export { SUPPORTED_FAMILIES };
