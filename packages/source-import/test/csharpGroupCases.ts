export const CSHARP_GROUP_CASES = [
  { id: 'typed-order-and-mutation', source: 'class Groups { public static byte Test(byte Input) { byte First = Input, Second = First; Second += First; return Second; } }' },
  { id: 'const-context-and-dependencies', source: 'class Groups { public static byte Test() { unchecked { const byte First = (byte)256, Second = First, Third = (byte)(Second + 1); return Third; } } }' },
  { id: 'sibling-group-identities', source: 'class Groups { public static int Test(int Input) { { int First = Input, Second = First; Input += Second; } { int First = Input, Second = First; Input += Second; } return Input; } }' },
  { id: 'exact-long-minimum', source: 'class Groups { public static long Test() { long First = -9223372036854775808, Second = First + 1; return Second; } }' },
  { id: 'void-group-completion', source: 'class Groups { public static void Test(byte Input) { byte First = Input, Second = First; Second++; } }' },
];

export const CSHARP_GROUP_REJECTIONS = [
  'int First = 1, First = 2;',
  'int First = Second, Second = 1;',
  'var First = 1, Second = 2;',
  'const int First = Input, Second = First;',
].map((body, index) => ({ id: `native-group-rejection-${index}`, files: [{ path: 'Groups.cs', source: `class Groups { public static void Test(int Input) { ${body} } }\nclass NativeWitness { static void Check() { int observed = 0; } }` }], expected: { ok: false }, sourceBinding: 'checked' }));
