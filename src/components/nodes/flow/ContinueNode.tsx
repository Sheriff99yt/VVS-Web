import React from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface ContinueNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    isActive?: boolean;
}

const ContinueNodeContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const NodeContent = styled.div`
    padding: 8px;
    font-size: 12px;
    color: ${props => props.theme.text.primary};
`;

const ContinueIndicator = styled.div<{ isActive: boolean }>`
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

export const ContinueNode: React.FC<ContinueNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    isActive
}) => {
    return (
        <ContinueNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                continue
            </NodeContent>
            <ContinueIndicator isActive={isActive || false} />
        </ContinueNodeContainer>
    );
}; 