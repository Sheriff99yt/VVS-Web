import { createSystem, defaultConfig } from '@chakra-ui/react';

// Define colors for our theme
const socketColors = {
  boolean: { value: '#ffd700' },
  number: { value: '#00bcd4' },
  string: { value: '#4caf50' },
  any: { value: '#9e9e9e' },
  flow: { value: '#ff5722' },
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