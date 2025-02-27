import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '../components/nodes/CustomNodes';

interface HistoryState {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}

export class HistoryService {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private currentState: HistoryState;
  private maxHistorySize: number;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private debounceDelay: number;
  private lastMovementTime: number = 0;
  private movementDebounceDelay: number = 100; // Shorter delay for movements

  constructor(
    initialState: Omit<HistoryState, 'selectedNodeIds' | 'selectedEdgeIds'>,
    maxHistorySize: number = 50,
    debounceDelay: number = 1000
  ) {
    this.currentState = {
      ...initialState,
      selectedNodeIds: [],
      selectedEdgeIds: []
    };
    this.maxHistorySize = maxHistorySize;
    this.debounceDelay = debounceDelay;
  }

  private deepCloneState(state: HistoryState): HistoryState {
    return {
      nodes: state.nodes.map(node => ({
        ...node,
        data: { ...node.data },
        position: { ...node.position }
      })),
      edges: state.edges.map(edge => ({ ...edge })),
      selectedNodeIds: [...state.selectedNodeIds],
      selectedEdgeIds: [...state.selectedEdgeIds]
    };
  }

  private areStatesEqual(state1: HistoryState, state2: HistoryState): boolean {
    // Compare selections
    const selectionsEqual = 
      state1.selectedNodeIds.length === state2.selectedNodeIds.length &&
      state1.selectedEdgeIds.length === state2.selectedEdgeIds.length &&
      state1.selectedNodeIds.every(id => state2.selectedNodeIds.includes(id)) &&
      state1.selectedEdgeIds.every(id => state2.selectedEdgeIds.includes(id));

    // Compare node positions and data
    const nodesEqual = state1.nodes.length === state2.nodes.length &&
      state1.nodes.every((node1, index) => {
        const node2 = state2.nodes[index];
        return node1.id === node2.id &&
          node1.position.x === node2.position.x &&
          node1.position.y === node2.position.y &&
          JSON.stringify(node1.data) === JSON.stringify(node2.data) &&
          node1.selected === node2.selected;
      });

    // Compare edges
    const edgesEqual = state1.edges.length === state2.edges.length &&
      state1.edges.every((edge1, index) => {
        const edge2 = state2.edges[index];
        return edge1.source === edge2.source &&
          edge1.target === edge2.target &&
          edge1.sourceHandle === edge2.sourceHandle &&
          edge1.targetHandle === edge2.targetHandle &&
          edge1.selected === edge2.selected;
      });

    return nodesEqual && edgesEqual && selectionsEqual;
  }

  pushState(state: HistoryState, debounce: boolean = false) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    const pushStateImpl = () => {
      const newState = this.deepCloneState(state);
      
      // Don't push if the state is the same as current
      if (this.currentState && this.areStatesEqual(this.currentState, newState)) {
        return;
      }

      // For node movements, only record if enough time has passed
      const isMovementOnly = this.isOnlyNodeMovement(this.currentState, newState);
      const now = Date.now();
      if (isMovementOnly && now - this.lastMovementTime < this.movementDebounceDelay) {
        this.currentState = newState;
        return;
      }
      this.lastMovementTime = now;

      this.undoStack.push(this.deepCloneState(this.currentState));
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }
      this.currentState = newState;
      this.redoStack = []; // Clear redo stack when new action is performed
    };

    if (debounce) {
      this.debounceTimeout = setTimeout(pushStateImpl, this.debounceDelay);
    } else {
      pushStateImpl();
    }
  }

  private isOnlyNodeMovement(oldState: HistoryState, newState: HistoryState): boolean {
    if (oldState.nodes.length !== newState.nodes.length || 
        oldState.edges.length !== newState.edges.length ||
        oldState.selectedNodeIds.length !== newState.selectedNodeIds.length ||
        oldState.selectedEdgeIds.length !== newState.selectedEdgeIds.length) {
      return false;
    }

    // Check if only positions changed
    return oldState.nodes.every((oldNode, index) => {
      const newNode = newState.nodes[index];
      return oldNode.id === newNode.id &&
        JSON.stringify(oldNode.data) === JSON.stringify(newNode.data) &&
        oldNode.selected === newNode.selected;
    });
  }

  undo(): HistoryState | null {
    if (this.undoStack.length === 0) return null;

    const previousState = this.undoStack.pop()!;
    this.redoStack.push(this.deepCloneState(this.currentState));
    this.currentState = this.deepCloneState(previousState);
    return this.currentState;
  }

  redo(): HistoryState | null {
    if (this.redoStack.length === 0) return null;

    const nextState = this.redoStack.pop()!;
    this.undoStack.push(this.deepCloneState(this.currentState));
    this.currentState = this.deepCloneState(nextState);
    return this.currentState;
  }

  getCurrentState(): HistoryState {
    return this.deepCloneState(this.currentState);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
  }
} 