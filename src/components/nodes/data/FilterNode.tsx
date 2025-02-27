import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface FilterNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 200px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const ArrayVisualizer = styled.div<{ type: 'input' | 'output' | 'filtered' }>`
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

const PredicateDisplay = styled.div`
  background: ${props => props.theme.data.function.background};
  border: 1px solid ${props => props.theme.data.function.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
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

export const FilterNode: React.FC<FilterNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { inputArray, predicate, outputArray, filteredArray } = useMemo(() => {
    const arrayPort = data.inputs.find(port => port.label === 'array');
    const predicatePort = data.inputs.find(port => port.label === 'predicate');
    const resultPort = data.outputs.find(port => port.label === 'result');
    const filteredPort = data.outputs.find(port => port.label === 'filtered');
    
    const getPortValue = (port: typeof arrayPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      inputArray: Array.isArray(getPortValue(arrayPort)) ? getPortValue(arrayPort) : [],
      predicate: typeof getPortValue(predicatePort) === 'string' ? getPortValue(predicatePort) : '(x) => true',
      outputArray: Array.isArray(getPortValue(resultPort)) ? getPortValue(resultPort) : [],
      filteredArray: Array.isArray(getPortValue(filteredPort)) ? getPortValue(filteredPort) : []
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
          
          <PredicateDisplay>
            {predicate}
          </PredicateDisplay>
          
          <ArrayVisualizer type="output">
            Matched: [{outputArray.slice(0, 3).join(', ')}
            {outputArray.length > 3 ? ', ...' : ''}]
          </ArrayVisualizer>

          <ArrayVisualizer type="filtered">
            Filtered: [{filteredArray.slice(0, 3).join(', ')}
            {filteredArray.length > 3 ? ', ...' : ''}]
          </ArrayVisualizer>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 