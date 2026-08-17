import { test, expect } from 'bun:test';
import { CodeSink } from '../codeSink';
import { appendCppOutOfLineFunction, appendIrMembersInOrder } from './members';
import type { IrModule, IrMemberDecl } from '../ir/types';
import type { FunctionSymbol, ProjectEnvironmentManifest, VariableSymbol } from '@vvs/graph-types';
import { packCatalog } from '@vvs/syntax-registry';

test('appendIrMembers > emits multiple overloads for a single FunctionDecl', () => {
  const func: FunctionSymbol = {
    id: 'func_1',
    name: 'MyFunction',
    visibility: 'public',
    category: '',
    description: '',
    returnType: 'void',
    overloads: [
      { id: 'ovr_1', parameters: [{ id: 'p1', label: 'param1', type: 'data_number' }], graphTabId: 'tab1' },
      { id: 'ovr_2', parameters: [{ id: 'p2', label: 'param1', type: 'data_string' }], graphTabId: 'tab2' },
    ],
  };

  const decl: IrMemberDecl = {
    kind: 'FunctionDecl',
    sourceGraphNodeId: 'node_1',
    declareSourceGraphNodeId: 'node_1',
    implementSourceGraphNodeId: 'node_1',
    emitBody: true,
    symbol: func,
    overloads: [
      { id: 'ovr_1', tabId: 'tab1' },
      { id: 'ovr_2', tabId: 'tab2' },
    ],
    properties: {},
  };

  const ir: IrModule = {
    targetLanguage: 'csharp',
    emitUnsupportedComments: true,
    modules: [],
    members: [decl],
    functions: [func],
    variables: [],
    functionBodies: {
      'tab1': [
        {
          kind: 'IrVoidReturn',
          sourceGraphNodeId: 'return_1',
        }
      ],
      'tab2': [
        {
          kind: 'IrVoidReturn',
          sourceGraphNodeId: 'return_2',
        }
      ]
    },
    eventBodies: {},
    environmentManifest: {
      packages: {},
      packLock: {
        'vvs.core': '1.0.0',
        'vvs.lang.csharp': '1.0.0'
      }
    } as ProjectEnvironmentManifest,
  };

  const sink = new CodeSink('test.cs');
  appendIrMembersInOrder(sink, ir, { cppVisibility: 'public' }, {});

  const code = sink.content;
  expect(code).toContain('public void MyFunction(float param1)');
  expect(code).toContain('public void MyFunction(string param1)');
});

test('appendIrMembers > Verse class-typed field default is Type{} not logic false (CL-016)', () => {
  const variable: VariableSymbol = {
    kind: 'variable',
    id: 'var-host',
    name: 'Host',
    type: 'data_object',
    typeRef: { kind: 'class', classId: 'main-class', name: 'Machine' },
    binding: 'instance',
    visibility: 'public',
    defaultValue: null,
  };

  const decl: IrMemberDecl = {
    kind: 'VariableDecl',
    sourceGraphNodeId: 'node-host',
    symbol: variable,
    properties: { visibility: 'public' },
  };

  const ir: IrModule = {
    targetLanguage: 'verse',
    emitUnsupportedComments: true,
    modules: [],
    members: [decl],
    functions: [],
    variables: [variable],
    functionBodies: {},
    eventBodies: {},
    environmentManifest: {
      packages: {},
      packLock: {
        'vvs.core': '1.0.0',
        'vvs.lang.verse': '1.0.0',
      },
    } as ProjectEnvironmentManifest,
  };

  const sink = new CodeSink('test.verse');
  appendIrMembersInOrder(sink, ir, { cppVisibility: 'public' }, {});

  const code = sink.content;
  expect(code).toContain('var Host<public> : Machine = Machine{}');
  expect(code).not.toContain('Host<public> : Machine = false');
  expect(code).not.toContain('new Machine');
  expect(code).not.toContain('Machine()');
});


