import React, { useEffect, useState, useRef } from 'react';
import Prism from 'prismjs';
// Import core styles
import 'prismjs/themes/prism-tomorrow.css';
// Import languages
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import './CodePanel.css';
import { CodeGenerator, Language } from '../../services/CodeGenerator';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../../services/NodeFactory';

interface CodePanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

const CodePanel: React.FC<CodePanelProps> = ({ nodes, edges }) => {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const generator = new CodeGenerator({ language });
    const generatedCode = generator.generateCode(nodes, edges);
    setCode(generatedCode);
  }, [nodes, edges, language]);

  useEffect(() => {
    if (codeRef.current) {
      // Clear existing classes
      codeRef.current.className = '';
      // Add new language class
      codeRef.current.classList.add(`language-${language}`);
      // Manually trigger highlighting
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getFileExtension = (lang: Language): string => {
    switch (lang) {
      case 'cpp':
        return 'cpp';
      case 'javascript':
        return 'js';
      case 'python':
        return 'py';
      case 'pseudocode':
        return 'txt';
      default:
        return 'txt';
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-panel">
      <div className="code-header">
        <div className="code-title">Generated Code</div>
        <div className="code-actions">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="language-selector"
          >
            <option value="pseudocode">Pseudocode</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
          </select>
          <button className="code-action-btn" onClick={handleCopy}>Copy</button>
          <button className="code-action-btn" onClick={handleDownload}>Download</button>
        </div>
      </div>
      <div className="code-editor">
        <pre className="code-content">
          <code ref={codeRef}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodePanel; 