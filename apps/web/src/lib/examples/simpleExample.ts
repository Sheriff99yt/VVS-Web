import { ProjectSnapshot } from '@/types/projectSnapshot';
import { defaultTabMetadata } from '@/lib/graphDefaults';

/** Minimal starter — On Start wired to a single Print String node. */
export function createSimpleExampleSnapshot(): ProjectSnapshot {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: 'HelloWorld',
      extendsType: '',
      description: 'Simple example — one event and one action',
    },
    variables: [],
    events: [],
    functions: [],
    openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
    activeGraphTab: 'main',
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      main: {
        nodes: [
          {
            id: 'ex-simple-start',
            type: 'vvs_standard_node',
            position: { x: 80, y: 80 },
            data: {
              label: 'On Start',
              category: 'Events',
              inputs: [],
              outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
              inlineValues: {},
            },
          },
          {
            id: 'ex-simple-print',
            type: 'vvs_standard_node',
            position: { x: 380, y: 80 },
            data: {
              label: 'Print String',
              category: 'Action',
              inputs: [
                { id: 'exec_in', label: '', type: 'execution' },
                { id: 'in_str', label: 'In String', type: 'data_string' },
              ],
              outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
              inlineValues: { in_str: 'Hello from VVS!' },
            },
          },
        ],
        edges: [
          {
            id: 'ex-simple-edge',
            source: 'ex-simple-start',
            target: 'ex-simple-print',
            sourceHandle: 'exec_out',
            targetHandle: 'exec_in',
            type: 'vvs_standard_edge',
            data: { pinType: 'execution' },
          },
        ],
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
    },
    installedLibrary: [],
  };
}
