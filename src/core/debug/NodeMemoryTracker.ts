import { NodeState } from '../types';

export interface MemoryStats {
    totalNodes: number;
    activeCleanups: number;
    memoryUsage: number;
    lastGC?: number;
    details?: {
        nodeTypes: Record<string, number>;
    };
}

export interface NodeMemoryTracker {
    /**
     * Track a node's memory usage and register cleanup
     * @param node The node to track
     * @param cleanup Optional cleanup function
     */
    trackNode(node: NodeState, cleanup?: () => void): void;

    /**
     * Stop tracking a node and trigger cleanup
     * @param nodeId The ID of the node to dispose
     */
    disposeNode(nodeId: string): void;

    /**
     * Get memory usage statistics
     */
    getStats(): MemoryStats;

    /**
     * Register a callback to be called when nodes are disposed
     * @param callback The callback function
     */
    registerGCCallback(callback: () => void): void;

    /**
     * Unregister a previously registered GC callback
     * @param callback The callback function to unregister
     */
    unregisterGCCallback(callback: () => void): void;
}

export class NodeMemoryTrackerImpl implements NodeMemoryTracker {
    private nodes: Map<string, NodeState> = new Map();
    private nodeSizes: Map<string, number> = new Map();
    private cleanups: Map<string, Array<() => void>> = new Map();
    private gcCallbacks: Set<() => void> = new Set();
    private lastGCTime?: number;
    private seenTypes: Set<string> = new Set();

    trackNode(node: NodeState, cleanup?: () => void): void {
        this.nodes.set(node.id, node);
        const size = this.calculateNodeSize(node);
        this.nodeSizes.set(node.id, size);
        this.seenTypes.add(node.type);

        if (cleanup) {
            const cleanups = this.cleanups.get(node.id) || [];
            cleanups.push(cleanup);
            this.cleanups.set(node.id, cleanups);
        }
    }

    disposeNode(nodeId: string): void {
        const cleanups = this.cleanups.get(nodeId);
        if (cleanups) {
            cleanups.forEach(cleanup => {
                try {
                    cleanup();
                } catch (error) {
                    console.error(`Error in cleanup for node ${nodeId}:`, error);
                }
            });
            this.cleanups.delete(nodeId);
        }

        this.nodes.delete(nodeId);
        this.nodeSizes.delete(nodeId);
        this.lastGCTime = Date.now();

        // Trigger GC callbacks
        this.gcCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in GC callback:', error);
            }
        });
    }

    getStats(): MemoryStats {
        let memoryUsage = 0;
        const nodeTypes: Record<string, number> = {};

        // Initialize all seen types with 0
        this.seenTypes.forEach(type => {
            nodeTypes[type] = 0;
        });

        // Count current nodes
        for (const [nodeId, size] of this.nodeSizes) {
            memoryUsage += size;
            const node = this.nodes.get(nodeId);
            if (node) {
                nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
            }
        }

        return {
            totalNodes: this.nodes.size,
            activeCleanups: this.cleanups.size,
            memoryUsage,
            lastGC: this.lastGCTime,
            details: {
                nodeTypes
            }
        };
    }

    registerGCCallback(callback: () => void): void {
        this.gcCallbacks.add(callback);
    }

    unregisterGCCallback(callback: () => void): void {
        this.gcCallbacks.delete(callback);
    }

    private calculateNodeSize(node: NodeState): number {
        // Rough estimation of node memory usage in bytes
        let size = 0;

        // Base object size
        size += 40; // Approximate size of object header and basic properties

        // ID and type strings
        size += node.id.length * 2;
        size += node.type.length * 2;

        // Position object
        size += 16; // x and y numbers

        // Ports
        size += this.calculatePortsSize(node.inputs);
        size += this.calculatePortsSize(node.outputs);

        // Status and error strings if present
        if (node.status) size += 8;
        if (node.error) size += node.error.length * 2;

        // Metadata if present
        if (node.metadata) {
            size += this.calculateObjectSize(node.metadata);
        }

        return size;
    }

    private calculatePortsSize(ports: any[]): number {
        let size = 0;
        for (const port of ports) {
            // Base port object size
            size += 32;

            // String properties
            size += port.id.length * 2;
            size += port.name.length * 2;
            size += (port.label?.length || 0) * 2;
            size += port.dataType.length * 2;

            // Boolean flag
            size += 4;

            // Validation object if present
            if (port.validation) {
                size += 16;
                if (port.validation.required !== undefined) size += 4;
                if (port.validation.customValidation) size += 8;
                if (port.validation.typeCheck) size += 8;
            }

            // Metadata if present
            if (port.metadata) {
                size += this.calculateObjectSize(port.metadata);
            }
        }
        return size;
    }

    private calculateObjectSize(obj: Record<string, any>): number {
        let size = 0;
        for (const [key, value] of Object.entries(obj)) {
            size += key.length * 2; // Key string
            if (typeof value === 'string') {
                size += value.length * 2;
            } else if (typeof value === 'number') {
                size += 8;
            } else if (typeof value === 'boolean') {
                size += 4;
            } else if (typeof value === 'object' && value !== null) {
                size += this.calculateObjectSize(value);
            }
        }
        return size;
    }
} 