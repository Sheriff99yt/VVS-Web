import { fixedNativeRustInitializer } from '@vvs/graph-types';
import { ImportFailure } from './contracts';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';
import { inferNativeScalarSourceExpression, type NativeScalarSourceExpression } from './nativeScalarSourceExpression';

/** Source-only deduction; it does not grant graph/IR/worker admission. */
export function inferNativeLocalInitializer(tree: NativeScalarSourceExpression, language: NativeInventoryLanguage) {
  if (language === 'rust' && !fixedNativeRustInitializer(tree)) throw new ImportFailure('NATIVE_LOCAL_SOURCE_INFERENCE_CONSTRAINTS_REQUIRED', 'This inferred local needs whole-body native type constraints.', tree);
  return inferNativeScalarSourceExpression(tree, language);
}
