import { test, expect } from 'bun:test';
import { CodeSink } from '../codeSink';
import { appendIrMembersInOrder } from './members';
import type { IrModule, IrMemberDecl } from '../ir/types';
import type { FunctionSymbol, ProjectEnvironmentManifest } from '@vvs/graph-types';
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
