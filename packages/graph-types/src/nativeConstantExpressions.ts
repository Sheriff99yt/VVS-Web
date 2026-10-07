import { NativeScalarFailure, type NativeScalarLanguage } from './nativeScalarContracts';
import { nativeScalarLiteral, type NativeIntegerLiteralOptions } from './nativeScalarLiterals';

export type NativeConstantExpression =
  | { kind: 'literal'; token: string; options?: NativeIntegerLiteralOptions }
  | { kind: 'convert'; nativeType: string; operand: NativeConstantExpression }
  | { kind: 'group'; operand: NativeConstantExpression }
  | { kind: 'unary'; operator: string; operand: NativeConstantExpression; directLiteral?: boolean }
  | { kind: 'binary'; operator: string; left: NativeConstantExpression; right: NativeConstantExpression };
export interface NativeConstantFact {
  analysisOnly: true; graphAdmission: 'blocked'; domain: 'integer-boolean-constant-expressions';
  nativeType: string; encoding: 'decimal-integer' | 'boolean'; payload: string | boolean;
  bits: number; signed: boolean; nativeWarnings: readonly string[]; evaluatedNodes: number;
}
type Value = { nativeType: string; value: bigint | boolean; bits: number; signed: boolean; warnings: string[] };
const cpp: Record<string, [number, boolean, number]> = {
  'signed char': [8,true,0], 'unsigned char': [8,false,0], short:[16,true,0], 'unsigned short':[16,false,0],
  int:[32,true,1], 'unsigned int':[32,false,1], long:[32,true,2], 'unsigned long':[32,false,2],
  'long long':[64,true,3], 'unsigned long long':[64,false,3],
};
const max = (bits:number,signed:boolean) => (BigInt(1) << BigInt(bits-(signed?1:0)))-BigInt(1);
const min = (bits:number,signed:boolean) => signed ? -(BigInt(1) << BigInt(bits-1)) : BigInt(0);
const integer = (value:Value) => typeof value.value==='boolean' ? BigInt(value.value?1:0) : value.value;

