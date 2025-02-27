import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

interface NodeState {
    id: string;
    status: 'idle' | 'executing' | 'completed' | 'error';
    startTime?: number;
    endTime?: number;
    error?: string;
    data?: {
        inputs: Record<string, any>;
        outputs: Record<string, any>;
        intermediateStates?: Record<string, any>;
    };
    performance?: {
        executionTime: number;
        memoryUsage: number;
        operationsCount: number;
    };
    breakpoints?: {
        active: boolean;
        condition?: string;
        hitCount: number;
    };
}

interface StateVisualizerProps {
    state: NodeState;
    showPerformance?: boolean;
    showData?: boolean;
    showBreakpoints?: boolean;
    onBreakpointToggle?: (nodeId: string) => void;
}

const pulse = keyframes`
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0.6; }
`;

const Container = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
    z-index: 2;
`;

const ExecutionOverlay = styled.div<{ status: NodeState['status'] }>`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: 8px;
    background-color: ${props => {
        switch (props.status) {
            case 'executing':
                return 'rgba(255, 193, 7, 0.1)';
            case 'completed':
                return 'rgba(76, 175, 80, 0.1)';
            case 'error':
                return 'rgba(244, 67, 54, 0.1)';
            default:
                return 'transparent';
        }
    }};
    border: 2px solid ${props => {
        switch (props.status) {
            case 'executing':
                return props.theme.colors.warning;
            case 'completed':
                return props.theme.colors.success;
            case 'error':
                return props.theme.colors.error;
            default:
                return 'transparent';
        }
    }};
    animation: ${props => props.status === 'executing' ? pulse : 'none'} 2s infinite;
`;

const StateIndicator = styled.div<{ status: NodeState['status'] }>`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => {
        switch (props.status) {
            case 'executing':
                return props.theme.colors.warning;
            case 'completed':
                return props.theme.colors.success;
            case 'error':
                return props.theme.colors.error;
            default:
                return props.theme.colors.disabled;
        }
    }};
    border: 2px solid ${props => props.theme.background.secondary};
    cursor: help;
`;

const PerformancePanel = styled.div`
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 10px;
    color: ${props => props.theme.text.secondary};
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
`;

const DataPanel = styled.div`
    position: absolute;
    bottom: 8px;
    left: 8px;
    font-size: 10px;
    color: ${props => props.theme.text.secondary};
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    max-width: 150px;
    overflow: hidden;
`;

const BreakpointIndicator = styled.div<{ active: boolean }>`
    position: absolute;
    top: -8px;
    left: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.active ? props.theme.colors.error : props.theme.colors.disabled};
    border: 2px solid ${props => props.theme.background.secondary};
    cursor: pointer;
    pointer-events: all;

    &:hover {
        transform: scale(1.1);
        filter: brightness(1.2);
    }
`;

const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const truncateValue = (value: any): string => {
    const str = JSON.stringify(value);
    return str.length > 20 ? str.substring(0, 17) + '...' : str;
};

export const StateVisualizer: React.FC<StateVisualizerProps> = ({
    state,
    showPerformance = true,
    showData = true,
    showBreakpoints = true,
    onBreakpointToggle
}) => {
    const executionTime = useMemo(() => {
        if (state.startTime && state.endTime) {
            return state.endTime - state.startTime;
        }
        return state.performance?.executionTime || 0;
    }, [state]);

    return (
        <Container>
            <ExecutionOverlay status={state.status} />
            <StateIndicator
                status={state.status}
                title={state.error || state.status}
            />
            {showBreakpoints && state.breakpoints && (
                <BreakpointIndicator
                    active={state.breakpoints.active}
                    onClick={() => onBreakpointToggle?.(state.id)}
                    title={`Breakpoint ${state.breakpoints.active ? 'enabled' : 'disabled'}
${state.breakpoints.condition ? `\nCondition: ${state.breakpoints.condition}` : ''}
Hit count: ${state.breakpoints.hitCount}`}
                />
            )}
            {showPerformance && state.performance && (
                <PerformancePanel>
                    <div>Time: {formatDuration(executionTime)}</div>
                    <div>Memory: {formatBytes(state.performance.memoryUsage)}</div>
                    <div>Ops: {state.performance.operationsCount}</div>
                </PerformancePanel>
            )}
            {showData && state.data && (
                <DataPanel>
                    {Object.entries(state.data.outputs).map(([key, value]) => (
                        <div key={key} title={JSON.stringify(value, null, 2)}>
                            {key}: {truncateValue(value)}
                        </div>
                    ))}
                </DataPanel>
            )}
        </Container>
    );
}; 