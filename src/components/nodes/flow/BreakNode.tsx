import React from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface BreakNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isActive?: boolean;
}

const BreakNodeContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const NodeContent = styled.div`
    padding: 8px;
    font-size: 12px;
    color: ${props => props.theme.text.primary};
`;

const BreakIndicator = styled.div<{ isActive: boolean }>`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.isActive ? props.theme.colors.error : props.theme.colors.disabled};
    border: 2px solid ${props => props.theme.background.secondary};
    transition: background-color 0.3s ease;
`;

export const BreakNode: React.FC<BreakNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isActive
}) => {
    return (
        <BreakNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                break
            </NodeContent>
            <BreakIndicator isActive={isActive || false} />
        </BreakNodeContainer>
    );
}; 