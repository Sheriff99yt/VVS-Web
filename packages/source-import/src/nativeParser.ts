import type { Parser, Language, Tree } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS } from './contracts';
import { checkSourceBudget } from './parser';
import { NATIVE_GRAMMARS, type NativeGrammar } from './nativeGrammarContracts';

type Runtime = { Parser: typeof Parser; Language: typeof Language };
interface Assets { baseUrl?: string; runtime?: Runtime; runtimeWasm?: Uint8Array; goGrammar?: Uint8Array; csharpGrammar?: Uint8Array; rustGrammar?: Uint8Array; cppGrammar?: Uint8Array; gdscriptGrammar?: Uint8Array }
let assets: Assets = {};
let initialized: Promise<Runtime> | undefined;
type Grammar = NativeGrammar;
const grammars: Partial<Record<Grammar, Promise<{ runtime: Runtime; language: Language }>>> = {};
const ready: Partial<Record<Grammar, { runtime: Runtime; language: Language }>> = {};
/** The web host supplies its deployment base path; native tests supply identical pinned bytes. */
export function configureNativeParserAssets(next: Assets): void {
  // A loaded runtime is immutable, but another lazy grammar may be configured later.
  if (!initialized) assets = { ...assets, ...next };
  else {
    for (const kind of Object.keys(NATIVE_GRAMMARS) as Grammar[]) {
      const key = `${kind}Grammar` as `${Grammar}Grammar`;
      if (!grammars[kind] && next[key]) assets[key] = next[key];
    }
  }
}
async function initialize() {
  const config = { ...assets };
  const base = config.baseUrl ?? '/source-parsers';
  const url = `${base}/web-tree-sitter.js`;
  const runtime = config.runtime ?? await import(/* webpackIgnore: true */ url) as Runtime;
  await runtime.Parser.init(config.runtimeWasm ? { wasmBinary: config.runtimeWasm } : { locateFile: () => `${base}/web-tree-sitter.wasm` });
  return runtime;
}
async function loadGrammar(kind: Grammar): Promise<void> {
  initialized ??= initialize().catch(error => { initialized = undefined; throw error; });
  if (!grammars[kind]) {
    const contract = NATIVE_GRAMMARS[kind];
    const bytes = assets[`${kind}Grammar`];
    const path = `${assets.baseUrl ?? '/source-parsers'}/${contract.file}`;
    grammars[kind] = initialized.then(async runtime => {
      let grammar = bytes;
      if (!grammar) {
        const response = await fetch(path);
        if (!response.ok) throw new ImportFailure('GRAMMAR_LOAD', `Cannot load the pinned ${contract.label} grammar.`);
        grammar = new Uint8Array(await response.arrayBuffer());
      }
      // Snapshot exactly this view; injected buffers can share a larger backing
      // allocation or be changed while the asynchronous digest is in progress.
      const grammarBytes = new Uint8Array(grammar);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', grammarBytes.buffer)), byte => byte.toString(16).padStart(2, '0')).join('');
      if (hash !== contract.sha256) throw new ImportFailure('GRAMMAR_PIN', `The pinned ${contract.label} grammar bytes changed.`);
      const language = await runtime.Language.load(grammarBytes);
      if (language.abiVersion !== contract.abi) throw new ImportFailure('GRAMMAR_ABI', `The pinned ${contract.label} grammar requires ABI ${contract.abi}.`);
      return { runtime, language };
    }).catch(error => { delete grammars[kind]; throw error; });
  }
  ready[kind] = await grammars[kind];
}
export async function prepareGoParser(): Promise<void> { await loadGrammar('go'); }
export async function loadGoParser(): Promise<void> { await loadGrammar('go'); }
export async function loadCSharpParser(): Promise<void> { await loadGrammar('csharp'); }
export async function loadNativeParser(kind: NativeGrammar): Promise<void> {
  if (!Object.hasOwn(NATIVE_GRAMMARS, kind)) throw new ImportFailure('IMPORT_LANGUAGE_UNSUPPORTED', 'No pinned native grammar is configured for this language.');
  await loadGrammar(kind);
}
/** Trees are transient and must be deleted by the caller after inspection. */
export function parseNativeTree(source: string, kind: Grammar): Tree {
  checkSourceBudget(source);
  const loaded = ready[kind];
  const label = NATIVE_GRAMMARS[kind].label;
  if (!loaded) throw new ImportFailure('PARSER_NOT_READY', `Analyze ${label} source before reviewing it.`);
  const started = performance.now();
  const parser = new loaded.runtime.Parser();
  try {
    parser.setLanguage(loaded.language);
    const tree = parser.parse(source, null, { progressCallback: () => performance.now() - started > IMPORT_LIMITS.elapsedMs });
    if (!tree) throw new ImportFailure('PARSER_CANCELLED', `${label} parsing exceeded its time budget.`);
    const queue = [{ node: tree.rootNode, depth: 0 }]; let count = 0;
    while (queue.length) {
      const { node, depth } = queue.pop()!;
      if (node.isError || node.isMissing || depth > IMPORT_LIMITS.depth || ++count > IMPORT_LIMITS.astNodes || performance.now() - started > IMPORT_LIMITS.elapsedMs) {
        const location = { start: node.startIndex, end: node.endIndex };
        tree.delete();
        throw new ImportFailure(`${kind.toUpperCase()}_PARSE`, `${label} source must parse completely within the syntax budget.`, location);
      }
      for (const child of node.children) queue.push({ node: child, depth: depth + 1 });
    }
    return tree;
  } finally { parser.delete(); }
}
export function parseGoTree(source: string): Tree { return parseNativeTree(source, 'go'); }
export function parseCSharpTree(source: string): Tree { return parseNativeTree(source, 'csharp'); }
