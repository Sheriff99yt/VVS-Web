import { v4 as uuidv4 } from 'uuid';
import { Connection, Port } from '../types/node';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Map<string, Connection> = new Map();
  private portConnections: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public createConnection(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): Connection {
    // Create unique connection ID
    const id = uuidv4();
    
    // Create the connection object
    const connection: Connection = {
      id,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId
    };

    // Store the connection
    this.connections.set(id, connection);

    // Track port connections
    this.addPortConnection(sourcePortId, id);
    this.addPortConnection(targetPortId, id);

    return connection;
  }

  public removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove from port tracking
      this.removePortConnection(connection.sourcePortId, connectionId);
      this.removePortConnection(connection.targetPortId, connectionId);
      
      // Remove the connection
      this.connections.delete(connectionId);
    }
  }

  public getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  public getConnectionsForPort(portId: string): Connection[] {
    const connectionIds = this.portConnections.get(portId);
    if (!connectionIds) return [];
    
    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter((conn): conn is Connection => conn !== undefined);
  }

  public canConnect(sourcePort: Port, targetPort: Port): boolean {
    // Check if ports are of compatible types
    if (sourcePort.type === 'input' || targetPort.type === 'output') {
      return false;
    }

    // Check if data types are compatible
    if (sourcePort.dataType !== targetPort.dataType) {
      return false;
    }

    // Check if target port already has a connection
    const targetConnections = this.getConnectionsForPort(targetPort.id);
    if (targetConnections.length > 0) {
      return false;
    }

    return true;
  }

  private addPortConnection(portId: string, connectionId: string): void {
    let connections = this.portConnections.get(portId);
    if (!connections) {
      connections = new Set();
      this.portConnections.set(portId, connections);
    }
    connections.add(connectionId);
  }

  private removePortConnection(portId: string, connectionId: string): void {
    const connections = this.portConnections.get(portId);
    if (connections) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.portConnections.delete(portId);
      }
    }
  }
} 