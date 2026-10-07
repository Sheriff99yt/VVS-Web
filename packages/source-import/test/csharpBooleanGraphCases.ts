export const CSHARP_BOOLEAN_GRAPH_CASES = [
  { id: 'literal', source: 'class BooleanGraph { public static bool Test() => false; }' },
  { id: 'comparison', source: 'class BooleanGraph { public static bool Test(uint Input, long Other) => Input < Other; }' },
  { id: 'logical', source: 'class BooleanGraph { public static bool Test(int Input) => !(Input < 0) && ((Input < 10) | false); }' },
  { id: 'constant-wide', source: 'class BooleanGraph { public static bool Test() => 18446744073709551615UL > 0UL; }' },
  { id: 'direct-minimum', source: 'class BooleanGraph { public static bool Test() => -9223372036854775808L < 0; }' },
  { id: 'overflow-context', source: 'class BooleanGraph { public static bool Test(int Input) => checked(Input > unchecked((byte)256)); }' },
  { id: 'local-read', source: 'class BooleanGraph { public static bool Test(int Input) { int Value; Value = Input; return Value > 0; } }' },
  { id: 'short-circuit', source: 'class BooleanGraph { public static bool Test() { int Value; return false && Value > 0; } }' },
];
