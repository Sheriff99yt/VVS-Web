import { Node, Edge } from 'reactflow';
import { FunctionNodeData } from '../../components/flow/nodes/FunctionNode';
import { EdgeType } from '../../models/flow';

/**
 * Extending the FunctionNodeData interface to add requiredImports property
 */
interface ExtendedFunctionNodeData extends FunctionNodeData {
  requiredImports?: string[];
}

/**
 * The DependencyResolver is responsible for analyzing the node graph
 * and determining the correct order of operations and dependencies
 * needed for code generation.
 */
export class DependencyResolver {
  private nodes: Node<ExtendedFunctionNodeData>[];
  private edges: Edge[];
  private dependencies: Map<string, Set<string>> = new Map();
  private dataDependencies: Map<string, Map<string, string>> = new Map(); // Store input port to source node output mappings
  private nodeExecutionOrder: string[] = [];
  private executionGroups: Map<string, string[]> = new Map(); // Group nodes by execution flow
  
  // New fields for execution flow
  private executionDependencies: Map<string, Set<string>> = new Map(); // Node ID -> Set of nodes that execute after this node
  private conditionalBranches: Map<string, Map<string, string>> = new Map(); // Node ID -> Map of condition label to target node ID
  private executionEntryPoints: string[] = []; // Nodes that start execution flows
  private executionExitPoints: string[] = []; // Nodes that end execution flows
  
  constructor(nodes: Node<FunctionNodeData>[], edges: Edge[]) {
    this.nodes = nodes as Node<ExtendedFunctionNodeData>[];
    this.edges = edges;
  }
  
  /**
   * Resolve the dependencies and execution order for the node graph
   */
  public resolve(): void {
    // Reset state
    this.dependencies.clear();
    this.dataDependencies.clear();
    this.nodeExecutionOrder = [];
    this.executionGroups.clear();
    this.executionDependencies.clear();
    this.conditionalBranches.clear();
    this.executionEntryPoints = [];
    this.executionExitPoints = [];
    
    // Build dependency graph
    this.buildDependencyGraph();
    
    // Identify execution entry and exit points
    this.identifyExecutionBoundaries();
    
    // Identify execution groups
    this.identifyExecutionGroups();
    
    // Perform topological sort to get execution order
    this.topologicalSort();
  }
  
  /**
   * Get the execution order of nodes based on dependencies
   * @returns Array of nodes in execution order
   */
  public getExecutionOrder(): Node<FunctionNodeData>[] {
    return this.nodeExecutionOrder.map(id => 
      this.nodes.find(node => node.id === id)
    ).filter(Boolean) as Node<FunctionNodeData>[];
  }
  
  /**
   * Get all required imports from nodes
   * @returns Array of import statements
   */
  public getRequiredImports(): string[] {
    const imports = new Set<string>();
    
    // Collect imports from all nodes
    for (const node of this.nodes) {
      const nodeData = node.data as ExtendedFunctionNodeData;
      if (nodeData.requiredImports) {
        for (const importStatement of nodeData.requiredImports) {
          imports.add(importStatement);
        }
      }
    }
    
    return Array.from(imports);
  }
  
  /**
   * Get all nodes that depend on the specified node
   * @param nodeId ID of the node
   * @returns Array of dependent nodes
   */
  public getDependenciesForNode(nodeId: string): Node<FunctionNodeData>[] {
    const dependencyIds = this.dependencies.get(nodeId) || new Set<string>();
    return Array.from(dependencyIds).map(id => 
      this.nodes.find(node => node.id === id)
    ).filter(Boolean) as Node<FunctionNodeData>[];
  }
  
  /**
   * Get data dependencies for a node (input port to source node output mappings)
   * @param nodeId ID of the node
   * @returns Map of input port to source node output
   */
  public getDataDependenciesForNode(nodeId: string): Map<string, string> {
    return this.dataDependencies.get(nodeId) || new Map<string, string>();
  }
  
