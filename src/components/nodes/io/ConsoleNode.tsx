import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ConsoleNodeMetadata {
    description?: string;
    tags?: string[];
    version?: string;
    deprecated?: boolean;
    complexity?: number;
    isPure?: boolean;
    isAsync?: boolean;
    defaultPrompt?: string;
    bufferSize?: number;
    maxLines?: number;
}

interface ConsoleNodeData extends Omit<INodeData, 'metadata'> {
    metadata?: ConsoleNodeMetadata;
}

interface ConsoleBuffer {
    stdout: string[];
    stderr: string[];
    stdin: string[];
    currentPrompt?: string;
    isWaitingForInput: boolean;
    bufferSize: number;
    maxLines: number;
}

interface ConsoleNodeProps {
    data: ConsoleNodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isProcessing?: boolean;
    error?: string;
    buffer?: ConsoleBuffer;
}

type LineType = 'stdout' | 'stderr' | 'stdin' | 'prompt';

interface ConsoleLine {
    type: LineType;
    content: string;
}

const ConsoleNodeContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const NodeContent = styled.div`
    padding: 8px;
    font-size: 12px;
    color: ${props => props.theme.text.primary};
`;

const ConsoleOutput = styled.div`
    margin-top: 8px;
    padding: 4px;
    background-color: ${props => props.theme.background.secondary};
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    max-height: 120px;
    overflow-y: auto;
`;

const StdoutLine = styled.div`
    color: ${props => props.theme.text.primary};
    white-space: pre-wrap;
    word-break: break-all;
`;

const StderrLine = styled.div`
    color: ${props => props.theme.colors.error};
    white-space: pre-wrap;
    word-break: break-all;
`;

const StdinLine = styled.div`
    color: ${props => props.theme.colors.success};
    white-space: pre-wrap;
    word-break: break-all;
    &::before {
        content: '> ';
        color: ${props => props.theme.text.secondary};
    }
`;

const PromptLine = styled.div`
    color: ${props => props.theme.text.secondary};
    white-space: pre-wrap;
    word-break: break-all;
    &::before {
        content: '? ';
        color: ${props => props.theme.colors.warning};
    }
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

const BufferStats = styled.div`
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 10px;
    color: ${props => props.theme.text.secondary};
`;

export const ConsoleNode: React.FC<ConsoleNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isProcessing,
    error,
    buffer = {
        stdout: [],
        stderr: [],
        stdin: [],
        isWaitingForInput: false,
        bufferSize: 1024,
        maxLines: 100
    }
}) => {
    const operationType = useMemo(() => {
        return data.type === 'print' ? 'Print' : 'Input';
    }, [data.type]);

    const bufferUsage = useMemo(() => {
        const total = buffer.stdout.join('\n').length +
            buffer.stderr.join('\n').length +
            buffer.stdin.join('\n').length;
        return Math.round((total / buffer.bufferSize) * 100);
    }, [buffer]);

    const displayLines = useMemo(() => {
        const allLines: ConsoleLine[] = [
            ...buffer.stdout.map(line => ({ type: 'stdout' as const, content: line })),
            ...buffer.stderr.map(line => ({ type: 'stderr' as const, content: line })),
            ...buffer.stdin.map(line => ({ type: 'stdin' as const, content: line }))
        ].sort((a, b) => a.content.localeCompare(b.content))
        .slice(-buffer.maxLines);

        if (buffer.isWaitingForInput && buffer.currentPrompt) {
            allLines.push({ type: 'prompt', content: buffer.currentPrompt });
        }

        return allLines;
    }, [buffer]);

    return (
        <ConsoleNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                {operationType}
                <ConsoleOutput>
                    {displayLines.map((line, index) => {
                        switch (line.type) {
                            case 'stdout':
                                return <StdoutLine key={index}>{line.content}</StdoutLine>;
                            case 'stderr':
                                return <StderrLine key={index}>{line.content}</StderrLine>;
                            case 'stdin':
                                return <StdinLine key={index}>{line.content}</StdinLine>;
                            case 'prompt':
                                return <PromptLine key={index}>{line.content}</PromptLine>;
                        }
                    })}
                </ConsoleOutput>
            </NodeContent>
            {isProcessing && <ProcessingIndicator isActive={true} />}
            {error && <ErrorIndicator title={error} />}
            <BufferStats>
                {bufferUsage}% buffer used
                {buffer.maxLines < displayLines.length && ` (${displayLines.length - buffer.maxLines} lines truncated)`}
            </BufferStats>
        </ConsoleNodeContainer>
    );
}; 