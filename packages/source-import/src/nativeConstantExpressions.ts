import {
  evaluateNativeConstant as sharedConstant, NativeScalarFailure,
  type NativeConstantExpression, type NativeConstantFact, type NativeScalarLanguage,
} from '@vvs/graph-types';
import { ImportFailure } from './contracts';

export type { NativeConstantExpression, NativeConstantFact } from '@vvs/graph-types';

/** Graph analysis and source analysis use the same independent native policies. */
export function evaluateNativeConstant(expression: NativeConstantExpression, language: NativeScalarLanguage): Readonly<NativeConstantFact> {
  try { return sharedConstant(expression, language); }
  catch (error) {
    if (error instanceof NativeScalarFailure) throw new ImportFailure(error.code, error.detail);
    throw error;
  }
}