  /**
   * Get all nodes in the same execution group as the specified node
   * @param nodeId ID of the node
   * @returns Array of nodes in the same execution group
   */
  public getNodesInSameExecutionGroup(nodeId: string): Node<FunctionNodeData>[] {
    // Find which group this node belongs to
    let groupId: string | undefined;
    
    // Convert entries to array and then iterate
    const groupEntries = Array.from(this.executionGroups.entries());
    for (const [group, nodeIds] of groupEntries) {
      if (nodeIds.includes(nodeId)) {
        groupId = group;
        break;
      }
    }
    
    if (!groupId) {
      return []; // Node is not in any group
    }
    
    // Get all nodes in this group
    const nodeIds = this.executionGroups.get(groupId) || [];
    return nodeIds.map(id => 
      this.nodes.find(node => node.id === id)
    ).filter(Boolean) as Node<FunctionNodeData>[];
  }
  
  // New methods for execution flow
  
  /**
   * Get the execution path starting from a specific node
   * @param startNodeId ID of the starting node
   * @returns Array of node IDs in execution order
   */
  public getExecutionPath(startNodeId: string): string[] {
    const path: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      path.push(nodeId);
      
      const nextNodes = this.executionDependencies.get(nodeId) || new Set<string>();
      // Convert to array before iterating
      Array.from(nextNodes).forEach(nextNodeId => {
        traverse(nextNodeId);
      });
    };
    
