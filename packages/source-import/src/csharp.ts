import { checkSourceBudget } from './parser';
import { loadCSharpParser, parseCSharpTree } from './nativeParser';
import { analyzeCSharpIntegralBindings, type CSharpIntegralBindingReport } from './csharpBindings';

export interface CSharpDeclarationInventory {
  kind: string;
  name?: string;
  start: number;
  end: number;
  ownerStart?: number;
}
/** Syntax inventory is intentionally separate from an import preview/acceptance receipt. */
export interface CSharpSourceInventory {
  language: 'csharp';
  analysisOnly: true;
  grammarVersion: '0.23.5';
  source: string;
  sourceSha256: string;
  syntaxComplete: boolean;
  declarations: CSharpDeclarationInventory[];
  diagnostics: string[];
  integralBindings?: CSharpIntegralBindingReport;
}
const declarationKinds = new Set([
  'namespace_declaration', 'file_scoped_namespace_declaration', 'class_declaration',
  'struct_declaration', 'interface_declaration', 'record_declaration', 'enum_declaration',
  'delegate_declaration', 'method_declaration', 'constructor_declaration',
  'destructor_declaration', 'property_declaration', 'indexer_declaration',
  'field_declaration', 'event_declaration', 'event_field_declaration',
  'operator_declaration', 'conversion_operator_declaration', 'local_function_statement',
]);
/** Retains the entire source, including unsupported constructs, comments and directives. */
export async function inventoryCSharpSource(source: string): Promise<CSharpSourceInventory> {
  checkSourceBudget(source);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const sourceSha256 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  const result: CSharpSourceInventory = { language: 'csharp', analysisOnly: true, grammarVersion: '0.23.5', source, sourceSha256, syntaxComplete: false, declarations: [], diagnostics: [] };
  try {
    await loadCSharpParser();
    const tree = parseCSharpTree(source);
    try {
      const queue = [{ node: tree.rootNode, ownerStart: undefined as number | undefined }];
      while (queue.length) {
        const { node, ownerStart } = queue.pop()!;
        const declaration = declarationKinds.has(node.type);
        if (declaration) result.declarations.push({ kind: node.type, name: node.childForFieldName('name')?.text, start: node.startIndex, end: node.endIndex, ownerStart });
        for (const child of node.namedChildren) queue.push({ node: child, ownerStart: declaration ? node.startIndex : ownerStart });
      }
      result.declarations.sort((a, b) => a.start - b.start || b.end - a.end);
      result.syntaxComplete = true;
    } finally { tree.delete(); }
    result.integralBindings = await analyzeCSharpIntegralBindings(source);
  } catch (error) {
    result.diagnostics.push(error instanceof Error ? error.message : String(error));
  }
  result.declarations.forEach(Object.freeze);
  Object.freeze(result.declarations); Object.freeze(result.diagnostics);
  return Object.freeze(result);
}
