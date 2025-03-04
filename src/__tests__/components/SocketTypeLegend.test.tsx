import { render, screen } from '@testing-library/react';
import SocketTypeLegend from '../../components/SocketTypeLegend';

// The useToken hook is already mocked in setupTests.ts

describe('SocketTypeLegend Component', () => {
  test('renders the socket type legend with all socket types', () => {
    render(<SocketTypeLegend />);
    
    // Check if the legend title is rendered
    expect(screen.getByText('Socket Type Legend')).toBeInTheDocument();
    
    // Check if all socket types are rendered
    expect(screen.getByText('Boolean')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('String')).toBeInTheDocument();
    expect(screen.getByText('Flow')).toBeInTheDocument();
    expect(screen.getByText('Any')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    // Check if descriptions are rendered
    expect(screen.getByText('True/False values')).toBeInTheDocument();
    expect(screen.getByText('Numeric values')).toBeInTheDocument();
    expect(screen.getByText('Text values')).toBeInTheDocument();
    expect(screen.getByText('Execution flow')).toBeInTheDocument();
    expect(screen.getByText('Compatible with any type')).toBeInTheDocument();
    expect(screen.getByText('Incompatible connection')).toBeInTheDocument();
  });
}); 