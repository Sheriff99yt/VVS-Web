import type { FidelityLintInput, FidelityViolation } from './schema';

/**
 * Static fidelity linter — one behavioral node → one locatable region.
 * Run on Rosetta suite output in CI.
 */
export function lintFidelity(input: FidelityLintInput): FidelityViolation[] {
  const violations: FidelityViolation[] = [];
  const seenNodeIds = new Set<string>();

  for (const stmt of input.statements) {
    if (stmt.synthetic) continue;
    const nodeId = stmt.sourceGraphNodeId;
    if (!nodeId) {
      violations.push({
        code: 'MISSING_SOURCE_NODE',
        message: 'Statement lacks sourceGraphNodeId',
      });
      continue;
    }
    if (seenNodeIds.has(nodeId)) {
      violations.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate sourceGraphNodeId: ${nodeId}`,
        nodeId,
      });
    }
    seenNodeIds.add(nodeId);

    if (!(nodeId in input.sourceMap) && !stmt.synthetic) {
      violations.push({
        code: 'MISSING_SOURCE_NODE',
        message: `Node ${nodeId} not present in sourceMap`,
        nodeId,
      });
    }
  }

  return violations;
}
