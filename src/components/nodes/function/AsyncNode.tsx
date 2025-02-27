import React, { useMemo } from 'react';
import styled, { useTheme, keyframes } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface AsyncNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
}

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 220px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const PromiseState = styled.div<{ $state: 'pending' | 'fulfilled' | 'rejected' }>`
  background: ${props => props.theme.function.async.state[props.$state].background};
  border: 1px solid ${props => props.theme.function.async.state[props.$state].border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
  color: ${props => props.theme.function.async.state[props.$state].text};
  animation: ${props => props.$state === 'pending' ? pulse : 'none'} 2s infinite;
`;

const ResultPreview = styled.div<{ $state: 'fulfilled' | 'rejected' }>`
  background: ${props => props.theme.function.async.result[props.$state].background};
  border: 1px solid ${props => props.theme.function.async.result[props.$state].border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 11px;
  color: ${props => props.theme.function.async.result[props.$state].text};
  max-height: 100px;
  overflow-y: auto;
  word-break: break-word;
`;

const ExecutionTimeline = styled.div`
  background: ${props => props.theme.function.async.timeline.background};
  border: 1px solid ${props => props.theme.function.async.timeline.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-size: 11px;
`;

const TimelineEvent = styled.div<{ $type: 'start' | 'resolve' | 'reject' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  margin: 2px 0;
  border-radius: 2px;
  background: ${props => props.theme.function.async.timeline.event[props.$type].background};
  color: ${props => props.theme.function.async.timeline.event[props.$type].text};
`;

const Badge = styled.span<{ $type: 'async' | 'await' | 'time' }>`
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: ${props => props.theme.function.async.badges[props.$type].background};
  color: ${props => props.theme.function.async.badges[props.$type].text};
  margin-left: 4px;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  height: 2px;
  background: ${props => props.theme.function.async.progress.track};
  border-radius: 1px;
  margin: 4px 0;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$progress}%;
    background: ${props => props.theme.function.async.progress.indicator};
    transition: width 0.3s ease;
  }
`;

const ProcessingIndicator = styled.div<{ $state: 'pending' | 'fulfilled' | 'rejected' }>`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.theme.function.async.state[props.$state].indicator};
  transition: background-color 0.3s ease;
  animation: ${props => props.$state === 'pending' ? pulse : 'none'} 2s infinite;
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

interface TimelineEvent {
  type: 'start' | 'resolve' | 'reject';
  timestamp: number;
  data?: any;
}

interface AsyncMetadata {
  state: 'pending' | 'fulfilled' | 'rejected';
  startTime?: number;
  endTime?: number;
  progress?: number;
  result?: any;
  error?: any;
  timeline: TimelineEvent[];
}

export const AsyncNode: React.FC<AsyncNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  ...rest
}) => {
  const theme = useTheme();

  const { metadata } = useMemo(() => {
    const metadataPort = data.inputs.find(port => port.label === 'metadata');
    
    const getPortValue = (port: typeof metadataPort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      metadata: (getPortValue(metadataPort) || {
        state: 'pending',
        timeline: []
      }) as AsyncMetadata
    };
  }, [data]);

  const formatTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const delta = Date.now() - timestamp;
    if (delta < 1000) return 'just now';
    if (delta < 60000) return `${Math.floor(delta / 1000)}s ago`;
    if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`;
    return `${Math.floor(delta / 3600000)}h ago`;
  };

  const getExecutionTime = () => {
    if (!metadata.startTime) return 0;
    const endTime = metadata.endTime || Date.now();
    return endTime - metadata.startTime;
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
        <ProcessingIndicator $state={metadata.state} />
        <NodeContent>
          <PromiseState $state={metadata.state}>
            Promise State: {metadata.state}
            {metadata.progress !== undefined && (
              <>
                <ProgressBar $progress={metadata.progress} />
                <Badge $type="time">
                  {formatTime(getExecutionTime())}
                </Badge>
              </>
            )}
          </PromiseState>
          
          {metadata.state !== 'pending' && (
            <ResultPreview $state={metadata.state === 'fulfilled' ? 'fulfilled' : 'rejected'}>
              {metadata.state === 'fulfilled' ? 'Result:' : 'Error:'}
              <pre>
                {metadata.state === 'fulfilled'
                  ? JSON.stringify(metadata.result, null, 2)
                  : metadata.error?.message || String(metadata.error)
                }
              </pre>
            </ResultPreview>
          )}
          
          <ExecutionTimeline>
            {metadata.timeline.map((event, index) => (
              <TimelineEvent key={index} $type={event.type}>
                <span>{event.type}</span>
                <div>
                  <Badge $type={event.type === 'start' ? 'async' : 'await'}>
                    {event.type === 'start' ? 'async' : 'await'}
                  </Badge>
                  <Badge $type="time">
                    {formatTimestamp(event.timestamp)}
                  </Badge>
                </div>
              </TimelineEvent>
            ))}
          </ExecutionTimeline>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 