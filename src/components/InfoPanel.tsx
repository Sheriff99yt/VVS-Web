import React from 'react';
import { Box } from '@chakra-ui/react';
import SocketTypeLegend from './SocketTypeLegend';

interface InfoPanelProps {
  isOpen: boolean;
}

/**
 * InfoPanel component
 * A floating panel that contains various information panels like the socket type legend
 */
const InfoPanel: React.FC<InfoPanelProps> = ({ isOpen }) => {
  return (
    <Box position="absolute" bottom="20px" right="20px" zIndex={10}>
      {/* Info panels container */}
      <Box 
        display={isOpen ? 'block' : 'none'}
        opacity={isOpen ? 1 : 0}
        transition="opacity 0.2s"
      >
        <SocketTypeLegend />
        {/* Add more panels here in the future */}
      </Box>
    </Box>
  );
};

export default InfoPanel; 