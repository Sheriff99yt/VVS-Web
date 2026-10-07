/** Native scope probes remain analysis evidence until visible block mapping lands. */
export const CSHARP_SCOPE_CASES = [
  { id: 'nested-outer-constant', body: 'const int Outer = 1; { const int Inner = Outer + 1; var observed = Inner; return observed; }', ok: true },
  { id: 'sibling-name-reuse', body: '{ int Same = Input; Same++; } { int Same = Input; Same--; } var observed = Input; return observed;', ok: true },
  { id: 'later-ancestor-reservation', body: '{ int Later = 1; } int Later = 2; var observed = Later; return observed;', ok: false },
  { id: 'parameter-shadow', body: '{ int Input = 1; } var observed = Input; return observed;', ok: false },
  { id: 'checked-narrow-overflow', body: 'checked { var observed = (byte)256; return observed; }', ok: false },
  { id: 'unchecked-narrow-wrap', body: 'unchecked { var observed = (byte)256; return observed; }', ok: true },
  { id: 'nested-unchecked-override', body: 'checked { unchecked { var observed = (byte)256; return observed; } }', ok: true },
  { id: 'nested-checked-override', body: 'unchecked { checked { var observed = (byte)256; return observed; } }', ok: false },
  { id: 'checked-expression-override', body: 'unchecked { var observed = checked((byte)256); return observed; }', ok: false },
  { id: 'unchecked-expression-override', body: 'checked { var observed = unchecked((byte)256); return observed; }', ok: true },
  { id: 'checked-constant-arithmetic', body: 'checked { var observed = 2147483647 + 1; return observed; }', ok: false },
  { id: 'unchecked-constant-arithmetic', body: 'unchecked { var observed = 2147483647 + 1; return observed; }', ok: true },
  { id: 'nested-const-write', body: 'const int Fixed = 1; { Fixed++; } var observed = Fixed; return observed;', ok: false },
  { id: 'nested-bare-value-return', body: '{ return; }', ok: false },
  { id: 'group-order-in-scope', body: '{ int First = Input, Second = First; var observed = Second; return observed; }', ok: true },
].map(spec => ({
  id: `source-scope-${spec.id}`,
  files: [{ path: 'Scopes.cs', source: `class Scopes { public static int Test(int Input) { ${spec.body} } }${spec.body.includes('var observed') ? '' : '\nclass NativeWitness { static void Check() { int observed = 0; } }'}` }],
  expected: { ok: spec.ok }, sourceBinding: 'checked',
}));
