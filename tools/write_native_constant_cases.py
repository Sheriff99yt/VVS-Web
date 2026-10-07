"""Trusted composed operator/conversion expectations, independent of the VVS evaluator."""
import json
from pathlib import Path

cases={language:[] for language in ['cpp','rust','gdscript']}
def literal(token,negated=False): return {'kind':'literal','token':token,'options':{'negated':negated}}
def binary(operator,left,right): return {'kind':'binary','operator':operator,'left':left,'right':right}
def unary(operator,operand): return {'kind':'unary','operator':operator,'operand':operand}
def cast(type_name,operand): return {'kind':'convert','nativeType':type_name,'operand':operand}
def spelling(tree,language):
    if tree['kind']=='literal': return ('-' if tree['options']['negated'] else '')+tree['token']
    if tree['kind']=='convert':
        operand=spelling(tree['operand'],language); target=tree['nativeType']
        return f'static_cast<{target}>({operand})' if language=='cpp' else f'({operand} as {target})' if language=='rust' else f'{target}({operand})'
    if tree['kind']=='unary':
        operator='not ' if language=='gdscript' and tree['operator']=='!' else tree['operator']
        return f'({operator}({spelling(tree["operand"],language)}))'
    return f'({spelling(tree["left"],language)} {tree["operator"]} {spelling(tree["right"],language)})'
def add(language,identifier,tree,type_name,payload,diagnostic=None,valid=True,calibration=False):
    expression=spelling(tree,language)
    if language=='cpp':
        expected=payload if type_name=='bool' else payload+('ULL' if type_name.startswith('unsigned') else 'LL')
        source='// λ🧭 constant proof\ntemplate<class A,class B> constexpr bool SAME=false;\ntemplate<class A> constexpr bool SAME<A,A> = true;\n'
        source+=f'constexpr auto VALUE={expression};\nstatic_assert(SAME<decltype({expression}),{type_name}>);\nstatic_assert(VALUE=={expected});\n'
    elif language=='rust':
        expected=payload if type_name=='bool' else payload+type_name
        source='// λ🧭 constant proof\n'+f'const VALUE:{type_name}={expression};\nconst _:()=assert!(VALUE=={expected});\n'
    else:
        expected='(-9223372036854775807 - 1)' if payload=='-9223372036854775808' else payload
        source='# λ🧭 constant proof\nextends RefCounted\n'+f'const VALUE={expression}\nconst CHECK=1 / int(VALUE=={expected})\nconst TYPE_CHECK=1 / int(VALUE is {type_name})\n'
    if calibration: source+= 'static_assert(VALUE!=VALUE);\n' if language=='cpp' else 'const _:()=assert!(VALUE!=VALUE);\n' if language=='rust' else 'const WRONG=1 / int(VALUE!=VALUE)\n'
    cases[language].append({'id':identifier,'tree':tree,'expression':expression,'nativeType':type_name,'payload':payload,'modelDiagnostic':diagnostic,'valid':valid,'calibration':calibration,'source':source})

for language in cases:
    type_name='i32' if language=='rust' else 'int'
    for identifier,op,left,right,result in [('add','+','7','5','12'),('subtract','-','7','5','2'),('multiply','*','7','5','35'),('divide','/','7','2','3'),('remainder','%','7','2','1'),('and','&','7','3','3'),('or','|','4','3','7'),('xor','^','7','3','4'),('shift-left','<<','3','2','12'),('shift-right','>>','12','2','3')]:
        add(language,identifier,binary(op,literal(left),literal(right)),type_name,result)
    add(language,'negative-division',binary('/',literal('7',True),literal('2')),type_name,'-3')
    add(language,'negative-remainder',binary('%',literal('7',True),literal('2')),type_name,'-1')
    add(language,'composed',binary('*',binary('+',literal('7'),literal('5')),binary('-',literal('9'),literal('2'))),type_name,'84')
    for identifier,op,expected in [('eq','==','false'),('ne','!=','true'),('lt','<','true'),('le','<=','true'),('gt','>','false'),('ge','>=','false')]: add(language,'compare-'+identifier,binary(op,literal('2'),literal('7')),'bool',expected)
    add(language,'bool-equal',binary('==',literal('true'),literal('false')),'bool','false')
    add(language,'not-bool',unary('!',literal('false')),'bool','true')
    add(language,'negative-composed',unary('-',binary('+',literal('2'),literal('3'))),type_name,'-5')
    add(language,'bit-not',unary('!' if language=='rust' else '~',literal('7')),type_name,'-8')
    add(language,'divide-zero',binary('/',literal('7'),literal('0')),type_name,'0','CONSTANT_DIVIDE_BY_ZERO',False)
    add(language,'remainder-zero',binary('%',literal('7'),literal('0')),type_name,'0','CONSTANT_DIVIDE_BY_ZERO',False)
    add(language,'bool-int',cast(type_name,literal('true')),type_name,'1')
    if language!='rust': add(language,'int-bool',cast('bool',literal('2')),'bool','true')
    else: add(language,'int-bool-invalid',cast('bool',literal('2')),'bool','true','CONSTANT_INVALID_CAST',False)
    add(language,'calibration',binary('+',literal('2'),literal('3')),type_name,'5',valid=False,calibration=True)

