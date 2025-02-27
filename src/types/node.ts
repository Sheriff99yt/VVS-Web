export interface Port {
  id: string;
  type: 'input' | 'output';
  dataType: 'number' | 'string' | 'boolean';
  name: string;
  value?: any;
}

export interface NodeProps {
  id: string;
  inputs?: Port[];
  outputs?: Port[];
  onInputChange?: (nodeId: string, portId: string, value: any) => void;
  onOutputChange?: (nodeId: string, portId: string, value: any) => void;
  onStartConnection?: (portId: string) => void;
  onEndConnection?: (portId: string) => void;
  onPortHover?: (portId: string) => void;
  onPortHoverEnd?: () => void;
  hoveredPortId?: string | null;
  isValidConnection?: boolean;
  position?: { x: number; y: number };
  selected?: boolean;
  style?: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  inputs: Port[];
  outputs: Port[];
  data?: Record<string, any>;
} 