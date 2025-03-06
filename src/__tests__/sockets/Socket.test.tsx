import { render, screen } from '@testing-library/react';
import { Socket } from '../../sockets/Socket';
import { Position } from 'reactflow';
import { SocketType, SocketDirection, createSocketDefinition } from '../../sockets/types';
import React from 'react';
import { SocketTooltipProvider } from '../../contexts/SocketTooltipContext';

// Create a wrapper that will catch and handle the Chakra UI props
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SocketTooltipProvider>
      <div data-testid="socket-container">{children}</div>
    </SocketTooltipProvider>
  );
};

describe('Socket Component', () => {
  const inputSocket = createSocketDefinition(
    'input-id',
    'Input Socket',
    SocketType.NUMBER,
    SocketDirection.INPUT
  );

  const outputSocket = createSocketDefinition(
    'output-id',
    'Output Socket',
    SocketType.STRING,
    SocketDirection.OUTPUT
  );

  test('renders input socket correctly', () => {
    render(
      <TestWrapper>
        <Socket socket={inputSocket} position={Position.Left} />
      </TestWrapper>
    );
    
    // Check if the socket wrapper is rendered with the correct title
    const socketWrapper = screen.getByTestId('socket-wrapper');
    expect(socketWrapper).toBeInTheDocument();
    expect(socketWrapper).toHaveAttribute('title', 'Input Socket (number)');
  });

  test('renders output socket correctly', () => {
    render(
      <TestWrapper>
        <Socket socket={outputSocket} position={Position.Right} />
      </TestWrapper>
    );
    
    // Check if the socket wrapper is rendered with the correct title
    const socketWrapper = screen.getByTestId('socket-wrapper');
    expect(socketWrapper).toBeInTheDocument();
    expect(socketWrapper).toHaveAttribute('title', 'Output Socket (string)');
  });

  test('positions socket based on the position prop', () => {
    const { rerender } = render(
      <TestWrapper>
        <Socket socket={inputSocket} position={Position.Left} />
      </TestWrapper>
    );
    
    // Check if the socket container has the correct class for left position
    expect(document.querySelector('.socket-container-left')).toBeInTheDocument();
    
    // Rerender with right position
    rerender(
      <TestWrapper>
        <Socket socket={inputSocket} position={Position.Right} />
      </TestWrapper>
    );
    
    // Check if the socket container has the correct class for right position
    expect(document.querySelector('.socket-container-right')).toBeInTheDocument();
  });
}); 