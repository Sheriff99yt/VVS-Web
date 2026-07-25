import { createDefaultGraphForTab } from './src/lib/graphDefaults';
import { FunctionSymbol } from '@vvs/graph-types';

const func: FunctionSymbol = {
  id: 'func-123',
  name: 'MyFunc',
  description: '',
  parameters: [],
  returnType: 'number',
  overloads: [
    { id: 'ov-1', parameters: [], graphTabId: 'func-123' },
    { id: 'ov-2', parameters: [], graphTabId: 'func-123::ov-2' },
  ]
};

const doc = createDefaultGraphForTab('function', 'Function: MyFunc', undefined, undefined, {
  tabId: 'func-123::ov-2',
  functions: [func]
});

console.log(JSON.stringify(doc.nodes, null, 2));
