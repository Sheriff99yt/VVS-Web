import { createSystem, defaultConfig } from '@chakra-ui/react';

// Define colors for our theme
const socketColors = {
  // Base socket colors
  boolean: { value: '#ffd700' }, // Gold
  number: { value: '#00bcd4' },  // Cyan
  string: { value: '#4caf50' },  // Green
  any: { value: '#9e9e9e' },     // Gray
  flow: { value: '#ff5722' },    // Orange
  
  // Hover state colors (slightly brighter)
  booleanHover: { value: '#ffeb3b' }, // Brighter gold
  numberHover: { value: '#26c6da' },  // Brighter cyan
  stringHover: { value: '#66bb6a' },  // Brighter green
  anyHover: { value: '#bdbdbd' },     // Brighter gray
  flowHover: { value: '#ff7043' },    // Brighter orange
  
  // Error state colors
  error: { value: '#f44336' },        // Red
  errorHover: { value: '#ef5350' },   // Brighter red
  
  // Compatible connection indicator
  compatible: { value: '#4caf50' },   // Green
  incompatible: { value: '#f44336' }, // Red
};

// Create system with custom configuration
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e0f7ff' },
          100: { value: '#b9e6ff' },
          200: { value: '#8ecfff' },
          300: { value: '#5cb2ff' },
          400: { value: '#3e96fd' },
          500: { value: '#2979e4' },
          600: { value: '#1a5eb2' },
          700: { value: '#0e4582' },
          800: { value: '#052b53' },
          900: { value: '#001226' },
        },
        socket: socketColors,
      },
    },
    semanticTokens: {
      colors: {
        // Add semantic tokens as needed
        bg: {
          value: {
            base: 'gray.900',
            _dark: 'gray.900',
          }
        },
        text: {
          value: {
            base: 'white',
            _dark: 'white',
          }
        },
      },
    },
  },
  preflight: true,
});

export default system; 