test('C++ two-overload Declare prototypes + out-of-line Define bodies', () => {
  const func: FunctionSymbol = {
    id: 'func_ping',
    name: 'Ping',
    visibility: 'public',
    category: '',
    description: '',
    returnType: 'void',
    overloads: [
      { id: 'ovr_a', parameters: [{ id: 'alpha', label: 'alpha', type: 'data_string' }], graphTabId: 'tab_a' },
      {
        id: 'ovr_b',
        parameters: [
          { id: 'beta', label: 'beta', type: 'data_string' },
          { id: 'count', label: 'count', type: 'data_number' },
        ],
        graphTabId: 'tab_b',
      },
    ],
  };

  const declareMember: IrMemberDecl = {
    kind: 'FunctionDecl',
    sourceGraphNodeId: 'decl_1',
    declareSourceGraphNodeId: 'decl_1',
    emitBody: false,
    symbol: func,
    overloads: [
      { id: 'ovr_a', tabId: 'tab_a' },
      { id: 'ovr_b', tabId: 'tab_b' },
    ],
    properties: {},
  };

  const defineMember: Extract<IrMemberDecl, { kind: 'FunctionDecl' }> = {
    kind: 'FunctionDecl',
    sourceGraphNodeId: 'impl_1',
    implementSourceGraphNodeId: 'impl_1',
    emitBody: true,
    symbol: func,
    overloads: [
      { id: 'ovr_a', tabId: 'tab_a' },
      { id: 'ovr_b', tabId: 'tab_b' },
    ],
    properties: {},
  };

  const ir: IrModule = {
    targetLanguage: 'cpp',
    emitUnsupportedComments: true,
    modules: [],
    members: [declareMember],
    functions: [func],
    variables: [],
    functionBodies: {
      tab_a: [
        {
          kind: 'Print',
          sourceGraphNodeId: 'print_a',
          value: { kind: 'Literal', sourceGraphNodeId: 'print_a', value: 'bodyA', literalType: 'string' },
        },
      ],
      tab_b: [
        {
          kind: 'Print',
          sourceGraphNodeId: 'print_b',
          value: { kind: 'Literal', sourceGraphNodeId: 'print_b', value: 'bodyB', literalType: 'string' },
        },
      ],
    },
    eventBodies: {},
    environmentManifest: {
      packages: {},
      packLock: {
        'vvs.core': '1.0.0',
        'vvs.lang.cpp': '1.0.0',
      },
    } as ProjectEnvironmentManifest,
  };

  const protoSink = new CodeSink('test.h');
  appendIrMembersInOrder(protoSink, ir, { cppVisibility: 'public' }, {});
  const prototypes = protoSink.content;
  expect(prototypes).toContain('Ping(');
  expect(prototypes).toContain('alpha');
  expect(prototypes).toContain('beta');
  expect(prototypes).toContain('count');

  const bodySink = new CodeSink('test.cpp');
  appendCppOutOfLineFunction(bodySink, { ...ir, members: [defineMember] }, defineMember, 'Machine');
  const bodies = bodySink.content;
  expect(bodies).toContain('void Machine::Ping(');
  expect(bodies).toContain('alpha');
  expect(bodies).toContain('beta');
  expect(bodies).toContain('count');
  expect(bodies).toContain('bodyA');
  expect(bodies).toContain('bodyB');
  const first = bodies.indexOf('Machine::Ping');
  const second = bodies.indexOf('Machine::Ping', first + 1);
  expect(second).toBeGreaterThan(first);
});

test('Python extra overload is (x) Implement — no invented overload syntax', () => {
  const func: FunctionSymbol = {
    id: 'func_ping',
    name: 'Ping',
    visibility: 'public',
    category: '',
    description: '',
    returnType: 'void',
    overloads: [
      { id: 'ovr_a', parameters: [{ id: 'alpha', label: 'alpha', type: 'data_string' }], graphTabId: 'tab_a' },
      { id: 'ovr_b', parameters: [{ id: 'beta', label: 'beta', type: 'data_string' }], graphTabId: 'tab_b' },
    ],
  };

  const decl: IrMemberDecl = {
    kind: 'FunctionDecl',
    sourceGraphNodeId: 'impl_1',
    implementSourceGraphNodeId: 'impl_1',
    emitBody: true,
    symbol: func,
    overloads: [
      { id: 'ovr_a', tabId: 'tab_a' },
      { id: 'ovr_b', tabId: 'tab_b' },
    ],
    properties: {},
  };

  const ir: IrModule = {
    targetLanguage: 'python',
    emitUnsupportedComments: true,
    modules: [],
    members: [decl],
    functions: [func],
    variables: [],
    functionBodies: { tab_a: [], tab_b: [] },
    eventBodies: {},
    environmentManifest: {
      packages: {},
      packLock: {
        'vvs.core': '1.0.0',
        'vvs.lang.python': '1.0.0',
      },
    } as ProjectEnvironmentManifest,
  };

  const sink = new CodeSink('test.py');
  appendIrMembersInOrder(sink, ir, { cppVisibility: 'public' }, {});
  const code = sink.content;
  expect(code).toContain('def Ping');
  expect(code).toContain('(x) Implement Ping');
  expect(code).not.toContain('@overload');
  expect(code.match(/def Ping/g)?.length).toBe(1);
});
