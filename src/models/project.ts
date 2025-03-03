/**
 * Project
 * 
 * Data models for VVS Web projects, including project metadata,
 * flow data, and version information.
 */

import { Node, Edge } from 'reactflow';
import { FunctionNodeData } from '../components/flow/nodes/FunctionNode';
import { TypeConversionNodeData } from '../components/flow/nodes/TypeConversionNode';

export type ProjectNodeData = FunctionNodeData | TypeConversionNodeData;

/**
 * Project metadata information
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  tags: string[];
}

/**
 * Project flow data (nodes, edges, viewport)
 */
export interface ProjectFlowData {
  nodes: Node<ProjectNodeData>[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

/**
 * Complete project data structure
 */
export interface Project {
  metadata: ProjectMetadata;
  flowData: ProjectFlowData;
  settings?: Record<string, any>;
  generatedCode?: string;
}

/**
 * Project summary data for listing projects
 */
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  author: string;
  updatedAt: string;
  tags: string[];
  thumbnail?: string;
}

/**
 * Create a new empty project with default values
 */
export function createEmptyProject(name = 'Untitled Project'): Project {
  const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  return {
    metadata: {
      id,
      name,
      description: 'A VVS Web project',
      author: 'VVS User',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      tags: []
    },
    flowData: {
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      }
    },
    settings: {
      language: 'python',
      theme: 'light'
    }
  };
}

/**
 * Create a project summary from a full project
 */
export function createProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.metadata.id,
    name: project.metadata.name,
    description: project.metadata.description,
    author: project.metadata.author,
    updatedAt: project.metadata.updatedAt,
    tags: project.metadata.tags
  };
} 