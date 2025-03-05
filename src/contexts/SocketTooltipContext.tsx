import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SocketDefinition } from '../sockets/types';

interface SocketTooltipContextType {
  hoveredSocket: {
    socket: SocketDefinition | null;
    position: { x: number; y: number } | null;
  };
  showTooltip: (socket: SocketDefinition, x: number, y: number) => void;
  hideTooltip: () => void;
}

const SocketTooltipContext = createContext<SocketTooltipContextType | null>(null);

export const useSocketTooltip = () => {
  const context = useContext(SocketTooltipContext);
  if (!context) {
    throw new Error('useSocketTooltip must be used within a SocketTooltipProvider');
  }
  return context;
};

interface SocketTooltipProviderProps {
  children: ReactNode;
}

export const SocketTooltipProvider: React.FC<SocketTooltipProviderProps> = ({ children }) => {
  const [hoveredSocket, setHoveredSocket] = useState<{
    socket: SocketDefinition | null;
    position: { x: number; y: number } | null;
  }>({
    socket: null,
    position: null
  });

  const showTooltip = useCallback((socket: SocketDefinition, x: number, y: number) => {
    setHoveredSocket({
      socket,
      position: { x, y }
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setHoveredSocket({
      socket: null,
      position: null
    });
  }, []);

  return (
    <SocketTooltipContext.Provider
      value={{
        hoveredSocket,
        showTooltip,
        hideTooltip
      }}
    >
      {children}
    </SocketTooltipContext.Provider>
  );
};

export default SocketTooltipContext; 