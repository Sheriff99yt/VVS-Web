import { describe, expect, test } from 'bun:test';
import { expandProjectSymbols, inferKindIdFromLabel, list } from './registry';

describe('inferKindIdFromLabel', () => {
  test('resolves declare function and event templates', () => {
    expect(inferKindIdFromLabel('Declare Function', 'Project')).toBe('function_define');
    expect(inferKindIdFromLabel('Declare Event', 'Events')).toBe('event_member_define');
  });

  test('resolves bound declare labels by category', () => {
    expect(inferKindIdFromLabel('Declare Add', 'Project')).toBe('function_define');
    expect(inferKindIdFromLabel('Declare calculate', 'Events')).toBe('event_member_define');
  });

  test('resolves declare variable and class templates', () => {
    expect(inferKindIdFromLabel('Declare Variable', 'Variables')).toBe('var_define');
    expect(inferKindIdFromLabel('Declare Class', 'Project')).toBe('class_define');
    expect(inferKindIdFromLabel('Declare Score', 'Variables')).toBe('var_define');
  });

  test('resolves U81 define function body placement labels', () => {
    expect(inferKindIdFromLabel('Define Function', 'Project')).toBe('function_implement');
    expect(inferKindIdFromLabel('Define Add', 'Project')).toBe('function_implement');
    expect(inferKindIdFromLabel('Define Event', 'Events')).toBe('event_member_define');
    expect(inferKindIdFromLabel('Define calculate', 'Events')).toBe('event_member_define');
  });
});

describe('list catalog grouping', () => {
  test('groups Declare vs Define catalog sections with handlers', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    const names = categories.map((c) => c.name);
    expect(names).toContain('Define');
    expect(names).toContain('Declare');
    expect(names).toContain('Handlers');
    const declareSection = categories.find((c) => c.name === 'Declare');
    const defineSection = categories.find((c) => c.name === 'Define');
    expect(declareSection?.items.some((i) => i.kindId === 'var_define')).toBe(true);
    expect(declareSection?.items.some((i) => i.kindId === 'class_define')).toBe(true);
    expect(declareSection?.items.some((i) => i.kindId === 'event_member_define')).toBe(true);
    expect(declareSection?.items.some((i) => i.kindId === 'function_define')).toBe(false);
    expect(declareSection?.items.some((i) => i.label === 'Declare Function')).toBe(false);
    expect(defineSection?.items.some((i) => i.kindId === 'function_implement')).toBe(true);
    expect(defineSection?.items.some((i) => i.label === 'Define Function')).toBe(true);
    const handlers = categories.find((c) => c.name === 'Handlers');
    expect(handlers?.items.some((i) => i.kindId === 'event_define')).toBe(true);
  });

  test('renames project symbol sections to Call and Dispatch', () => {
    const categories = expandProjectSymbols({
      currentGraphId: 'main',
      functions: [{ id: 'fn-1', name: 'Add', binding: 'instance', overloads: [{ id: 'o1', returnType: 'void', parameters: [] }] }],
      events: [{ id: 'evt-1', name: 'calculate' }],
    });
    expect(categories.map((c) => c.name)).toEqual(['Call', 'Dispatch']);
  });

  test('adds missing Define/Declare rows for symbols without define nodes', () => {
    const categories = list({
      currentGraphId: 'main',
      functions: [],
      events: [],
      functionsMissingDeclare: [{ id: 'fn-1', name: 'Add', binding: 'instance', overloads: [{ id: 'o1', returnType: 'void', parameters: [] }] }],
      eventsMissingDeclare: [{ id: 'evt-1', name: 'calculate' }],
    });
    const defineSection = categories.find((c) => c.name === 'Define');
    const declareSection = categories.find((c) => c.name === 'Declare');
    expect(declareSection?.items.some((i) => i.label === 'Declare Add')).toBe(false);
    expect(declareSection?.items.some((i) => i.label === 'Declare calculate')).toBe(true);
  });

  test('spawns Function Declare for C++ and for abstract functions only', () => {
    const cpp = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'cpp' });
    const cppDeclare = cpp.find((c) => c.name === 'Declare');
    expect(cppDeclare?.items.some((i) => i.kindId === 'function_define')).toBe(true);

    const pythonMissing = list({
      currentGraphId: 'main',
      functions: [],
      events: [],
      targetLanguage: 'python',
      functionsMissingDeclare: [
        { id: 'fn-1', name: 'Add', binding: 'instance', overloads: [{ id: 'o1', returnType: 'void', parameters: [] }] },
        {
          id: 'fn-2',
          name: 'Diagnose',
          binding: 'instance',
          flags: { abstract: true },
          overloads: [{ id: 'o1', returnType: 'void', parameters: [] }],
        },
      ],
    });
    const pyDeclare = pythonMissing.find((c) => c.name === 'Declare');
    expect(pyDeclare?.items.some((i) => i.label === 'Declare Add')).toBe(false);
    expect(pyDeclare?.items.some((i) => i.label === 'Declare Diagnose')).toBe(true);
  });
});

