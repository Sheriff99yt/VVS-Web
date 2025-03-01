import React, { useEffect, useState } from 'react';
import './NodePalette.css';
import { NodeFunctionStructure } from '../../isolated/db/FunctionDB';
import { DataImportService } from '../../services/DataImportService';

interface NodePaletteProps {
  onDragStart?: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [nodes, setNodes] = useState<NodeFunctionStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        // First import example data
        await DataImportService.importExampleData();
        // Then fetch all nodes
        const allNodes = await DataImportService.getAllNodes();
        setNodes(allNodes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load nodes');
      } finally {
        setLoading(false);
      }
    };

    loadNodes();
  }, []);

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/vvsnode', nodeType);
    if (onDragStart) {
      onDragStart(event, nodeType);
    }
  };

  // Group nodes by category
  const nodesByCategory = nodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeFunctionStructure[]>);

  if (loading) {
    return <div className="node-palette loading">Loading nodes...</div>;
  }

  if (error) {
    return <div className="node-palette error">Error: {error}</div>;
  }

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>Nodes</h3>
      </div>
      <div className="palette-content">
        {Object.entries(nodesByCategory).map(([category, categoryNodes]) => (
          <div key={category} className="node-category">
            <div className="category-header">{category}</div>
            <div className="category-nodes">
              {categoryNodes.map(node => (
                <div
                  key={`${node.id}-${node.language}`}
                  className="node-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.id.toString())}
                  title={node.description}
                >
                  <span className="node-name">{node.name}</span>
                  <span className="node-language">{node.language}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette; 