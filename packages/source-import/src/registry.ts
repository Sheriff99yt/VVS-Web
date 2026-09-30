import { ImportFailure, type MappingContract, type MappingResult, type SourceSpan } from './contracts';

export interface ReverseMapping<N, C, T> {
  contract: MappingContract;
  matches(node: N, context: C): boolean;
  map(node: N, context: C): T;
}
/** No first-match priority: all structural matches are checked before materializing anything. */
export function resolveReverseMapping<N, C, T>(
  mappings: readonly ReverseMapping<N, C, T>[], node: N, context: C, span: SourceSpan,
): MappingResult<T> {
  const matches = mappings.filter(mapping => mapping.matches(node, context));
  if (matches.length > 1) return { status: 'ambiguous', mappingIds: matches.map(m => m.contract.id).sort(),
    diagnostic: { ...span, code: 'AMBIGUOUS_MAPPING', message: 'Multiple mappings match; explicit disjointness is required.' } };
  const mapping = matches[0];
  if (!mapping) return { status: 'unsupported', diagnostic: { ...span, code: 'MAPPING_MISSING', message: 'No reviewed reverse mapping for this construct.' } };
  try { return { status: 'supported', value: mapping.map(node, context) }; }
  catch (error) {
    if (!(error instanceof ImportFailure)) throw error;
    return { status: 'unsupported', diagnostic: { ...error.span, code: error.code, message: error.message } };
  }
}
export function requireMapped<T>(result: MappingResult<T>): T {
  if (result.status === 'supported') return result.value;
  throw new ImportFailure(result.diagnostic.code, result.diagnostic.message, result.diagnostic);
}
