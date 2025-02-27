import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface CurryNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 200px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const FunctionPreview = styled.div`
  background: ${props => props.theme.function.curry.preview.background};
  border: 1px solid ${props => props.theme.function.curry.preview.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
  color: ${props => props.theme.function.curry.preview.text};
`;

const CurriedArguments = styled.div`
  background: ${props => props.theme.function.curry.arguments.background};
  border: 1px solid ${props => props.theme.function.curry.arguments.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
`;

const Argument = styled.div<{ $isCurried?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  margin: 2px 0;
  border-radius: 2px;
  background: ${props => props.theme.function.curry.arguments.item.background};
  opacity: ${props => props.$isCurried ? 0.7 : 1};

  &:hover {
    background: ${props => props.theme.function.curry.arguments.item.hover};
  }
`;

const ArgumentValue = styled.span`
  color: ${props => props.theme.function.curry.arguments.value};
  font-style: italic;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ArityIndicator = styled.div`
  background: ${props => props.theme.function.curry.arity.background};
  border: 1px solid ${props => props.theme.function.curry.arity.border};
  border-radius: 4px;
  padding: 6px;
  margin: 4px;
  font-size: 11px;
  color: ${props => props.theme.function.curry.arity.text};
  display: flex;
  justify-content: space-between;
`;

const Badge = styled.span<{ $type: 'curried' | 'remaining' }>`
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: ${props => props.theme.function.curry.badges[props.$type].background};
  color: ${props => props.theme.function.curry.badges[props.$type].text};
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

interface CurriedArgument {
  name: string;
  value: any;
  isCurried: boolean;
}

interface CurryMetadata {
  originalArity: number;
  remainingArity: number;
  functionName?: string;
}

export const CurryNode: React.FC<CurryNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { arguments: args, metadata } = useMemo(() => {
    const argsPort = data.inputs.find(port => port.label === 'arguments');
    const metadataPort = data.inputs.find(port => port.label === 'metadata');
    
    const getPortValue = (port: typeof argsPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      arguments: (getPortValue(argsPort) || []) as CurriedArgument[],
      metadata: (getPortValue(metadataPort) || {
        originalArity: 0,
        remainingArity: 0
      }) as CurryMetadata
    };
  }, [data]);

  const functionPreview = useMemo(() => {
    const curriedArgs = args.filter(arg => arg.isCurried).map(arg => arg.value);
    const placeholders = Array(metadata.remainingArity).fill('_');
    const allArgs = [...curriedArgs, ...placeholders];
    
    return `${metadata.functionName || 'fn'}(${allArgs.join(', ')})`;
  }, [args, metadata]);

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
          <FunctionPreview>
            {functionPreview}
          </FunctionPreview>
          
          <CurriedArguments>
            Arguments:
            {args.map((arg, index) => (
              <Argument key={index} $isCurried={arg.isCurried}>
                <span>{arg.name}</span>
                <ArgumentValue>
                  {typeof arg.value === 'object' ? JSON.stringify(arg.value) : String(arg.value)}
                </ArgumentValue>
              </Argument>
            ))}
          </CurriedArguments>
          
          <ArityIndicator>
            <span>
              Arity: {metadata.originalArity}
              <Badge $type="curried">
                {metadata.originalArity - metadata.remainingArity} curried
              </Badge>
            </span>
            <Badge $type="remaining">
              {metadata.remainingArity} remaining
            </Badge>
          </ArityIndicator>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 