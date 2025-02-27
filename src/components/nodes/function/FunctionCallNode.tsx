import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface FunctionCallNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
  isExecuting?: boolean;
  hasError?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean; $isExecuting?: boolean; $hasError?: boolean }>`
  position: relative;
  min-width: 180px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing || props.$isExecuting ? 0.8 : 1};
  border: 2px solid ${props => props.$hasError ? props.theme.status.error : 'transparent'};
  border-radius: 6px;
`;

const ArgumentList = styled.div`
  background: ${props => props.theme.function.arguments.background};
  border: 1px solid ${props => props.theme.function.arguments.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
`;

const Argument = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  margin: 2px 0;
  border-radius: 2px;
  background: ${props => props.theme.function.arguments.item.background};

  &:hover {
    background: ${props => props.theme.function.arguments.item.hover};
  }
`;

const ArgumentValue = styled.span`
  color: ${props => props.theme.function.arguments.value};
  font-style: italic;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ReturnValue = styled.div<{ $hasError?: boolean }>`
  background: ${props => props.$hasError ? props.theme.status.errorBackground : props.theme.function.returnValue.background};
  border: 1px solid ${props => props.$hasError ? props.theme.status.error : props.theme.function.returnValue.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
  color: ${props => props.$hasError ? props.theme.status.error : props.theme.function.returnValue.text};
`;

const ExecutionState = styled.div`
  background: ${props => props.theme.function.execution.background};
  border: 1px solid ${props => props.theme.function.execution.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-size: 11px;
`;

const StateIndicator = styled.div<{ $state: 'idle' | 'executing' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.function.execution[props.$state]};

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
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

interface Argument {
  name: string;
  value: any;
}

interface ExecutionMetadata {
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

export const FunctionCallNode: React.FC<FunctionCallNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  isExecuting = false,
  hasError = false,
  ...rest
}) => {
  const theme = useTheme();

  const { arguments: args, returnValue, executionMetadata } = useMemo(() => {
    const argsPort = data.inputs.find(port => port.label === 'arguments');
    const returnPort = data.outputs.find(port => port.label === 'return');
    const metadataPort = data.inputs.find(port => port.label === 'executionMetadata');
    
    const getPortValue = (port: typeof argsPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      arguments: (getPortValue(argsPort) || []) as Argument[],
      returnValue: getPortValue(returnPort),
      executionMetadata: (getPortValue(metadataPort) || {}) as ExecutionMetadata
    };
  }, [data]);

  const executionState = useMemo(() => {
    if (hasError || executionMetadata.error) return 'error';
    if (isExecuting) return 'executing';
    if (executionMetadata.endTime) return 'completed';
    return 'idle';
  }, [hasError, isExecuting, executionMetadata]);

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
      <NodeContainer $isProcessing={isProcessing} $isExecuting={isExecuting} $hasError={hasError}>
        <NodeContent>
          <ArgumentList>
            Arguments:
            {args.map((arg, index) => (
              <Argument key={index}>
                <span>{arg.name}</span>
                <ArgumentValue>
                  {typeof arg.value === 'object' ? JSON.stringify(arg.value) : String(arg.value)}
                </ArgumentValue>
              </Argument>
            ))}
          </ArgumentList>
          
          {(returnValue !== undefined || hasError) && (
            <ReturnValue $hasError={hasError}>
              {hasError ? executionMetadata.error || 'Error during execution' : `Return: ${JSON.stringify(returnValue)}`}
            </ReturnValue>
          )}
          
          <ExecutionState>
            <StateIndicator $state={executionState}>
              {executionState.charAt(0).toUpperCase() + executionState.slice(1)}
              {executionMetadata.duration && ` (${executionMetadata.duration}ms)`}
            </StateIndicator>
          </ExecutionState>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 