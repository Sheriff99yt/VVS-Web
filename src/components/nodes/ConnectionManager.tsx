import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { IPort } from '../../core/NodeSystem';
import { PortConnection } from './PortConnection';

interface Connection {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
    sourcePort: IPort;
    targetPort: IPort;
    sourcePosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
}

interface ConnectionManagerProps {
    connections: Connection[];
    onConnectionCreate?: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => void;
    onConnectionDelete?: (connectionId: string) => void;
    onConnectionValidate?: (sourcePort: IPort, targetPort: IPort) => boolean;
}

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
`;

const PreviewConnection = styled.div<{ isValid: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
    opacity: ${props => props.isValid ? 0.8 : 0.4};
`;

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
    connections,
    onConnectionCreate,
    onConnectionDelete,
    onConnectionValidate
}) => {
    const [draggingConnection, setDraggingConnection] = useState<{
        sourceNodeId: string;
        sourcePortId: string;
        sourcePort: IPort;
        sourcePosition: { x: number; y: number };
        currentPosition: { x: number; y: number };
        isValid: boolean;
    } | null>(null);

    const [highlightedConnection, setHighlightedConnection] = useState<string | null>(null);

    const handlePortDragStart = useCallback((
        nodeId: string,
        port: IPort,
        position: { x: number; y: number }
    ) => {
        setDraggingConnection({
            sourceNodeId: nodeId,
            sourcePortId: port.id,
            sourcePort: port,
            sourcePosition: position,
            currentPosition: position,
            isValid: true
        });
    }, []);

    const handlePortDragEnd = useCallback((
        targetNodeId: string,
        targetPort: IPort
    ) => {
        if (draggingConnection) {
            const isValid = onConnectionValidate?.(draggingConnection.sourcePort, targetPort) ?? true;

            if (isValid && onConnectionCreate) {
                onConnectionCreate(
                    draggingConnection.sourceNodeId,
                    draggingConnection.sourcePortId,
                    targetNodeId,
                    targetPort.id
                );
            }
        }
        setDraggingConnection(null);
    }, [draggingConnection, onConnectionCreate, onConnectionValidate]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (draggingConnection) {
            const container = document.getElementById('node-editor-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                setDraggingConnection(prev => ({
                    ...prev!,
                    currentPosition: {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    }
                }));
            }
        }
    }, [draggingConnection]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    return (
        <Container id="node-editor-container">
            {connections.map(connection => (
                <PortConnection
                    key={connection.id}
                    sourcePort={connection.sourcePort}
                    targetPort={connection.targetPort}
                    sourcePosition={connection.sourcePosition}
                    targetPosition={connection.targetPosition}
                    isValid={onConnectionValidate?.(connection.sourcePort, connection.targetPort) ?? true}
                    isHighlighted={connection.id === highlightedConnection}
                    isAnimated={true}
                    onClick={() => {
                        setHighlightedConnection(connection.id);
                        onConnectionDelete?.(connection.id);
                    }}
                />
            ))}
            {draggingConnection && (
                <PreviewConnection isValid={draggingConnection.isValid}>
                    <PortConnection
                        sourcePort={draggingConnection.sourcePort}
                        targetPort={draggingConnection.sourcePort}
                        sourcePosition={draggingConnection.sourcePosition}
                        targetPosition={draggingConnection.currentPosition}
                        isValid={draggingConnection.isValid}
                        isHighlighted={true}
                        isAnimated={true}
                    />
                </PreviewConnection>
            )}
        </Container>
    );
}; 