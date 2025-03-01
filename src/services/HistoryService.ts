import { Node, Edge } from 'reactflow';
import { NodeData } from './NodeFactory';

interface HistoryState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodes: Node<NodeData>[];
  selectedEdges: Edge[];
}

export class HistoryService {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private currentState: HistoryState = {
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: []
  };

  pushState(state: HistoryState) {
    this.undoStack.push({ ...this.currentState });
    this.currentState = { ...state };
    this.redoStack = [];
  }

  undo(): HistoryState | null {
    if (this.undoStack.length === 0) return null;

    const previousState = this.undoStack.pop()!;
    this.redoStack.push({ ...this.currentState });
    this.currentState = { ...previousState };
    return previousState;
  }

  redo(): HistoryState | null {
    if (this.redoStack.length === 0) return null;

    const nextState = this.redoStack.pop()!;
    this.undoStack.push({ ...this.currentState });
    this.currentState = { ...nextState };
    return nextState;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getCurrentState(): HistoryState {
    return { ...this.currentState };
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = {
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: []
    };
  }
}

export default HistoryService; 