import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { transpileGraph, withTestEntryGraph } from '@vvs/transpiler';
import {
  resolveNodeKindId,
  type GraphEdge,
  type GraphNode,
  type LanguageFamily,
  type ProjectEventDefinition,
  type FunctionSymbol,
  type VariableSymbol,
} from '@vvs/graph-types';

export type { LanguageFamily };

export const ROSETTA_FAMILIES: LanguageFamily[] = [
  'python',
  'javascript',
  'cpp',
  'verse',
  'gdscript',
  'rust',
  'csharp',
];

export interface RosettaFixture {
  name: string;
  description?: string;
  moduleName: string;
  extendsType?: string;
  variables?: VariableSymbol[];
  functions?: FunctionSymbol[];
  events?: ProjectEventDefinition[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** When set, load environment manifest for env-native fixtures. */
  environmentId?: string;
  /** Golden extraction mode — default on_start handler body. */
  goldenExtract?: 'on_start' | 'imports';
}

export function rosettaDir(): string {
  const here = fileURLToPath(new URL('.', import.meta.url));
  return join(here, '..', 'rosetta');
}

export function loadRosettaFixture(name: string): RosettaFixture {
  return JSON.parse(readFileSync(join(rosettaDir(), `${name}.fixture.json`), 'utf8'));
}

/** Extract on_start handler body lines for golden comparison. */
export function extractOnStartBody(content: string, family: LanguageFamily): string {
  const lines = content.split('\n');
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (family === 'python' && lines[i]!.includes('def on_start')) start = i + 1;
    if (family === 'javascript' && lines[i]!.includes('on_start()')) start = i + 1;
    if (family === 'cpp' && lines[i]!.includes('void on_start()')) start = i + 1;
    if (family === 'verse' && lines[i]!.includes('on_start')) start = i + 1;
    if (family === 'gdscript' && lines[i]!.includes('func on_start')) start = i + 1;
    if (family === 'rust' && lines[i]!.includes('fn on_start')) start = i + 1;
    if (family === 'csharp' && lines[i]!.includes('void on_start')) start = i + 1;
  }
  if (start < 0) return content;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]!;
    if (family === 'python' && /^    def /.test(l)) {
      end = i;
      break;
    }
    if (family === 'gdscript' && /^    func /.test(l)) {
      end = i;
      break;
    }
    if (family === 'rust' && /^    pub fn /.test(l)) {
      end = i;
      break;
    }
    if (family === 'csharp' && /^    void /.test(l)) {
      end = i;
      break;
    }
    if (family === 'javascript' && /^  [a-z_]/.test(l) && !l.startsWith('    ')) {
      end = i;
      break;
    }
    if (family === 'cpp' && /^    void /.test(l)) {
      end = i;
      break;
    }
    if (family === 'verse' && /^    on_/.test(l)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n') + '\n';
}

/** Extract hoisted import lines for golden comparison. */
export function extractImports(content: string, family: LanguageFamily): string {
  const lines = content.split('\n');
  const imports: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (imports.length > 0) break;
      continue;
    }
    if (family === 'python' && (trimmed.startsWith('import ') || trimmed.startsWith('from '))) {
      imports.push(line);
      continue;
    }
    if (family === 'javascript' && trimmed.startsWith('import ')) {
      imports.push(line);
      continue;
    }
    if (family === 'gdscript' && trimmed.startsWith('const ') && trimmed.includes('preload(')) {
      imports.push(line);
      continue;
    }
    if (family === 'rust' && (trimmed.startsWith('use ') || trimmed.startsWith('mod '))) {
      imports.push(line);
      continue;
    }
    if (family === 'csharp' && trimmed.startsWith('using ')) {
      imports.push(line);
      continue;
    }
    if (family === 'cpp' && trimmed.startsWith('#include')) {
      imports.push(line);
      continue;
    }
    if (family === 'verse' && trimmed.startsWith('using ')) {
      imports.push(line);
      continue;
    }
    if (imports.length > 0) break;
    if (
      trimmed.startsWith('class ') ||
      trimmed.startsWith('export ') ||
      trimmed.startsWith('class_name ') ||
      trimmed.startsWith('pub struct ')
    ) {
      break;
    }
  }
  return imports.join('\n') + (imports.length > 0 ? '\n' : '');
}

export function extractGoldenBody(
  content: string,
  family: LanguageFamily,
  mode: 'on_start' | 'imports' = 'on_start'
): string {
  if (mode === 'imports') return extractImports(content, family);
  return extractOnStartBody(content, family);
}

function stripLegacyOnStart(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[]; flowTargetId?: string } {
  const legacyStart = nodes.find((n) => resolveNodeKindId(n.data) === 'event_on_start');
  if (!legacyStart) return { nodes, edges };

  const outEdge = edges.find(
    (e) => e.source === legacyStart.id && e.data?.pinType === 'execution'
  );
  return {
    nodes: nodes.filter((n) => n.id !== legacyStart.id),
    edges: edges.filter((e) => e.source !== legacyStart.id && e.target !== legacyStart.id),
    flowTargetId: outEdge?.target,
  };
}

export function transpileRosettaFixture(fixture: RosettaFixture, family: LanguageFamily) {
  const { nodes, edges, flowTargetId } = stripLegacyOnStart(fixture.nodes, fixture.edges);
  const base = {
    moduleName: fixture.moduleName,
    extendsType: fixture.extendsType ?? '',
    targetLanguage: family,
    variables: fixture.variables ?? [],
    functions: fixture.functions ?? [],
    projectEvents: fixture.events ?? [],
    nodes,
    edges,
    environmentId: fixture.environmentId,
  };

  const hasLegacyEntry = fixture.nodes.some((n) => resolveNodeKindId(n.data) === 'event_on_start');
  const ctx = hasLegacyEntry ? withTestEntryGraph(base, flowTargetId) : base;

  return transpileGraph(ctx);
}