/** Constant contexts only. Dynamic overflow/effects and source/graph ownership are separate contracts. */
export function evaluateNativeConstant(expression: NativeConstantExpression, language: NativeScalarLanguage): Readonly<NativeConstantFact> {
  let evaluatedNodes=0;
  const fail = (code:string):never => { throw new NativeScalarFailure(`${language.toUpperCase()}_${code}`,'This constant expression requires its native operator/type/evaluation contract.'); };
  const shape = (type:string):[number,boolean] => {
    if (type==='bool') return [1,false];
    if (language==='cpp' && cpp[type]) return [cpp[type][0],cpp[type][1]];
    if (language==='gdscript' && type==='int') return [64,true];
    if (language==='rust' && /^[iu](?:8|16|32|64|128|size)$/.test(type)) return [type.endsWith('size')?64:Number(type.slice(1)),type.startsWith('i')];
    return fail('UNSUPPORTED_CONSTANT_TYPE');
  };
  const value = (nativeType:string,payload:bigint|boolean,warnings:string[]=[]):Value => { const [bits,signed]=shape(nativeType); return {nativeType,value:payload,bits,signed,warnings}; };
  const wrap = (number:bigint,type:Value) => type.signed ? BigInt.asIntN(type.bits,number) : BigInt.asUintN(type.bits,number);
  const convert = (input:Value,type:string):Value => {
    const output=value(type,BigInt(0),input.warnings);
    if (type==='bool') {
      if (language==='rust' && input.nativeType!=='bool') return fail('CONSTANT_INVALID_CAST');
      output.value=integer(input)!==BigInt(0); return output;
    }
    output.value=wrap(integer(input),output); return output;
  };
  const promote = (input:Value) => language==='cpp' && (input.nativeType==='bool' || input.bits<32) ? convert(input,'int') : input;
  const common = (left:Value,right:Value):[Value,Value] => {
    left=promote(left); right=promote(right);
    if (language!=='cpp') {
      if (left.nativeType!==right.nativeType) return fail('CONSTANT_TYPE_MISMATCH');
      return [left,right];
    }
    const a=cpp[left.nativeType], b=cpp[right.nativeType]; if (!a || !b) return fail('CONSTANT_TYPE_MISMATCH');
    let type:string;
    if (left.signed===right.signed) type=a[2]>=b[2]?left.nativeType:right.nativeType;
    else {
      const unsigned=left.signed?right:left, signed=left.signed?left:right;
      if (cpp[unsigned.nativeType][2]>=cpp[signed.nativeType][2]) type=unsigned.nativeType;
      else if (signed.bits>unsigned.bits) type=signed.nativeType;
      else type=`unsigned ${signed.nativeType}`;
    }
    return [convert(left,type),convert(right,type)];
  };
  const checked = (number:bigint,type:Value,wrapShift=false):Value => {
    if ((language==='cpp' && type.signed) || (language==='rust' && !wrapShift)) {
      if (number<min(type.bits,type.signed) || number>max(type.bits,type.signed)) return fail('CONSTANT_OVERFLOW');
    }
    return value(type.nativeType,wrap(number,type),type.warnings);
  };
  const visit = (node:NativeConstantExpression,depth:number):Value => {
    if (++evaluatedNodes>4096 || depth>128) return fail('UNSUPPORTED_CONSTANT_BUDGET');
    if (node.kind==='literal') {
      const fact=nativeScalarLiteral(node.token,language,node.options);
      return value(fact.nativeType, fact.encoding==='boolean'?fact.payload:BigInt(fact.payload),fact.encoding==='boolean'?[]:[...fact.nativeWarnings]);
    }
    if (node.kind==='convert') return convert(visit(node.operand,depth+1),node.nativeType);
    if (node.kind==='group') return visit(node.operand,depth+1);
    if (node.kind==='unary') {
      let literalOperand=node.operand, groups=0;
      if (language==='rust' && node.operator==='-') while(literalOperand.kind==='group') { if (++groups+depth>128) return fail('UNSUPPORTED_CONSTANT_BUDGET'); literalOperand=literalOperand.operand; }
      const nativeLiteralNegation=(language==='rust' || language==='gdscript' && node.directLiteral===true) && node.operator==='-' && literalOperand.kind==='literal' && !literalOperand.options?.negated && !['true','false'].includes(literalOperand.token);
      if (nativeLiteralNegation && literalOperand.kind==='literal') {
        let fact;
        try { fact=nativeScalarLiteral(literalOperand.token,language,{...literalOperand.options,negated:true}); }
        catch(error) { if (error instanceof NativeScalarFailure && error.code==='RUST_LITERAL_UNSIGNED_NEGATION') return fail('CONSTANT_UNSIGNED_NEGATION'); throw error; }
        evaluatedNodes+=groups+1;
        if (evaluatedNodes>4096 || depth+groups+1>128) return fail('UNSUPPORTED_CONSTANT_BUDGET');
        return value(fact.nativeType,fact.encoding==='boolean'?fact.payload:BigInt(fact.payload),fact.encoding==='boolean'?[]:[...fact.nativeWarnings]);
      }
      let operand=visit(node.operand,depth+1);
      if (node.operator==='!' && (language!=='rust' || operand.nativeType==='bool')) return value('bool',integer(operand)===BigInt(0),operand.warnings);
      operand=promote(operand);
      if (typeof operand.value!=='bigint') return fail('CONSTANT_TYPE_MISMATCH');
      if (node.operator==='-' && language==='rust' && !operand.signed) return fail('CONSTANT_UNSIGNED_NEGATION');
      if (node.operator==='-') return checked(-operand.value,operand);
      if (node.operator==='~' && language!=='rust' || node.operator==='!' && language==='rust') return value(operand.nativeType,wrap(~operand.value,operand),operand.warnings);
      if (node.operator==='+' && language!=='rust') return operand;
      return fail('UNSUPPORTED_CONSTANT_OPERATOR');
    }
    if (node.kind!=='binary') return fail('UNSUPPORTED_CONSTANT_EXPRESSION');
    if (['&&','||','and','or'].includes(node.operator)) return fail('UNSUPPORTED_CONSTANT_CONDITIONAL_EVALUATION');
    let left=visit(node.left,depth+1),right=visit(node.right,depth+1);
    const warnings=[...left.warnings,...right.warnings];
    if (['<<','>>'].includes(node.operator)) {
      left=promote(left);right=promote(right);
      if (typeof left.value!=='bigint' || typeof right.value!=='bigint') return fail('CONSTANT_TYPE_MISMATCH');
      if (language==='gdscript' && left.value<BigInt(0)) return fail('CONSTANT_SHIFT_NEGATIVE_OPERAND');
      if (right.value<BigInt(0) || right.value>=BigInt(left.bits)) return fail('CONSTANT_SHIFT_COUNT');
      if (language==='cpp' && left.signed && node.operator==='<<' && (left.value<BigInt(0) || (left.value<<right.value)>max(left.bits,true))) return fail('UNSUPPORTED_CONSTANT_SIGNED_SHIFT');
      const number=node.operator==='<<'?left.value<<right.value:left.value>>right.value;
      const result=checked(number,left,true); result.warnings=warnings; return result;
    }
    if (left.nativeType==='bool' && right.nativeType==='bool' && language!=='cpp') {
      if (['==','!='].includes(node.operator)) return value('bool',node.operator==='=='?left.value===right.value:left.value!==right.value,warnings);
      if (language==='rust' && ['&','|','^'].includes(node.operator)) return value('bool',node.operator==='&'?left.value && right.value:node.operator==='|'?left.value || right.value:left.value!==right.value,warnings);
      return fail('CONSTANT_TYPE_MISMATCH');
    }
    [left,right]=common(left,right);left.warnings=warnings;
    const a=integer(left),b=integer(right);
    if (['==','!=','<','<=','>','>='].includes(node.operator)) return value('bool',node.operator==='=='?a===b:node.operator==='!='?a!==b:node.operator==='<'?a<b:node.operator==='<='?a<=b:node.operator==='>'?a>b:a>=b,warnings);
    if (['/','%'].includes(node.operator)) {
      if (b===BigInt(0)) return fail('CONSTANT_DIVIDE_BY_ZERO');
      if (left.signed && a===min(left.bits,true) && b===-BigInt(1)) return fail('CONSTANT_DIVISION_OVERFLOW');
    }
    const number=node.operator==='+'?a+b:node.operator==='-'?a-b:node.operator==='*'?a*b:node.operator==='/'?a/b:node.operator==='%'?a%b:node.operator==='&'?a&b:node.operator==='|'?a|b:node.operator==='^'?a^b:fail('UNSUPPORTED_CONSTANT_OPERATOR');
    return checked(number,left);
  };
  const result=visit(expression,0);
  return Object.freeze({ analysisOnly:true,graphAdmission:'blocked',domain:'integer-boolean-constant-expressions',nativeType:result.nativeType,
    encoding:typeof result.value==='boolean'?'boolean':'decimal-integer',payload:typeof result.value==='boolean'?result.value:result.value.toString(),bits:result.bits,signed:result.signed,
    nativeWarnings:Object.freeze(result.warnings),evaluatedNodes });
}
