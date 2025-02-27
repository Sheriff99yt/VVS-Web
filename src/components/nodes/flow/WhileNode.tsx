import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface WhileNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isLooping?: boolean;
    currentIteration?: number;
}

const WhileNodeContainer = styled.div`
    position: relative;
`;

const LoopIndicator = styled.div<{ isActive: boolean }>`
    position: absolute;
    right: -40px;
    top: 0;
    bottom: 0;
    width: 32px;
    border: 2px solid ${props => props.isActive ? props.theme.flow.loop.active : props.theme.flow.loop.inactive};
    border-left: none;
    border-radius: 0 8px 8px 0;
    opacity: ${props => props.isActive ? props.theme.execution.activeOpacity : props.theme.execution.inactiveOpacity};
    transition: all 0.3s ease;
`;

const IterationCounter = styled.div`
    position: absolute;
    right: -64px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    border-radius: 12px;
    background-color: ${props => props.theme.flow.loop.iteration};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    opacity: 0.8;
    transition: all 0.3s ease;

    &:hover {
        opacity: 1;
    }
`;

const NodeContent = styled.div`
    padding: 8px;
    margin: 8px 0;
    border-radius: 4px;
    background-color: ${props => props.theme.node.background}20;
    font-size: 12px;
    color: ${props => props.theme.node.text};
`;

const ConditionBox = styled.div<{ conditionState: 'true' | 'false' | 'unknown' }>`
    position: absolute;
    right: -32px;
    top: 16px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: ${props => props.theme.flow.condition[props.conditionState]};
    opacity: 0.3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: ${props => props.theme.node.text};
    transition: all 0.3s ease;

    &:hover {
        opacity: 0.6;
    }
`;

export const WhileNode: React.FC<WhileNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isLooping,
    currentIteration = 0
}) => {
    const conditionValue = useMemo(() => {
        const conditionPort = data.inputs.find(port => port.id === 'condition');
        if (!conditionPort) return 'unknown';
        if (conditionPort.validation?.customValidation) {
            return conditionPort.validation.customValidation(null) ? 'true' : 'false';
        }
        return 'unknown';
    }, [data.inputs]) as 'true' | 'false' | 'unknown';

    return (
        <WhileNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                while ({data.inputs.find(port => port.id === 'condition')?.label})
            </NodeContent>
            <LoopIndicator isActive={isLooping || false} />
            {(isLooping || currentIteration > 0) && (
                <IterationCounter>
                    {currentIteration}
                </IterationCounter>
            )}
            <ConditionBox conditionState={conditionValue}>
                {conditionValue === 'true' ? 'T' : conditionValue === 'false' ? 'F' : '?'}
            </ConditionBox>
        </WhileNodeContainer>
    );
}; 