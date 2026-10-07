export const CSHARP_PARAMETER_WRITE_CASES = [
  { id: 'parameter-narrow-constant', type: 'byte', source: 'class Assignments { public static byte Change(byte Input) { Input = 255; return Input; } }' },
  { id: 'parameter-compound-and-update', type: 'byte', source: 'class Assignments { public static byte Change(byte Input, int Count) { Input += 1; Input <<= Count; ++Input; Input--; return Input; } }' },
  { id: 'parameter-exact-long', type: 'long', source: 'class Assignments { public static long Change(long Input) { Input = -9223372036854775808; return Input; } }' },
  { id: 'parameter-char-update', type: 'char', source: 'class Assignments { public static char Change(char Input) { --Input; Input++; return Input; } }' },
  { id: 'parameter-mixed-local-order', type: 'byte', source: 'class Assignments { public static byte Change(byte Input) { byte Initial = Input; Input = Initial; Input += Initial; int Wide = Input + 1; Input = unchecked((byte)Wide); return Input; } }' },
] as const;