    traverse(startNodeId);
    return path;
  }
  
  /**
   * Get all execution entry points (nodes that start execution flows)
   * @returns Array of entry point node IDs
   */
  public getExecutionEntryPoints(): string[] {
    return this.executionEntryPoints;
  }
  
  /**
   * Get all execution exit points (nodes that end execution flows)
   * @returns Array of exit point node IDs
   */
  public getExecutionExitPoints(): string[] {
    return this.executionExitPoints;
  }
  
  /**
   * Get conditional branches for a node
   * @param nodeId ID of the node
   * @returns Map of condition labels to target node IDs
   */
  public getConditionalBranches(nodeId: string): Map<string, string> {
    return this.conditionalBranches.get(nodeId) || new Map<string, string>();
  }
  
  /**
   * Build the dependency graph by analyzing edges
   * @private
   */
  private buildDependencyGraph(): void {
    // Initialize empty sets for all nodes
    for (const node of this.nodes) {
      this.dependencies.set(node.id, new Set<string>());
      this.dataDependencies.set(node.id, new Map<string, string>());
      this.executionDependencies.set(node.id, new Set<string>());
    }
    
    // Process all edges
    for (const edge of this.edges) {
      const { source, target, sourceHandle, targetHandle } = edge;
      const sourceNode = this.nodes.find(n => n.id === source);
      const targetNode = this.nodes.find(n => n.id === target);
      
      if (!sourceNode || !targetNode) continue;
      
      // Check if this is an execution edge
      const edgeData = edge.data || {};
      const isExecutionEdge = edgeData.type === EdgeType.EXECUTION;
      
      if (isExecutionEdge) {
        // Add execution dependency
        const executionDeps = this.executionDependencies.get(source) || new Set<string>();
        executionDeps.add(target);
        this.executionDependencies.set(source, executionDeps);
        
        // Add conditional branch if labeled
        if (edgeData.label) {
          let branches = this.conditionalBranches.get(source) || new Map<string, string>();
          branches.set(edgeData.label, target);
          this.conditionalBranches.set(source, branches);
        }
      } else {
        // Add data dependency
        const deps = this.dependencies.get(target) || new Set<string>();
        deps.add(source);
        this.dependencies.set(target, deps);
        
        // Store input port to source node output mapping
        const dataDeps = this.dataDependencies.get(target) || new Map<string, string>();
        if (sourceHandle && targetHandle) {
          dataDeps.set(targetHandle, `${source}:${sourceHandle}`);
          this.dataDependencies.set(target, dataDeps);
        }
      }
    }
  }
  
  /**
   * Identify execution entry and exit points
   * @private
   */
  private identifyExecutionBoundaries(): void {
    const hasIncomingExecution: Set<string> = new Set();
    const hasOutgoingExecution: Set<string> = new Set();
    
    // Check all execution edges to find nodes with incoming and outgoing connections
    for (const edge of this.edges) {
      const edgeData = edge.data || {};
      if (edgeData.type === EdgeType.EXECUTION) {
        hasOutgoingExecution.add(edge.source);
        hasIncomingExecution.add(edge.target);
      }
    }
    
    // Nodes with execution ports but no incoming execution edges are entry points
    for (const node of this.nodes) {
      if (node.data.hasExecutionPorts && node.data.executionInputs && node.data.executionInputs.length > 0) {
        if (!hasIncomingExecution.has(node.id)) {
          this.executionEntryPoints.push(node.id);
        }
      }
    }
    
    // Nodes with execution ports but no outgoing execution edges are exit points
    for (const node of this.nodes) {
      if (node.data.hasExecutionPorts && node.data.executionOutputs && node.data.executionOutputs.length > 0) {
        if (!hasOutgoingExecution.has(node.id)) {
          this.executionExitPoints.push(node.id);
        }
      }
    }
    
    // If no execution ports are found, use input nodes as entry points
    if (this.executionEntryPoints.length === 0) {
      const inputNodes = this.nodes.filter(node => node.type === 'input');
      this.executionEntryPoints = inputNodes.map(node => node.id);
    }
  }
  
  /**
   * Identify execution groups based on execution flow
   * @private
   */
  private identifyExecutionGroups(): void {
    const visited = new Set<string>();
    let groupCounter = 0;
    
    // Start from each entry point and traverse execution paths
    for (const entryPoint of this.executionEntryPoints) {
      if (!visited.has(entryPoint)) {
        const groupId = `group_${groupCounter++}`;
        this.executionGroups.set(groupId, []);
        this.traverseExecutionPath(entryPoint, groupId, visited);
      }
    }
    
    // For non-execution nodes, group by data dependencies
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        // Node is not part of any execution group, create a new data-flow group
        const groupId = `data_group_${groupCounter++}`;
        this.executionGroups.set(groupId, []);
        this.traverseDataDependencies(node.id, groupId, visited);
      }
    }
  }
  
  /**
   * Traverse execution path and add nodes to the specified group
   * @param nodeId ID of the current node
   * @param groupId ID of the group
   * @param visited Set of visited node IDs
   * @private
   */
  private traverseExecutionPath(nodeId: string, groupId: string, visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    
    // Add node to the group
    const group = this.executionGroups.get(groupId) || [];
    group.push(nodeId);
    this.executionGroups.set(groupId, group);
    
    // Follow execution dependencies
    const execDeps = this.executionDependencies.get(nodeId) || new Set<string>();
    // Convert to array before iterating
    Array.from(execDeps).forEach(nextNodeId => {
      this.traverseExecutionPath(nextNodeId, groupId, visited);
    });
    
    // Also include data dependencies of this node in the same group
    const dataDeps = this.dependencies.get(nodeId) || new Set<string>();
    // Convert to array before iterating
    Array.from(dataDeps).forEach(depNodeId => {
      this.traverseDataDependencies(depNodeId, groupId, visited);
    });
  }
  
  /**
   * Traverse data dependencies and add nodes to the specified group
   * @param nodeId ID of the current node
   * @param groupId ID of the group
   * @param visited Set of visited node IDs
   * @private
   */
  private traverseDataDependencies(nodeId: string, groupId: string, visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    
    // Add node to the group
    const group = this.executionGroups.get(groupId) || [];
    group.push(nodeId);
    this.executionGroups.set(groupId, group);
    
    // Follow data dependencies
    const dataDeps = this.dependencies.get(nodeId) || new Set<string>();
    // Convert to array before iterating
    Array.from(dataDeps).forEach(depNodeId => {
      this.traverseDataDependencies(depNodeId, groupId, visited);
    });
  }
  
  /**
   * Perform topological sort to determine execution order
   * @private
   */
  private topologicalSort(): void {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    // Visit function for topological sort
    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        // Circular dependency detected
        console.warn(`Circular dependency detected at node ${nodeId}`);
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      temp.add(nodeId);
      
      // Visit dependencies first (both data and execution)
      const dataDeps = this.dependencies.get(nodeId) || new Set<string>();
      // Convert to array before iterating
      Array.from(dataDeps).forEach(depId => {
        visit(depId);
      });
      
      const execDeps = new Set<string>();
      // For execution dependencies, we need to reverse the direction for topological sort
      // (we want nodes that execute earlier to come first in the order)
      const execEntries = Array.from(this.executionDependencies.entries());
      for (const [src, targets] of execEntries) {
        if (targets.has(nodeId)) {
          execDeps.add(src);
        }
      }
      
      // Convert to array before iterating
      Array.from(execDeps).forEach(depId => {
        visit(depId);
      });
      
      temp.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };
    
    // Visit all nodes
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }
    
    // Reverse to get the correct order
    this.nodeExecutionOrder = order.reverse();
  }
} 