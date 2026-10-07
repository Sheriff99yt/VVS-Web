import { canonicalNativeScalarSignatureType, NativeRuntimeTypeFailure, type NativeRuntimeTypeFact } from '@vvs/graph-types';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan } from './contracts';
import { analyzeNativeSourceSignatures } from './nativeSourceSignatures';
import { analyzeNativeLocalBindings, type NativeLocalBinding } from './nativeLocalBindings';
import { analyzeNativeInitialization } from './nativeInitialization';
import { parseNativeTree } from './nativeParser';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';
import { createNativeScalarSourceExpressionReader, inferNativeScalarSourceExpression, type NativeScalarSourceExpression, type NativeSourceReference } from './nativeScalarSourceExpression';
import { inferNativeLocalInitializer } from './nativeLocalInference';

export type NativeLocalSourceStatement = Readonly<SourceSpan & (
  { kind: 'declaration'; binding: Readonly<NativeLocalBinding>; nativeType: string; authoredType: string; inferenceMode?: 'cpp-auto' | 'rust-let' | 'gdscript-inferred'; declarationGroup: Readonly<SourceSpan>; initializer: NativeScalarSourceExpression; fact: Readonly<NativeRuntimeTypeFact> }
  | { kind: 'assignment'; bindingId: string; target: Readonly<SourceSpan>; nativeType: string; value: NativeScalarSourceExpression; fact: Readonly<NativeRuntimeTypeFact> }
  | { kind: 'return'; style: 'explicit' | 'rust-tail'; value: NativeScalarSourceExpression; fact: Readonly<NativeRuntimeTypeFact> }
)>;
const comments = new Set(['comment', 'line_comment', 'block_comment']);
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !comments.has(child.type));
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });

/** Source-owned typed scalar statement sequences. Visible graph admission remains a separate gate. */
export async function analyzeNativeLocalSourceBodies(source: string, language: NativeInventoryLanguage, options: { inferredLocals?: boolean } = {}) {
  const headers = await analyzeNativeSourceSignatures(source, language);
  const bindings = await analyzeNativeLocalBindings(source, language);
  const initialization = await analyzeNativeInitialization(source, language);
  const tree = parseNativeTree(source, language);
  const expressionBudget = { count: 0, started: performance.now() };
  const records: { owner: Readonly<SourceSpan & { name: string; nativeReturnType: string }>; statements?: readonly NativeLocalSourceStatement[]; diagnostic?: Readonly<SourceSpan & { code: string; message: string }> }[] = [];
  const fail = (at: SourceSpan, code: string): never => { throw new ImportFailure(`NATIVE_LOCAL_SOURCE_${code}`, 'This statement requires its native source/binding/type contract.', at); };
  try {
    for (const signature of headers.signatures) {
      const record: typeof records[number] = { owner: Object.freeze({ start: signature.start, end: signature.end, name: signature.name, nativeReturnType: signature.nativeReturnType }) };
      try {
        const fn = children(tree.rootNode).find(node => node.startIndex === signature.start && node.endIndex === signature.end), body = fn?.childForFieldName('body');
        if (!body) fail(signature.bodySpan, 'BODY_OWNER');
        const initialDiagnostic = initialization.diagnostics.find(item => item.start >= signature.start && item.end <= signature.end);
        if (initialDiagnostic) throw new ImportFailure(initialDiagnostic.code, initialDiagnostic.message, initialDiagnostic);
        const localTypes = new Map<string, string>(), declared = new Set<string>();
        const statements: NativeLocalSourceStatement[] = [];
        const read = createNativeScalarSourceExpressionReader<NativeSourceReference>(source, language, node => {
          const reference = bindings.references.find(ref => ref.start === node.startIndex && ref.end === node.endIndex && ref.access === 'read');
          const binding = reference && bindings.bindings.find(binding => binding.id === reference.bindingId);
          if (!binding) return fail(span(node), 'REFERENCE_OWNER');
          const declaration = Object.freeze({ start: binding.start, end: binding.end });
          if (binding.kind === 'parameter') {
            const slot = signature.parameters.findIndex(parameter => parameter.start === binding.start && parameter.end === binding.end);
            if (slot < 0) return fail(span(node), 'PARAMETER_OWNER');
            return { kind: 'parameter', slot, nativeType: signature.parameters[slot].nativeType, declaration };
          }
          const nativeType = localTypes.get(binding.id);
          if (!nativeType || !declared.has(binding.id) || !initialization.reads.some(item => item.bindingId === binding.id && item.start === node.startIndex && item.end === node.endIndex && item.initialized)) return fail(span(node), 'LOCAL_READ_STATE');
          return { kind: 'local', bindingId: binding.id, nativeType, declaration };
        }, 'NATIVE_LOCAL_SOURCE', expressionBudget);
        const typed = (value: SyntaxNode, type: string) => {
          const expression = read(value), inferred = inferNativeScalarSourceExpression(expression, language, type);
          if (inferred.fact.nativeType !== type) fail(span(value), 'ASSIGNED_TYPE_CONTEXT_REQUIRED');
          return { expression, ...inferred };
        };
        const sourceStatements = children(body!);
        if (sourceStatements.length > IMPORT_LIMITS.nodes) fail(signature.bodySpan, 'STATEMENT_BUDGET');
        for (const [index, original] of sourceStatements.entries()) {
          let node = original;
          if (node.type === 'expression_statement') {
            if (children(node).length !== 1) fail(span(node), 'STATEMENT_OWNER');
            node = children(node)[0];
          }
          if (['declaration', 'let_declaration', 'variable_statement', 'const_statement'].includes(node.type)) {
            if (language === 'cpp' && children(node).some(child => child.type === 'type_qualifier' && child.text !== 'const')) fail(span(node), 'QUALIFIER_CONTEXT');
            const declarators = language === 'cpp' ? node.childrenForFieldName('declarator') : [node];
            if (!declarators.length) fail(span(node), 'DECLARATION_OWNER');
            let inferredGroupType: string | undefined;
            for (const declarator of declarators) {
              const identifier = language === 'cpp' ? declarator.childForFieldName('declarator') : node.childForFieldName(language === 'rust' ? 'pattern' : 'name');
              const binding = identifier && bindings.bindings.find(binding => binding.kind === 'local' && binding.start === identifier.startIndex && binding.end === identifier.endIndex);
              const initializer = declarator.childForFieldName('value');
              let nativeType = binding?.declaredType && canonicalNativeScalarSignatureType(binding.declaredType, language);
              const inferenceMode = language === 'cpp' && binding?.declaredType === 'auto' ? 'cpp-auto' : language === 'rust' && binding && !binding.declaredType ? 'rust-let' : language === 'gdscript' && binding?.declaredType === ':=' ? 'gdscript-inferred' : undefined;
              if (!binding || !initializer || declared.has(binding.id) || !nativeType && !(inferenceMode && options.inferredLocals)) fail(span(declarator), 'TYPED_INITIALIZER_REQUIRED');
              const inferred = inferenceMode ? (() => { const expression = read(initializer!); return { expression, ...inferNativeLocalInitializer(expression, language) }; })() : typed(initializer!, nativeType!);
              nativeType = inferred.fact.nativeType;
              if (inferenceMode === 'cpp-auto' && inferredGroupType && inferredGroupType !== nativeType) fail(span(declarator), 'AUTO_GROUP_TYPE_MISMATCH');
              if (inferenceMode === 'cpp-auto') inferredGroupType = nativeType;
              if (language === 'gdscript' && !binding!.mutable && inferred.referenceCount) fail(span(initializer!), 'CONSTANT_BINDING_CONTEXT_REQUIRED');
              localTypes.set(binding!.id, nativeType!); declared.add(binding!.id);
              statements.push(Object.freeze({ ...span(declarator), kind: 'declaration', binding: Object.freeze({ ...binding! }), nativeType: nativeType!, authoredType: binding!.declaredType ?? '', ...(inferenceMode ? { inferenceMode } : {}), declarationGroup: Object.freeze(span(node)), initializer: inferred.expression, fact: inferred.fact }));
            }
            continue;
          }
          if (['assignment_expression', 'assignment'].includes(node.type)) {
            const left = node.childForFieldName('left'), right = node.childForFieldName('right');
            if (!left || !right || left.type !== 'identifier' || source.slice(left.endIndex, right.startIndex).trim() !== '=') fail(span(node), 'ASSIGNMENT_CONTEXT');
            const reference = bindings.references.find(item => item.start === left!.startIndex && item.end === left!.endIndex && item.access === 'write');
            const binding = reference && bindings.bindings.find(item => item.id === reference.bindingId && item.kind === 'local');
            const nativeType = binding && localTypes.get(binding.id);
            if (!binding || !nativeType || !binding.mutable) fail(span(left!), 'ASSIGNMENT_OWNER');
            const inferred = typed(right!, nativeType!);
            statements.push(Object.freeze({ ...span(node), kind: 'assignment', bindingId: binding!.id, target: Object.freeze(span(left!)), nativeType: nativeType!, value: inferred.expression, fact: inferred.fact }));
            continue;
          }
          const explicit = ['return_statement', 'return_expression'].includes(node.type);
          if (index !== sourceStatements.length - 1 || !explicit && language !== 'rust' || !explicit && original.type === 'expression_statement' && original.text.trimEnd().endsWith(';')) fail(span(original), 'RETURN_CONTEXT');
          const value = explicit ? children(node)[0] : node;
          if (!value) fail(span(node), 'RETURN_VALUE_REQUIRED');
          const inferred = typed(value!, signature.nativeReturnType);
          statements.push(Object.freeze({ ...span(original), kind: 'return', style: explicit ? 'explicit' : 'rust-tail', value: inferred.expression, fact: inferred.fact }));
        }
        if (statements.at(-1)?.kind !== 'return') fail(signature.bodySpan, 'RETURN_REQUIRED');
        const checkTrivia = (node: SyntaxNode): void => { if (comments.has(node.type)) fail(span(node), 'COMMENT_MAPPING_REQUIRED'); for (const child of node.namedChildren) checkTrivia(child); };
        checkTrivia(body!);
        record.statements = Object.freeze(statements);
      } catch (error) {
        if (!(error instanceof ImportFailure) && !(error instanceof NativeRuntimeTypeFailure)) throw error;
        record.diagnostic = Object.freeze({ ...(error instanceof ImportFailure ? error.span : signature.bodySpan), code: error.code, message: error.message });
      }
      records.push(Object.freeze(record));
    }
    return Object.freeze({ source, sourceSha256: headers.sourceSha256, language, inventory: headers.inventory, headerDiagnostics: headers.diagnostics, records: Object.freeze(records), graphAdmission: 'blocked' as const });
  } finally { tree.delete(); }
}
