import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ReturnNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
  isActive?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean; $isActive?: boolean }>`
  position: relative;
  min-width: 160px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
  border: 2px solid ${props => props.$isActive ? props.theme.function.return.active : 'transparent'};
  border-radius: 6px;
`;

const ReturnValue = styled.div`
  background: ${props => props.theme.function.return.value.background};
  border: 1px solid ${props => props.theme.function.return.value.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
  color: ${props => props.theme.function.return.value.text};
`;

const ValuePreview = styled.div`
  background: ${props => props.theme.function.return.preview.background};
  border-radius: 2px;
  padding: 4px 6px;
  margin-top: 4px;
  font-size: 11px;
  color: ${props => props.theme.function.return.preview.text};
  max-height: 60px;
  overflow-y: auto;
  word-break: break-word;
`;

const TypeIndicator = styled.div`
  background: ${props => props.theme.function.return.type.background};
  border: 1px solid ${props => props.theme.function.return.type.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-size: 11px;
  color: ${props => props.theme.function.return.type.text};
  font-style: italic;
`;

const FlowIndicator = styled.div<{ $isActive?: boolean }>`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isActive ? props.theme.status.active : props.theme.status.idle};
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

interface ReturnData {
  value: any;
  type: string;
}

export const ReturnNode: React.FC<ReturnNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  isActive = false,
  ...rest
}) => {
  const theme = useTheme();

  const { returnData } = useMemo(() => {
    const valuePort = data.inputs.find(port => port.label === 'value');
    
    const getPortValue = (port: typeof valuePort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    const value = getPortValue(valuePort);
    const type = typeof value;
    
    return {
      returnData: { value, type } as ReturnData
    };
  }, [data]);

  const renderValuePreview = (value: any) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }
    return String(value);
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
      <NodeContainer $isProcessing={isProcessing} $isActive={isActive}>
        <FlowIndicator $isActive={isActive} />
        <NodeContent>
          <ReturnValue>
            Return Value:
            <ValuePreview>
              {renderValuePreview(returnData.value)}
            </ValuePreview>
          </ReturnValue>
          
          <TypeIndicator>
            Type: {returnData.type}
          </TypeIndicator>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 