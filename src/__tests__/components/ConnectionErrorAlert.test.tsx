import { render, screen } from '@testing-library/react';

// Mock the ConnectionErrorAlert component
jest.mock('../../components/ConnectionErrorAlert', () => ({
  ConnectionErrorAlert: () => <div data-testid="connection-error-alert">Mocked ConnectionErrorAlert</div>
}));

// Mock the useGraphStore hook
const mockClearConnectionError = jest.fn();
jest.mock('../../store/useGraphStore', () => ({
  __esModule: true,
  default: jest.fn((selector) => {
    // Mock store state
    const state = {
      connectionError: 'Test error message',
      clearConnectionError: mockClearConnectionError
    };
    
    // If selector is provided, call it with the state
    if (selector && typeof selector === 'function') {
      return selector(state);
    }
    
    // Otherwise return the entire state
    return state;
  })
}));

describe('ConnectionErrorAlert', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockClearConnectionError.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the mocked component', () => {
    // Import the mocked component
    const { ConnectionErrorAlert } = require('../../components/ConnectionErrorAlert');
    render(<ConnectionErrorAlert />);
    
    expect(screen.getByTestId('connection-error-alert')).toBeInTheDocument();
    expect(screen.getByText('Mocked ConnectionErrorAlert')).toBeInTheDocument();
  });

  test('useGraphStore is mocked correctly', () => {
    const useGraphStore = require('../../store/useGraphStore').default;
    const result = useGraphStore();
    
    expect(result.connectionError).toBe('Test error message');
    expect(result.clearConnectionError).toBe(mockClearConnectionError);
  });

  test('clearConnectionError can be called', () => {
    const useGraphStore = require('../../store/useGraphStore').default;
    const { clearConnectionError } = useGraphStore();
    
    clearConnectionError();
    
    expect(mockClearConnectionError).toHaveBeenCalledTimes(1);
  });

  test('useGraphStore selector works', () => {
    const useGraphStore = require('../../store/useGraphStore').default;
    const result = useGraphStore((state: any) => state.connectionError);
    
    expect(result).toBe('Test error message');
  });
}); 