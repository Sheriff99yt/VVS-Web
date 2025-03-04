import { createSystem, defaultConfig } from '@chakra-ui/react';

// Define colors for our socket types
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