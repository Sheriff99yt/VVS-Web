import type { NativeScalarLanguage } from './nativeScalarContracts';
export interface NativeRuntimeTypeCase {
  language: NativeScalarLanguage; id: string; form: 'unary' | 'binary' | 'conversion'; operator: string; operands: string[]; result?: string;
}
/** Handwritten native expectations, independent of the policy implementation. */
export const NATIVE_RUNTIME_TYPE_CASES: readonly NativeRuntimeTypeCase[] = [
  ...(['cpp', 'rust', 'gdscript'] as const).flatMap(language => {
    const int = language === 'rust' ? 'i32' : 'int';
    return [
      { language, id: 'integer-add', form: 'binary' as const, operator: '+', operands: [int, int], result: int },
      { language, id: 'integer-less', form: 'binary' as const, operator: '<', operands: [int, int], result: 'bool' },
      { language, id: 'bool-equality', form: 'binary' as const, operator: '==', operands: ['bool', 'bool'], result: 'bool' },
      { language, id: 'bool-not', form: 'unary' as const, operator: '!', operands: ['bool'], result: 'bool' },
      { language, id: 'integer-negation', form: 'unary' as const, operator: '-', operands: [int], result: int },
      { language, id: 'bool-conjunction', form: 'binary' as const, operator: language === 'gdscript' ? 'and' : '&&', operands: ['bool', 'bool'], result: 'bool' },
      { language, id: 'bool-to-integer', form: 'conversion' as const, operator: int, operands: ['bool'], result: int },
    ];
  }),
  { language: 'cpp', id: 'small-promote', form: 'binary', operator: '+', operands: ['short', 'unsigned short'], result: 'int' },
  { language: 'cpp', id: 'signed-unsigned', form: 'binary', operator: '+', operands: ['long', 'unsigned int'], result: 'unsigned long' },
  { language: 'cpp', id: 'wide-signed', form: 'binary', operator: '+', operands: ['long long', 'unsigned int'], result: 'long long' },
  { language: 'cpp', id: 'wide-unsigned', form: 'binary', operator: '+', operands: ['long long', 'unsigned long long'], result: 'unsigned long long' },
  { language: 'cpp', id: 'bool-add-promote', form: 'binary', operator: '+', operands: ['bool', 'bool'], result: 'int' },
  { language: 'cpp', id: 'shift-promote-left', form: 'binary', operator: '<<', operands: ['unsigned short', 'long long'], result: 'int' },
  { language: 'cpp', id: 'unsigned-negate', form: 'unary', operator: '-', operands: ['unsigned int'], result: 'unsigned int' },
  { language: 'rust', id: 'mismatched-integers', form: 'binary', operator: '+', operands: ['i32', 'u32'] },
  { language: 'rust', id: 'bool-arithmetic', form: 'binary', operator: '+', operands: ['bool', 'bool'] },
  { language: 'rust', id: 'bool-bitwise', form: 'binary', operator: '^', operands: ['bool', 'bool'], result: 'bool' },
  { language: 'rust', id: 'bool-order', form: 'binary', operator: '<', operands: ['bool', 'bool'], result: 'bool' },
  { language: 'rust', id: 'integer-not', form: 'unary', operator: '!', operands: ['i8'], result: 'i8' },
  { language: 'rust', id: 'unsigned-negate', form: 'unary', operator: '-', operands: ['u8'] },
  { language: 'rust', id: 'unary-plus', form: 'unary', operator: '+', operands: ['i32'] },
  { language: 'rust', id: 'heterogeneous-shift', form: 'binary', operator: '<<', operands: ['i8', 'u64'], result: 'i8' },
  { language: 'rust', id: 'integer-to-bool', form: 'conversion', operator: 'bool', operands: ['i32'] },
  { language: 'rust', id: 'integer-logical', form: 'binary', operator: '&&', operands: ['i32', 'i32'] },
  { language: 'gdscript', id: 'bool-order', form: 'binary', operator: '<', operands: ['bool', 'bool'], result: 'bool' },
  { language: 'gdscript', id: 'bool-arithmetic', form: 'binary', operator: '+', operands: ['bool', 'bool'] },
  { language: 'gdscript', id: 'bool-bitwise', form: 'binary', operator: '^', operands: ['bool', 'bool'] },
  { language: 'gdscript', id: 'integer-logical', form: 'binary', operator: 'and', operands: ['int', 'int'], result: 'bool' },
  { language: 'gdscript', id: 'integer-to-bool', form: 'conversion', operator: 'bool', operands: ['int'], result: 'bool' },
  { language: 'gdscript', id: 'integer-bitnot', form: 'unary', operator: '~', operands: ['int'], result: 'int' },
];
