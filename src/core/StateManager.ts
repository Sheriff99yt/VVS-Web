import { NodeData, Port, Connection } from '../types/node';
import { NodeFactory } from './NodeFactory';
import { ConnectionManager } from './ConnectionManager';

export class StateManager {
  private static instance: StateManager;
  private nodeStates: Map<string, Map<string, any>> = new Map();
  private nodeFactory: NodeFactory;
  private connectionManager: ConnectionManager;

  private constructor() {
    this.nodeFactory = NodeFactory.getInstance();
    this.connectionManager = ConnectionManager.getInstance();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public updatePortValue(nodeId: string, portId: string, value: any): void {
    // Get or create node state
    let portStates = this.nodeStates.get(nodeId);
    if (!portStates) {
      portStates = new Map();
      this.nodeStates.set(nodeId, portStates);
    }

    // Update port value
    portStates.set(portId, value);

    // Propagate changes through connections
    this.propagateChanges(nodeId, portId, value);
  }

  public getPortValue(nodeId: string, portId: string): any {
    return this.nodeStates.get(nodeId)?.get(portId);
  }

  private propagateChanges(sourceNodeId: string, sourcePortId: string, value: any): void {
    // Get connections from this port
    const connections = this.connectionManager.getConnectionsForPort(sourcePortId);

    // Update connected ports
    for (const connection of connections) {
      if (connection.sourcePortId === sourcePortId) {
        this.updatePortValue(connection.targetNodeId, connection.targetPortId, value);
      }
    }
  }

  public clearNodeState(nodeId: string): void {
    this.nodeStates.delete(nodeId);
  }

  public getNodeState(nodeId: string): Map<string, any> | undefined {
    return this.nodeStates.get(nodeId);
  }

  public reset(): void {
    this.nodeStates.clear();
  }
} 