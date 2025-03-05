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

// Modern dark theme gray scale (no tints, pure grays for eye comfort)
const darkThemeGrays = {
  950: '#0A0A0A', // Almost black
  900: '#121212', // Base background
  850: '#181818', // Slightly lighter
  800: '#1E1E1E', // VS Code-like background
  750: '#242424', // Node background
  700: '#2A2A2A', // Tertiary background
  650: '#303030', // Input background
  600: '#363636', // Border color
  550: '#404040', // Hover state
  500: '#4A4A4A', // Base border
  450: '#555555', // Subtle UI elements
  400: '#606060', // Muted text
  350: '#757575', // Very muted text
  300: '#9E9E9E', // Secondary text
  200: '#BBBBBB', // Primary text for less emphasis
  100: '#E0E0E0', // Secondary text highlight
  50: '#F5F5F5',  // Primary text
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
    
    // Update Monaco editor theme
    colorModeManager.updateMonacoEditorTheme(colorMode);
  },
  
  // Helper method to update Monaco editor theme
  updateMonacoEditorTheme: (colorMode: 'light' | 'dark') => {
    // Trigger Monaco editor theme refresh
    setTimeout(() => {
      const monacoEditors = document.querySelectorAll('.monaco-editor');
      if (monacoEditors.length > 0) {
        // Force editor redraw
        window.dispatchEvent(new Event('resize'));
        
        // Apply CSS classes to ensure theme consistency
        monacoEditors.forEach((editor) => {
          if (colorMode === 'dark') {
            editor.classList.add('vs-dark');
            editor.classList.remove('vs');
          } else {
            editor.classList.add('vs');
            editor.classList.remove('vs-dark');
          }
        });
      }
    }, 50); // Small delay to ensure DOM is updated
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
            _dark: darkThemeGrays[900],
          }
        },
        bgSecondary: {
          value: {
            base: 'gray.50',
            _dark: darkThemeGrays[850],
          }
        },
        bgTertiary: {
          value: {
            base: 'gray.100',
            _dark: darkThemeGrays[800],
          }
        },
        
        // Text colors
        text: {
          value: {
            base: 'gray.800',
            _dark: darkThemeGrays[50],
          }
        },
        textSecondary: {
          value: {
            base: 'gray.600',
            _dark: darkThemeGrays[200],
          }
        },
        textMuted: {
          value: {
            base: 'gray.500',
            _dark: darkThemeGrays[350],
          }
        },
        
        // Border colors
        border: {
          value: {
            base: 'gray.200',
            _dark: darkThemeGrays[600],
          }
        },
        
        // Panel colors
        panelBg: {
          value: {
            base: 'white',
            _dark: darkThemeGrays[800],
          }
        },
        panelHeaderBg: {
          value: {
            base: 'gray.50',
            _dark: darkThemeGrays[750],
          }
        },
        
        // Node colors
        nodeBg: {
          value: {
            base: 'white',
            _dark: darkThemeGrays[750],
          }
        },
        nodeHeaderBg: {
          value: {
            base: 'gray.50',
            _dark: darkThemeGrays[700],
          }
        },
        
        // Toolbar colors
        toolbarBg: {
          value: {
            base: 'white',
            _dark: darkThemeGrays[850],
          }
        },
        toolbarBorder: {
          value: {
            base: 'gray.200',
            _dark: darkThemeGrays[700],
          }
        },
        
        // Graph editor colors
        graphBg: {
          value: {
            base: 'gray.50',
            _dark: darkThemeGrays[900],
          }
        },
        
        // Socket colors (for better visibility in light mode)
        socketBorder: {
          value: {
            base: 'gray.400',
            _dark: darkThemeGrays[300],
          }
        },
        
        // Input colors
        'input.bg': {
          value: {
            base: 'white',
            _dark: darkThemeGrays[700],
          }
        },
        'input.bgHover': {
          value: {
            base: 'gray.50',
            _dark: darkThemeGrays[650],
          }
        },
        'input.border': {
          value: {
            base: 'gray.200',
            _dark: darkThemeGrays[600],
          }
        },
        'input.borderHover': {
          value: {
            base: 'gray.300',
            _dark: darkThemeGrays[550],
          }
        },
        'input.text': {
          value: {
            base: 'gray.800',
            _dark: darkThemeGrays[100],
          }
        },
        'input.placeholder': {
          value: {
            base: 'gray.400',
            _dark: darkThemeGrays[400],
          }
        },
        'input.label': {
          value: {
            base: 'gray.600',
            _dark: darkThemeGrays[200],
          }
        },
        
        // Code preview colors
        codeBg: {
          value: {
            base: 'gray.50',
            _dark: darkThemeGrays[850],
          }
        },
        codeText: {
          value: {
            base: 'gray.800',
            _dark: darkThemeGrays[100],
          }
        },
      },
    },
  },
  preflight: true,
});

export default system; 