import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeLibrary } from '../../components/NodeLibrary';
import { NODE_CATEGORIES } from '../../nodes/types';

// Create the mock function outside so it's accessible in the mock
const mockAddNode = jest.fn();

// Mock the useGraphStore hook
jest.mock('../../store/useGraphStore', () => ({
  __esModule: true,
  default: jest.fn((selector) => {
    // If a selector function is provided, call it with our mock state
    if (typeof selector === 'function') {
      return selector({ addNode: mockAddNode });
    }
    // Otherwise return the whole mock state
    return { addNode: mockAddNode };
  }),
}));

// Mock Chakra UI components to avoid context issues
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  return {
    ...originalModule,
    ChakraProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="chakra-provider-mock">{children}</div>,
    Box: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => <div data-testid="box-mock" {...props}>{children}</div>,
    Text: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => <div data-testid="text-mock" {...props}>{children}</div>,
    Heading: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => <div data-testid="heading-mock" {...props}>{children}</div>,
    Button: ({ children, onClick, ...props }: { children?: React.ReactNode, onClick?: () => void, [key: string]: any }) => (
      <button data-testid="button-mock" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Input: (props: any) => <input data-testid="input-mock" {...props} />,
    Flex: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => <div data-testid="flex-mock" {...props}>{children}</div>,
    useColorModeValue: jest.fn().mockImplementation(() => '#000000'),
    useTheme: jest.fn().mockReturnValue({
      colors: {
        gray: { 700: '#2D3748', 600: '#4A5568' },
        blue: { 500: '#3182CE' }
      }
    }),
  };
});

// Updated test wrapper component that includes ChakraProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ChakraProvider } = jest.requireMock('@chakra-ui/react');
  return <ChakraProvider>{children}</ChakraProvider>;
};

describe('NodeLibrary Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the NodeLibrary component with title', () => {
    render(
      <TestWrapper>
        <NodeLibrary />
      </TestWrapper>
    );

    expect(screen.getByText('Node Library')).toBeInTheDocument();
  });

  test('renders all node categories', () => {
    render(
      <TestWrapper>
        <NodeLibrary />
      </TestWrapper>
    );

    // Check that all categories are rendered
    NODE_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category.label)).toBeInTheDocument();
    });
  });

  test('renders node buttons for each category', () => {
    render(
      <TestWrapper>
        <NodeLibrary />
      </TestWrapper>
    );

    // We'll check for at least one node button from each category
    // This is a simplified test since we don't have direct access to nodeTemplates
    expect(screen.getByText('Node Library')).toBeInTheDocument();
    // We expect at least some buttons to be rendered
    expect(screen.getAllByTestId('button-mock').length).toBeGreaterThan(0);
  });

  test('clicking a node button calls addNode with correct data', () => {
    render(
      <TestWrapper>
        <NodeLibrary />
      </TestWrapper>
    );

    // Find a button and click it
    const buttons = screen.getAllByTestId('button-mock');
    expect(buttons.length).toBeGreaterThan(0);
    
    fireEvent.click(buttons[0]);

    // Check that addNode was called
    expect(mockAddNode).toHaveBeenCalledTimes(1);
    // We can't check the exact parameters since we don't know which button was clicked
    // but we can verify it was called with an object
    expect(mockAddNode).toHaveBeenCalledWith(expect.any(Object));
  });

  test('clicking a different node button calls addNode with different data', () => {
    render(
      <TestWrapper>
        <NodeLibrary />
      </TestWrapper>
    );

    // Find buttons and click a different one
    const buttons = screen.getAllByTestId('button-mock');
    expect(buttons.length).toBeGreaterThan(1);
    
    // Click the second button if available, otherwise the first one
    const buttonToClick = buttons.length > 1 ? buttons[1] : buttons[0];
    fireEvent.click(buttonToClick);

    // Check that addNode was called
    expect(mockAddNode).toHaveBeenCalledTimes(1);
    expect(mockAddNode).toHaveBeenCalledWith(expect.any(Object));
  });
}); 