describe('expandProjectSymbols inheritance Get/Set (U106)', () => {
  test('emits Get/Set rows for in-scope variables without changing Call/Dispatch', () => {
    const categories = expandProjectSymbols({
      currentGraphId: 'main',
      functions: [{ id: 'fn-1', name: 'Add', binding: 'instance', overloads: [{ id: 'o1', returnType: 'void', parameters: [] }] }],
      events: [{ id: 'evt-1', name: 'calculate' }],
      variables: [
        {
          kind: 'variable',
          id: 'var-power',
          name: 'Power',
          type: 'data_number',
          binding: 'instance',
          visibility: 'public',
        },
      ],
    });
    expect(categories.map((c) => c.name)).toEqual(['Call', 'Dispatch', 'Get', 'Set']);
    const getPower = categories.find((c) => c.name === 'Get')?.items.find((i) => i.label === 'Get Power');
    expect(getPower?.graphBinding).toEqual({ kind: 'variable_ref', symbolId: 'var-power' });
  });
});

describe('function role spawn rows', () => {
  test('Constructor row hidden for go and rust; shown for python/cpp', () => {
    for (const lang of ['go', 'rust', 'verse'] as const) {
      const cats = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: lang });
      const define = cats.find((c) => c.name === 'Define');
      expect(define?.items.some((i) => i.label === 'Constructor')).toBe(false);
      expect(define?.items.some((i) => i.kindId === 'function_implement')).toBe(true);
    }
    for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'gdscript'] as const) {
      const cats = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: lang });
      const define = cats.find((c) => c.name === 'Define');
      const ctor = define?.items.find((i) => i.label === 'Constructor');
      expect(ctor?.kindId).toBe('function_implement');
      expect(ctor?.properties).toEqual({ role: 'constructor' });
    }
  });

  test('Destructor row only for cpp and sets role', () => {
    const cpp = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'cpp' });
    const cppDefine = cpp.find((c) => c.name === 'Define');
    const dtor = cppDefine?.items.find((i) => i.label === 'Destructor');
    expect(dtor?.kindId).toBe('function_implement');
    expect(dtor?.properties).toEqual({ role: 'destructor' });

    for (const lang of ['python', 'javascript', 'csharp', 'gdscript', 'rust', 'go', 'verse'] as const) {
      const cats = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: lang });
      const define = cats.find((c) => c.name === 'Define');
      expect(define?.items.some((i) => i.label === 'Destructor')).toBe(false);
    }
  });
});

function catalogHasKind(targetLanguage: Parameters<typeof list>[0]['targetLanguage'], kindId: string): boolean {
  return list({ currentGraphId: 'main', functions: [], events: [], targetLanguage })
    .some((category) => category.items.some((item) => item.kindId === kindId));
}

describe('lambda and try spawn gates', () => {
  test('lambda_define spawns only python/javascript/csharp/rust/gdscript', () => {
    for (const lang of ['python', 'javascript', 'csharp', 'rust', 'gdscript'] as const) {
      expect(catalogHasKind(lang, 'lambda_define')).toBe(true);
    }
    for (const lang of ['cpp', 'go', 'verse'] as const) {
      expect(catalogHasKind(lang, 'lambda_define')).toBe(false);
    }
  });

  test('flow_try spawns only python/javascript/cpp/csharp/gdscript', () => {
    for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'gdscript'] as const) {
      expect(catalogHasKind(lang, 'flow_try')).toBe(true);
    }
    for (const lang of ['go', 'rust', 'verse'] as const) {
      expect(catalogHasKind(lang, 'flow_try')).toBe(false);
    }
  });

  test('inferKindIdFromLabel maps Lambda and Try', () => {
    expect(inferKindIdFromLabel('Lambda', 'Expressions')).toBe('lambda_define');
    expect(inferKindIdFromLabel('Try', 'Flow Control')).toBe('flow_try');
  });

  test('yield_stmt spawns only python/gdscript; hidden on cpp/js/cs/go/rust/verse', () => {
    for (const lang of ['python', 'gdscript'] as const) {
      expect(catalogHasKind(lang, 'yield_stmt')).toBe(true);
    }
    for (const lang of ['cpp', 'javascript', 'csharp', 'go', 'rust', 'verse'] as const) {
      expect(catalogHasKind(lang, 'yield_stmt')).toBe(false);
    }
    expect(inferKindIdFromLabel('Yield', 'Flow Control')).toBe('yield_stmt');
  });
});

describe('lambda_define and flow_try spawn gates', () => {
  function kindShown(lang: 'python' | 'javascript' | 'cpp' | 'csharp' | 'rust' | 'gdscript' | 'verse' | 'go', kindId: string): boolean {
    const cats = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: lang });
    return cats.some((c) => c.items.some((i) => i.kindId === kindId));
  }

  test('lambda_define hidden for cpp/go/verse; shown for python/js/cs/rust/gd', () => {
    for (const lang of ['cpp', 'go', 'verse'] as const) {
      expect(kindShown(lang, 'lambda_define')).toBe(false);
    }
    for (const lang of ['python', 'javascript', 'csharp', 'rust', 'gdscript'] as const) {
      expect(kindShown(lang, 'lambda_define')).toBe(true);
    }
  });

  test('flow_try hidden for go/rust; shown for python/js/cpp/cs/gd', () => {
    for (const lang of ['go', 'rust'] as const) {
      expect(kindShown(lang, 'flow_try')).toBe(false);
    }
    for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'gdscript'] as const) {
      expect(kindShown(lang, 'flow_try')).toBe(true);
    }
  });
});
