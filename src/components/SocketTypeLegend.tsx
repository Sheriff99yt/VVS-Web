import React from 'react';
import { Box, Text, VStack, HStack, useToken } from '@chakra-ui/react';
import { SocketType } from '../sockets/types';

/**
 * SocketTypeLegend component
 * Displays a legend explaining the socket type color coding
 */
const SocketTypeLegend: React.FC = () => {
  // Get colors from theme using the global mock
  const [
    booleanColor,
    numberColor,
    stringColor,
    flowColor,
    anyColor,
    errorColor
  ] = useToken('colors', [
    'socket.boolean',
    'socket.number',
    'socket.string',
    'socket.flow',
    'socket.any',
    'socket.error'
  ]);

  // Socket type definitions with colors and descriptions
  const socketTypes = [
    {
      type: SocketType.BOOLEAN,
      color: booleanColor,
      label: 'Boolean',
      description: 'True/False values'
    },
    {
      type: SocketType.NUMBER,
      color: numberColor,
      label: 'Number',
      description: 'Numeric values'
    },
    {
      type: SocketType.STRING,
      color: stringColor,
      label: 'String',
      description: 'Text values'
    },
    {
      type: SocketType.FLOW,
      color: flowColor,
      label: 'Flow',
      description: 'Execution flow'
    },
    {
      type: SocketType.ANY,
      color: anyColor,
      label: 'Any',
      description: 'Compatible with any type'
    }
  ];

  return (
    <Box
      className="socket-type-legend"
      bg="blackAlpha.700"
      rounded="md"
      p={3}
      width="250px"
      shadow="lg"
    >
      <Text fontWeight="bold" mb={1} fontSize="sm">Socket Type Legend</Text>
      <VStack align="stretch" gap="2">
        {socketTypes.map((socketType) => (
          <HStack key={socketType.type} gap="2">
            <Box
              width="12px"
              height="12px"
              rounded="full"
              bg={socketType.color}
              border="1px solid white"
            />
            <Text fontSize="xs" fontWeight="bold">{socketType.label}</Text>
            <Text fontSize="xs" flex="1">{socketType.description}</Text>
          </HStack>
        ))}
        <HStack gap="2" mt="1">
          <Box
            width="12px"
            height="12px"
            rounded="full"
            bg={errorColor}
            border="1px solid white"
          />
          <Text fontSize="xs" fontWeight="bold">Error</Text>
          <Text fontSize="xs" flex="1">Incompatible connection</Text>
        </HStack>
      </VStack>
    </Box>
  );
};

export default SocketTypeLegend; 