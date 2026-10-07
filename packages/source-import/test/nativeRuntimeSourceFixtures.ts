export const nativeRuntimeSourceFixtures = {
  cpp: 'int arithmetic(short a, int b) { return (a + b) * 2; }\nbool condition(int a, int b) { return !(a < b) || a == b; }\nint converted(bool a) { return static_cast<int>(a); }\n',
  rust: 'fn arithmetic(a: i8, b: i8) -> i8 { (a + b) * 2 }\nfn condition(a: i8, b: i8) -> bool { !(a < b) || a == b }\nfn converted(a: bool) -> i32 { a as i32 }\n',
  gdscript: 'func arithmetic(a: int, b: int) -> int:\n    return (a + b) * 2\nfunc condition(a: int, b: int) -> bool:\n    return not (a < b) or a == b\nfunc converted(a: bool) -> int:\n    return int(a)\n',
} as const;
