export const CSHARP_DEFINITE_ASSIGNMENT_CASES = [
  { id: 'plain-initialization', source: 'class Assignment { public static int Test(int Input) { int Value; Value = Input; return Value; } }' },
  { id: 'mixed-group', source: 'class Assignment { public static int Test(int Input) { int First, Second = Input; First = Second; Second += First; return Second; } }' },
  { id: 'all-uninitialized-group', source: 'class Assignment { public static byte Test() { byte First, Second; First = 1; Second = First; return Second; } }' },
  { id: 'nested-parent-initialization', source: 'class Assignment { public static int Test(int Input) { int Value; checked { { Value = Input; } } return Value; } }' },
  { id: 'unused-and-void', source: 'class Assignment { public static void Test() { int Unused; { byte First, Second; } } }' },
  { id: 'initializer-replacement', source: 'class Assignment { public static int Test(int Input) { int Value = 1; Value = Input; return Value; } }' },
];

export const CSHARP_DEFINITE_ASSIGNMENT_PROBES = [
  { id: 'assigned-read', body: 'int Value; Value = Input; var observed = Value;', ok: true },
  { id: 'mixed-group-read', body: 'int First, Second = Input; First = Second; var observed = First;', ok: true },
  { id: 'ancestor-block-assignment', body: 'int Value; { Value = Input; } var observed = Value;', ok: true },
  { id: 'unassigned-read', body: 'int Value; var observed = Value;', ok: false },
  { id: 'compound-before-assignment', body: 'int Value; Value += 1; var observed = Value;', ok: false },
  { id: 'update-before-assignment', body: 'int Value; Value++; var observed = Value;', ok: false },
  { id: 'self-assignment', body: 'int Value; Value = Value; var observed = Value;', ok: false },
  { id: 'group-unassigned-dependency', body: 'int First, Second = First; var observed = Second;', ok: false },
  { id: 'const-needs-initializer', body: 'const int Value; var observed = Value;', ok: false },
  { id: 'var-needs-initializer', body: 'var Value; var observed = Value;', ok: false },
].map(spec => ({ id: `source-definite-${spec.id}`, files: [{ path: 'Assignment.cs', source: `class Assignment { public static int Test(int Input) { ${spec.body} return observed; } }` }], expected: { ok: spec.ok }, sourceBinding: 'checked' }));
