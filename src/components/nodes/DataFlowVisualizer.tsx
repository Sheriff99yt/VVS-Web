import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { IPort } from '../../core/NodeSystem';

interface DataFlow {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePort: IPort;
    targetPort: IPort;
    data: any;
    timestamp: number;
    status: 'pending' | 'active' | 'completed' | 'error';
    performance?: {
        transferTime: number;
        dataSize: number;
    };
}

interface DataFlowVisualizerProps {
    flows: DataFlow[];
    connections: {
        id: string;
        sourceNodeId: string;
        targetNodeId: string;
        path: string;
    }[];
    showPerformance?: boolean;
}

const flowAnimation = keyframes`
    0% { stroke-dashoffset: 20; }
    100% { stroke-dashoffset: 0; }
`;

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
`;

const FlowPath = styled.path<{
    $status: DataFlow['status'];
    $dataType: string;
}>`
    fill: none;
    stroke: ${props => {
        switch (props.$status) {
            case 'active':
                return props.theme.colors.warning;
            case 'completed':
                return props.theme.colors.success;
            case 'error':
                return props.theme.colors.error;
            default:
                return props.theme.colors.disabled;
        }
    }};
    stroke-width: 3px;
    stroke-dasharray: 5;
    animation: ${flowAnimation} 1s linear infinite;
    opacity: ${props => props.$status === 'pending' ? 0.3 : 1};
`;

const DataIndicator = styled.circle<{
    $status: DataFlow['status'];
}>`
    fill: ${props => {
        switch (props.$status) {
            case 'active':
                return props.theme.colors.warning;
            case 'completed':
                return props.theme.colors.success;
            case 'error':
                return props.theme.colors.error;
            default:
                return props.theme.colors.disabled;
        }
    }};
    stroke: ${props => props.theme.background.secondary};
    stroke-width: 2px;
    r: 6;
`;

const PerformanceLabel = styled.text`
    font-size: 10px;
    fill: ${props => props.theme.text.secondary};
    text-anchor: middle;
    pointer-events: none;
`;

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

export const DataFlowVisualizer: React.FC<DataFlowVisualizerProps> = ({
    flows,
    connections,
    showPerformance = true
}) => {
    const activeFlows = useMemo(() => {
        return flows.filter(flow => flow.status !== 'completed');
    }, [flows]);

    const getConnectionPath = (flowId: string): string | undefined => {
        const connection = connections.find(conn => conn.id === flowId);
        return connection?.path;
    };

    const getPathMidpoint = (path: string): { x: number; y: number } => {
        // Parse the path string to find the midpoint of the bezier curve
        const matches = path.match(/M ([\d.]+) ([\d.]+) C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)/);
        if (!matches) return { x: 0, y: 0 };

        const [, x1, y1, , , , , x2, y2] = matches.map(Number);
        return {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2
        };
    };

    return (
        <Container>
            <svg width="100%" height="100%">
                {activeFlows.map(flow => {
                    const path = getConnectionPath(flow.id);
                    if (!path) return null;

                    const midpoint = getPathMidpoint(path);

                    return (
                        <g key={flow.id}>
                            <FlowPath
                                d={path}
                                $status={flow.status}
                                $dataType={flow.sourcePort.dataType}
                            />
                            <DataIndicator
                                cx={midpoint.x}
                                cy={midpoint.y}
                                $status={flow.status}
                            />
                            {showPerformance && flow.performance && (
                                <PerformanceLabel
                                    x={midpoint.x}
                                    y={midpoint.y - 15}
                                >
                                    {formatBytes(flow.performance.dataSize)} in {formatDuration(flow.performance.transferTime)}
                                </PerformanceLabel>
                            )}
                        </g>
                    );
                })}
            </svg>
        </Container>
    );
}; 