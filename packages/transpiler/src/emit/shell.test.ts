import { describe, expect, test } from 'bun:test';
import {
  appendEventHandlerDefinition,
  classExtendsSuffix,
  functionReturnTypeName,
  renderClassModuleOpen,
  renderFunctionDefHeader,
  renderFunctionDefOutOfLineHeader,
  renderFunctionDeclPrototype,
  renderShell,
  resolveModifierSlots,
} from './shell';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule } from '../ir/types';


function fn(name: string, flags?: { virtual?: boolean; override?: boolean; abstract?: boolean; async?: boolean }) {
  return {
    id: 'f-' + name.toLowerCase(),
    name,
    classId: 'c1',
    binding: 'instance' as const,
    visibility: 'public' as const,
    overloads: [{ parameters: [] }],
    flags,
  };
}

describe('emit shell pack templates', () => {
  test('class module open with extends suffix', () => {
    expect(renderClassModuleOpen('python', 'App', 'Base')).toBe('class App(Base):');
    expect(renderClassModuleOpen('javascript', 'App')).toBe('class App {');
    expect(classExtendsSuffix('cpp', 'Widget')).toBe(' : public Widget');
  });

  test('one parent still prints a single base', () => {
    expect(renderClassModuleOpen('python', 'Child', 'Parent')).toBe('class Child(Parent):');
    expect(classExtendsSuffix('cpp', 'Parent')).toBe(' : public Parent');
  });

  test('python/cpp print every Extends row; others stay first parent', () => {
    const extras = ['Parent', 'Mixin'];
    expect(classExtendsSuffix('python', 'Parent', extras)).toBe('(Parent, Mixin)');
    expect(renderClassModuleOpen('python', 'Child', 'Parent', { extendsTypes: extras })).toBe(
      'class Child(Parent, Mixin):'
    );
    expect(classExtendsSuffix('cpp', 'Parent', extras)).toBe(' : public Parent, public Mixin');
    expect(renderClassModuleOpen('cpp', 'Child', 'Parent', { extendsTypes: extras })).toBe(
      'class Child : public Parent, public Mixin {'
    );
    expect(classExtendsSuffix('javascript', 'Parent', extras)).toBe(' extends Parent');
    expect(classExtendsSuffix('javascript', 'Parent', extras)).not.toContain('Mixin');
    expect(classExtendsSuffix('csharp', 'Parent', extras)).toBe(' : Parent');
    expect(classExtendsSuffix('csharp', 'Parent', extras)).not.toContain('Mixin');
    expect(classExtendsSuffix('gdscript', 'Parent', extras)).toBe('\nextends Parent');
    expect(classExtendsSuffix('verse', 'Parent', extras)).toBe('(Parent)');
    expect(classExtendsSuffix('rust', 'Parent', extras)).toBe('');
    expect(classExtendsSuffix('go', 'Parent', extras)).toBe('');
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

  test('C++ FunctionDeclPrototype emits virtual, override, and pure virtual', () => {
    expect(renderFunctionDeclPrototype(fn('Boot'), 'cpp', { isVirtual: true })).toBe(
      '    virtual void Boot();'
    );
    expect(renderFunctionDeclPrototype(fn('Report'), 'cpp', { isOverride: true })).toBe(
      '    void Report() override;'
    );
    expect(renderFunctionDeclPrototype(fn('Diagnose'), 'cpp', { isAbstract: true })).toBe(
      '    virtual void Diagnose() = 0;'
    );
    expect(
      renderFunctionDeclPrototype(fn('Report'), 'cpp', { isVirtual: true, isOverride: true })
    ).toBe('    virtual void Report() override;');
  });

  test('C++ prototype reads override from symbol flags when properties omit it', () => {
    expect(renderFunctionDeclPrototype(fn('Report', { override: true }), 'cpp')).toBe(
      '    void Report() override;'
    );
  });

  test('C# FunctionDefOpen emits virtual, override, and abstract', () => {
    expect(renderFunctionDefHeader(fn('Boot'), 'csharp', false, { isVirtual: true })).toBe(
      '    public virtual void Boot() {'
    );
    expect(renderFunctionDefHeader(fn('Report'), 'csharp', false, { isOverride: true })).toBe(
      '    public override void Report() {'
    );
    expect(renderFunctionDefHeader(fn('Diagnose'), 'csharp', false, { isAbstract: true })).toBe(
      '    public abstract void Diagnose() {'
    );
  });

  test('C# FunctionDeclPrototype emits abstract and override', () => {
    expect(renderFunctionDeclPrototype(fn('Diagnose'), 'csharp', { isAbstract: true })).toBe(
      '    public abstract void Diagnose();'
    );
    expect(renderFunctionDeclPrototype(fn('Report'), 'csharp', { isOverride: true })).toBe(
      '    public override void Report();'
    );
  });

  test('C# override wins over virtual (no virtual override)', () => {
    const mods = resolveModifierSlots('csharp', { isVirtual: true, isOverride: true });
    expect(mods.virtualKw).toBe('');
    expect(mods.overrideKw).toBe('override ');
    expect(
      renderFunctionDefHeader(fn('Report'), 'csharp', false, { isVirtual: true, isOverride: true })
    ).toBe('    public override void Report() {');
  });

  test('C# reads override from symbol flags when properties omit it', () => {
    expect(renderFunctionDefHeader(fn('Report', { override: true }), 'csharp')).toBe(
      '    public override void Report() {'
    );
  });

  test('Verse emits <override> specifier only', () => {
    expect(renderFunctionDefHeader(fn('Report'), 'verse', false, { isOverride: true })).toBe(
      '    Report<public><override>() : void ='
    );
  });

  test('CL-006 C# async void function emits async Task, not async void', () => {
    expect(renderFunctionDefHeader(fn('Shutdown'), 'csharp', false, { isAsync: true })).toBe(
      '    public async Task Shutdown() {'
    );
    expect(renderFunctionDefHeader(fn('Shutdown'), 'csharp', true)).toBe(
      '    public async Task Shutdown() {'
    );
    expect(renderFunctionDefHeader(fn('Shutdown', { async: true }), 'csharp')).toBe(
      '    public async Task Shutdown() {'
    );
    const header = renderFunctionDefHeader(fn('Shutdown'), 'csharp', true);
    expect(header).toContain('async Task');
    expect(header).not.toContain('async void');
  });

  test('CL-006 C# async with return type emits async Task<T>', () => {
    const fetch = {
      ...fn('Fetch'),
      overloads: [{ parameters: [], returnType: 'data_number' as const }],
    };
    expect(renderFunctionDefHeader(fetch, 'csharp', false, { isAsync: true })).toBe(
      '    public async Task<float> Fetch() {'
    );
    expect(functionReturnTypeName(fetch, 'csharp', { isAsync: true })).toBe('Task<float>');
    expect(
      functionReturnTypeName(fn('Shutdown'), 'csharp', { isAsync: true, returnType: 'data_string' })
    ).toBe('Task<string>');
    expect(functionReturnTypeName(fn('Shutdown'), 'csharp', { isAsync: true })).toBe('Task');
    expect(functionReturnTypeName(fn('Boot'), 'csharp')).toBe('void');
  });

  test('CL-006 C# async Declare prototype is Task without async keyword', () => {
    expect(renderFunctionDeclPrototype(fn('Shutdown', { async: true }), 'csharp')).toBe(
      '    public Task Shutdown();'
    );
    expect(
      renderFunctionDeclPrototype(fn('Shutdown'), 'csharp', { isAsync: true, isAbstract: true })
    ).toBe('    public abstract Task Shutdown();');
  });

  test('CL-006 C# EventHandlerOpen uses async Task when isAsync, void otherwise', () => {
    expect(
      renderShell('csharp', 'EventHandlerOpen', {
        linePrefix: '',
        visibility: 'public ',
        virtualKw: '',
        overrideKw: '',
        asyncKw: '',
        returnType: 'void',
        handler: 'tick',
        paramList: '',
      })
    ).toBe('    public void on_tick() {');
    expect(
      renderShell('csharp', 'EventHandlerOpen', {
        linePrefix: '',
        visibility: 'public ',
        virtualKw: '',
        overrideKw: '',
        asyncKw: 'async ',
        returnType: 'Task',
        handler: 'tick',
        paramList: '',
      })
    ).toBe('    public async Task on_tick() {');
  });

  test('CL-006 C# async event handler definition emits async Task, not async void', () => {
    const ir = {
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: 'csharp',
      filePath: 'Demo.cs',
      tabId: 'main',
      isFunctionTab: false,
      variables: [],
      functions: [],
      projectEvents: [],
      imports: [],
      onStartBody: [],
      eventHandlers: [],
      functionBodies: {},
      execOrder: [],
      handlerNodeLabels: [],
      members: [],
    } as unknown as IrModule;
    const handler: IrEventHandler = {
      kind: 'EventHandler',
      sourceGraphNodeId: 'h1',
      handlerName: 'tick',
      paramNames: [],
      body: [],
      properties: { isAsync: true, visibility: 'public' },
    };
    const sink = new CodeSink('Demo.cs');
    appendEventHandlerDefinition(sink, ir, handler, 'h1', {
      memberProperties: { isAsync: true, visibility: 'public' },
    });
    expect(sink.content).toContain('public async Task on_tick()');
    expect(sink.content).not.toContain('async void');
    expect(sink.content).not.toMatch(/void on_tick/);
  });

  test('languages without override invent no keyword or fake comment', () => {
    const langs = ['python', 'javascript', 'gdscript', 'rust', 'go'] as const;
    for (const lang of langs) {
      const mods = resolveModifierSlots(lang, {
        isOverride: true,
        isVirtual: true,
        isAbstract: true,
      });
      expect(mods.overrideKw).toBe('');
      expect(mods.virtualKw).toBe('');
      expect(mods.abstractKw).toBe('');
      const header = renderFunctionDefHeader(fn('Report'), lang, false, {
        isOverride: true,
        isVirtual: true,
        isAbstract: true,
      });
      expect(header.toLowerCase()).not.toContain('override');
      expect(header.toLowerCase()).not.toContain('virtual');
      expect(header).not.toContain('# override');
      expect(header).not.toContain('// override');
    }
  });

  test('CL-018 rust isAsync is a no-op (no Tokio) — emit fn, not async fn', () => {
    const header = renderFunctionDefHeader(fn('Shutdown', { async: true }), 'rust', false, {
      isAsync: true,
      visibility: 'public',
    });
    expect(header).toContain('pub fn Shutdown');
    expect(header).not.toContain('async');
    const mods = resolveModifierSlots('rust', { isAsync: true, visibility: 'public' });
    expect(mods.asyncKw).toBe('');
  });
});
