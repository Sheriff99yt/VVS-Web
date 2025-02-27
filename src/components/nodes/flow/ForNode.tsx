import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ForNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isLooping?: boolean;
    currentIteration?: number;
}

const ForNodeContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const NodeContent = styled.div`
    padding: 8px;
    font-size: 12px;
    color: ${props => props.theme.text.primary};
`;

const LoopIndicator = styled.div<{ isActive: boolean }>`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.isActive ? props.theme.colors.success : props.theme.colors.disabled};
    border: 2px solid ${props => props.theme.background.secondary};
    transition: background-color 0.3s ease;
`;

const IterationCounter = styled.div`
    position: absolute;
    bottom: -8px;
    right: -8px;
    min-width: 20px;
    height: 20px;
    padding: 2px 4px;
    border-radius: 10px;
    background-color: ${props => props.theme.background.secondary};
    color: ${props => props.theme.text.primary};
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const LoopRange = styled.div`
    font-size: 11px;
    color: ${props => props.theme.text.secondary};
    margin-top: 4px;
`;

export const ForNode: React.FC<ForNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isLooping,
    currentIteration = 0
}) => {
    const loopRange = useMemo(() => {
        const start = data.inputs.find(port => port.id === 'start')?.validation?.customValidation?.(null) ?? '0';
        const end = data.inputs.find(port => port.id === 'end')?.validation?.customValidation?.(null) ?? '0';
        const step = data.inputs.find(port => port.id === 'step')?.validation?.customValidation?.(null) ?? '1';
        return `${start} to ${end} by ${step}`;
    }, [data.inputs]);

    return (
        <ForNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                for (i = {loopRange})
            </NodeContent>
            <LoopIndicator isActive={isLooping || false} />
            {(isLooping || currentIteration > 0) && (
                <IterationCounter>
                    {currentIteration}
                </IterationCounter>
            )}
            <LoopRange>{loopRange}</LoopRange>
        </ForNodeContainer>
    );
}; 