/** Pinned scalar profiles shared by import analysis and saved-graph validation. */
export type NativeScalarLanguage = 'rust' | 'cpp' | 'gdscript';

/** A semantic failure, independent of parser spans and import diagnostics. */
export class NativeScalarFailure extends Error {
  constructor(public readonly code: string, public readonly detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'NativeScalarFailure';
  }
}
