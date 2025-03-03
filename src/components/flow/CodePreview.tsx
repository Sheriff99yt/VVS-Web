import React, { useMemo, useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { FunctionNodeData } from './nodes/FunctionNode';
import { ExecutionBasedCodeGenerator } from '../../services/codeGen/ExecutionBasedCodeGenerator';
import { ExportService, ExportOptions } from '../../services/codeGen/ExportService';
import { useSyntaxDatabaseService } from '../../hooks/useSyntaxDatabaseService';
import './CodePreview.css';

interface CodePreviewProps {
  nodes: Node<FunctionNodeData>[];
  edges: Edge[];
  languageId?: number; // Optional language ID, defaults to 1 (Python)
}

/**
 * A component that displays the generated Python code for the current node graph
 * using execution-based code generation that follows the flow of execution ports
 * and applies syntax patterns from the syntax database when available.
 */
const CodePreview: React.FC<CodePreviewProps> = ({ 
  nodes, 
  edges, 
  languageId = 1 // Default to Python
}) => {
  const syntaxDbService = useSyntaxDatabaseService();
  const [pythonCode, setPythonCode] = useState<string>("# Generating code...");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    fileName: 'vvs_generated_code',
    includeTimestamp: true,
    addDocumentation: true,
    formatCode: true
  });
  const [exportStatus, setExportStatus] = useState<{
    isExporting: boolean;
    success: boolean | null;
    message: string | null;
  }>({
    isExporting: false,
    success: null,
    message: null
  });
  
  // Generate code using the ExecutionBasedCodeGenerator
  useEffect(() => {
    let isMounted = true;
    
    const generateCode = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (nodes.length === 0) {
          setPythonCode("# No nodes to generate code from\n# Drag nodes from the library to start");
          return;
        }
        
        // Create the code generator, passing the syntax service if available
        const codeGenerator = new ExecutionBasedCodeGenerator(
          nodes, 
          edges, 
          syntaxDbService, 
          languageId
        );
        
        const result = await codeGenerator.generateCode();
        
        if (isMounted) {
          setPythonCode(result.code);
          
          // Optionally, handle errors and warnings
          if (result.errors.length > 0) {
            setError(`Generated with ${result.errors.length} errors. See console for details.`);
            console.error('Code generation errors:', result.errors);
          }
          
          if (result.warnings.length > 0) {
            console.warn('Code generation warnings:', result.warnings);
          }
        }
      } catch (err) {
        console.error('Failed to generate code:', err);
        if (isMounted) {
          setError('Failed to generate code. See console for details.');
          setPythonCode('# Error generating code. Please check the console for details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Only run code generation when nodes or edges change
    const timeoutId = setTimeout(() => {
      generateCode();
    }, 300); // Add a small debounce
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [nodes, edges, syntaxDbService, languageId]);
  
  // Display a message when syntax service is not available
  const syntaxStatusMessage = useMemo(() => {
    if (!syntaxDbService) {
      return "(Syntax database not available, using basic code generation)";
    }
    return null;
  }, [syntaxDbService]);

  // Handle export button click
  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  // Handle export dialog close
  const handleExportDialogClose = () => {
    setShowExportDialog(false);
    // Reset export status after a delay
    setTimeout(() => {
      setExportStatus({
        isExporting: false,
        success: null,
        message: null
      });
    }, 2000);
  };

  // Handle export options change
  const handleExportOptionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setExportOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle export form submission
  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setExportStatus({
      isExporting: true,
      success: null,
      message: 'Exporting Python code...'
    });
    
    try {
      const exportService = ExportService.getInstance();
      await exportService.exportPythonFile(pythonCode, exportOptions);
      
      setExportStatus({
        isExporting: false,
        success: true,
        message: 'Successfully exported Python code!'
      });
      
      // Auto-close dialog after successful export
      setTimeout(() => {
        handleExportDialogClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to export code:', error);
      setExportStatus({
        isExporting: false,
        success: false,
        message: 'Failed to export code. See console for details.'
      });
    }
  };
  
  return (
    <div className="code-preview">
      <div className="code-preview-header">
        <h3>Python Code Preview</h3>
        <div className="code-preview-controls">
          {isLoading && <span className="loading-indicator">Generating...</span>}
          {syntaxStatusMessage && <span className="syntax-status">{syntaxStatusMessage}</span>}
          <button 
            className="export-button"
            onClick={handleExportClick}
            disabled={isLoading || nodes.length === 0}
          >
            Export .py
          </button>
        </div>
      </div>
      {error && (
        <div className="code-preview-error">
          {error}
        </div>
      )}
      <pre className="code-preview-content">
        <code>{pythonCode}</code>
      </pre>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="export-dialog-overlay">
          <div className="export-dialog">
            <div className="export-dialog-header">
              <h3>Export Python Code</h3>
              <button 
                className="export-dialog-close"
                onClick={handleExportDialogClose}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleExportSubmit}>
              <div className="export-form-group">
                <label htmlFor="fileName">File Name:</label>
                <input
                  type="text"
                  id="fileName"
                  name="fileName"
                  value={exportOptions.fileName}
                  onChange={handleExportOptionsChange}
                  required
                />
                <small>.py will be added automatically</small>
              </div>
              
              <div className="export-form-group">
                <label>
                  <input
                    type="checkbox"
                    name="includeTimestamp"
                    checked={exportOptions.includeTimestamp}
                    onChange={handleExportOptionsChange}
                  />
                  Include timestamp in filename
                </label>
              </div>
              
              <div className="export-form-group">
                <label>
                  <input
                    type="checkbox"
                    name="addDocumentation"
                    checked={exportOptions.addDocumentation}
                    onChange={handleExportOptionsChange}
                  />
                  Add documentation header
                </label>
              </div>
              
              <div className="export-form-group">
                <label>
                  <input
                    type="checkbox"
                    name="formatCode"
                    checked={exportOptions.formatCode}
                    onChange={handleExportOptionsChange}
                  />
                  Format code (PEP 8)
                </label>
              </div>
              
              <div className="export-form-actions">
                <button
                  type="button"
                  onClick={handleExportDialogClose}
                  disabled={exportStatus.isExporting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exportStatus.isExporting}
                >
                  {exportStatus.isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
              
              {exportStatus.message && (
                <div className={`export-status ${exportStatus.success === true ? 'success' : exportStatus.success === false ? 'error' : ''}`}>
                  {exportStatus.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodePreview; 