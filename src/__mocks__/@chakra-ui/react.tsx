import React from 'react';

// Get the actual module
const originalModule = jest.requireActual('@chakra-ui/react');

// Mock the useToken hook
const useToken = () => {
  return [
    '#ffd700', // boolean
    '#00bcd4', // number
    '#4caf50', // string
    '#ff5722', // flow
    '#9e9e9e', // any
    '#f44336'  // error
  ];
};

// Create a simple ChakraProvider mock
const ChakraProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'chakra-provider' }, children);
};

// Export all the original exports plus our mocks
module.exports = {
  ...originalModule,
  useToken,
  ChakraProvider
}; 