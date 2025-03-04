// jest-dom adds custom jest matchers for asserting on DOM nodes
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React, { ReactNode } from 'react';

// Polyfill structuredClone if it's not available
if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Helper function to filter out Chakra UI props that might cause warnings in tests
export function filterChakraProps(props: Record<string, unknown>) {
  const chakraProps = [
    'colorScheme',
    'size',
    'variant',
    'isDisabled',
    'isLoading',
    'isActive',
    'isInvalid',
    'isFocused',
    'isReadOnly',
    'isRequired',
    'isFullWidth',
  ];
  
  const filteredProps = { ...props };
  chakraProps.forEach(prop => {
    if (prop in filteredProps) {
      delete filteredProps[prop];
    }
  });
  
  return filteredProps;
}

// Mock Chakra UI components
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  
  return {
    __esModule: true,
    ...originalModule,
    // Mock useToken hook
    useToken: jest.fn().mockImplementation((_scale, tokens) => {
      // Return an array of mock color values based on the token names
      if (Array.isArray(tokens)) {
        return tokens.map(token => {
          if (token.includes('boolean')) return '#FF5733';
          if (token.includes('number')) return '#33FF57';
          if (token.includes('string')) return '#3357FF';
          if (token.includes('flow')) return '#FF33F6';
          if (token.includes('any')) return '#F6FF33';
          if (token.includes('error')) return '#FF0000';
          return '#CCCCCC'; // Default color
        });
      }
      return ['#CCCCCC']; // Default for single token
    }),
    // Mock ChakraProvider
    ChakraProvider: ({ children }: { children: ReactNode }) => children,
    // Mock other Chakra components
    Box: ({ children, ...props }: any) => React.createElement('div', filterChakraProps(props), children),
    Text: ({ children, ...props }: any) => React.createElement('span', filterChakraProps(props), children),
    Tooltip: ({ children, ...props }: any) => React.createElement('div', { ...filterChakraProps(props), 'data-testid': 'tooltip' }, children),
    useDisclosure: () => ({
      isOpen: false,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onToggle: jest.fn(),
    }),
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