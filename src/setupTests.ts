// jest-dom adds custom jest matchers for asserting on DOM nodes
import '@testing-library/jest-dom';
import React from 'react';

// Polyfill structuredClone if it's not available
if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Create a function to filter Chakra UI props that cause warnings
const filterChakraProps = (props: Record<string, any>) => {
  const commonChakraProps = [
    'alignItems', 'justifyContent', 'textAlign', 'borderRadius', 
    'position', 'width', 'height', 'display', 'mb', 'mt', 'ml', 'mr',
    'p', 'px', 'py', 'fontSize', 'fontWeight', 'bg', 'color', 'backgroundColor',
    'borderColor', 'minWidth', 'maxWidth', 'boxShadow', 'minH', 'maxH',
    'flex', 'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis',
    'borderWidth', 'borderStyle', 'overflow', 'overflowX', 'overflowY',
    'padding', 'margin', 'as', 'gap'
  ];
  
  const filteredProps: Record<string, any> = {};
  
  Object.keys(props).forEach(key => {
    if (!commonChakraProps.includes(key)) {
      filteredProps[key] = props[key];
    }
  });
  
  return filteredProps;
};

// Mock Chakra UI components
jest.mock('@chakra-ui/react', () => {
  return {
    __esModule: true,
    Box: ({ children, ...props }: any) => React.createElement('div', filterChakraProps(props), children),
    Text: ({ children, ...props }: any) => React.createElement('span', filterChakraProps(props), children),
    Tooltip: ({ children, ...props }: any) => React.createElement('div', { ...filterChakraProps(props), 'data-testid': 'tooltip' }, children),
    useDisclosure: () => ({
      isOpen: false,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onToggle: jest.fn(),
    }),
    // Add other Chakra components as needed
    Flex: ({ children, ...props }: any) => React.createElement('div', filterChakraProps(props), children),
    VStack: ({ children, ...props }: any) => React.createElement('div', filterChakraProps(props), children),
    HStack: ({ children, ...props }: any) => React.createElement('div', filterChakraProps(props), children),
    Button: ({ children, ...props }: any) => React.createElement('button', filterChakraProps(props), children),
    Input: ({ children, ...props }: any) => React.createElement('input', filterChakraProps(props), children),
    // Alert components
    Alert: ({ children, ...props }: any) => React.createElement('div', { ...filterChakraProps(props), 'data-testid': 'alert' }, children),
    AlertIcon: () => React.createElement('div', { 'data-testid': 'alert-icon' }),
    AlertTitle: ({ children, ...props }: any) => React.createElement('div', { ...filterChakraProps(props), 'data-testid': 'alert-title' }, children),
    AlertDescription: ({ children, ...props }: any) => React.createElement('div', { ...filterChakraProps(props), 'data-testid': 'alert-description' }, children),
    CloseButton: ({ onClick, ...props }: any) => React.createElement('button', { ...filterChakraProps(props), onClick, 'data-testid': 'close-button' }),
    Heading: ({ children, ...props }: any) => React.createElement('h2', { ...filterChakraProps(props), 'data-testid': 'heading' }, children),
  };
});

// ReactFlow mock
jest.mock('reactflow', () => {
  return {
    __esModule: true,
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'flow-provider' }, children),
    useNodesState: () => [[], jest.fn()],
    useEdgesState: () => [[], jest.fn()],
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Handle: ({ type, position, id, style }: any) => 
      React.createElement('div', { 
        'data-testid': 'handle',
        'data-type': type,
        'data-position': position,
        'data-id': id,
        style,
      }),
    Position: {
      Left: 'left',
      Right: 'right',
      Top: 'top',
      Bottom: 'bottom',
    },
    // Add mock store functions
    useStoreApi: () => ({
      getState: () => ({
        nodeInternals: new Map(),
        edges: [],
        width: 1000,
        height: 800,
        transform: [0, 0, 1],
      }),
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    }),
    useStore: () => ({
      nodeInternals: new Map(),
      edges: [],
      width: 1000,
      height: 800,
      transform: [0, 0, 1],
    }),
  };
});

// Monaco Editor mock
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value }: { value: string }) => React.createElement('div', { 'data-testid': 'monaco-editor' }, value),
  };
});

// Mock matchMedia (required for some Chakra UI components)
// Properly typed to match MediaQueryList
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 