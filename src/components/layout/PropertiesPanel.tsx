import React from 'react';
import './PropertiesPanel.css';

const PropertiesPanel: React.FC = () => {
  return (
    <div className="properties-panel">
      <div className="code-preview">
        <div className="panel-header">Code Preview</div>
        <div className="code-content">
          <pre className="code-block">
            <code>
              def user_function():
                My_Float = 10.0
                
                if (My_Float{'>'} 5):
                  print("Hello VVS")
                
                user_function()
            </code>
          </pre>
        </div>
      </div>
      
      <div className="properties-section">
        <div className="panel-header">Properties</div>
        <div className="properties-content">
          <div className="property-item">
            <label>Node Name</label>
            <input type="text" value="user_function" readOnly />
          </div>
          <div className="property-item">
            <label>Return Type</label>
            <input type="text" value="mutable" readOnly />
          </div>
          <div className="property-item">
            <label>Node Order</label>
            <input type="number" value="0" readOnly />
          </div>
        </div>
      </div>

      <div className="project-files">
        <div className="panel-header">Project Files</div>
        <div className="files-tree">
          <div className="file-item">📁 C++</div>
          <div className="file-item">📁 Preferences</div>
          <div className="file-item">📁 Python</div>
          <div className="file-item">📁 VVS Auto Backup</div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel; 