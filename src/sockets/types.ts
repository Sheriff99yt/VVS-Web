/**
 * Socket types for the node system
 * Each socket has a specific type that determines what connections are valid
 */

// Base socket types available in the system
export enum SocketType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  ANY = 'any',
  FLOW = 'flow',
}

// Socket direction (input or output)
export enum SocketDirection {
  INPUT = 'input',
  OUTPUT = 'output',
}

/**
 * Configuration for input widgets
 * Different settings based on socket type
 */
export interface InputWidgetConfig {
  // Basic settings
  enabled: boolean;           // Whether the input widget is enabled
  widgetType?: WidgetType;    // What type of widget to display (default depends on socket type)
  
  // Settings for NUMBER type
  min?: number;               // Minimum value (for number inputs)
  max?: number;               // Maximum value (for number inputs)
  step?: number;              // Step size (for number inputs)
  precision?: number;         // Decimal precision (for number inputs)
  isInteger?: boolean;        // Whether the number should be an integer
  useSlider?: boolean;        // Whether to use a slider for numeric input
  
  // Settings for STRING type
  maxLength?: number;         // Maximum string length
  placeholder?: string;       // Placeholder text
  multiline?: boolean;        // Whether to use a multi-line text area
  rows?: number;              // Number of rows for multi-line text area
  
  // Settings for BOOLEAN type
  label?: string;             // Label for the checkbox
  
  // Settings for dropdown/select widget
  options?: Array<{
    label: string;
    value: any;
  }>;                         // Available options for dropdown
  
  // Settings for color picker
  defaultColor?: string;      // Default color in hex format
}

/**
 * Available widget types that can be used for input sockets
 */
export enum WidgetType {
  DEFAULT = 'default',        // Use default for the socket type
  TEXT = 'text',              // Text input (for strings)
  NUMBER = 'number',          // Number input
  CHECKBOX = 'checkbox',      // Checkbox (for booleans)
  DROPDOWN = 'dropdown',      // Dropdown/select (for enumerated values)
  COLOR_PICKER = 'color',     // Color picker
  TEXTAREA = 'textarea',      // Multi-line text area
  SLIDER = 'slider',          // Slider for numeric values
  // Add more widget types as needed
}

// Socket definition interface
export interface SocketDefinition {
  id: string;
  name: string;
  type: SocketType;
  direction: SocketDirection;
  defaultValue?: any;
  inputWidget?: InputWidgetConfig; // Configuration for the input widget
}

// Function to check if two sockets are compatible for connection
export const areSocketsCompatible = (
  source: SocketDefinition,
  target: SocketDefinition
): boolean => {
  // Socket direction must be different (output to input)
  if (source.direction === target.direction) {
    return false;
  }

  // If either socket is of type ANY, the connection is valid
  if (source.type === SocketType.ANY || target.type === SocketType.ANY) {
    return true;
  }

  // Otherwise, the types must match
  return source.type === target.type;
};

// Helper function to create a socket definition
export const createSocketDefinition = (
  id: string,
  name: string,
  type: SocketType,
  direction: SocketDirection,
  defaultValue?: any,
  inputWidget?: Partial<InputWidgetConfig>
): SocketDefinition => {
  // Create default input widget config based on socket type
  let defaultInputWidget: InputWidgetConfig | undefined;
  
  if (direction === SocketDirection.INPUT && type !== SocketType.FLOW) {
    // Create the base config with required fields
    defaultInputWidget = {
      enabled: true,
      widgetType: WidgetType.DEFAULT,
    };
    
    // Add type-specific defaults
    switch (type) {
      case SocketType.NUMBER:
        defaultInputWidget.min = -Infinity;
        defaultInputWidget.max = Infinity;
        defaultInputWidget.step = 1;
        defaultInputWidget.precision = name.toLowerCase().includes('int') ? 0 : 2;
        defaultInputWidget.isInteger = name.toLowerCase().includes('int');
        defaultInputWidget.useSlider = false;
        break;
      case SocketType.STRING:
        defaultInputWidget.maxLength = 1000;
        defaultInputWidget.placeholder = '';
        defaultInputWidget.multiline = false;
        break;
      case SocketType.BOOLEAN:
        defaultInputWidget.label = '';
        break;
    }
  }
  
  // Merge default config with provided config, ensuring required fields are present
  const mergedInputWidget = defaultInputWidget && inputWidget 
    ? { ...defaultInputWidget, ...inputWidget, enabled: inputWidget.enabled ?? defaultInputWidget.enabled }
    : defaultInputWidget;

  return {
    id,
    name,
    type,
    direction,
    defaultValue,
    inputWidget: mergedInputWidget,
  };
}; 