import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export interface ErrorMessage {
  id: string;
  message: string;
  type: AlertColor;
  timestamp: number;
}

interface ErrorDisplayProps {
  errors: ErrorMessage[];
  onClose: (id: string) => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, onClose }) => {
  const handleClose = (id: string) => () => {
    onClose(id);
  };

  return (
    <>
      {errors.map((error, index) => (
        <Snackbar
          key={error.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => handleClose(error.id)()}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: `${(index * 80) + 24}px` }}
        >
          <Alert
            onClose={() => handleClose(error.id)()}
            severity={error.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default ErrorDisplay; 