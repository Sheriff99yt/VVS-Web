import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan } from './contracts';
import { parseNativeTree } from './nativeParser';
import { previewNativeSyntax, type NativeInventoryLanguage, type NativeSyntaxInventory } from './nativeSyntaxInventory';
import { evaluateNativeConstant, type NativeConstantExpression, type NativeConstantFact } from './nativeConstantExpressions';

export type NativeSourceExpression = NativeConstantExpression & SourceSpan & { syntaxKind:string };
export interface NativeSourceExpressionRecord extends SourceSpan {
  owner: Readonly<SourceSpan & { name:string; kind:'initializer'|'return'; contextType?:string }>;
  expression?: Readonly<NativeSourceExpression>; fact?: Readonly<NativeConstantFact>;
  diagnostic?: Readonly<SourceSpan & { code:string; status:'invalid'|'unsupported'; message:string }>;
}
export interface NativeSourceExpressionReport {
  analysisOnly:true; graphAdmission:'blocked'; language:NativeInventoryLanguage;
  source:string; sourceSha256:string; inventory:NativeSyntaxInventory;
  records:readonly Readonly<NativeSourceExpressionRecord>[];
}
const field=(node:SyntaxNode,name:string)=>node.childForFieldName(name);
const children=(node:SyntaxNode)=>node.namedChildren.filter(child=>!['comment','line_comment','block_comment'].includes(child.type));
const span=(node:SyntaxNode):SourceSpan=>({start:node.startIndex,end:node.endIndex});
const integerType=(type?:string)=>type && /^[iu](?:8|16|32|64|128|size)$/.test(type) ? type : undefined;

