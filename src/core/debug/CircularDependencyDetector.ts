import { SystemState, ValidationError } from '../types';
import { CircularDependencyDetector as ICircularDependencyDetector } from './types';

export class CircularDependencyDetector implements ICircularDependencyDetector {
    detectCircular(state: SystemState, startNodeId: string): string[] | null {
        const visited = new Set<string>();
        const path: string[] = [];
        
        const dfs = (nodeId: string): boolean => {
            if (path.includes(nodeId)) {
                path.push(nodeId);
                return true;
            }
            
            if (visited.has(nodeId)) {
                return false;
            }
            
            visited.add(nodeId);
            path.push(nodeId);
            
            const outgoingConnections = Object.values(state.connections)
                .filter(conn => conn.sourceNodeId === nodeId);
                
            for (const conn of outgoingConnections) {
                if (dfs(conn.targetNodeId)) {
                    return true;
                }
            }
            
            path.pop();
            return false;
        };
        
        if (dfs(startNodeId)) {
            return path;
        }
        
        return null;
    }

    validateGraph(state: SystemState): ValidationError[] {
        const errors: ValidationError[] = [];
        const visited = new Set<string>();

        // Check each node for cycles
        Object.keys(state.nodes).forEach(nodeId => {
            if (!visited.has(nodeId)) {
                const cycle = this.detectCircular(state, nodeId);
                if (cycle) {
                    errors.push({
                        type: 'system',
                        id: nodeId,
                        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
                        severity: 'error',
                        details: { cycle }
                    });
                }
                cycle?.forEach(id => visited.add(id));
            }
        });

        return errors;
    }

    getNodeDependencies(state: SystemState, nodeId: string): string[] {
        const dependencies: string[] = [];
        const visited = new Set<string>();

        const dfs = (currentNodeId: string) => {
            if (visited.has(currentNodeId)) {
                return;
            }

            visited.add(currentNodeId);
            const connections = Object.values(state.connections)
                .filter(conn => conn.sourceNodeId === currentNodeId);

            connections.forEach(conn => {
                if (!dependencies.includes(conn.targetNodeId) && conn.targetNodeId !== nodeId) {
                    dependencies.push(conn.targetNodeId);
                    dfs(conn.targetNodeId);
                }
            });
        };

        dfs(nodeId);
        return dependencies;
    }
} 