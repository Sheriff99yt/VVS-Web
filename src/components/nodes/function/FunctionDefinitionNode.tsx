import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface FunctionDefinitionNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 200px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const ParameterList = styled.div`
  background: ${props => props.theme.function.parameters.background};
  border: 1px solid ${props => props.theme.function.parameters.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
`;

const Parameter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  margin: 2px 0;
  border-radius: 2px;
  background: ${props => props.theme.function.parameters.item.background};

  &:hover {
    background: ${props => props.theme.function.parameters.item.hover};
  }
`;

const ParameterType = styled.span`
  color: ${props => props.theme.function.parameters.type};
  font-style: italic;
`;

const ReturnType = styled.div`
  background: ${props => props.theme.function.returnType.background};
  border: 1px solid ${props => props.theme.function.returnType.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
  color: ${props => props.theme.function.returnType.text};
`;

const FunctionMetadata = styled.div`
  background: ${props => props.theme.function.metadata.background};
  border: 1px solid ${props => props.theme.function.metadata.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-size: 11px;
`;

const MetadataItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  color: ${props => props.theme.function.metadata.text};
`;

const Badge = styled.span<{ $type: 'pure' | 'async' | 'generator' }>`
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: ${props => props.theme.function.badges[props.$type].background};
  color: ${props => props.theme.function.badges[props.$type].text};
  margin-left: 4px;
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

interface Parameter {
  name: string;
  type: string;
  defaultValue?: any;
  isOptional?: boolean;
}

interface FunctionMetadata {
  isPure?: boolean;
  isAsync?: boolean;
  isGenerator?: boolean;
  complexity?: number;
  description?: string;
}

export const FunctionDefinitionNode: React.FC<FunctionDefinitionNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { parameters, returnType, metadata } = useMemo(() => {
    const paramsPort = data.inputs.find(port => port.label === 'parameters');
    const returnPort = data.outputs.find(port => port.label === 'return');
    const metadataPort = data.inputs.find(port => port.label === 'metadata');
    
    const getPortValue = (port: typeof paramsPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      parameters: (getPortValue(paramsPort) || []) as Parameter[],
      returnType: getPortValue(returnPort) as string || 'void',
      metadata: (getPortValue(metadataPort) || {}) as FunctionMetadata
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
          <ParameterList>
            Parameters:
            {parameters.map((param, index) => (
              <Parameter key={index}>
                <span>{param.name}{param.isOptional ? '?' : ''}</span>
                <ParameterType>
                  {param.type}
                  {param.defaultValue !== undefined && ` = ${JSON.stringify(param.defaultValue)}`}
                </ParameterType>
              </Parameter>
            ))}
          </ParameterList>
          
          <ReturnType>
            Returns: {returnType}
          </ReturnType>
          
          <FunctionMetadata>
            {metadata.isPure && <Badge $type="pure">Pure</Badge>}
            {metadata.isAsync && <Badge $type="async">Async</Badge>}
            {metadata.isGenerator && <Badge $type="generator">Generator</Badge>}
            {metadata.complexity !== undefined && (
              <MetadataItem>
                Complexity: O({metadata.complexity})
              </MetadataItem>
            )}
            {metadata.description && (
              <MetadataItem>
                {metadata.description}
              </MetadataItem>
            )}
          </FunctionMetadata>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 