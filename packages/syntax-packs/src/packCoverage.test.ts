import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { resolvePrintProfile } from './resolve';

const REQUIRED_TEMPLATES = [
  'Print',
  'Assign',
  'AssignInstance',
  'AssignLocal',
  'CallFunction',
  'CallInstance',
  'DispatchEvent',
  'DispatchEventCrossClass',
  'IfBranchHeader',
  'ForLoopHeader',
  'WhileLoopHeader',
  'ModuleImport',
  'ImportClass',
  'AwaitWait',
  'AwaitWaitAsync',
  'AwaitWaitSync',
  'CallNative',
  'ConvertToString',
  'ConvertToNumber',
  'InstanceRef',
  'NullLiteral',
  'BoolLiteralTrue',
  'BoolLiteralFalse',
  'VarDefine',
  'DeclareLocal',
  'SequenceHeader',
  'EnumMemberAccess',
  'ModuleImportFrom',
  'ModuleImportIncludeSystem',
] as const;

const REQUIRED_SHELL_TEMPLATES = [
  'ClassModuleOpen',
  'EventHandlerOpen',
  'FunctionDefOpen',
] as const;

const OPTIONAL_SHELL_BY_FAMILY: Record<
  (typeof PACK_FAMILIES)[number],
  readonly string[]
> = {
  python: ['SwitchSelectBind'],
  javascript: ['ClassModuleClose', 'EventHandlerClose', 'FunctionTabClose'],
  cpp: [
    'ClassModuleClose',
    'ClassPublicSection',
    'EventHandlerClose',
    'FunctionTabClose',
    'FunctionDeclPrototype',
    'FunctionDefOutOfLineOpen',
    'FunctionOutOfLineClose',
  ],
  gdscript: ['SwitchSelectBind'],
  verse: [],
  rust: [
    'ClassModuleClose',
    'EventHandlerClose',
    'FunctionTabClose',
    'IfBranchClose',
    'ForLoopClose',
    'WhileLoopClose',
    'SequenceComment',
    'SequenceClose',
    'CallCrossClassStatic',
    'SwitchSelectBind',
    'GetInputLineNew',
    'GetInputLineRead',
    'GetInputParseLineF32',
  ],
  csharp: [
    'ClassModuleClose',
    'EventHandlerClose',
    'FunctionTabClose',
    'IfBranchClose',
    'ForLoopClose',
    'WhileLoopClose',
    'SequenceComment',
    'SequenceClose',
    'CallCrossClassStatic',
    'GetInputLineRead',
    'GetInputParseLineF32',
  ],
};

const REQUIRED_LAYOUT_KEYS = [
  'indentUnit',
  'blockPlaceholder',
  'commentPrefix',
  'instanceReceiver',
  'bodyIndent',
  'handlerBodyIndent',
  'memberChainIndent',
  'varDeclIndent',
  'emptyHandlerBody',
  'emptyFunctionBody',
] as const;

const PACK_FAMILIES = ['python', 'cpp', 'javascript', 'verse', 'gdscript', 'rust', 'csharp'] as const;

function skipTemplate(family: (typeof PACK_FAMILIES)[number], key: (typeof REQUIRED_TEMPLATES)[number]): boolean {
  if (family === 'python' && (key === 'AwaitWait' || key === 'Assign')) return true;
  if (family === 'gdscript' && (key === 'AwaitWait' || key === 'Assign')) return true;
  if (family === 'rust' && (key === 'AwaitWaitAsync' || key === 'AwaitWaitSync' || key === 'Assign')) return true;
  if (family === 'csharp' && (key === 'AwaitWait' || key === 'Assign')) return true;
  if (family === 'cpp' && (key === 'AwaitWaitAsync' || key === 'AwaitWaitSync' || key === 'AssignInstance' || key === 'AssignLocal')) {
    return true;
  }
  if (family === 'javascript' && (key === 'AwaitWait' || key === 'Assign')) return true;
  if (family === 'verse' && (key === 'AwaitWaitAsync' || key === 'AwaitWaitSync' || key === 'Assign' || key === 'AssignInstance' || key === 'AssignLocal')) {
    return true;
  }
  return false;
}

function rosettaDir(): string {
  const here = fileURLToPath(new URL('.', import.meta.url));
  return join(here, '..', 'rosetta');
}

describe('pack coverage for Rosetta families', () => {
  for (const family of PACK_FAMILIES) {
    test(`${family}.base has required template keys`, () => {
      const profile = resolvePrintProfile(family);
      for (const key of REQUIRED_TEMPLATES) {
        if (skipTemplate(family, key)) continue;
        expect(profile.templates[key], `missing ${key} in ${family}`).toBeDefined();
      }
      expect(profile.layout).toBeDefined();
      for (const key of REQUIRED_LAYOUT_KEYS) {
        const value = profile.layout?.[key];
        if (key === 'instanceReceiver') {
          expect(value).toBeDefined();
          continue;
        }
        expect(value, `missing layout.${key} in ${family}`).toBeTruthy();
      }
      for (const key of REQUIRED_SHELL_TEMPLATES) {
        expect(profile.templates[key], `missing shell ${key} in ${family}`).toBeDefined();
      }
      for (const key of OPTIONAL_SHELL_BY_FAMILY[family]) {
        expect(profile.templates[key], `missing optional shell ${key} in ${family}`).toBeDefined();
      }
    });
  }

  test('every Rosetta fixture file exists for all pack families', () => {
    const fixtures = readdirSync(rosettaDir())
      .filter((f) => f.endsWith('.fixture.json'))
      .map((f) => f.replace('.fixture.json', ''));
    for (const fixture of fixtures) {
      for (const family of PACK_FAMILIES) {
        const goldenPath = join(rosettaDir(), `${fixture}.${family}.golden.txt`);
        expect(readFileSync(goldenPath, 'utf8').length).toBeGreaterThan(0);
      }
    }
  });
});
