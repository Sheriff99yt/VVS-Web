import { act } from '@testing-library/react';
import useGraphStore from '../../store/useGraphStore';

describe('Connection error handling', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGraphStore.setState({
      nodes: [],
      edges: [],
      connectionError: null,
      selectedNodeId: null,
      generatedCode: ''
    });
  });

  test('should clear connection error', () => {
    // Set a connection error directly in the state
    act(() => {
      useGraphStore.setState({
        connectionError: 'Test error message'
      });
    });
    
    // Verify the error is set
    expect(useGraphStore.getState().connectionError).toBe('Test error message');
    
    // Clear the error
    act(() => {
      useGraphStore.getState().clearConnectionError();
    });
    
    // Verify the error is cleared
    expect(useGraphStore.getState().connectionError).toBeNull();
  });
}); 