/** Source-owned constant initializer/return observations, never whole-source validity or graph receipts. */
export async function analyzeNativeConstantSource(source:string,language:NativeInventoryLanguage):Promise<NativeSourceExpressionReport> {
  const inventory=await previewNativeSyntax(source,language);
  const tree=parseNativeTree(source,language), started=performance.now();
  const records:NativeSourceExpressionRecord[]=[];
  const fail=(node:SyntaxNode,code:string):never=>{throw new ImportFailure(`${language.toUpperCase()}_${code}`,'This source expression requires its native binding/type/effect contract.',span(node));};
  const hint=(node:SyntaxNode):string|undefined=>{
    if (node.type==='parenthesized_expression') { const child=children(node)[0]; return child?hint(child):undefined; }
    if (node.type==='type_cast_expression') return integerType(field(node,'type')?.text);
    if (node.type==='integer_literal') return node.text.match(/([iu](?:8|16|32|64|128|size))$/)?.[1];
    if (node.type==='unary_expression') {const operand=children(node)[0];return operand?hint(operand):undefined;}
    if (node.type==='binary_expression') {
      const left=field(node,'left'),right=field(node,'right'),operator=field(node,'operator')?.text??(left&&right?source.slice(left.endIndex,right.startIndex).trim():'');
      if(!['==','!=','<','<=','>','>=','&&','||'].includes(operator))return left&&hint(left)||right&&hint(right)||undefined;
    }
    return undefined;
  };
  const build=(node:SyntaxNode,contextType?:string,depth=0):NativeSourceExpression=>{
    if (depth>128 || performance.now()-started>IMPORT_LIMITS.elapsedMs) return fail(node,'UNSUPPORTED_SOURCE_EXPRESSION_BUDGET');
    const base={...span(node),syntaxKind:node.type};
    const result=(item:NativeConstantExpression):NativeSourceExpression=>Object.freeze({...base,...item}) as NativeSourceExpression;
    if (['integer_literal','number_literal','integer','boolean_literal','true','false'].includes(node.type)) {
      if(language==='cpp'&&node.type==='number_literal'&&/^[+-]/.test(node.text)) {
        const operand=Object.freeze({kind:'literal' as const,token:node.text.slice(1),start:node.startIndex+1,end:node.endIndex,syntaxKind:node.type});
        return result({kind:'unary',operator:node.text[0],operand});
      }
      const options=language==='rust' && contextType ? Object.freeze({expectedType:contextType}) : undefined;
      return result({kind:'literal',token:node.text,...(options?{options}:{} )});
    }
    if (node.type==='parenthesized_expression') {
      const operand=children(node)[0]; if (!operand) return fail(node,'UNSUPPORTED_SOURCE_GROUP');
      return result({kind:'group',operand:build(operand,contextType,depth+1)});
    }
    if (['unary_expression','unary_operator'].includes(node.type)) {
      const operand=children(node)[0];if(!operand)return fail(node,'UNSUPPORTED_SOURCE_UNARY');
      const spelling=field(node,'operator')?.text??node.children.find(child=>!child.isNamed&&['-','+','!','~','not'].includes(child.text))?.text??source.slice(node.startIndex,operand.startIndex).trim(),operator=spelling==='not'?'!':spelling;
      return result({kind:'unary',operator,operand:build(operand,contextType,depth+1),...(language==='gdscript'?{directLiteral:['integer','true','false'].includes(operand.type)}:{})});
    }
    if (['binary_expression','binary_operator'].includes(node.type)) {
      const left=field(node,'left'),right=field(node,'right');if(!left||!right)return fail(node,'UNSUPPORTED_SOURCE_BINARY');
      const operator=field(node,'operator')?.text??node.children.find(child=>!child.isNamed&&['+','-','*','/','%','&','|','^','<<','>>','==','!=','<','<=','>','>=','&&','||','and','or'].includes(child.text))?.text??source.slice(left.endIndex,right.startIndex).trim();
      const comparison=['==','!=','<','<=','>','>='].includes(operator),shift=['<<','>>'].includes(operator);
      const operandType=language==='rust'?(comparison?undefined:integerType(contextType))??hint(left)??hint(right):undefined;
      return result({kind:'binary',operator,left:build(left,operandType,depth+1),right:build(right,shift?hint(right):operandType,depth+1)});
    }
    if (language==='rust' && node.type==='type_cast_expression') {
      const operand=field(node,'value'),type=field(node,'type');if(!operand||!type)return fail(node,'UNSUPPORTED_SOURCE_CAST');
      return result({kind:'convert',nativeType:type.text,operand:build(operand,undefined,depth+1)});
    }
    if (language==='cpp' && node.type==='call_expression') {
      const fn=field(node,'function'),argumentsNode=field(node,'arguments');
      const typeArguments=fn?field(fn,'arguments'):null;
      if (!fn || fn.type!=='template_function' || field(fn,'name')?.text!=='static_cast' || !argumentsNode || !typeArguments) return fail(node,'UNSUPPORTED_SOURCE_CALL');
      const types=children(typeArguments),argumentsList=children(argumentsNode);
      if(types.length!==1||argumentsList.length!==1||types[0].type!=='type_descriptor')return fail(node,'UNSUPPORTED_SOURCE_CAST');
      return result({kind:'convert',nativeType:types[0].text,operand:build(argumentsList[0],undefined,depth+1)});
    }
    if (language==='gdscript' && node.type==='call') {
      const argumentsNode=field(node,'arguments'),callee=children(node).find(child=>child.type==='identifier');
      if (!callee || !['int','bool'].includes(callee.text) || !argumentsNode || children(argumentsNode).length!==1) return fail(node,'UNSUPPORTED_SOURCE_CALL');
      return result({kind:'convert',nativeType:callee.text,operand:build(children(argumentsNode)[0],undefined,depth+1)});
    }
    return fail(node,'UNSUPPORTED_SOURCE_EXPRESSION');
  };
  const observe=(node:SyntaxNode,owner:NativeSourceExpressionRecord['owner'])=>{
    const record:NativeSourceExpressionRecord={...span(node),owner:Object.freeze(owner)};
    try {
      record.expression=build(node,language==='rust'?owner.contextType:undefined);
      record.fact=evaluateNativeConstant(record.expression,language);
      if (language==='rust' && owner.contextType && record.fact.nativeType!==owner.contextType) fail(node,'EXPRESSION_CONTEXT_TYPE');
    } catch(error) {
      if (!(error instanceof ImportFailure)) throw error;
      const errorSpan=error.span&&(error.span.start!==0||error.span.end!==0)?error.span:span(node);
      record.diagnostic=Object.freeze({...errorSpan,code:error.code,status:error.code.includes('UNSUPPORTED')?'unsupported':'invalid',message:error.message});
      delete record.fact;
    }
    records.push(Object.freeze(record));
  };
  const walk=(node:SyntaxNode,method?:{name:string;type?:string},depth=0):void=>{
    if(depth>128||performance.now()-started>IMPORT_LIMITS.elapsedMs) return fail(node,'UNSUPPORTED_SOURCE_EXPRESSION_BUDGET');
    if (['template_declaration','class_specifier','struct_specifier','impl_item','macro_invocation','lambda_expression','closure_expression','lambda'].includes(node.type)) return;
    if (node.type===(language==='rust'?'function_item':'function_definition')) {
      const body=field(node,'body');if(!body)return;
      const declarator=language==='cpp'?field(node,'declarator'):node;
      const name=declarator?field(declarator,'name')??field(declarator,'declarator'):null;
      const type=field(node,language==='cpp'?'type':'return_type')?.text;
      if(language==='rust') {
        const last=children(body).at(-1);
        const implicit=last?.type==='expression_statement'&&!last.text.trimEnd().endsWith(';')?children(last)[0]:last;
        if(implicit&&!['let_declaration','expression_statement','return_expression','attribute_item','empty_statement'].includes(implicit.type))observe(implicit,{...span(implicit),name:name?.text??'',kind:'return',...(type?{contextType:type}:{})});
      }
      for(const child of children(body))walk(child,{name:name?.text??'',type},depth+1);
      return;
    }
    if(language==='cpp'&&node.type==='declaration') {
      for(const declarator of node.childrenForFieldName('declarator')) {
        const initializer=field(declarator,'value'),name=field(declarator,'declarator');
        if(initializer&&name?.type==='identifier')observe(initializer,{...span(name),name:name.text,kind:'initializer',contextType:field(node,'type')?.text});
      }
      return;
    }
    if(['const_item','static_item','let_declaration','const_statement','variable_statement'].includes(node.type)) {
      const initializer=field(node,'value'),name=field(node,language==='rust'&&node.type==='let_declaration'?'pattern':'name');
      if(initializer&&name&&['identifier','name'].includes(name.type))observe(initializer,{...span(name),name:name.text,kind:'initializer',...(field(node,'type')?{contextType:field(node,'type')!.text}:{})});
      return;
    }
    if(['return_statement','return_expression'].includes(node.type)&&method) {
      const operand=children(node)[0];if(operand)observe(operand,{...span(node),name:method.name,kind:'return',...(method.type?{contextType:method.type}:{})});
      return;
    }
    for(const child of children(node))walk(child,method,depth+1);
  };
  try {walk(tree.rootNode);return Object.freeze({analysisOnly:true,graphAdmission:'blocked',language,source,sourceSha256:inventory.sourceSha256,inventory,records:Object.freeze(records)});}
  finally {tree.delete();}
}
