import { describe, expect, test } from 'bun:test';
import {
  classExtendsSuffix,
  renderClassModuleOpen,
  renderFunctionDefHeader,
  renderFunctionDefOutOfLineHeader,
  renderFunctionDeclPrototype,
} from './shell';

describe('emit shell pack templates', () => {
  test('class module open with extends suffix', () => {
    expect(renderClassModuleOpen('python', 'App', 'Base')).toBe('class App(Base):');
    expect(renderClassModuleOpen('javascript', 'App')).toBe('class App {');
    expect(classExtendsSuffix('cpp', 'Widget')).toBe(' : public Widget');
  });

  test('function def header from pack', () => {
    expect(
      renderFunctionDefHeader(
        {
          id: 'f1',
          name: 'run',
          classId: 'c1',
          binding: 'instance',
          overloads: [{ parameters: [] }],
        },
        'python'
      )
    ).toBe('    def run(self):');
  });

  test('C++ FunctionDefOpen matches skill Declare+Define modifiers', () => {
    expect(
      renderFunctionDefHeader(
        {
          id: 'f-boot',
          name: 'Boot',
          classId: 'c1',
          binding: 'instance',
          overloads: [{ parameters: [] }],
        },
        'cpp',
        false,
        { isVirtual: true }
      )
    ).toBe('    virtual void Boot() {');

    expect(
      renderFunctionDefHeader(
        {
          id: 'f-report',
          name: 'Report',
          classId: 'c1',
          binding: 'instance',
          overloads: [{ parameters: [] }],
        },
        'cpp',
        false,
        { isOverride: true }
      )
    ).toBe('    void Report() override {');
  });

  test('C++ FunctionDefOutOfLineOpen omits virtual/override (belong on Declare)', () => {
    expect(
      renderFunctionDefOutOfLineHeader(
        {
          id: 'f-boot',
          name: 'Boot',
          classId: 'c1',
          binding: 'instance',
          overloads: [{ parameters: [] }],
        },
        'Machine',
        'cpp',
        false,
        { isVirtual: true }
      )
    ).toBe('void Machine::Boot() {');
  });

  test('C++ prototype and out-of-line use overload return type', () => {
    const add = {
      id: 'f-add',
      name: 'Add',
      classId: 'c1',
      binding: 'instance' as const,
      overloads: [
        {
          id: 'o1',
          parameters: [
            { id: 'a', label: 'a', type: 'data_number' as const },
            { id: 'b', label: 'b', type: 'data_number' as const },
          ],
          returnType: 'data_number' as const,
        },
      ],
    };
    expect(renderFunctionDeclPrototype(add, 'cpp')).toBe(
      '    float Add(float a, float b);'
    );
    expect(renderFunctionDeclPrototype(add, 'csharp')).toBe(
      '    float Add(float a, float b);'
    );
    expect(renderFunctionDefOutOfLineHeader(add, 'Machine', 'cpp')).toBe(
      'float Machine::Add(float a, float b) {'
    );
  });
});
