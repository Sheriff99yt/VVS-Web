import { canonicalNativeScalarSignatureType, nativeScalarFunctionSignatureProblem, type NativeScalarFunctionSignature, type NativeScalarParameter } from '@vvs/graph-types';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan, type ImportDiagnostic } from './contracts';
import { loadNativeParser, parseNativeTree } from './nativeParser';
import { previewNativeSyntax, type NativeInventoryLanguage, type NativeSyntaxInventory } from './nativeSyntaxInventory';

export interface NativeSourceParameter extends NativeScalarParameter, SourceSpan { readonly typeSpan: Readonly<SourceSpan> }
export interface NativeSourceSignature extends NativeScalarFunctionSignature, SourceSpan {
  readonly nameSpan: Readonly<SourceSpan>;
  readonly returnTypeSpan?: Readonly<SourceSpan>;
  readonly bodySpan: Readonly<SourceSpan>;
  readonly parameters: readonly Readonly<NativeSourceParameter>[];
  readonly modifiers: readonly string[];
}
export interface NativeSourceSignatureReport {
  readonly language: NativeInventoryLanguage;
  readonly source: string;
  readonly sourceSha256: string;
  readonly inventory: NativeSyntaxInventory;
  readonly signatures: readonly Readonly<NativeSourceSignature>[];
  readonly diagnostics: readonly Readonly<ImportDiagnostic>[];
  readonly graphAdmission: 'blocked';
}
const span = (node: SyntaxNode): Readonly<SourceSpan> => Object.freeze({ start: node.startIndex, end: node.endIndex });
const field = (node: SyntaxNode, name: string) => node.childForFieldName(name);
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !['comment', 'line_comment', 'block_comment'].includes(child.type));

/** Source-owned ordinary scalar function headers, never a declaration/emit cache. */
export async function analyzeNativeSourceSignatures(source: string, language: NativeInventoryLanguage): Promise<Readonly<NativeSourceSignatureReport>> {
  const inventory = await previewNativeSyntax(source, language);
  await loadNativeParser(language);
  const tree = parseNativeTree(source, language);
  const signatures: NativeSourceSignature[] = [], diagnostics: ImportDiagnostic[] = [];
  const fail = (node: SyntaxNode, code: string): never => { throw new ImportFailure(`${language.toUpperCase()}_UNSUPPORTED_SIGNATURE_${code}`, 'This function header needs its native signature contract.', span(node)); };
  try {
    const functions = children(tree.rootNode).filter(node => node.type === (language === 'rust' ? 'function_item' : 'function_definition'));
    if (functions.length > IMPORT_LIMITS.methods) fail(tree.rootNode, 'BUDGET');
    for (const fn of functions) {
      try {
        const declarator = language === 'cpp' ? field(fn, 'declarator') : fn;
        if (!declarator || language === 'cpp' && declarator.type !== 'function_declarator' || field(fn, 'type_parameters')) fail(fn, 'FUNCTION');
        const name = field(declarator!, language === 'cpp' ? 'declarator' : 'name'), body = field(fn, 'body'), parametersNode = field(declarator!, 'parameters');
        if (!name || !['identifier', 'name'].includes(name.type) || !body || !parametersNode) fail(fn, 'FUNCTION');
        const parameters: NativeSourceParameter[] = [];
        for (const parameter of children(parametersNode!)) {
          const type = field(parameter, 'type');
          const identifier = language === 'cpp' ? field(parameter, 'declarator') : language === 'rust' ? field(parameter, 'pattern') : children(parameter).find(child => child.type === 'identifier');
          if (language === 'cpp' && type?.text === 'void' && !identifier && children(parametersNode!).length === 1) continue;
          if (!type || !identifier || identifier.type !== 'identifier' || !['parameter', 'parameter_declaration', 'typed_parameter'].includes(parameter.type)) fail(parameter, 'PARAMETER');
          if (field(parameter, 'value') || children(parameter).some(child => ['default_value', 'default_parameter', 'variadic_parameter', 'attribute_item'].includes(child.type))) fail(parameter, 'DEFAULT_OR_VARIADIC');
          const qualifiers = children(parameter).filter(child => child.type === 'type_qualifier');
          if (qualifiers.some(child => child.text !== 'const')) fail(parameter, 'QUALIFIER');
          const nativeType = canonicalNativeScalarSignatureType(type!.text, language);
          if (!nativeType) fail(type!, 'TYPE');
          parameters.push(Object.freeze({ ...span(identifier!), name: identifier!.text, authoredType: type!.text, nativeType: nativeType!,
            mutable: language === 'rust' ? children(parameter).some(child => child.type === 'mutable_specifier') : !qualifiers.length,
            typeSpan: span(type!) }));
        }
        const returnType = field(fn, language === 'cpp' ? 'type' : 'return_type');
        const authoredReturnType = returnType?.text ?? (language === 'rust' ? '()' : '');
        const nativeReturnType = authoredReturnType === (language === 'rust' ? '()' : 'void') ? authoredReturnType : canonicalNativeScalarSignatureType(authoredReturnType, language);
        if (!nativeReturnType) fail(returnType ?? fn, 'RETURN');
        const modifiers = children(fn).filter(child => ['type_qualifier', 'storage_class_specifier', 'function_modifiers', 'visibility_modifier', 'static_keyword'].includes(child.type)).map(child => child.text);
        if (modifiers.some(modifier => !['const', 'constexpr', 'static', 'const fn', 'pub'].includes(modifier))) fail(fn, 'MODIFIER');
        const signature: NativeSourceSignature = { ...span(fn), language, name: name!.text, nameSpan: span(name!), bodySpan: span(body!),
          authoredReturnType, nativeReturnType: nativeReturnType!, ...(returnType ? { returnTypeSpan: span(returnType) } : {}),
          parameters: Object.freeze(parameters), modifiers: Object.freeze(modifiers) };
        const problem = nativeScalarFunctionSignatureProblem(signature);
        if (problem) fail(fn, problem);
        signatures.push(Object.freeze(signature));
      } catch (error) {
        if (!(error instanceof ImportFailure)) throw error;
        diagnostics.push(Object.freeze({ ...error.span, code: error.code, message: error.message }));
      }
    }
    return Object.freeze({ language, source, sourceSha256: inventory.sourceSha256, inventory, signatures: Object.freeze(signatures), diagnostics: Object.freeze(diagnostics), graphAdmission: 'blocked' });
  } finally { tree.delete(); }
}
