import { LibraryCategory } from '@/types/ui';

export const MOCK_CATEGORIES: LibraryCategory[] = [
  {
    name: 'Events',
    items: [
      { 
        type: 'event_on_start', 
        label: 'On Start', 
        category: 'Events',
        inputs: [],
        outputs: [{ id: 'out_exec', label: '', type: 'execution' }]
      },
      { 
        type: 'event_on_update', 
        label: 'On Update', 
        category: 'Events',
        inputs: [],
        outputs: [
          { id: 'out_exec', label: '', type: 'execution' },
          { id: 'out_delta', label: 'Delta time', type: 'data_number' }
        ]
      },
      { 
        type: 'event_custom', 
        label: 'Custom event', 
        category: 'Events',
        inputs: [],
        outputs: [{ id: 'out_exec', label: '', type: 'execution' }]
      }
    ]
  },
  {
    name: 'Flow Control',
    items: [
      { 
        type: 'flow_branch', 
        label: 'Branch', 
        category: 'Flow Control',
        inputs: [
          { id: 'in_exec', label: '', type: 'execution' },
          { id: 'condition', label: 'Condition', type: 'data_boolean' }
        ],
        outputs: [
          { id: 'true_exec', label: 'True', type: 'execution' },
          { id: 'false_exec', label: 'False', type: 'execution' }
        ]
      }
    ]
  },
  {
    name: 'Action',
    items: [
      { 
        type: 'action_print', 
        label: 'Print String', 
        category: 'Action',
        inputs: [
          { id: 'in_exec', label: '', type: 'execution' },
          { id: 'in_msg', label: 'Message', type: 'data_string' },
          { id: 'in_duration', label: 'Duration', type: 'data_number' },
          { id: 'in_print_screen', label: 'Print to Screen', type: 'data_boolean' }
        ],
        outputs: [{ id: 'out_exec', label: '', type: 'execution' }]
      }
    ]
  },
  {
    name: 'Math',
    items: [
      { 
        type: 'math_add', 
        label: 'Math Add', 
        category: 'Math',
        inputs: [
          { id: 'in_a', label: 'A', type: 'data_number' },
          { id: 'in_b', label: 'B', type: 'data_number' }
        ],
        outputs: [{ id: 'out_result', label: '', type: 'data_number' }]
      },
      { 
        type: 'math_subtract', 
        label: 'Math Subtract', 
        category: 'Math',
        inputs: [
          { id: 'in_a', label: 'A', type: 'data_number' },
          { id: 'in_b', label: 'B', type: 'data_number' }
        ],
        outputs: [{ id: 'out_result', label: '', type: 'data_number' }]
      }
    ]
  },
  {
    name: 'Variables',
    items: [
      { 
        type: 'variable_get', 
        label: 'Get Variable', 
        category: 'Variables',
        inputs: [],
        outputs: [{ id: 'val', label: 'Value', type: 'data_any' }]
      },
      { 
        type: 'variable_set', 
        label: 'Set Variable', 
        category: 'Variables',
        inputs: [
          { id: 'in_exec', label: '', type: 'execution' },
          { id: 'val', label: 'New Value', type: 'data_any' }
        ],
        outputs: [{ id: 'out_exec', label: '', type: 'execution' }]
      }
    ]
  }
];
