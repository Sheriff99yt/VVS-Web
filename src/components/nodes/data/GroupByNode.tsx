import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface GroupByNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
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

const GrouperDisplay = styled.div`
  background: ${props => props.theme.data.function.background};
  border: 1px solid ${props => props.theme.data.function.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
`;

const GroupsContainer = styled.div`
  background: ${props => props.theme.data.groups.background};
  border: 1px solid ${props => props.theme.data.groups.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 120px;
  overflow-y: auto;
`;

const GroupItem = styled.div`
  padding: 4px;
  margin: 2px 0;
  border-bottom: 1px solid ${props => props.theme.data.groups.separator};
  
  &:last-child {
    border-bottom: none;
  }
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

export const GroupByNode: React.FC<GroupByNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { inputArray, grouper, groups } = useMemo(() => {
    const arrayPort = data.inputs.find(port => port.label === 'array');
    const grouperPort = data.inputs.find(port => port.label === 'grouper');
    const resultPort = data.outputs.find(port => port.label === 'result');
    
    const getPortValue = (port: typeof arrayPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      inputArray: Array.isArray(getPortValue(arrayPort)) ? getPortValue(arrayPort) : [],
      grouper: typeof getPortValue(grouperPort) === 'string' ? getPortValue(grouperPort) : 'x => x',
      groups: getPortValue(resultPort) || {}
    };
  }, [data]);

  const renderGroups = () => {
    return Object.entries(groups).map(([key, items]) => (
      <GroupItem key={key}>
        {key}: [{Array.isArray(items) ? items.slice(0, 3).join(', ') : ''}
        {Array.isArray(items) && items.length > 3 ? ', ...' : ''}]
      </GroupItem>
    ));
  };

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
          
          <GrouperDisplay>
            {grouper}
          </GrouperDisplay>
          
          <GroupsContainer>
            {renderGroups()}
          </GroupsContainer>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 