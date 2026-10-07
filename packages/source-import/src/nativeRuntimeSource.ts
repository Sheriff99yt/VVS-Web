import { NativeRuntimeTypeFailure, type NativeRuntimeTypeFact } from '@vvs/graph-types';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, type SourceSpan } from './contracts';
import { createNativeScalarSourceExpressionReader, inferNativeScalarSourceExpression, type NativeSourceParameterReference, type NativeScalarSourceExpression } from './nativeScalarSourceExpression';
import { analyzeNativeSourceSignatures } from './nativeSourceSignatures';
import { analyzeNativeLocalBindings } from './nativeLocalBindings';
import { parseNativeTree } from './nativeParser';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';

export type NativeRuntimeSourceTree = NativeScalarSourceExpression<NativeSourceParameterReference>;
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !['comment', 'line_comment', 'block_comment'].includes(child.type));
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });
/** Bound source trees only: not a graph receipt, compiler cache or complete-module verdict. */
export async function analyzeNativeRuntimeSource(source: string, language: NativeInventoryLanguage) {
  const headers = await analyzeNativeSourceSignatures(source, language);
  const bindings = await analyzeNativeLocalBindings(source, language);
  const tree = parseNativeTree(source, language);
  const expressionBudget = { count: 0, started: performance.now() };
  const records: { owner: Readonly<SourceSpan & { name: string; nativeReturnType: string }>; expression?: NativeRuntimeSourceTree; fact?: Readonly<NativeRuntimeTypeFact>; diagnostic?: Readonly<SourceSpan & { code: string; message: string }> }[] = [];
  const fail = (at: SourceSpan, code: string): never => { throw new ImportFailure(`NATIVE_RUNTIME_SOURCE_${code}`, 'This expression requires its native source/binding/type contract.', at); };
  try {
    for (const signature of headers.signatures) {
      const record: typeof records[number] = { owner: Object.freeze({ start: signature.start, end: signature.end, name: signature.name, nativeReturnType: signature.nativeReturnType }) };
      try {
        const fn = children(tree.rootNode).find(node => node.startIndex === signature.start && node.endIndex === signature.end);
        const body = fn?.childForFieldName('body');
        if (!body || children(body).length !== 1) fail(signature.bodySpan, 'BODY_CONTEXT');
        let statement = children(body!)[0];
        if (language === 'rust' && statement.type === 'expression_statement') {
          if (!children(statement)[0] || statement.text.trimEnd().endsWith(';') && children(statement)[0].type !== 'return_expression') fail(span(statement), 'DISCARDED_EXPRESSION');
          statement = children(statement)[0];
        }
        const value = ['return_statement', 'return_expression'].includes(statement.type) ? children(statement)[0] : language === 'rust' ? statement : undefined;
        if (!value) fail(signature.bodySpan, 'RETURN_CONTEXT');
        const read = createNativeScalarSourceExpressionReader<NativeSourceParameterReference>(source, language, node => {
          const reference = bindings.references.find(ref => ref.start === node.startIndex && ref.end === node.endIndex && ref.access === 'read');
          const binding = reference && bindings.bindings.find(binding => binding.id === reference.bindingId && binding.kind === 'parameter');
          const slot = binding ? signature.parameters.findIndex(p => p.start === binding.start && p.end === binding.end) : -1;
          if (slot < 0) return fail(span(node), 'PARAMETER_BINDING');
          return { kind: 'parameter', slot, nativeType: signature.parameters[slot].nativeType, declaration: Object.freeze({ start: binding!.start, end: binding!.end }) };
        }, 'NATIVE_RUNTIME_SOURCE', expressionBudget);
        record.expression = read(value!);
        const inferred = inferNativeScalarSourceExpression(record.expression, language, signature.nativeReturnType);
        if (!inferred.referenceCount) fail(record.expression, 'PARAMETER_REQUIRED');
        record.fact = inferred.fact;
      } catch (error) {
        if (!(error instanceof ImportFailure) && !(error instanceof NativeRuntimeTypeFailure)) throw error;
        record.diagnostic = Object.freeze({ ...(error instanceof ImportFailure ? error.span : signature.bodySpan), code: error.code, message: error.message });
        delete record.fact;
      }
      records.push(Object.freeze(record));
    }
    return Object.freeze({ source, sourceSha256: headers.sourceSha256, language, inventory: headers.inventory, headerDiagnostics: headers.diagnostics, records: Object.freeze(records), graphAdmission: 'blocked' as const });
  } finally { tree.delete(); }
}
