"""Curated compile-only ordinary scalar function header contracts."""
import json
from pathlib import Path

cases = {language: [] for language in ['cpp', 'rust', 'gdscript']}
types = {
    'cpp': ['bool', 'signed char', 'unsigned char', 'short', 'unsigned short', 'int', 'unsigned int', 'long', 'unsigned long', 'long long', 'unsigned long long'],
    'rust': ['bool', 'i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'i64', 'u64', 'i128', 'u128', 'isize', 'usize'],
    'gdscript': ['bool', 'int'],
}
for language, items in types.items():
    for native_type in items:
        source = {'cpp': f'{native_type} sample({native_type} value) {{ return value; }}\nusing Signature={native_type}(*)({native_type});\nconstexpr Signature probe=&sample;\n',
                  'rust': f'fn sample(value: {native_type})->{native_type} {{ value }}\nconst _:fn({native_type})->{native_type}=sample;\n',
                  'gdscript': f'func sample(value: {native_type})->{native_type}:\n\treturn value\n'}[language]
        cases[language].append({'id': 'identity-' + native_type.replace(' ', '-'), 'source': '// λ🧭 signature probe\n' + source if language != 'gdscript' else '# λ🧭 signature probe\n' + source,
                                'valid': True, 'parameters': [{'name': 'value', 'type': native_type, 'mutable': language != 'rust'}], 'returnType': native_type})

def add(language, identifier, source, parameters, result, unsupported=False):
    cases[language].append({'id': identifier, 'source': source, 'valid': True, 'parameters': parameters, 'returnType': result, 'unsupported': unsupported})

add('cpp', 'const-parameter', 'constexpr int sample(const int value) { return value; }\nusing Signature=int(*)(int);\nconstexpr Signature probe=&sample;\n', [{'name': 'value', 'type': 'int', 'mutable': False}], 'int')
add('cpp', 'unsigned-alias', 'unsigned sample(unsigned value) { return value; }\nusing Signature=unsigned int(*)(unsigned int);\nconstexpr Signature probe=&sample;\n', [{'name': 'value', 'type': 'unsigned int', 'mutable': True}], 'unsigned int')
add('cpp', 'void-empty', 'void sample(void) {}\n', [], 'void')
add('cpp', 'pointer-unresolved', 'int sample(int *value) { return *value; }\n', [], '', True)
add('cpp', 'default-unresolved', 'int sample(int value=1) { return value; }\n', [], '', True)
add('rust', 'mutable-parameter', 'pub const fn sample(mut value:i8)->i8 { value=1; value }\nconst _:fn(i8)->i8=sample;\n', [{'name': 'value', 'type': 'i8', 'mutable': True}], 'i8')
add('rust', 'unit-empty', 'fn sample() {}\nconst _:fn()->()=sample;\n', [], '()')
add('rust', 'borrow-unresolved', 'fn sample(value:&i32)->i32 { *value }\n', [], '', True)
add('gdscript', 'static-parameter', 'static func sample(value:int)->int:\n\treturn value\n', [{'name': 'value', 'type': 'int', 'mutable': True}], 'int')
add('gdscript', 'void-empty', 'func sample()->void:\n\tpass\n', [], 'void')
add('gdscript', 'untyped-unresolved', 'func sample(value):\n\treturn value\n', [], '', True)
add('gdscript', 'default-unresolved', 'func sample(value:int=1)->int:\n\treturn value\n', [], '', True)
Path(__file__).with_name('native_signature_cases.json').write_text(json.dumps(cases, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
