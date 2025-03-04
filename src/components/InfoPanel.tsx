import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip,
  useDisclosure
} from '@chakra-ui/react';
import SocketTypeLegend from './SocketTypeLegend';

/**
 * InfoPanel component
 * A floating panel that contains various information panels like the socket type legend
 * Can be toggled on/off with an info button
 */
const InfoPanel: React.FC = () => {
  const { open: isOpen, onToggle } = useDisclosure();
  const [activePanel, setActivePanel] = useState<string>('socketTypes');

  return (
    <Box position="absolute" bottom="20px" right="20px" zIndex={10}>
      {/* Info panels container */}
      <Box 
        display={isOpen ? 'block' : 'none'}
        mb={4}
        opacity={isOpen ? 1 : 0}
        transition="opacity 0.2s"
      >
        {activePanel === 'socketTypes' && <SocketTypeLegend />}
        {/* Add more panels here in the future */}
      </Box>

      {/* Toggle button */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <IconButton
            aria-label="Toggle info panel"
            children="ℹ️"
            onClick={onToggle}
            colorScheme={isOpen ? "blue" : "gray"}
            size="md"
            borderRadius="full"
            boxShadow="md"
          />
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Tooltip.Arrow />
          {isOpen ? "Hide info panel" : "Show info panel"}
        </Tooltip.Content>
      </Tooltip.Root>
    </Box>
  );
};

export default InfoPanel; 