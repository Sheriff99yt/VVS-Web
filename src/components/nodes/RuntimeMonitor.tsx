import React, { useMemo } from 'react';
import styled from 'styled-components';

interface RuntimeState {
    id: string;
    nodeId: string;
    timestamp: number;
    type: 'execution' | 'memory' | 'error' | 'breakpoint' | 'custom';
    status: 'active' | 'completed' | 'error';
    data: {
        executionTime?: number;
        memoryUsage?: number;
        errorMessage?: string;
        breakpointCondition?: string;
        customData?: Record<string, any>;
    };
    metadata?: {
        stackTrace?: string[];
        variables?: Record<string, any>;
        callStack?: string[];
    };
}

interface RuntimeMonitorProps {
    states: RuntimeState[];
    selectedNodeId?: string;
    onStateSelect?: (state: RuntimeState) => void;
    showStackTrace?: boolean;
    showVariables?: boolean;
    showCallStack?: boolean;
}

const Container = styled.div`
    position: fixed;
    bottom: 0;
    right: 0;
    width: 300px;
    max-height: 400px;
    background-color: ${props => props.theme.background.primary};
    border: 1px solid ${props => props.theme.border.primary};
    border-radius: 8px 0 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 1000;
`;

const Header = styled.div`
    padding: 8px 12px;
    background-color: ${props => props.theme.background.secondary};
    border-bottom: 1px solid ${props => props.theme.border.primary};
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Title = styled.h3`
    margin: 0;
    font-size: 14px;
    color: ${props => props.theme.text.primary};
`;

const Content = styled.div`
    padding: 8px;
    max-height: 352px;
    overflow-y: auto;
`;

const StateEntry = styled.div<{ isSelected?: boolean; status: RuntimeState['status'] }>`
    padding: 8px;
    margin-bottom: 8px;
    background-color: ${props => props.isSelected ? props.theme.background.hover : props.theme.background.secondary};
    border-radius: 4px;
    border-left: 3px solid ${props => {
        switch (props.status) {
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
    cursor: pointer;

    &:hover {
        background-color: ${props => props.theme.background.hover};
    }
`;

const StateHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
`;

const StateType = styled.span`
    font-size: 12px;
    color: ${props => props.theme.text.secondary};
`;

const StateTime = styled.span`
    font-size: 10px;
    color: ${props => props.theme.text.tertiary};
`;

const StateData = styled.div`
    font-size: 12px;
    color: ${props => props.theme.text.primary};
    margin-top: 4px;
`;

const MetadataSection = styled.div`
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid ${props => props.theme.border.secondary};
`;

const MetadataTitle = styled.div`
    font-size: 11px;
    color: ${props => props.theme.text.secondary};
    margin-bottom: 4px;
`;

const MetadataContent = styled.pre`
    font-size: 10px;
    color: ${props => props.theme.text.primary};
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
`;

const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
};

const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const RuntimeMonitor: React.FC<RuntimeMonitorProps> = ({
    states,
    selectedNodeId,
    onStateSelect,
    showStackTrace = true,
    showVariables = true,
    showCallStack = true
}) => {
    const filteredStates = useMemo(() => {
        return selectedNodeId
            ? states.filter(state => state.nodeId === selectedNodeId)
            : states;
    }, [states, selectedNodeId]);

    const renderStateData = (state: RuntimeState) => {
        switch (state.type) {
            case 'execution':
                return state.data.executionTime && (
                    <StateData>Execution time: {formatDuration(state.data.executionTime)}</StateData>
                );
            case 'memory':
                return state.data.memoryUsage && (
                    <StateData>Memory usage: {formatBytes(state.data.memoryUsage)}</StateData>
                );
            case 'error':
                return state.data.errorMessage && (
                    <StateData>Error: {state.data.errorMessage}</StateData>
                );
            case 'breakpoint':
                return state.data.breakpointCondition && (
                    <StateData>Condition: {state.data.breakpointCondition}</StateData>
                );
            case 'custom':
                return state.data.customData && (
                    <StateData>{JSON.stringify(state.data.customData, null, 2)}</StateData>
                );
            default:
                return null;
        }
    };

    return (
        <Container>
            <Header>
                <Title>Runtime Monitor</Title>
            </Header>
            <Content>
                {filteredStates.map(state => (
                    <StateEntry
                        key={state.id}
                        status={state.status}
                        isSelected={selectedNodeId === state.nodeId}
                        onClick={() => onStateSelect?.(state)}
                    >
                        <StateHeader>
                            <StateType>{state.type}</StateType>
                            <StateTime>{formatTime(state.timestamp)}</StateTime>
                        </StateHeader>
                        {renderStateData(state)}
                        {state.metadata && (
                            <>
                                {showStackTrace && state.metadata.stackTrace && (
                                    <MetadataSection>
                                        <MetadataTitle>Stack Trace</MetadataTitle>
                                        <MetadataContent>
                                            {state.metadata.stackTrace.join('\n')}
                                        </MetadataContent>
                                    </MetadataSection>
                                )}
                                {showVariables && state.metadata.variables && (
                                    <MetadataSection>
                                        <MetadataTitle>Variables</MetadataTitle>
                                        <MetadataContent>
                                            {JSON.stringify(state.metadata.variables, null, 2)}
                                        </MetadataContent>
                                    </MetadataSection>
                                )}
                                {showCallStack && state.metadata.callStack && (
                                    <MetadataSection>
                                        <MetadataTitle>Call Stack</MetadataTitle>
                                        <MetadataContent>
                                            {state.metadata.callStack.join('\n')}
                                        </MetadataContent>
                                    </MetadataSection>
                                )}
                            </>
                        )}
                    </StateEntry>
                ))}
            </Content>
        </Container>
    );
}; 