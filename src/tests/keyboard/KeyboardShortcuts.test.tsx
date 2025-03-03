/**
 * KeyboardShortcuts.test.tsx
 * 
 * Tests for the keyboard shortcut system in the application.
 * Verifies that shortcuts are registered and triggered correctly.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutProvider } from '../../contexts/KeyboardShortcutContext';
import { ProjectProvider } from '../../contexts/ProjectContext';
import { keyboardShortcutService } from '../../services/keyboard/KeyboardShortcutService';
import { DEFAULT_SHORTCUTS } from '../../services/keyboard/ShortcutDefaults';

// Mock component to test shortcuts
const TestComponent: React.FC = () => {
  return (
    <div data-testid="test-component">
      <button data-testid="test-button">Test Button</button>
    </div>
  );
};

// Wrapped component with providers
const WrappedTestComponent: React.FC = () => {
  return (
    <ProjectProvider>
      <KeyboardShortcutProvider>
        <TestComponent />
      </KeyboardShortcutProvider>
    </ProjectProvider>
  );
};

describe('Keyboard Shortcut System', () => {
  beforeEach(() => {
    // Reset the keyboard shortcut service before each test
    jest.clearAllMocks();
  });

  it('registers shortcuts with the service', () => {
    // Spy on the registerShortcut method
    const registerShortcutSpy = jest.spyOn(keyboardShortcutService, 'registerShortcut');
    
    // Render the component
    render(<WrappedTestComponent />);
    
    // Verify that registerShortcut was called
    expect(registerShortcutSpy).toHaveBeenCalled();
  });

  it('handles keyboard events correctly', () => {
    // Create a mock action
    const mockAction = jest.fn();
    
    // Register a test shortcut
    keyboardShortcutService.registerShortcut({
      key: 'ctrl+t',
      description: 'Test shortcut',
      category: 'general',
      action: mockAction
    });
    
    // Render the component
    render(<WrappedTestComponent />);
    
    // Get the document element
    const documentElement = document.documentElement;
    
    // Fire a keyboard event
    fireEvent.keyDown(documentElement, { 
      key: 't', 
      ctrlKey: true,
      code: 'KeyT'
    });
    
    // Verify that the action was called
    expect(mockAction).toHaveBeenCalled();
  });

  it('normalizes keyboard events correctly', () => {
    // Spy on the normalizeKeyEvent method
    const normalizeKeyEventSpy = jest.spyOn(keyboardShortcutService, 'normalizeKeyEvent');
    
    // Render the component
    render(<WrappedTestComponent />);
    
    // Get the document element
    const documentElement = document.documentElement;
    
    // Fire a keyboard event
    fireEvent.keyDown(documentElement, { 
      key: 'S', 
      ctrlKey: true,
      shiftKey: true,
      code: 'KeyS'
    });
    
    // Verify that normalizeKeyEvent returns the correct value
    expect(normalizeKeyEventSpy).toHaveReturnedWith('ctrl+shift+s');
  });

  it('prevents default browser behavior for registered shortcuts', () => {
    // Create a mock action
    const mockAction = jest.fn();
    
    // Register a test shortcut
    keyboardShortcutService.registerShortcut({
      key: 'ctrl+s',
      description: 'Save',
      category: 'project',
      action: mockAction
    });
    
    // Render the component
    render(<WrappedTestComponent />);
    
    // Get the document element
    const documentElement = document.documentElement;
    
    // Create a keyboard event with preventDefault spy
    const event = new KeyboardEvent('keydown', { 
      key: 's', 
      ctrlKey: true,
      bubbles: true
    });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    
    // Dispatch the event
    documentElement.dispatchEvent(event);
    
    // Verify that preventDefault was called
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not trigger shortcuts when disabled', () => {
    // Create a mock action
    const mockAction = jest.fn();
    
    // Register a test shortcut
    keyboardShortcutService.registerShortcut({
      key: 'ctrl+z',
      description: 'Undo',
      category: 'canvas',
      action: mockAction
    });
    
    // Disable the service
    keyboardShortcutService.disable();
    
    // Render the component
    render(<WrappedTestComponent />);
    
    // Get the document element
    const documentElement = document.documentElement;
    
    // Fire a keyboard event
    fireEvent.keyDown(documentElement, { 
      key: 'z', 
      ctrlKey: true,
      code: 'KeyZ'
    });
    
    // Verify that the action was not called
    expect(mockAction).not.toHaveBeenCalled();
    
    // Re-enable for cleanup
    keyboardShortcutService.enable();
  });
}); 