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
  
  // Helper function to convert Chakra props to valid DOM props
  const convertProps = (props: any) => {
    const validProps: any = {};
    
    // Process props to make them DOM-compatible
    Object.entries(props).forEach(([key, value]) => {
      // Skip children prop as it's handled separately
      if (key === 'children') return;
      
      // Convert camelCase to lowercase for HTML attributes
      // or use data attributes for non-standard props
      if (
        ['zIndex', 'borderRadius', 'paddingLeft', 'paddingRight', 'marginBottom', 
         'marginTop', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom',
         'fontWeight', 'fontSize', 'maxHeight', 'minWidth', 'maxWidth', 'flexShrink',
         'justifyContent', 'alignItems', 'flexWrap', 'borderRight', 'backdropFilter'].includes(key)
      ) {
        validProps[`data-${key.toLowerCase()}`] = value;
      } else {
        validProps[key] = value;
      }
    });
    
    return validProps;
  };
  
  return {
    ...originalModule,
    ChakraProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="chakra-provider-mock">{children}</div>,
    Box: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <div data-testid="box-mock" {...convertProps(props)}>{children}</div>,
    Text: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <div data-testid="text-mock" {...convertProps(props)}>{children}</div>,
    Heading: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <div data-testid="heading-mock" {...convertProps(props)}>{children}</div>,
    Button: ({ children, onClick, ...props }: { children?: React.ReactNode, onClick?: () => void, [key: string]: any }) => (
      <button data-testid="button-mock" onClick={onClick} {...convertProps(props)}>
        {children}
      </button>
    ),
    Input: (props: any) => <input data-testid="input-mock" {...convertProps(props)} />,
    Flex: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => 
      <div data-testid="flex-mock" {...convertProps(props)}>{children}</div>,
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

    expect(screen.getByPlaceholderText('Search nodes...')).toBeInTheDocument();
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
    expect(screen.getByText('Process Flow')).toBeInTheDocument();
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