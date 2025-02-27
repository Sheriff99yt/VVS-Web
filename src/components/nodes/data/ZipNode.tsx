import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ZipNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
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

const ZipOptions = styled.div`
  background: ${props => props.theme.data.options.background};
  border: 1px solid ${props => props.theme.data.options.border};
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

interface ZipOptions {
  fillValue: any;
  truncate: boolean;
}

type ZippedItem = Array<any>;

export const ZipNode: React.FC<ZipNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { arrays, zipOptions, zippedArray } = useMemo(() => {
    const array1Port = data.inputs.find(port => port.label === 'array1');
    const array2Port = data.inputs.find(port => port.label === 'array2');
    const optionsPort = data.inputs.find(port => port.label === 'options');
    const resultPort = data.outputs.find(port => port.label === 'result');
    
    const getPortValue = (port: typeof array1Port) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    const array1 = Array.isArray(getPortValue(array1Port)) ? getPortValue(array1Port) : [];
    const array2 = Array.isArray(getPortValue(array2Port)) ? getPortValue(array2Port) : [];
    
    return {
      arrays: [array1, array2],
      zipOptions: (getPortValue(optionsPort) || { fillValue: null, truncate: false }) as ZipOptions,
      zippedArray: (Array.isArray(getPortValue(resultPort)) ? getPortValue(resultPort) : []) as ZippedItem[]
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
          {arrays.map((array, index) => (
            <ArrayVisualizer key={index} type="input">
              Array {index + 1}: [{array.slice(0, 3).join(', ')}
              {array.length > 3 ? ', ...' : ''}]
            </ArrayVisualizer>
          ))}
          
          <ZipOptions>
            Fill: {JSON.stringify(zipOptions.fillValue)}
            Truncate: {zipOptions.truncate ? 'true' : 'false'}
          </ZipOptions>
          
          <ArrayVisualizer type="output">
            Zipped: [{zippedArray.slice(0, 3).map((item: ZippedItem) => `[${item.join(', ')}]`).join(', ')}
            {zippedArray.length > 3 ? ', ...' : ''}]
          </ArrayVisualizer>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 