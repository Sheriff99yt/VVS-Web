/**
 * Stage B — graph nodes + registry semantics → IR.
 */
export type { CodegenContext } from '../generate';
export { buildIrMembers, resolveActiveClass } from './buildMembers';
export { graphToIr, buildIrStatements } from './graphToIr';
