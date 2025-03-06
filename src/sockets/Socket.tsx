import * as React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, useToken, Input, Textarea } from '@chakra-ui/react';
import { SocketDefinition, SocketDirection, SocketType, WidgetType } from './types';
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
  // Use a helper function to get a display value that never shows "undefined"
  const getInitialValue = (val: any) => {
    if (val === "undefined" || val === undefined) {
      // Return appropriate default based on socket type
      switch (socket.type) {
        case SocketType.NUMBER: return 0;
        case SocketType.STRING: return '';
        case SocketType.BOOLEAN: return false;
        default: return '';
      }
    }
    return val;
  };
  
  const [value, setValue] = React.useState<any>(getInitialValue(socket.defaultValue));
  const socketRef = React.useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip } = useSocketTooltip();

  // Sync local state with socket.defaultValue when it changes
  React.useEffect(() => {
    setValue(getInitialValue(socket.defaultValue));
  }, [socket.defaultValue]);

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
  const renderInputWidget = (): React.ReactNode => {
    // Only render for input sockets that aren't connected and have inputWidget config
    if (!isInput || isConnected || !socket.inputWidget || !socket.inputWidget.enabled) {
      return null;
    }

    // Get widget config
    const config = socket.inputWidget;
    const widgetType = config.widgetType || WidgetType.DEFAULT;
    
    // Helper function to determine if we should use default widget for a type
    const isDefaultWidgetForType = (socketType: SocketType): boolean => {
      return widgetType === WidgetType.DEFAULT && socket.type === socketType;
    };
    
    // Determine which widget to render based on widget type and socket type
    if (widgetType === WidgetType.CHECKBOX || isDefaultWidgetForType(SocketType.BOOLEAN)) {
      return (
        <input 
          type="checkbox" 
          checked={value === true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.checked)}
          className="socket-checkbox"
          style={{ 
            accentColor: booleanColor
          }}
          title={config.label || socket.name}
        />
      );
    }
    
    if (widgetType === WidgetType.SLIDER && socket.type === SocketType.NUMBER) {
      // Use a simple range input instead of Chakra UI's Slider
      return (
        <Box className="socket-slider-container" display="flex" alignItems="center">
          <input
            type="range"
            min={config.min !== undefined ? config.min : 0}
            max={config.max !== undefined ? config.max : 100}
            step={config.step || 1}
            value={value === "undefined" ? 0 : (Number(value) || 0)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleValueChange(parseFloat(e.target.value))}
            className="socket-slider"
            style={{
              width: "var(--socket-input-width)",
              marginLeft: "var(--socket-input-margin)",
              accentColor: numberColor
            }}
          />
          <Input
            type="number"
            size="xs"
            value={value === "undefined" ? 0 : (value !== undefined ? value : 0)}
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
            className="socket-input socket-slider-value"
            width="40px"
            height="var(--socket-input-height)"
            fontSize="var(--socket-input-font-size)"
            padding="var(--socket-input-padding)"
            borderRadius="2px"
            fontFamily="monospace"
            textAlign="right"
            min={config.min}
            max={config.max}
            step={config.step || (config.isInteger ? 1 : 0.1)}
          />
        </Box>
      );
    }
    
    if (widgetType === WidgetType.DROPDOWN && config.options && config.options.length > 0) {
      // Use a regular HTML select instead of Chakra UI's Select
      const displayValue = value === "undefined" ? (config.options[0]?.value || '') : (value !== undefined ? String(value) : '');
      return (
        <select
          value={displayValue}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleValueChange(e.target.value)}
          className="socket-input socket-select"
          style={{
            height: "var(--socket-input-height)",
            fontSize: "var(--socket-input-font-size)",
            width: "var(--socket-input-width)",
            marginLeft: "var(--socket-input-margin)",
            borderRadius: "2px",
            fontFamily: "monospace"
          }}
        >
          {config.options.map((option, index) => (
            <option key={index} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    
    if (widgetType === WidgetType.TEXTAREA) {
      return (
        <Textarea
          value={value === "undefined" ? '' : (value !== undefined ? String(value) : '')}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange(e.target.value)}
          className="socket-input socket-textarea"
          height={config.rows ? `${config.rows * 20}px` : "60px"}
          fontSize="var(--socket-input-font-size)"
          padding="var(--socket-input-padding)"
          width="var(--socket-input-width)"
          marginLeft="var(--socket-input-margin)"
          borderRadius="2px"
          fontFamily="monospace"
          placeholder={config.placeholder || ''}
          resize="vertical"
          size="xs"
        />
      );
    }
    
    if (widgetType === WidgetType.COLOR_PICKER) {
      const displayColor = value === "undefined" ? (config.defaultColor || '#000000') : (value || config.defaultColor || '#000000');
      return (
        <Box display="flex" alignItems="center">
          <Box 
            className="socket-color-preview"
            width="15px"
            height="15px"
            borderRadius="3px"
            backgroundColor={displayColor}
            marginLeft="var(--socket-input-margin)"
            marginRight="4px"
            border="1px solid var(--border-color)"
          />
          <Input
            type="color"
            value={displayColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
            className="socket-input socket-color"
            height="var(--socket-input-height)"
            width="var(--socket-input-width)"
            padding="0"
            cursor="pointer"
          />
        </Box>
      );
    }
    
    if (widgetType === WidgetType.NUMBER || isDefaultWidgetForType(SocketType.NUMBER)) {
      // If useSlider is true, render a simple slider instead
      if (config.useSlider) {
        const newConfig = { ...config, widgetType: WidgetType.SLIDER };
        
        // Recursively call renderInputWidget with the modified socket
        return renderInputWidget();
      }
      
      return (
        <Input
          type="number"
          size="xs"
          value={value === "undefined" ? 0 : (value !== undefined ? value : 0)}
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
    }
    
    if (widgetType === WidgetType.TEXT || isDefaultWidgetForType(SocketType.STRING)) {
      // If multiline is true, render a textarea instead
      if (config.multiline) {
        const newConfig = { ...config, widgetType: WidgetType.TEXTAREA };
        
        // Recursively call renderInputWidget with the modified socket
        return renderInputWidget();
      }
      
      return (
        <Input
          type="text"
          size="xs"
          value={value === "undefined" ? '' : (value !== undefined ? value : '')}
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
    }
    
    if (isDefaultWidgetForType(SocketType.ANY)) {
      return (
        <Input
          size="xs"
          value={value === "undefined" ? '' : (value !== undefined ? String(value) : '')}
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
    }
    
    return null;
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
