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
    expect(declareSection?.items.some((i) => i.kindId === 'function_define')).toBe(true);
    expect(declareSection?.items.some((i) => i.label === 'Declare Function')).toBe(true);
    expect(defineSection?.items.some((i) => i.kindId === 'function_implement')).toBe(true);
    expect(defineSection?.items.some((i) => i.label === 'Define Function')).toBe(true);
    const handlers = categories.find((c) => c.name === 'Handlers');
    expect(handlers?.items.some((i) => i.kindId === 'event_define')).toBe(true);
  });

  test('renames project symbol sections to Call and Dispatch', () => {
    const categories = expandProjectSymbols({
      currentGraphId: 'main',
      functions: [{ id: 'fn-1', name: 'Add', binding: 'instance', overloads: [{ id: 'o1', returnType: 'void' }] }],
      events: [{ id: 'evt-1', name: 'calculate' }],
    });
    expect(categories.map((c) => c.name)).toEqual(['Call', 'Dispatch']);
  });

  test('adds missing Define/Declare rows for symbols without define nodes', () => {
    const categories = list({
      currentGraphId: 'main',
      functions: [],
      events: [],
      functionsMissingDeclare: [{ id: 'fn-1', name: 'Add', binding: 'instance', overloads: [{ id: 'o1', returnType: 'void' }] }],
      eventsMissingDeclare: [{ id: 'evt-1', name: 'calculate' }],
    });
    const defineSection = categories.find((c) => c.name === 'Define');
    const declareSection = categories.find((c) => c.name === 'Declare');
    expect(declareSection?.items.some((i) => i.label === 'Declare Add')).toBe(true);
    expect(declareSection?.items.some((i) => i.label === 'Declare calculate')).toBe(true);
  });
});
