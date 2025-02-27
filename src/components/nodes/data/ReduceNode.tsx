import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ReduceNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 200px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const ArrayVisualizer = styled.div<{ type: 'input' | 'output' }>`
  background: ${props => props.theme.data.array[props.type].background};
  border: 1px solid ${props => props.theme.data.array[props.type].border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 60px;
  overflow-y: auto;
`;

const ReducerDisplay = styled.div`
  background: ${props => props.theme.data.function.background};
  border: 1px solid ${props => props.theme.data.function.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
`;

const AccumulatorState = styled.div`
  background: ${props => props.theme.data.state.background};
  border: 1px solid ${props => props.theme.data.state.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
`;

const ProcessingIndicator = styled.div<{ $isProcessing?: boolean }>`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isProcessing ? props.theme.status.processing : props.theme.status.idle};
  transition: background-color 0.3s ease;
`;

const NodeContent = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
`;

const Wrapper = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
  transition: opacity 0.3s ease;
`;

export const ReduceNode: React.FC<ReduceNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { inputArray, reducer, initialValue, currentValue } = useMemo(() => {
    const arrayPort = data.inputs.find(port => port.label === 'array');
    const reducerPort = data.inputs.find(port => port.label === 'reducer');
    const initialPort = data.inputs.find(port => port.label === 'initial');
    const resultPort = data.outputs.find(port => port.label === 'result');
    
    const getPortValue = (port: typeof arrayPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      inputArray: Array.isArray(getPortValue(arrayPort)) ? getPortValue(arrayPort) : [],
      reducer: typeof getPortValue(reducerPort) === 'string' ? getPortValue(reducerPort) : '(acc, x) => acc',
      initialValue: getPortValue(initialPort),
      currentValue: getPortValue(resultPort)
    };
  }, [data]);

  return (
    <Wrapper $isProcessing={isProcessing}>
      <BaseNode
        data={data}
        selected={selected}
        onSelect={onSelect}
        onPortConnect={onPortConnect}
        onPositionChange={onPositionChange}
        {...rest}
      />
      <NodeContainer $isProcessing={isProcessing}>
        <ProcessingIndicator $isProcessing={isProcessing} />
        <NodeContent>
          <ArrayVisualizer type="input">
            Input: [{inputArray.slice(0, 3).join(', ')}
            {inputArray.length > 3 ? ', ...' : ''}]
          </ArrayVisualizer>
          
          <ReducerDisplay>
            {reducer}
          </ReducerDisplay>
          
          <AccumulatorState>
            Initial: {JSON.stringify(initialValue)}
            Current: {JSON.stringify(currentValue)}
          </AccumulatorState>
          
          <ArrayVisualizer type="output">
            Result: {JSON.stringify(currentValue)}
          </ArrayVisualizer>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 