import React, { useMemo } from 'react';
import styled from 'styled-components';
import { IPort } from '../../core/NodeSystem';

interface PortConnectionProps {
    sourcePort: IPort;
    targetPort: IPort;
    sourcePosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    isValid?: boolean;
    isHighlighted?: boolean;
    isAnimated?: boolean;
    onClick?: () => void;
}

interface ConnectionPoint {
    x: number;
    y: number;
    type: 'source' | 'target';
    dataType: string;
    isExec: boolean;
}

const ConnectionContainer = styled.svg`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
`;

const ConnectionPath = styled.path<{
    $dataType: string;
    $isExec: boolean;
    $isValid: boolean;
    $isHighlighted: boolean;
    $isAnimated: boolean;
}>`
    fill: none;
    stroke: ${props => getConnectionColor(props.$dataType, props.$isExec, props.$isValid)};
    stroke-width: ${props => props.$isHighlighted ? 3 : 2}px;
    stroke-dasharray: ${props => props.$isAnimated ? '5,5' : 'none'};
    transition: stroke 0.3s ease, stroke-width 0.3s ease;
    pointer-events: all;
    cursor: pointer;
    opacity: ${props => props.$isValid ? 1 : 0.5};

    &:hover {
        stroke-width: 3px;
        filter: brightness(1.2);
    }

    ${props => props.$isAnimated && `
        animation: flowAnimation 30s linear infinite;
    `}

    @keyframes flowAnimation {
        from {
            stroke-dashoffset: 20;
        }
        to {
            stroke-dashoffset: 0;
        }
    }
`;

const Handle = styled.circle<{
    $dataType: string;
    $isExec: boolean;
    $isValid: boolean;
}>`
    fill: ${props => getConnectionColor(props.$dataType, props.$isExec, props.$isValid)};
    stroke: ${props => props.theme.background.secondary};
    stroke-width: 2px;
    transition: all 0.3s ease;
    pointer-events: all;
    cursor: pointer;

    &:hover {
        transform: scale(1.2);
        filter: brightness(1.2);
    }
`;

const getConnectionColor = (dataType: string, isExec: boolean, isValid: boolean) => {
    if (!isValid) return '#f44336';
    if (isExec) return '#4caf50';

    switch (dataType) {
        case 'number':
            return '#00ff00';
        case 'string':
            return '#ff00ff';
        case 'boolean':
            return '#de3c3c';
        case 'object':
            return '#4b0082';
        case 'array':
            return '#4b0082';
        case 'any':
            return '#ffffff';
        default:
            return '#cccccc';
    }
};

export const PortConnection: React.FC<PortConnectionProps> = ({
    sourcePort,
    targetPort,
    sourcePosition,
    targetPosition,
    isValid = true,
    isHighlighted = false,
    isAnimated = false,
    onClick
}) => {
    const points = useMemo(() => {
        const source: ConnectionPoint = {
            x: sourcePosition.x,
            y: sourcePosition.y,
            type: 'source',
            dataType: sourcePort.dataType,
            isExec: sourcePort.isExec || false
        };

        const target: ConnectionPoint = {
            x: targetPosition.x,
            y: targetPosition.y,
            type: 'target',
            dataType: targetPort.dataType,
            isExec: targetPort.isExec || false
        };

        return { source, target };
    }, [sourcePort, targetPort, sourcePosition, targetPosition]);

    const path = useMemo(() => {
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const controlPointOffset = Math.min(Math.abs(dx), 150);

        return `M ${points.source.x} ${points.source.y} 
                C ${points.source.x + controlPointOffset} ${points.source.y},
                  ${points.target.x - controlPointOffset} ${points.target.y},
                  ${points.target.x} ${points.target.y}`;
    }, [points]);

    return (
        <ConnectionContainer>
            <ConnectionPath
                d={path}
                $dataType={sourcePort.dataType}
                $isExec={sourcePort.isExec || false}
                $isValid={isValid}
                $isHighlighted={isHighlighted}
                $isAnimated={isAnimated}
                onClick={onClick}
            />
            <Handle
                cx={points.source.x}
                cy={points.source.y}
                r={6}
                $dataType={points.source.dataType}
                $isExec={points.source.isExec}
                $isValid={isValid}
            />
            <Handle
                cx={points.target.x}
                cy={points.target.y}
                r={6}
                $dataType={points.target.dataType}
                $isExec={points.target.isExec}
                $isValid={isValid}
            />
        </ConnectionContainer>
    );
}; 