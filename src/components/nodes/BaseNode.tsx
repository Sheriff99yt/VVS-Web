import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { INodeData, IPort } from '../../core/NodeSystem';
import { Theme } from '../../theme/types';

interface BaseNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    onPortDragStart?: (nodeId: string, port: IPort, position: { x: number; y: number }) => void;
    onPortDragEnd?: (nodeId: string, port: IPort) => void;
}

const NodeContainer = styled.div<{ selected?: boolean }>`
    position: relative;
    background: ${(props) => props.theme.node.background};
    border: 2px solid ${(props) => props.selected ? props.theme.node.selectedBorder : props.theme.node.border};
    border-radius: 8px;
    padding: 12px;
    min-width: 200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    user-select: none;
    transition: all 0.2s ease;

    &:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
`;

const NodeHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid ${(props) => props.theme.node.border};
`;

const NodeTitle = styled.h3`
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: ${(props) => props.theme.node.title};
`;

const NodeType = styled.span`
    font-size: 12px;
    color: ${(props) => props.theme.node.type};
    margin-left: 8px;
    opacity: 0.7;
`;

const PortsContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

const PortList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Port = styled.div<{ isExec?: boolean; isInput?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
        background-color: ${(props) => props.theme.node.portHover};
    }
`;

const PortDot = styled.div<{ isExec?: boolean; isInput?: boolean; isConnectable?: boolean }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${(props) => props.isExec ? props.theme.port.exec : props.theme.port.data};
    border: 2px solid ${(props) => props.theme.port.border};
    transition: all 0.2s ease;
    cursor: ${props => props.isConnectable ? 'crosshair' : 'not-allowed'};

    &:hover {
        transform: ${props => props.isConnectable ? 'scale(1.2)' : 'none'};
        filter: ${props => props.isConnectable ? 'brightness(1.2)' : 'none'};
    }
`;

const PortLabel = styled.span`
    font-size: 12px;
    color: ${(props) => props.theme.node.text};
`;

const ValidationIndicator = styled.div<{ isValid: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) => props.isValid ? props.theme.validation.valid : props.theme.validation.invalid};
    margin-left: 4px;
`;

export const BaseNode: React.FC<BaseNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    onPortDragStart,
    onPortDragEnd
}) => {
    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            nodeId: data.id,
            nodeType: data.type
        }));
    }, [data]);

    const handlePortDragStart = useCallback((e: React.DragEvent, port: IPort) => {
        e.stopPropagation();
        const portElement = e.currentTarget as HTMLElement;
        const rect = portElement.getBoundingClientRect();
        const position = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        onPortDragStart?.(data.id, port, position);

        e.dataTransfer.setData('application/json', JSON.stringify({
            nodeId: data.id,
            portId: port.id,
            isInput: port.isInput
        }));
    }, [data, onPortDragStart]);

    const handlePortDrop = useCallback((e: React.DragEvent, targetPort: IPort) => {
        e.preventDefault();
        e.stopPropagation();

        const sourceData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (sourceData.nodeId !== data.id && onPortConnect) {
            onPortConnect(
                sourceData.nodeId,
                sourceData.portId,
                data.id,
                targetPort.id
            );
        }

        onPortDragEnd?.(data.id, targetPort);
    }, [data, onPortConnect, onPortDragEnd]);

    const { inputs, outputs } = useMemo(() => ({
        inputs: data.inputs.sort((a, b) => (a.isExec === b.isExec) ? 0 : a.isExec ? -1 : 1),
        outputs: data.outputs.sort((a, b) => (a.isExec === b.isExec) ? 0 : a.isExec ? -1 : 1)
    }), [data.inputs, data.outputs]);

    const isPortConnectable = useCallback((port: IPort) => {
        return !port.validation?.required || port.validation.customValidation?.(null) || false;
    }, []);

    const renderPort = useCallback((port: IPort) => (
        <Port
            key={port.id}
            draggable
            onDragStart={e => handlePortDragStart(e, port)}
            onDrop={e => handlePortDrop(e, port)}
            onDragOver={e => e.preventDefault()}
            isInput={port.isInput}
            isExec={port.isExec}
        >
            {!port.isInput && (
                <PortDot
                    isExec={port.isExec}
                    isInput={port.isInput}
                    isConnectable={isPortConnectable(port)}
                />
            )}
            <PortLabel>{port.label}</PortLabel>
            {port.isInput && (
                <PortDot
                    isExec={port.isExec}
                    isInput={port.isInput}
                    isConnectable={isPortConnectable(port)}
                />
            )}
            {port.validation && (
                <ValidationIndicator
                    isValid={!port.validation.required || port.validation.customValidation?.(null) || false}
                />
            )}
        </Port>
    ), [handlePortDragStart, handlePortDrop, isPortConnectable]);

    return (
        <NodeContainer
            draggable
            selected={selected}
            onDragStart={handleDragStart}
            onClick={() => onSelect?.(data.id)}
            style={{
                transform: `translate(${data.position?.x || 0}px, ${data.position?.y || 0}px)`
            }}
        >
            <NodeHeader>
                <NodeTitle>{data.title}</NodeTitle>
                <NodeType>{data.type}</NodeType>
            </NodeHeader>
            <PortsContainer>
                <PortList>
                    {inputs.map(renderPort)}
                </PortList>
                <PortList>
                    {outputs.map(renderPort)}
                </PortList>
            </PortsContainer>
        </NodeContainer>
    );
}; 