import * as React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, useToken, Input, Text } from '@chakra-ui/react';
import { SocketDefinition, SocketDirection, SocketType } from './types';
import { useSocketTooltip } from '../contexts/SocketTooltipContext';

/**
 * Socket component props
 * @param {SocketDefinition} socket - The socket definition
 * @param {Position} position - The position of the socket (left or right)
 * @param {boolean} isValidConnection - Whether this socket can be connected (for highlighting)
 * @param {boolean} isInvalidConnection - Whether this socket has an invalid connection attempt
 * @param {boolean} isConnected - Whether this socket is connected to another socket
 * @param {Function} onValueChange - Callback when the input widget value changes
 */
interface SocketProps {
  socket: SocketDefinition;
  position: Position;
  isValidConnection?: boolean;
  isInvalidConnection?: boolean;
  isConnected?: boolean;
  onValueChange?: (socketId: string, value: any) => void;
}

/**
 * Socket component for node inputs/outputs
 * Provides visual distinction between socket types with color coding
 * Ultra-compact design for input widgets
 * Uses global tooltip system for improved performance
 */
export const Socket: React.FC<SocketProps> = ({
  socket,
  position,
  isValidConnection = false,
  isInvalidConnection = false,
  isConnected = false,
  onValueChange
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [value, setValue] = React.useState<any>(socket.defaultValue);
  const socketRef = React.useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip } = useSocketTooltip();

  // Handle value change
  const handleValueChange = (newValue: any) => {
    setValue(newValue);
    if (onValueChange) {
      onValueChange(socket.id, newValue);
    }
  };

  // Get all socket colors from theme using the global mock
  const [
    booleanColor,
    booleanHoverColor,
    numberColor,
    numberHoverColor,
    stringColor,
    stringHoverColor,
    flowColor,
    flowHoverColor,
    anyColor,
    anyHoverColor,
    errorColor,
    errorHoverColor,
    compatibleColor,
    // Input widget colors
    inputBg,
    inputBgHover,
    inputBorder,
    inputBorderHover,
    inputText,
    inputPlaceholder,
    inputLabel
  ] = useToken('colors', [
    'socket.boolean',
    'socket.booleanHover',
    'socket.number',
    'socket.numberHover',
    'socket.string',
    'socket.stringHover',
    'socket.flow',
    'socket.flowHover',
    'socket.any',
    'socket.anyHover',
    'socket.error',
    'socket.errorHover',
    'socket.compatible',
    // Input widget colors
    'input.bg',
    'input.bgHover',
    'input.border',
    'input.borderHover',
    'input.text',
    'input.placeholder',
    'input.label'
  ]);

  // Maps socket types to their color from theme
  const getSocketColor = (type: SocketType, hovered: boolean): string => {
    if (isInvalidConnection) {
      return hovered ? errorHoverColor : errorColor;
    }

    if (isValidConnection) {
      return compatibleColor;
    }

    switch (type) {
      case SocketType.BOOLEAN:
        return hovered ? booleanHoverColor : booleanColor;
      case SocketType.NUMBER:
        return hovered ? numberHoverColor : numberColor;
      case SocketType.STRING:
        return hovered ? stringHoverColor : stringColor;
      case SocketType.FLOW:
        return hovered ? flowHoverColor : flowColor;
      case SocketType.ANY:
      default:
        return hovered ? anyHoverColor : anyColor;
    }
  };

  // Determine if this is an input or output socket
  const isConnectable = true;
  const isInput = socket.direction === SocketDirection.INPUT;
  // Using isInput to determine the handle type
  const handleType = isInput ? 'target' : 'source';

  // Get the socket color
  const socketColor = getSocketColor(socket.type, isHovered);

  // Calculate the glow effect for hover and valid/invalid connections
  let glowColor = 'transparent';
  let glowSize = '0px';

  if (isValidConnection) {
    glowColor = compatibleColor;
    glowSize = '5px';
  } else if (isInvalidConnection) {
    glowColor = errorColor;
    glowSize = '5px';
  } else if (isHovered) {
    glowColor = socketColor;
    glowSize = '4px';
  }

  // Handle hover events for tooltip
  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
    
    if (socketRef.current) {
      const rect = socketRef.current.getBoundingClientRect();
      const x = position === Position.Left ? 
        rect.left : 
        rect.right;
      const y = rect.top;
      
      showTooltip(socket, x, y);
    }
  }, [socket, position, showTooltip]);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    hideTooltip();
  }, [hideTooltip]);

  // Render input widget based on socket type and configuration
  const renderInputWidget = () => {
    // Only render for input sockets that aren't connected and have inputWidget config
    if (!isInput || isConnected || !socket.inputWidget || !socket.inputWidget.enabled) {
      return null;
    }

    // Get widget config
    const config = socket.inputWidget;

    switch (socket.type) {
      case SocketType.BOOLEAN:
        return (
          <input 
            type="checkbox" 
            checked={value === true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.checked)}
            className="socket-checkbox"
            style={{ 
              accentColor: booleanColor
            }}
          />
        );
      case SocketType.NUMBER:
        return (
          <Input
            type="number"
            size="xs"
            value={value !== undefined ? value : 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              let val: number;
              
              if (config.isInteger) {
                val = parseInt(e.target.value, 10) || 0;
              } else {
                val = parseFloat(e.target.value) || 0;
              }
              
              // Apply min/max constraints if defined
              if (config.min !== undefined && val < config.min) val = config.min;
              if (config.max !== undefined && val > config.max) val = config.max;
              
              handleValueChange(val);
            }}
            className="socket-input"
            height="var(--socket-input-height)"
            fontSize="var(--socket-input-font-size)"
            padding="var(--socket-input-padding)"
            width="var(--socket-input-width)"
            borderRadius="2px"
            fontFamily="monospace"
            textAlign="right"
            min={config.min}
            max={config.max}
            step={config.step || (config.isInteger ? 1 : 0.1)}
          />
        );
      case SocketType.STRING:
        return (
          <Input
            type="text"
            size="xs"
            value={value !== undefined ? value : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
            className="socket-input"
            height="var(--socket-input-height)"
            fontSize="var(--socket-input-font-size)"
            padding="var(--socket-input-padding)"
            width="var(--socket-input-width)"
            borderRadius="2px"
            fontFamily="monospace"
            placeholder={config.placeholder || ''}
          />
        );
      case SocketType.ANY:
        return (
          <Input
            size="xs"
            value={value !== undefined ? String(value) : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
            className="socket-input"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      className={`socket-container socket-container-${position === Position.Left ? 'left' : 'right'}`}
    >
      <Box
        title={`${socket.name} (${socket.type})`}
        data-testid="socket-wrapper"
        className="socket-wrapper"
      >
        <Box
          className="socket-handle-container"
          ref={socketRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Handle
            type={handleType}
            position={position}
            id={socket.id}
            isConnectable={isConnectable}
            className={`${socket.type === SocketType.FLOW ? 'flow-socket execution-edge' : ''} ${
              handleType === 'source' ? 'source' : 'target'
            } ${isHovered ? 'hovered' : ''} ${
              isInvalidConnection ? 'error' : ''
            } ${isValidConnection ? 'compatible' : ''}`}
            style={socket.type !== SocketType.FLOW ? {
              width: 'var(--socket-handle-size)',
              height: 'var(--socket-handle-size)',
              background: socketColor,
              border: 'var(--socket-handle-border)',
              boxShadow: `0 0 ${glowSize} ${glowColor}`,
              transition: 'var(--socket-handle-transition)',
              borderRadius: 'var(--socket-handle-border-radius)',
              zIndex: 2,
            } : {
              zIndex: 2,
              '--flow-socket-color': flowColor,
              '--flow-socket-hover-color': flowHoverColor,
              '--socket-error-color': errorColor,
              '--socket-compatible-color': compatibleColor,
            } as any}
          />
        </Box>
        
        {/* Input widget for unconnected input sockets */}
        {renderInputWidget()}
      </Box>
    </Box>
  );
};

// Change to default export
export default Socket;
