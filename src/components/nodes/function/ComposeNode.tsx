import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ComposeNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
  activeFunction?: number;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 220px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const CompositionChain = styled.div`
  background: ${props => props.theme.function.compose.chain.background};
  border: 1px solid ${props => props.theme.function.compose.chain.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
`;

const FunctionStep = styled.div<{ $isActive?: boolean; $index: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  margin: 2px 0;
  border-radius: 2px;
  background: ${props => props.$isActive ? props.theme.function.compose.step.activeBackground : props.theme.function.compose.step.background};
  position: relative;

  &:not(:last-child)::after {
    content: '↓';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    color: ${props => props.theme.function.compose.step.arrow};
  }

  &:hover {
    background: ${props => props.theme.function.compose.step.hover};
  }
`;

const FunctionName = styled.span`
  color: ${props => props.theme.function.compose.step.name};
  font-weight: 500;
`;

const TypeAnnotation = styled.span`
  color: ${props => props.theme.function.compose.step.type};
  font-style: italic;
  font-size: 11px;
`;

const CompositionPreview = styled.div`
  background: ${props => props.theme.function.compose.preview.background};
  border: 1px solid ${props => props.theme.function.compose.preview.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
  color: ${props => props.theme.function.compose.preview.text};
  white-space: pre-wrap;
  word-break: break-all;
`;

const ExecutionMetadata = styled.div`
  background: ${props => props.theme.function.compose.metadata.background};
  border: 1px solid ${props => props.theme.function.compose.metadata.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-size: 11px;
`;

const Badge = styled.span<{ $type: 'input' | 'output' | 'step' }>`
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: ${props => props.theme.function.compose.badges[props.$type].background};
  color: ${props => props.theme.function.compose.badges[props.$type].text};
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

interface ComposedFunction {
  name: string;
  inputType: string;
  outputType: string;
  description?: string;
}

interface ComposeMetadata {
  inputType: string;
  outputType: string;
  stepCount: number;
}

export const ComposeNode: React.FC<ComposeNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  activeFunction = -1,
  ...rest
}) => {
  const theme = useTheme();

  const { functions, metadata } = useMemo(() => {
    const functionsPort = data.inputs.find(port => port.label === 'functions');
    const metadataPort = data.inputs.find(port => port.label === 'metadata');
    
    const getPortValue = (port: typeof functionsPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      functions: (getPortValue(functionsPort) || []) as ComposedFunction[],
      metadata: (getPortValue(metadataPort) || {
        inputType: 'unknown',
        outputType: 'unknown',
        stepCount: 0
      }) as ComposeMetadata
    };
  }, [data]);

  const compositionPreview = useMemo(() => {
    if (functions.length === 0) return 'compose()';
    const functionNames = functions.map(f => f.name).reverse();
    return `compose(${functionNames.join(', ')})`;
  }, [functions]);

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
          <CompositionPreview>
            {compositionPreview}
          </CompositionPreview>
          
          <CompositionChain>
            {functions.map((fn, index) => (
              <FunctionStep 
                key={index} 
                $isActive={activeFunction === index}
                $index={index}
              >
                <FunctionName>{fn.name}</FunctionName>
                <TypeAnnotation>
                  {fn.inputType} → {fn.outputType}
                </TypeAnnotation>
              </FunctionStep>
            ))}
          </CompositionChain>
          
          <ExecutionMetadata>
            <div>
              <Badge $type="input">Input: {metadata.inputType}</Badge>
              <Badge $type="output">Output: {metadata.outputType}</Badge>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Badge $type="step">Steps: {metadata.stepCount}</Badge>
            </div>
          </ExecutionMetadata>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 