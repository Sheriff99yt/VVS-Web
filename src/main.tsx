import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App'
import './index.css'
import system from './themes/theme.ts'
import { initializeNodeSystem } from './nodes/NodeSystem'

// Initialize the node system
initializeNodeSystem();

// Set the initial color mode to dark
document.documentElement.setAttribute('data-theme', 'dark');
document.body.classList.add('dark-mode');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
