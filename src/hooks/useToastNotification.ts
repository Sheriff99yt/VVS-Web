import { useToast, UseToastOptions } from '@chakra-ui/react';

/**
 * Custom hook for displaying toast notifications
 * @returns Object with methods for displaying different types of toast notifications
 */
export const useToastNotification = () => {
  const toast = useToast();

  const showToast = (options: UseToastOptions) => {
    const defaultOptions: UseToastOptions = {
      position: 'top-right',
      duration: 3000,
      isClosable: true,
    };

    return toast({
      ...defaultOptions,
      ...options,
    });
  };

  const showSuccess = (message: string, title?: string) => {
    return showToast({
      title: title || 'Success',
      description: message,
      status: 'success',
    });
  };

  const showError = (message: string, title?: string) => {
    return showToast({
      title: title || 'Error',
      description: message,
      status: 'error',
    });
  };

  const showWarning = (message: string, title?: string) => {
    return showToast({
      title: title || 'Warning',
      description: message,
      status: 'warning',
    });
  };

  const showInfo = (message: string, title?: string) => {
    return showToast({
      title: title || 'Info',
      description: message,
      status: 'info',
    });
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 