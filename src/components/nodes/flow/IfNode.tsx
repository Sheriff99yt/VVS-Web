import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface IfNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    executionPath?: 'then' | 'else' | null;
}

const IfNodeContainer = styled.div`
    position: relative;
`;

const ExecutionPathIndicator = styled.div<{ path: 'then' | 'else'; isActive: boolean }>`
    position: absolute;
    right: ${props => props.path === 'then' ? '-24px' : '-24px'};
    top: ${props => props.path === 'then' ? '40%' : '60%'};
    width: 20px;
    height: 2px;
    background-color: ${props => props.isActive ? props.theme.execution.activePath : props.theme.execution.inactivePath};
    opacity: ${props => props.isActive ? props.theme.execution.activeOpacity : props.theme.execution.inactiveOpacity};
    transform-origin: left center;
    transition: all 0.3s ease;
`;

const ConditionBox = styled.div<{ conditionState: 'true' | 'false' | 'unknown' }>`
    position: absolute;
    right: -32px;
    top: 50%;
    transform: translateY(-50%);
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

const NodeContent = styled.div`
    padding: 8px;
    margin: 8px 0;
    border-radius: 4px;
    background-color: ${props => props.theme.node.background}20;
    font-size: 12px;
    color: ${props => props.theme.node.text};
`;

export const IfNode: React.FC<IfNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    executionPath
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
        <IfNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                if ({data.inputs.find(port => port.id === 'condition')?.label})
            </NodeContent>
            <ExecutionPathIndicator 
                path="then" 
                isActive={executionPath === 'then'} 
            />
            <ExecutionPathIndicator 
                path="else" 
                isActive={executionPath === 'else'} 
            />
            <ConditionBox conditionState={conditionValue}>
                {conditionValue === 'true' ? 'T' : conditionValue === 'false' ? 'F' : '?'}
            </ConditionBox>
        </IfNodeContainer>
    );
}; 