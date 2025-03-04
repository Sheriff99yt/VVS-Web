import * as React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, useToken, Input, Text } from '@chakra-ui/react';
import { SocketDefinition, SocketDirection, SocketType } from './types';

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
            style={{ accentColor: booleanColor }}
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
                val = parseInt(e.target.value, 10);
              } else {
                val = parseFloat(e.target.value);
              }
              
              // Apply min/max constraints if specified
              if (!isNaN(val)) {
                if (config.min !== undefined && val < config.min) val = config.min;
                if (config.max !== undefined && val > config.max) val = config.max;
              } else {
                val = 0;
              }
              
              handleValueChange(val);
            }}
            className="socket-input"
            textAlign="right"
            paddingRight="8px"
            step={config.step || (config.isInteger ? 1 : 0.1)}
            min={config.min}
            max={config.max}
          />
        );
      case SocketType.STRING:
        return (
          <Input
            size="xs"
            value={value !== undefined ? value : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
            className="socket-input"
            maxLength={config.maxLength}
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
      position="relative"
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent={position === Position.Left ? 'flex-start' : 'flex-end'}
      mb="0.8em"
      minHeight="14px"
    >
      <Box
        title={`${socket.name} (${socket.type})`}
        data-testid="socket-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        display="flex"
        alignItems="center"
        opacity={isHovered ? 1 : 0.85}
        transition="opacity 0.2s ease"
        position="relative"
      >
        {/* Invisible larger hit area for better selection */}
        <Box
          position="absolute"
          width="24px"
          height="24px"
          left={position === Position.Left ? "-12px" : undefined}
          right={position === Position.Right ? "-12px" : undefined}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          borderRadius="50%"
        />
        
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
            width: '14px',
            height: '14px',
            background: socketColor,
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: `0 0 ${glowSize} ${glowColor}`,
            transition: 'all 0.2s ease-in-out',
            borderRadius: '50%',
            zIndex: 2,
          } : {
            zIndex: 2,
            '--flow-socket-color': flowColor,
            '--flow-socket-hover-color': flowHoverColor,
            '--socket-error-color': errorColor,
            '--socket-compatible-color': compatibleColor,
          } as any}
        />
        <Box
          as="span"
          className={`socket-label ${position === Position.Left ? 'left' : 'right'} ${isHovered ? 'hovered' : ''}`}
          color={isInvalidConnection ? errorColor :
                 isValidConnection ? compatibleColor :
                 undefined}
        >
          {socket.name}
        </Box>
        
        {/* Input widget for unconnected input sockets */}
        {renderInputWidget()}
      </Box>
    </Box>
  );
};

// Change to default export
export default Socket;
