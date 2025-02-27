import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ErrorMessage } from '../components/ErrorDisplay';
import { AlertColor } from '@mui/material';

interface ErrorContextType {
  addError: (message: string, type?: AlertColor) => void;
  removeError: (id: string) => void;
  errors: ErrorMessage[];
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorMessage[]>([]);

  const addError = useCallback((message: string, type: AlertColor = 'error') => {
    const newError: ErrorMessage = {
      id: uuidv4(),
      message,
      type,
      timestamp: Date.now(),
    };
    setErrors(prev => [...prev, newError]);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  return (
    <ErrorContext.Provider value={{ addError, removeError, errors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext; 