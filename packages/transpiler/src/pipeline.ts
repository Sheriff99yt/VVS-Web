/**
 * Three-stage transpiler pipeline:
 * A analyze (graph order, symbol index)
 * B lower (nodes → IR) — see lower/
 * C emit (IR → source) — see emit/
 */
export * from './analyze';
export * from './lower';
export * from './emit';
