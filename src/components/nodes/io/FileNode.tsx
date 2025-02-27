import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface FileNodeMetadata {
    description?: string;
    tags?: string[];
    version?: string;
    deprecated?: boolean;
    complexity?: number;
    isPure?: boolean;
    isAsync?: boolean;
    isStream?: boolean;
    mode?: 'read' | 'write' | 'append';
    encoding?: string;
    createIfNotExists?: boolean;
}

interface FileNodeData extends Omit<INodeData, 'metadata'> {
    metadata?: FileNodeMetadata;
}

interface FileNodeProps {
    data: FileNodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isProcessing?: boolean;
    progress?: number;
    error?: string;
    streamStats?: {
        bytesRead: number;
        bytesWritten: number;
        isEOF: boolean;
    };
}

const FileNodeContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const NodeContent = styled.div`
    padding: 8px;
    font-size: 12px;
    color: ${props => props.theme.text.primary};
`;

const ProgressBar = styled.div<{ progress: number }>`
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${props => props.progress}%;
    height: 4px;
    background-color: ${props => props.theme.colors.success};
    transition: width 0.3s ease;
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

const StreamStats = styled.div`
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 10px;
    color: ${props => props.theme.text.secondary};
`;

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const FileNode: React.FC<FileNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isProcessing,
    progress = 0,
    error,
    streamStats
}) => {
    const operationType = useMemo(() => {
        const isStream = data.metadata?.isStream;
        const mode = data.metadata?.mode || 'read';
        return `${isStream ? 'Stream ' : ''}${mode === 'read' ? 'Read' : mode === 'append' ? 'Append' : 'Write'}`;
    }, [data.metadata]);

    const filePath = useMemo(() => {
        return data.inputs.find(port => port.id === 'path')?.validation?.customValidation?.(null) || 'No file selected';
    }, [data.inputs]);

    return (
        <FileNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                {operationType}: {filePath}
            </NodeContent>
            {isProcessing && <ProcessingIndicator isActive={true} />}
            {error && <ErrorIndicator title={error} />}
            {progress > 0 && <ProgressBar progress={progress} />}
            {streamStats && (
                <StreamStats>
                    {streamStats.bytesRead > 0 && `↓${formatBytes(streamStats.bytesRead)} `}
                    {streamStats.bytesWritten > 0 && `↑${formatBytes(streamStats.bytesWritten)}`}
                    {streamStats.isEOF && ' (EOF)'}
                </StreamStats>
            )}
        </FileNodeContainer>
    );
}; 