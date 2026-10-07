"""Author comparable, trusted compile-only initialization probes (not analyzer output)."""
import json
from pathlib import Path

rows = [
    ('discarded-local', 'int sample() { int value; value; return 0; }', 'fn sample()->i32 { let value:i32; value; return 0; }', 'func sample()->int:\n\tvar value:int\n\tvalue\n\treturn 0\n', [False], 'UNINITIALIZED_READ'),
    ('discarded-parenthesized', 'int sample() { int value; (value); return 0; }', 'fn sample()->i32 { let value:i32; (value); return 0; }', 'func sample()->int:\n\tvar value:int\n\t(value)\n\treturn 0\n', [False], 'UNINITIALIZED_READ'),
    ('initialized', 'int sample(int input) { int value=input; return value; }', 'fn sample(input:i32)->i32 { let value=input; return value; }', 'func sample(input:int)->int:\n\tvar value:int=input\n\treturn value\n', [True, True], None),
    ('deferred-read', 'int sample() { int value; return value; }', 'fn sample()->i32 { let value:i32; return value; }', 'func sample()->int:\n\tvar value:int\n\treturn value\n', [False], 'UNINITIALIZED_READ'),
    ('first-assignment', 'int sample() { int value; value=2; return value; }', 'fn sample()->i32 { let value:i32; value=2; return value; }', 'func sample()->int:\n\tvar value:int\n\tvalue=2\n\treturn value\n', [True], None),
    ('both-arms', 'int sample(bool condition) { int value; if(condition) { value=1; } else { value=2; } return value; }', 'fn sample(condition:bool)->i32 { let value:i32; if condition { value=1; } else { value=2; } return value; }', 'func sample(condition:bool)->int:\n\tvar value:int\n\tif condition:\n\t\tvalue=1\n\telse:\n\t\tvalue=2\n\treturn value\n', [True, True], None),
    ('one-arm', 'int sample(bool condition) { int value; if(condition) { value=1; } return value; }', 'fn sample(condition:bool)->i32 { let value:i32; if condition { value=1; } return value; }', 'func sample(condition:bool)->int:\n\tvar value:int\n\tif condition:\n\t\tvalue=1\n\treturn value\n', [True, False], 'UNINITIALIZED_READ'),
    ('returning-arm', 'int sample(bool condition) { int value; if(condition) { return 1; } else { value=2; } return value; }', 'fn sample(condition:bool)->i32 { let value:i32; if condition { return 1; } else { value=2; } return value; }', 'func sample(condition:bool)->int:\n\tvar value:int\n\tif condition:\n\t\treturn 1\n\telse:\n\t\tvalue=2\n\treturn value\n', [True, True], None),
    ('rhs-before-write', 'int sample() { int value; value=value+1; return value; }', 'fn sample()->i32 { let mut value:i32; value=value+1; return value; }', 'func sample()->int:\n\tvar value:int\n\tvalue=value+1\n\treturn value\n', [False, True], 'UNINITIALIZED_READ'),
    ('compound-read', 'int sample() { int value; value+=1; return value; }', 'fn sample()->i32 { let mut value:i32; value+=1; return value; }', 'func sample()->int:\n\tvar value:int\n\tvalue+=1\n\treturn value\n', [False, True], 'UNINITIALIZED_READ'),
    ('readonly-twice', 'int sample() { const int value=1; value=2; return value; }', 'fn sample()->i32 { let value:i32; value=1; value=2; return value; }', 'func sample()->int:\n\tconst value:int=1\n\tvalue=2\n\treturn value\n', [True], 'READONLY_ASSIGNMENT'),
    ('parameter-readonly', 'int sample(const int input) { input=2; return input; }', 'fn sample(input:i32)->i32 { input=2; return input; }', 'func sample(input:int)->int:\n\tinput=2\n\treturn input\n', [True], 'READONLY_ASSIGNMENT'),
    ('ordered-declarations', 'int sample(int input) { int first=input, second=first; return second; }', 'fn sample(input:i32)->i32 { let first=input; let second=first; return second; }', 'func sample(input:int)->int:\n\tvar first:int=input\n\tvar second:int=first\n\treturn second\n', [True, True, True], None),
    ('shadow-initializer', 'int sample(int input) { int value=input; { int value=value; return value; } }', 'fn sample(input:i32)->i32 { let value=input; { let value=value; return value; } }', 'func sample(input:int)->int:\n\tvar value:int=input\n\tvar other:int=value\n\treturn other\n', [True, False, True], 'UNINITIALIZED_READ'),
    ('possible-reassignment', 'int sample(bool condition) { int value; if(condition) { value=1; } value=2; return value; }', 'fn sample(condition:bool)->i32 { let value:i32; if condition { value=1; } value=2; return value; }', 'func sample(condition:bool)->int:\n\tvar value:int\n\tif condition:\n\t\tvalue=1\n\tvalue=2\n\treturn value\n', [True, True], 'READONLY_ASSIGNMENT'),
]
cases = {language: [] for language in ('cpp', 'rust', 'gdscript')}
for identifier, cpp, rust, gdscript, reads, diagnostic in rows:
    for language, source in [('cpp', cpp), ('rust', rust), ('gdscript', gdscript)]:
        expected = diagnostic
        observed_reads = reads.copy()
        if language == 'gdscript':
            observed_reads = [True for _ in reads]
            if identifier != 'readonly-twice':
                expected = None
        if language == 'rust' and identifier == 'shadow-initializer':
            observed_reads = [True, True, True]
            expected = None
        if language == 'cpp' and identifier == 'possible-reassignment':
            expected = None
        if language == 'cpp' and identifier.startswith('discarded-'):
            expected = None
            observed_reads = []
        source = ('# λ🧭 initialization probe\nextends RefCounted\n' if language == 'gdscript' else '// λ🧭 initialization probe\n') + source
        status = 'unsafe' if language == 'cpp' and expected == 'UNINITIALIZED_READ' else 'invalid'
        cases[language].append({'id': identifier, 'source': source, 'valid': expected is None,
                                'reads': observed_reads, 'modelDiagnostic': expected, 'modelStatus': status if expected else None,
                                'diagnostic': ('uninitialized' if expected == 'UNINITIALIZED_READ' else 'assign') if expected else None})
Path(__file__).with_name('native_initialization_cases.json').write_text(json.dumps(cases, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
