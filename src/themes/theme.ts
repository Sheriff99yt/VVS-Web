import { createSystem, defaultConfig } from '@chakra-ui/react';

// Define colors for our socket types
const socketColors = {
  // Base socket colors
  boolean: { value: '#FF4040' },  // Dark Red for binary/boolean
  number: { value: '#00E1C5' },   // Aqua Green for numbers
  string: { value: '#FF40FF' },   // Magenta for strings
  any: { value: '#9E9E9E' },      // Gray for any type
  flow: { value: '#FFFFFF' },      // White for execution flow
  
  // Hover state colors (slightly brighter)
  booleanHover: { value: '#FF6060' },  // Lighter red
  numberHover: { value: '#40F0D5' },   // Lighter aqua
  stringHover: { value: '#FF60FF' },   // Lighter magenta
  anyHover: { value: '#BDBDBD' },      // Lighter gray
  flowHover: { value: '#FFFFFF' },      // White (no change)
  
  // Error state colors
  error: { value: '#f44336' },         // Red
  errorHover: { value: '#ef5350' },    // Brighter red
  
  // Compatible connection indicator
  compatible: { value: '#4caf50' },    // Green
  incompatible: { value: '#f44336' },  // Red
};

// Custom color mode manager to sync with data-theme attribute
export const colorModeManager = {
  get: () => {
    const dataTheme = document.documentElement.getAttribute('data-theme');
    return dataTheme === 'light' ? 'light' : 'dark';
  },
  set: (colorMode: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', colorMode);
    if (colorMode === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }
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
        // Background colors
        bg: {
          value: {
            base: 'white',
            _dark: 'gray.900',
          }
        },
        bgSecondary: {
          value: {
            base: 'gray.50',
            _dark: 'gray.800',
          }
        },
        bgTertiary: {
          value: {
            base: 'gray.100',
            _dark: 'gray.700',
          }
        },
        
        // Text colors
        text: {
          value: {
            base: 'gray.800',
            _dark: 'white',
          }
        },
        textSecondary: {
          value: {
            base: 'gray.600',
            _dark: 'gray.300',
          }
        },
        textMuted: {
          value: {
            base: 'gray.500',
            _dark: 'gray.400',
          }
        },
        
        // Border colors
        border: {
          value: {
            base: 'gray.200',
            _dark: 'gray.700',
          }
        },
        
        // Panel colors
        panelBg: {
          value: {
            base: 'white',
            _dark: 'gray.900',
          }
        },
        panelHeaderBg: {
          value: {
            base: 'gray.50',
            _dark: 'gray.800',
          }
        },
        
        // Node colors
        nodeBg: {
          value: {
            base: 'white',
            _dark: 'gray.800',
          }
        },
        nodeHeaderBg: {
          value: {
            base: 'gray.50',
            _dark: 'gray.900',
          }
        },
        
        // Toolbar colors
        toolbarBg: {
          value: {
            base: 'white',
            _dark: 'gray.800',
          }
        },
        toolbarBorder: {
          value: {
            base: 'gray.200',
            _dark: 'gray.700',
          }
        },
        
        // Graph editor colors
        graphBg: {
          value: {
            base: 'gray.50',
            _dark: 'gray.900',
          }
        },
        
        // Socket colors (for better visibility in light mode)
        socketBorder: {
          value: {
            base: 'gray.400',
            _dark: 'white',
          }
        },
        
        // Input colors
        'input.bg': {
          value: {
            base: 'white',
            _dark: 'gray.700',
          }
        },
        'input.bgHover': {
          value: {
            base: 'gray.50',
            _dark: 'gray.600',
          }
        },
        'input.border': {
          value: {
            base: 'gray.200',
            _dark: 'gray.600',
          }
        },
        'input.borderHover': {
          value: {
            base: 'gray.300',
            _dark: 'gray.500',
          }
        },
        'input.text': {
          value: {
            base: 'gray.800',
            _dark: 'white',
          }
        },
        'input.placeholder': {
          value: {
            base: 'gray.400',
            _dark: 'gray.500',
          }
        },
        'input.label': {
          value: {
            base: 'gray.600',
            _dark: 'gray.300',
          }
        },
        
        // Code preview colors
        codeBg: {
          value: {
            base: 'gray.50',
            _dark: 'gray.800',
          }
        },
        codeText: {
          value: {
            base: 'gray.800',
            _dark: 'gray.100',
          }
        },
      },
    },
  },
  preflight: true,
});

export default system; 