/** Trusted composed source for native, saved-graph and reimport checks. */
export const CSHARP_ASSIGNMENT_CASES = [
  { id: 'narrow-constant', type: 'byte', source: 'class Assignments { public static byte Change() { byte Value = 0; Value = 255; return Value; } }' },
  { id: 'exact-long', type: 'long', source: 'class Assignments { public static long Change() { long Value = 0; Value = -9223372036854775808; return Value; } }' },
  { id: 'ordered-runtime', type: 'int', source: 'class Assignments { public static int Change(byte Input) { var Value = Input + 1; Value = Value + Input; int Other = Value; Value = Other + 1; return Value; } }' },
  { id: 'explicit-narrowing', type: 'byte', source: 'class Assignments { public static byte Change(int Input) { byte Value = 0; Value = unchecked((byte)Input); return Value; } }' },
  { id: 'compound-narrow-and-shifts', type: 'byte', source: 'class Assignments { public static byte Change(byte Input, int Count) { byte Value = Input; Value += 1; Value -= 1; Value *= 2; Value /= 2; Value %= 3; Value &= 7; Value |= 1; Value ^= 2; Value <<= Count; Value >>= Count; Value >>>= Count; ++Value; Value--; return Value; } }' },
  { id: 'char-mutation', type: 'char', source: 'class Assignments { public static char Change(char Input, int Count) { char Value = Input; Value += Input; Value <<= Count; Value >>>= Count; --Value; Value++; return Value; } }' },
  { id: 'unsigned-runtime', type: 'uint', source: 'class Assignments { public static uint Change(uint Input) { uint Value = Input; Value += 1; Value ^= Input; Value--; ++Value; return Value; } }' },
] as const;
