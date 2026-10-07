"""Trusted scalar assertions authored independently of the VVS literal evaluator."""
import json
from pathlib import Path

cases = {'cpp': [], 'rust': [], 'gdscript': []}


def add(language, identifier, token, native_type, payload, *, context=None, negated=False, diagnostic=None, valid=True, calibration=False):
    expression = ('-' if negated else '') + token
    if language == 'cpp':
        expected = ('true' if payload == 'true' else 'false') if native_type == 'bool' else (payload + ('ULL' if native_type.startswith('unsigned') else 'LL'))
        source = '// λ🧭 scalar proof\ntemplate<class A, class B> constexpr bool SAME=false;\ntemplate<class A> constexpr bool SAME<A,A> = true;\n'
        source += f'constexpr auto VALUE={expression};\nstatic_assert(SAME<decltype({expression}), {native_type}>);\nstatic_assert(VALUE == {expected});\n'
    elif language == 'rust':
        declaration = f'const VALUE:{context or native_type}={expression};\n'
        expected = payload if native_type == 'bool' else payload + native_type
        source = '// λ🧭 scalar proof\n' + declaration + f'const _:() = assert!(VALUE == {expected});\n'
        # Type contrast: a by-value identity must have exactly the literal/context type.
        source += f'fn identity(value:{native_type})->{native_type} {{ value }}\nfn checked()->{native_type} {{ identity({expression}) }}\n'
        if context is None and native_type == 'i32' and not token.endswith('i32'):
            source += f'const _:() = {{ let value={expression}; assert!(core::mem::size_of_val(&value)==4); assert!(value == {payload}); }};\n'
    else:
        expected = '(-9223372036854775807 - 1)' if payload == '-9223372036854775808' else payload
        source = '# λ🧭 scalar proof\nextends RefCounted\n' + f'const VALUE = {expression}\nconst VALUE_CHECK = 1 / int(VALUE == {expected})\nconst TYPE_CHECK = 1 / int(VALUE is {native_type})\n'
    if calibration:
        if language == 'cpp':
            source += 'static_assert(VALUE != VALUE);\n'
        elif language == 'rust':
            source += 'const _:()=assert!(VALUE != VALUE);\n'
        else:
            source += 'const WRONG = 1 / int(VALUE != VALUE)\n'
    cases[language].append({'id': identifier, 'token': token, 'context': context, 'negated': negated, 'nativeType': native_type, 'payload': payload,
                            'modelDiagnostic': diagnostic, 'valid': valid, 'calibration': calibration, 'source': source})


for language in cases:
    native_type = 'int' if language != 'rust' else 'i32'
    for identifier, token, value in [('zero','0','0'),('small','42','42'),('leading','007','7'),('int32-max','2147483647','2147483647')]:
        add(language,identifier,token,native_type,value)
    add(language,'true','true','bool','true')
    add(language,'false','false','bool','false')
    add(language,'calibration','42',native_type,'42',valid=False,calibration=True)

for identifier, token, native_type, payload, negated in [
    ('decimal-wide','2147483648','long long','2147483648',False),
    ('hex-wide','0x80000000','unsigned int','2147483648',False),
    ('octal-wide','037777777777','unsigned int','4294967295',False),
    ('binary','0b101010','int','42',False),
    ('separator',"1'234",'int','1234',False),
    ('unsigned','1u','unsigned int','1',False),
    ('long','1L','long','1',False),
    ('long-long','1LL','long long','1',False),
    ('unsigned-long-max','4294967295UL','unsigned long','4294967295',False),
    ('unsigned-long-wide','4294967296UL','unsigned long long','4294967296',False),
    ('signed-max','9223372036854775807LL','long long','9223372036854775807',False),
    ('unsigned-max','18446744073709551615ULL','unsigned long long','18446744073709551615',False),
    ('hex64','0xffffffffffffffff','unsigned long long','18446744073709551615',False),
    ('negative-wide','2147483648','long long','-2147483648',True),
    ('negative-unsigned','1u','unsigned int','4294967295',True),
]:
    add('cpp',identifier,token,native_type,payload,negated=negated)
add('cpp','extended-decimal','9223372036854775808','unsigned long long','9223372036854775808')

for width in [8,16,32,64,128]:
    for signed in [True,False]:
        type_name=('i' if signed else 'u')+str(width)
        maximum=(1 << (width-1 if signed else width))-1
        add('rust',type_name+'-max',str(maximum)+type_name,type_name,str(maximum))
        add('rust',type_name+'-overflow',str(maximum+1)+type_name,type_name,str(maximum+1),diagnostic='LITERAL_OVERFLOW',valid=False)
        if signed:
            add('rust',type_name+'-min',str(maximum+1)+type_name,type_name,str(-maximum-1),negated=True)
add('rust','usize-max','18446744073709551615usize','usize','18446744073709551615')
add('rust','isize-min','9223372036854775808isize','isize','-9223372036854775808',negated=True)
add('rust','context-small','127','i8','127',context='i8')
add('rust','context-overflow','128','i8','128',context='i8',diagnostic='LITERAL_OVERFLOW',valid=False)
add('rust','context-min','128','i8','-128',context='i8',negated=True)
add('rust','context-mismatch','1u8','u8','1',context='i32',diagnostic='LITERAL_CONTEXT_TYPE',valid=False)
add('rust','default-overflow','2147483648','i32','2147483648',diagnostic='LITERAL_OVERFLOW',valid=False)
add('rust','negative-unsigned','1u8','u8','-1',negated=True,diagnostic='LITERAL_UNSIGNED_NEGATION',valid=False)
add('rust','hex-suffix','0xff_u8','u8','255')
add('rust','octal','0o52','i32','42')
add('rust','binary','0b101010','i32','42')
add('rust','separator','1__234','i32','1234')

for identifier, token, payload, negated in [
    ('separator','1_234','1234',False),('binary','0b101010','42',False),('hex','0xff','255',False),
    ('signed-max','9223372036854775807','9223372036854775807',False),
    ('hex64','0xffffffffffffffff','9223372036854775807',False),('hex-sign-bit','0x8000000000000000','9223372036854775807',False),
    ('negative-small','42','-42',True),('negative-hex64','0xffffffffffffffff','-9223372036854775808',True),
    ('negative-min','9223372036854775808','-9223372036854775808',True),
    ('negative-hex-min','0x8000000000000000','-9223372036854775808',True),
    ('binary-sign-bit','0b1000000000000000000000000000000000000000000000000000000000000000','9223372036854775807',False),
    ('decimal20','18446744073709551615','9223372036854775807',False),
    ('decimal19-wide','9999999999999999999','-8446744073709551617',False),
    ('leading-zero-wide','09223372036854775808','9223372036854775807',False),
]:
    add('gdscript',identifier,token,'int',payload,negated=negated)
add('gdscript','extended-decimal','9223372036854775808','int','-9223372036854775808')

Path(__file__).with_name('native_scalar_cases.json').write_text(json.dumps(cases,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
