import { describe, expect, test } from 'bun:test';
import { transpileGraphCode } from './generate';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { FunctionSymbol, GraphEdge, GraphNode, TargetLanguage } from '@vvs/graph-types';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function emitRoleMethod(
  lang: TargetLanguage,
  role: 'function' | 'constructor' | 'destructor',
  name = 'Parent'
): string {
  const funcId = `fn-${role}`;
  const func: FunctionSymbol = {
    kind: 'function',
    id: funcId,
    name,
    binding: 'instance',
    visibility: 'public',
    classId: MAIN_CLASS_ID,
    overloads: [{ id: 'o1', parameters: [], returnType: 'void', graphTabId: funcId }],
  };
  const classNode: GraphNode = {
    id: 'class-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Class Parent',
      category: 'Project',
      kindId: 'class_define',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      properties: { symbolId: MAIN_CLASS_ID, classId: MAIN_CLASS_ID, name: 'Parent' },
    },
  };
  const fnDefine: GraphNode = {
    id: 'fn-def',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Declare ${name}`,
      category: 'Project',
      kindId: 'function_define',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      linkedGraphId: funcId,
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'o1' },
      properties: { symbolId: funcId, name, role, graphTabId: funcId },
    },
  };
  const fnImpl: GraphNode = {
    id: 'fn-impl',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Define ${name}`,
      category: 'Project',
      kindId: 'function_implement',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      linkedGraphId: funcId,
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'o1' },
      properties: { symbolId: funcId, name, role, graphTabId: funcId },
    },
  };
  const edges: GraphEdge[] = [
    {
      id: 'e-class-def',
      source: 'class-1',
      target: 'fn-def',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
    {
      id: 'e-def-impl',
      source: 'fn-def',
      target: 'fn-impl',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
  ];
  return transpileGraphCode({
    moduleName: 'Parent',
    extendsType: '',
    targetLanguage: lang,
    variables: [],
    functions: [func],
    nodes: [classNode, fnDefine, fnImpl],
    edges,
    documents: {
      [funcId]: { nodes: [], edges: [] },
    },
    projectEvents: [],
    classes: [{ kind: 'class', id: MAIN_CLASS_ID, name: 'Parent', containerId: MAIN_GRAPH_CONTAINER_ID }],
    activeClassId: MAIN_CLASS_ID,
    tabId: MAIN_GRAPH_CONTAINER_ID,
  });
}

describe('Function Define role — constructor / destructor', () => {
  test('Python constructor emits def __init__', () => {
    const code = emitRoleMethod('python', 'constructor');
    expect(code).toContain('def __init__');
    expect(code).not.toContain('def Parent(');
  });

  test('JavaScript constructor emits constructor(', () => {
    const code = emitRoleMethod('javascript', 'constructor');
    expect(code).toContain('constructor(');
  });

  test('C++ constructor + destructor use class form in-class and out-of-line', () => {
    const ctor = emitRoleMethod('cpp', 'constructor');
    expect(ctor).toMatch(/Parent\s*\(/);
    expect(ctor).toContain('Parent::Parent(');
    expect(ctor).not.toContain('void Parent(');

    const dtor = emitRoleMethod('cpp', 'destructor');
    expect(dtor).toContain('~Parent(');
    expect(dtor).toContain('Parent::~Parent(');
    expect(dtor).not.toContain('void Parent(');
  });

  test('C# constructor uses class name and does not emit a destructor', () => {
    const ctor = emitRoleMethod('csharp', 'constructor');
    expect(ctor).toMatch(/Parent\s*\(/);
    expect(ctor).not.toContain('~Parent');
    expect(ctor).not.toContain('void Parent(');

    const dtor = emitRoleMethod('csharp', 'destructor');
    expect(dtor).not.toContain('~Parent');
    expect(dtor).not.toContain('~Parent()');
  });

  test('GDScript constructor emits func _init', () => {
    const code = emitRoleMethod('gdscript', 'constructor');
    expect(code).toContain('func _init');
  });

  test('Rust role=constructor does not replace or duplicate honest fn new', () => {
    const code = emitRoleMethod('rust', 'constructor');
    const newCount = code.split('fn new').length - 1;
    expect(newCount).toBe(1);
    expect(code).toContain('pub fn new(');
    expect(code).not.toContain('fn Parent(');
    expect(code).not.toContain('(x) Implement Parent');
  });

  test('Go role=constructor does not invent a NewParent factory', () => {
    const code = emitRoleMethod('go', 'constructor');
    expect(code).not.toContain('func NewParent');
    expect(code).not.toContain('func (self *Parent) Parent(');
    expect(code).not.toContain('(x) Implement Parent');
  });

  test('Verse empty constructor implement does not leak leftover (x)', () => {
    const code = emitRoleMethod('verse', 'constructor');
    expect(code).not.toContain('(x) Implement Parent');
  });
});
