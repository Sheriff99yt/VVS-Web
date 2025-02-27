import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface MemoNodeProps extends Omit<React.ComponentProps<typeof BaseNode>, 'children'> {
  isProcessing?: boolean;
  isCacheHit?: boolean;
}

const NodeContainer = styled.div<{ $isProcessing?: boolean }>`
  position: relative;
  min-width: 220px;
  transition: all 0.3s ease;
  opacity: ${props => props.$isProcessing ? 0.8 : 1};
`;

const CachePreview = styled.div`
  background: ${props => props.theme.function.memo.cache.background};
  border: 1px solid ${props => props.theme.function.memo.cache.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-family: monospace;
  font-size: 12px;
`;

const CacheEntry = styled.div<{ $isHit?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  margin: 2px 0;
  border-radius: 2px;
  background: ${props => props.$isHit 
    ? props.theme.function.memo.cache.hit.background 
    : props.theme.function.memo.cache.entry.background};
  border-left: 3px solid ${props => props.$isHit 
    ? props.theme.function.memo.cache.hit.border 
    : props.theme.function.memo.cache.entry.border};

  &:hover {
    background: ${props => props.$isHit 
      ? props.theme.function.memo.cache.hit.hover 
      : props.theme.function.memo.cache.entry.hover};
  }
`;

const KeyValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Key = styled.span`
  color: ${props => props.theme.function.memo.cache.key};
  font-size: 11px;
`;

const Value = styled.span`
  color: ${props => props.theme.function.memo.cache.value};
  font-style: italic;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Timestamp = styled.span`
  color: ${props => props.theme.function.memo.cache.timestamp};
  font-size: 10px;
`;

const PerformanceMetrics = styled.div`
  background: ${props => props.theme.function.memo.metrics.background};
  border: 1px solid ${props => props.theme.function.memo.metrics.border};
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
  font-size: 11px;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
`;

const MetricLabel = styled.span`
  color: ${props => props.theme.function.memo.metrics.label};
`;

const MetricValue = styled.span`
  color: ${props => props.theme.function.memo.metrics.value};
  font-family: monospace;
`;

const Badge = styled.span<{ $type: 'hit' | 'miss' | 'size' }>`
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: ${props => props.theme.function.memo.badges[props.$type].background};
  color: ${props => props.theme.function.memo.badges[props.$type].text};
  margin-left: 4px;
`;

const ProcessingIndicator = styled.div<{ $isProcessing?: boolean; $isCacheHit?: boolean }>`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.$isProcessing) return props.theme.status.processing;
    if (props.$isCacheHit) return props.theme.function.memo.cache.hit.indicator;
    return props.theme.status.idle;
  }};
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

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  executionTime: number;
}

interface MemoMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageExecutionTime: number;
  cacheSize: number;
  maxSize: number;
}

export const MemoNode: React.FC<MemoNodeProps> = ({
  data,
  selected,
  onSelect,
  onPortConnect,
  onPositionChange,
  isProcessing = false,
  isCacheHit = false,
  ...rest
}) => {
  const theme = useTheme();

  const { cache, metrics, currentKey } = useMemo(() => {
    const cachePort = data.inputs.find(port => port.label === 'cache');
    const metricsPort = data.inputs.find(port => port.label === 'metrics');
    const currentKeyPort = data.inputs.find(port => port.label === 'currentKey');
    
    const getPortValue = (port: typeof cachePort) => {
      if (!port) return undefined;
      return (port as any).value;
    };
    
    return {
      cache: (getPortValue(cachePort) || []) as CacheEntry[],
      metrics: (getPortValue(metricsPort) || {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageExecutionTime: 0,
        cacheSize: 0,
        maxSize: 100
      }) as MemoMetrics,
      currentKey: getPortValue(currentKeyPort) as string
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
        <ProcessingIndicator $isProcessing={isProcessing} $isCacheHit={isCacheHit} />
        <NodeContent>
          <CachePreview>
            Cache Entries:
            {cache.map((entry, index) => (
              <CacheEntry 
                key={index} 
                $isHit={entry.key === currentKey}
              >
                <KeyValue>
                  <Key>{entry.key}</Key>
                  <Value>
                    {typeof entry.value === 'object' 
                      ? JSON.stringify(entry.value) 
                      : String(entry.value)}
                  </Value>
                </KeyValue>
                <Timestamp>{formatTimestamp(entry.timestamp)}</Timestamp>
              </CacheEntry>
            ))}
          </CachePreview>
          
          <PerformanceMetrics>
            <MetricRow>
              <MetricLabel>Cache Status</MetricLabel>
              <div>
                <Badge $type="hit">Hits: {metrics.hits}</Badge>
                <Badge $type="miss">Misses: {metrics.misses}</Badge>
                <Badge $type="size">
                  {metrics.cacheSize}/{metrics.maxSize}
                </Badge>
              </div>
            </MetricRow>
            <MetricRow>
              <MetricLabel>Hit Rate</MetricLabel>
              <MetricValue>{(metrics.hitRate * 100).toFixed(1)}%</MetricValue>
            </MetricRow>
            <MetricRow>
              <MetricLabel>Avg. Execution Time</MetricLabel>
              <MetricValue>{formatTime(metrics.averageExecutionTime)}</MetricValue>
            </MetricRow>
          </PerformanceMetrics>
        </NodeContent>
      </NodeContainer>
    </Wrapper>
  );
}; 