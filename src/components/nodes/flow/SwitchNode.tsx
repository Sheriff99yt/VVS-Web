import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BaseNode } from '../BaseNode';
import { INodeData } from '../../../core/NodeSystem';

interface SwitchNodeProps {
    data: INodeData;
    selected?: boolean;
    onSelect?: (id: string) => void;
    onPortConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
    onPositionChange?: (id: string, position: { x: number; y: number }) => void;
    activeCase?: string | null;
}

const SwitchNodeContainer = styled.div`
    position: relative;
`;

const CaseIndicator = styled.div<{ isActive: boolean }>`
    position: absolute;
    right: -32px;
    width: 24px;
    height: 2px;
    background-color: ${props => props.isActive ? props.theme.flow.switch.active : props.theme.flow.switch.inactive};
    opacity: ${props => props.isActive ? props.theme.execution.activeOpacity : props.theme.execution.inactiveOpacity};
    transition: all 0.3s ease;
`;

const CaseLabel = styled.div<{ isActive: boolean }>`
    position: absolute;
    right: -64px;
    width: 32px;
    height: 20px;
    border-radius: 4px;
    background-color: ${props => props.isActive ? props.theme.flow.switch.active : props.theme.flow.switch.case};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 500;
    opacity: ${props => props.isActive ? 1 : 0.6};
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
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const ValueDisplay = styled.div`
    font-family: monospace;
    font-size: 11px;
    color: ${props => props.theme.port.data};
    padding: 2px 6px;
    background-color: ${props => props.theme.node.background};
    border-radius: 4px;
    display: inline-block;
`;

export const SwitchNode: React.FC<SwitchNodeProps> = ({
    data,
    selected,
    onSelect,
    onPortConnect,
    onPositionChange,
    activeCase
}) => {
    const { value, cases } = useMemo(() => {
        const valuePort = data.inputs.find(port => port.id === 'value');
        const caseOutputs = data.outputs
            .filter(port => port.id.startsWith('case_'))
            .map(port => ({
                id: port.id.replace('case_', ''),
                label: port.label
            }));

        return {
            value: valuePort?.validation?.customValidation?.(null) ?? '?',
            cases: caseOutputs
        };
    }, [data.inputs, data.outputs]);

    const outputHeight = 100 / (cases.length + 1); // +1 for default case

    return (
        <SwitchNodeContainer>
            <BaseNode
                data={data}
                selected={selected}
                onSelect={onSelect}
                onPortConnect={onPortConnect}
                onPositionChange={onPositionChange}
            />
            <NodeContent>
                switch (<ValueDisplay>{value}</ValueDisplay>)
            </NodeContent>
            {/* Default case */}
            <CaseIndicator 
                isActive={activeCase === null}
                style={{ top: `${outputHeight / 2}%` }}
            />
            <CaseLabel
                isActive={activeCase === null}
                style={{ top: `calc(${outputHeight / 2}% - 10px)` }}
            >
                def
            </CaseLabel>
            {/* Switch cases */}
            {cases.map((caseItem, index) => {
                const top = outputHeight * (index + 1);
                return (
                    <React.Fragment key={caseItem.id}>
                        <CaseIndicator
                            isActive={activeCase === caseItem.id}
                            style={{ top: `${top + outputHeight / 2}%` }}
                        />
                        <CaseLabel
                            isActive={activeCase === caseItem.id}
                            style={{ top: `calc(${top + outputHeight / 2}% - 10px)` }}
                        >
                            {caseItem.id}
                        </CaseLabel>
                    </React.Fragment>
                );
            })}
        </SwitchNodeContainer>
    );
}; 