export const nativeScalarSourceFixtures = {
  cpp: 'int Value(const int value) { return value; }\nconstexpr int value() { return -(-5); }\nbool comparison() { return (2 < 3); }\nvoid empty() { return; }\n',
  rust: 'fn Value(value: i32) -> i32 { value }\nconst fn value() -> i32 { -(-5) }\nfn comparison() -> bool { return 2 < 3; }\nfn empty() -> () { return; }\n',
  gdscript: 'func Value(value: int) -> int:\n    return value\nfunc value() -> int:\n    return -(-5)\nfunc comparison() -> bool:\n    return not false\nfunc empty() -> void:\n    return\n',
} as const;
