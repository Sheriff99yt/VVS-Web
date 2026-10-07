import {
  nativeScalarLiteral as sharedScalarLiteral, NativeScalarFailure,
  type NativeIntegerLiteralOptions, type NativeScalarLanguage, type NativeScalarLiteral,
} from '@vvs/graph-types';
import { ImportFailure } from './contracts';

export type { NativeIntegerLiteralOptions, NativeScalarLiteral } from '@vvs/graph-types';

/** Keep parser-facing diagnostic identity while sharing the native semantic core. */
export function nativeScalarLiteral(token: string, language: NativeScalarLanguage, options: NativeIntegerLiteralOptions = {}): NativeScalarLiteral {
  try { return sharedScalarLiteral(token, language, options); }
  catch (error) {
    if (error instanceof NativeScalarFailure) throw new ImportFailure(error.code, error.detail);
    throw error;
  }
}
