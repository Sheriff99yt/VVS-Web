import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface NetworkNodeMetadata {
    description?: string;
    tags?: string[];
    version?: string;
    deprecated?: boolean;
    complexity?: number;
    isPure?: boolean;
    isAsync?: boolean;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    protocol?: 'http' | 'https' | 'ws' | 'wss';
    timeout?: number;
    retryCount?: number;
}

interface NetworkNodeData extends Omit<INodeData, 'metadata'> {
    metadata?: NetworkNodeMetadata;
}

interface NetworkStats {
    requestCount: number;
    lastResponseTime: number;
    avgResponseTime: number;
    successRate: number;
    bytesTransferred: number;
    isConnected?: boolean;
    messageCount?: number;
}

interface NetworkNodeProps {
    data: NetworkNodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isProcessing?: boolean;
    error?: string;
    stats?: NetworkStats;
}

const NetworkNodeContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const NodeContent = styled.div`
    padding: 8px;
    font-size: 12px;
    color: ${props => props.theme.text.primary};
`;

const ProcessingIndicator = styled.div<{ isActive: boolean }>`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.isActive ? props.theme.colors.warning : props.theme.colors.disabled};
    border: 2px solid ${props => props.theme.background.secondary};
    transition: background-color 0.3s ease;
`;

const ErrorIndicator = styled.div`
    position: absolute;
    top: -8px;
    left: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.theme.colors.error};
    border: 2px solid ${props => props.theme.background.secondary};
    cursor: help;
`;

const ConnectionIndicator = styled.div<{ isConnected: boolean }>`
    position: absolute;
    bottom: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.isConnected ? props.theme.colors.success : props.theme.colors.error};
    border: 2px solid ${props => props.theme.background.secondary};
    transition: background-color 0.3s ease;
`;

const StatsPanel = styled.div`
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 10px;
    color: ${props => props.theme.text.secondary};
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`;

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

export const NetworkNode: React.FC<NetworkNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isProcessing,
    error,
    stats
}) => {
    const operationType = useMemo(() => {
        const protocol = data.metadata?.protocol || 'http';
        const method = data.metadata?.method;
        return protocol === 'ws' || protocol === 'wss' 
            ? 'WebSocket'
            : `HTTP ${method || 'GET'}`;
    }, [data.metadata]);

    const endpoint = useMemo(() => {
        return data.inputs.find(port => port.id === 'url')?.validation?.customValidation?.(null) || 'No endpoint';
    }, [data.inputs]);

    return (
        <NetworkNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                {operationType}: {endpoint}
            </NodeContent>
            {isProcessing && <ProcessingIndicator isActive={true} />}
            {error && <ErrorIndicator title={error} />}
            {stats?.isConnected !== undefined && (
                <ConnectionIndicator isConnected={stats.isConnected} />
            )}
            {stats && (
                <StatsPanel>
                    {stats.requestCount > 0 && `${stats.requestCount} req`}
                    {stats.messageCount !== undefined && `${stats.messageCount} msg`}
                    {stats.lastResponseTime > 0 && formatTime(stats.lastResponseTime)}
                    {stats.bytesTransferred > 0 && formatBytes(stats.bytesTransferred)}
                    {stats.successRate < 100 && `${stats.successRate.toFixed(1)}% success`}
                </StatsPanel>
            )}
        </NetworkNodeContainer>
    );
}; 