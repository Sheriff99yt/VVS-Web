import { CircularDependencyDetector } from '../CircularDependencyDetector';
import { SystemState, NodeState, ConnectionState } from '../../types';

describe('CircularDependencyDetector', () => {
    let detector: CircularDependencyDetector;
    let mockState: SystemState;

    beforeEach(() => {
        detector = new CircularDependencyDetector();
        mockState = {
            nodes: {
                'node1': createMockNode('node1'),
                'node2': createMockNode('node2'),
                'node3': createMockNode('node3'),
                'node4': createMockNode('node4')
            },
            connections: {},
            selectedNodeIds: [],
            version: 1,
            timestamp: Date.now()
        };
    });

    function createMockNode(id: string): NodeState {
        return {
            id,
            type: 'test',
            inputs: [],
            outputs: [],
            position: { x: 0, y: 0 }
        };
    }

    function addConnection(from: string, to: string) {
        const id = `${from}->${to}`;
        mockState.connections[id] = {
            id,
            sourceNodeId: from,
            targetNodeId: to,
            sourcePortId: 'out',
            targetPortId: 'in'
        };
    }

    describe('detectCircular', () => {
        it('should return null when no cycle exists', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node3');
            
            const result = detector.detectCircular(mockState, 'node1');
            expect(result).toBeNull();
        });

        it('should detect a simple cycle', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node1');
            
            const result = detector.detectCircular(mockState, 'node1');
            expect(result).toEqual(['node1', 'node2', 'node1']);
        });

        it('should detect a complex cycle', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node3');
            addConnection('node3', 'node4');
            addConnection('node4', 'node2');
            
            const result = detector.detectCircular(mockState, 'node1');
            expect(result).toContain('node2');
            expect(result).toContain('node3');
            expect(result).toContain('node4');
        });
    });

    describe('validateGraph', () => {
        it('should return empty array for acyclic graph', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node3');
            addConnection('node3', 'node4');
            
            const errors = detector.validateGraph(mockState);
            expect(errors).toHaveLength(0);
        });

        it('should return validation errors for cycles', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node3');
            addConnection('node3', 'node1');
            
            const errors = detector.validateGraph(mockState);
            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe('system');
            expect(errors[0].severity).toBe('error');
            expect(errors[0].message).toContain('Circular dependency detected');
        });

        it('should detect multiple cycles', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node1');
            addConnection('node3', 'node4');
            addConnection('node4', 'node3');
            
            const errors = detector.validateGraph(mockState);
            expect(errors).toHaveLength(2);
        });
    });

    describe('getNodeDependencies', () => {
        it('should return empty array for node with no dependencies', () => {
            const deps = detector.getNodeDependencies(mockState, 'node1');
            expect(deps).toHaveLength(0);
        });

        it('should return direct dependencies', () => {
            addConnection('node1', 'node2');
            addConnection('node1', 'node3');
            
            const deps = detector.getNodeDependencies(mockState, 'node1');
            expect(deps).toContain('node2');
            expect(deps).toContain('node3');
            expect(deps).toHaveLength(2);
        });

        it('should return transitive dependencies', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node3');
            addConnection('node3', 'node4');
            
            const deps = detector.getNodeDependencies(mockState, 'node1');
            expect(deps).toContain('node2');
            expect(deps).toContain('node3');
            expect(deps).toContain('node4');
            expect(deps).toHaveLength(3);
        });

        it('should handle cyclic dependencies', () => {
            addConnection('node1', 'node2');
            addConnection('node2', 'node3');
            addConnection('node3', 'node1');
            
            const deps = detector.getNodeDependencies(mockState, 'node1');
            expect(deps).toContain('node2');
            expect(deps).toContain('node3');
            expect(deps).toHaveLength(2);
        });
    });
}); 