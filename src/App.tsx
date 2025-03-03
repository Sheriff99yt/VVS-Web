import React, { useState } from 'react';
import FlowDemo from './components/flow/FlowDemo';
import { ProjectProvider } from './contexts/ProjectContext';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import { ShortcutHelpDialog } from './components/shortcuts/ShortcutHelpDialog';
import './App.css';

const App: React.FC = () => {
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);

  // Function to toggle the shortcut help dialog
  const toggleShortcutHelp = () => {
    setIsShortcutHelpOpen(prev => !prev);
  };

  return (
    <ProjectProvider>
      <KeyboardShortcutProvider>
        <div className="app">
          <header className="app-header">
            <h1>VVS Web - Visual Node System</h1>
            <button 
              className="shortcuts-help-button"
              onClick={toggleShortcutHelp}
              title="Keyboard Shortcuts (Shift+?)"
            >
              ⌨️ Shortcuts
            </button>
          </header>
          <main className="app-content">
            <FlowDemo height="800px" />
          </main>
          <footer className="app-footer">
            <p>VVS Web - Python MVP</p>
          </footer>
          
          {/* Shortcut help dialog */}
          <ShortcutHelpDialog 
            isOpen={isShortcutHelpOpen} 
            onClose={() => setIsShortcutHelpOpen(false)} 
          />
        </div>
      </KeyboardShortcutProvider>
    </ProjectProvider>
  );
};

export default App; 