add('cpp','unsigned-wrap',binary('+',literal('4294967295u'),literal('1u')),'unsigned int','0')
add('cpp','unsigned-mixed',binary('+',literal('1',True),literal('1u')),'unsigned int','0')
add('cpp','signed-unsigned-compare',binary('<',literal('1',True),literal('1u')),'bool','false')
add('cpp','wide-signed-compare',binary('<',literal('1LL',True),literal('1u')),'bool','true')
add('cpp','long-unsigned-rank',binary('+',literal('1L'),literal('1u')),'unsigned long','2')
add('cpp','narrow-promotion',binary('+',cast('unsigned char',literal('255')),literal('1')),'int','256')
add('cpp','signed-narrow',cast('signed char',literal('255')),'signed char','-1')
add('cpp','unsigned-narrow',cast('unsigned char',literal('257')),'unsigned char','1')
add('cpp','signed-overflow',binary('+',literal('2147483647'),literal('1')),'int','0','CONSTANT_OVERFLOW',False)
add('cpp','shift-count',binary('<<',literal('1'),literal('32')),'int','0','CONSTANT_SHIFT_COUNT',False)
add('cpp','bool-arithmetic',binary('+',literal('true'),literal('true')),'int','2')
add('cpp','unsigned-shift',binary('<<',literal('4294967295u'),literal('1')),'unsigned int','4294967294')
add('cpp','negative-right-shift',binary('>>',literal('7',True),literal('1')),'int','-4')
add('cpp','division-overflow',binary('/',literal('9223372036854775807LL',True),literal('1',True)),'long long','9223372036854775807')

add('rust','signed-overflow',binary('+',literal('127i8'),literal('1i8')),'i8','0','CONSTANT_OVERFLOW',False)
add('rust','unsigned-overflow',binary('+',literal('255u8'),literal('1u8')),'u8','0','CONSTANT_OVERFLOW',False)
add('rust','narrow',cast('u8',literal('257i32')),'u8','1')
add('rust','signed-narrow',cast('i8',literal('255u32')),'i8','-1')
add('rust','mixed-types',binary('+',literal('1u8'),literal('1u16')),'u8','0','CONSTANT_TYPE_MISMATCH',False)
add('rust','shift-count',binary('<<',literal('1u8'),literal('8u32')),'u8','0','CONSTANT_SHIFT_COUNT',False)
add('rust','shift-truncates',binary('<<',literal('255u8'),literal('1u32')),'u8','254')
add('rust','signed-shift-truncates',binary('<<',literal('127i8'),literal('1u32')),'i8','-2')
add('rust','bool-bitwise',binary('^',literal('true'),literal('true')),'bool','false')
add('rust','unsigned-negative',unary('-',literal('1u8')),'u8','0','CONSTANT_UNSIGNED_NEGATION',False)
add('rust','grouped-minimum',unary('-',literal('128i8')),'i8','-128')
add('rust','negate-minimum-overflow',unary('-',literal('128i8',True)),'i8','0','CONSTANT_OVERFLOW',False)
add('rust','division-minimum-overflow',binary('/',literal('128i8',True),literal('1i8',True)),'i8','0','CONSTANT_DIVISION_OVERFLOW',False)
peer_two=literal('2');peer_two['options']['expectedType']='i8'
add('rust','negative-peer-comparison',binary('<',unary('-',literal('1i8')),peer_two),'bool','true')
peer_three=literal('3');peer_three['options']['expectedType']='i8'
add('rust','composed-peer-comparison',binary('<',binary('+',literal('1i8'),peer_two),peer_three),'bool','false')

add('gdscript','signed-wrap',binary('+',literal('9223372036854775807'),literal('1')),'int','-9223372036854775808')
add('gdscript','negative-shift',binary('>>',literal('7',True),literal('1')),'int','-4','CONSTANT_SHIFT_NEGATIVE_OPERAND',False)
add('gdscript','identity-convert',cast('int',binary('+',literal('2'),literal('3'))),'int','5')
add('gdscript','grouped-hex-negative',unary('-',literal('0x8000000000000000')),'int','-9223372036854775807')
add('gdscript','direct-hex-negative',literal('0x8000000000000000',True),'int','-9223372036854775808')
for language in cases:
    type_name='i8' if language=='rust' else 'int'
    first=literal('1');second=literal('2')
    if language=='rust':
        first['options']['expectedType']='i8';second['options']['expectedType']='i8'
    add(language,'source-method-return',binary('+',first,second),type_name,'3')
    method=cases[language][-1]
    method['sourceFunction']='mirror'
    if language=='cpp':method['source']+='constexpr int mirror() { return 1 + 2; }\nstatic_assert(mirror()==VALUE);\n'
    elif language=='rust':method['source']+='const fn mirror()->i8 { 1 + 2 }\nconst _:()=assert!(mirror()==VALUE);\n'
    else:method['source']+='func mirror()->int:\n\treturn 1 + 2\n'
Path(__file__).with_name('native_constant_cases.json').write_text(json.dumps(cases,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
