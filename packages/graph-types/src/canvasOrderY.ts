import type { Diagnostic } from './diagnostic';
import type { GraphDocument } from './symbols';

/**
 * U79 — canvas Y is a secondary order key (unconnected heads / event peers).
 * Connected exec chains are primary. Emit follows those rules without auto-reorder.
 *
 * Vertical-height teaching warnings (`CHAIN_ORDER_Y_MISMATCH`, `EVENT_PEER_Y_ORDER`)
 * are disabled — they added Compiler Log noise without changing emit.
 */
export function validateCanvasOrderYHints(
  _documents: Record<string, GraphDocument>
): Diagnostic[] {
  return [];
}
