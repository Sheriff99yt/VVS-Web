import type { ImportRegion } from './parser';
import { checkSourceBudget } from './parser';
import { loadNativeParser, parseNativeTree } from './nativeParser';
import { NATIVE_GRAMMARS } from './nativeGrammarContracts';
import { ImportFailure } from './contracts';

export type NativeInventoryLanguage = 'rust' | 'cpp' | 'gdscript';
export interface NativeSyntaxRegion extends ImportRegion { syntaxKind?: string; syntaxName?: string }
export interface NativeSyntaxInventory {
  readonly language: NativeInventoryLanguage;
  readonly stage: 'syntax-inventory';
  readonly source: string;
  readonly sourceSha256: string;
  readonly grammarVersion: string;
  readonly grammarAbi: number;
  readonly grammarSha256: string;
  readonly nativeBindingStatus: 'unvalidated';
  readonly regions: readonly Readonly<NativeSyntaxRegion>[];
  readonly diagnostics: readonly string[];
}

/** Retain every source span; clean syntax never grants a visual acceptance receipt. */
export async function previewNativeSyntax(source: string, language: NativeInventoryLanguage): Promise<NativeSyntaxInventory> {
  if (!['rust', 'cpp', 'gdscript'].includes(language)) throw new ImportFailure('IMPORT_LANGUAGE_UNSUPPORTED', 'This syntax inventory requires a reviewed grammar profile.');
  checkSourceBudget(source);
  await loadNativeParser(language);
  const tree = parseNativeTree(source, language);
  const regions: NativeSyntaxRegion[] = [];
  try {
    let position = 0;
    for (const node of tree.rootNode.namedChildren) {
      if (node.startIndex > position) regions.push({ kind: 'trivia', start: position, end: node.startIndex, text: source.slice(position, node.startIndex) });
      const name = node.childForFieldName('name');
      const trivia = ['comment', 'line_comment', 'block_comment'].includes(node.type);
      regions.push({ kind: trivia ? 'trivia' : 'unresolved', start: node.startIndex, end: node.endIndex,
        text: source.slice(node.startIndex, node.endIndex), syntaxKind: node.type,
        ...(name ? { syntaxName: name.text } : {}),
        ...(!trivia ? { reason: 'Native bindings, semantics and visible mappings are not yet validated.' } : {}) });
      position = node.endIndex;
    }
    if (position < source.length) regions.push({ kind: 'trivia', start: position, end: source.length, text: source.slice(position) });
  } finally { tree.delete(); }
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))), byte => byte.toString(16).padStart(2, '0')).join('');
  const contract = NATIVE_GRAMMARS[language];
  return Object.freeze({ language, stage: 'syntax-inventory', source, sourceSha256: hash,
    grammarVersion: contract.version, grammarAbi: contract.abi, grammarSha256: contract.sha256,
    nativeBindingStatus: 'unvalidated', regions: Object.freeze(regions.map(region => Object.freeze(region))),
    diagnostics: Object.freeze(['NATIVE_BINDING_UNVALIDATED: Syntax recognition does not establish native bindings, effects or editable graph mappings.']) });
}
