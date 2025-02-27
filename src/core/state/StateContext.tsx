import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StateManager, SystemState, NodeState, ConnectionState, StateValidationError } from './StateManager';

interface StateContextValue {
    state: SystemState;
    isLoading: boolean;
    errors: StateValidationError[];
    updateNode: (nodeId: string, updates: Partial<NodeState>) => void;
    addConnection: (connection: ConnectionState) => void;
    removeConnection: (connectionId: string) => void;
    undo: () => void;
    redo: () => void;
    beginTransaction: (description: string) => void;
    commitTransaction: () => void;
    rollbackTransaction: () => void;
    validateState: () => StateValidationError[];
}

const defaultContextValue: StateContextValue = {
    state: {
        nodes: {},
        connections: {},
        selectedNodeIds: [],
        version: 0,
        timestamp: Date.now()
    },
    isLoading: true,
    errors: [],
    updateNode: () => {},
    addConnection: () => {},
    removeConnection: () => {},
    undo: () => {},
    redo: () => {},
    beginTransaction: () => {},
    commitTransaction: () => {},
    rollbackTransaction: () => {},
    validateState: () => []
};

const StateContext = createContext<StateContextValue>(defaultContextValue);

interface StateProviderProps {
    children: React.ReactNode;
    initialState: SystemState;
    validationRules?: {
        validateNode?: (node: NodeState) => StateValidationError[];
        validateConnection?: (connection: ConnectionState, nodes: Record<string, NodeState>) => StateValidationError[];
        validateSystem?: (state: SystemState) => StateValidationError[];
    };
    autosaveInterval?: number;
    maxHistorySize?: number;
}

export const StateProvider: React.FC<StateProviderProps> = ({
    children,
    initialState,
    validationRules,
    autosaveInterval,
    maxHistorySize
}) => {
    const [state, setState] = useState<SystemState>(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<StateValidationError[]>([]);
    const stateManagerRef = useRef<StateManager>();

    useEffect(() => {
        const loadState = async () => {
            try {
                const savedState = await StateManager.loadState();
                const stateManager = new StateManager(savedState || initialState, {
                    validationRules,
                    autosaveInterval,
                    maxHistorySize
                });
                stateManagerRef.current = stateManager;
                setState(stateManager.getCurrentState());
                setErrors(stateManager.validateState());
            } catch (error) {
                console.error('Failed to initialize state:', error);
                setErrors([{
                    type: 'system',
                    id: 'init',
                    message: 'Failed to initialize state',
                    severity: 'error'
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        loadState();

        return () => {
            stateManagerRef.current?.destroy();
        };
    }, [initialState, validationRules, autosaveInterval, maxHistorySize]);

    const value = useMemo<StateContextValue>(() => ({
        state,
        isLoading,
        errors,
        updateNode: (nodeId: string, updates: Partial<NodeState>) => {
            try {
                stateManagerRef.current?.updateNode(nodeId, updates);
                setState(stateManagerRef.current!.getCurrentState());
                setErrors(stateManagerRef.current!.validateState());
            } catch (error) {
                console.error('Failed to update node:', error);
                setErrors(prev => [...prev, {
                    type: 'node',
                    id: nodeId,
                    message: error instanceof Error ? error.message : 'Failed to update node',
                    severity: 'error'
                }]);
            }
        },
        addConnection: (connection: ConnectionState) => {
            try {
                stateManagerRef.current?.addConnection(connection);
                setState(stateManagerRef.current!.getCurrentState());
                setErrors(stateManagerRef.current!.validateState());
            } catch (error) {
                console.error('Failed to add connection:', error);
                setErrors(prev => [...prev, {
                    type: 'connection',
                    id: connection.id,
                    message: error instanceof Error ? error.message : 'Failed to add connection',
                    severity: 'error'
                }]);
            }
        },
        removeConnection: (connectionId: string) => {
            try {
                stateManagerRef.current?.removeConnection(connectionId);
                setState(stateManagerRef.current!.getCurrentState());
                setErrors(stateManagerRef.current!.validateState());
            } catch (error) {
                console.error('Failed to remove connection:', error);
                setErrors(prev => [...prev, {
                    type: 'connection',
                    id: connectionId,
                    message: error instanceof Error ? error.message : 'Failed to remove connection',
                    severity: 'error'
                }]);
            }
        },
        undo: () => {
            if (stateManagerRef.current?.undo()) {
                setState(stateManagerRef.current.getCurrentState());
                setErrors(stateManagerRef.current.validateState());
            }
        },
        redo: () => {
            if (stateManagerRef.current?.redo()) {
                setState(stateManagerRef.current.getCurrentState());
                setErrors(stateManagerRef.current.validateState());
            }
        },
        beginTransaction: (description: string) => {
            try {
                stateManagerRef.current?.beginTransaction(description);
            } catch (error) {
                console.error('Failed to begin transaction:', error);
                setErrors(prev => [...prev, {
                    type: 'system',
                    id: 'transaction',
                    message: error instanceof Error ? error.message : 'Failed to begin transaction',
                    severity: 'error'
                }]);
            }
        },
        commitTransaction: () => {
            try {
                stateManagerRef.current?.commitTransaction();
                setState(stateManagerRef.current!.getCurrentState());
                setErrors(stateManagerRef.current!.validateState());
            } catch (error) {
                console.error('Failed to commit transaction:', error);
                setErrors(prev => [...prev, {
                    type: 'system',
                    id: 'transaction',
                    message: error instanceof Error ? error.message : 'Failed to commit transaction',
                    severity: 'error'
                }]);
            }
        },
        rollbackTransaction: () => {
            try {
                stateManagerRef.current?.rollbackTransaction();
            } catch (error) {
                console.error('Failed to rollback transaction:', error);
                setErrors(prev => [...prev, {
                    type: 'system',
                    id: 'transaction',
                    message: error instanceof Error ? error.message : 'Failed to rollback transaction',
                    severity: 'error'
                }]);
            }
        },
        validateState: () => {
            const errors = stateManagerRef.current?.validateState() || [];
            setErrors(errors);
            return errors;
        }
    }), [state, isLoading, errors]);

    return (
        <StateContext.Provider value={value}>
            {children}
        </StateContext.Provider>
    );
};

export const useNodeState = (): StateContextValue => {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error('useNodeState must be used within a StateProvider');
    }
    return context;
}; 