/**
 * ValidationMessages
 * 
 * A component that displays validation messages from the type validator.
 * It shows a list of errors and warnings related to type compatibility
 * in the flow editor.
 */

import React, { useState, useEffect } from 'react';
import { TypeValidationError } from '../../services/validation/TypeValidator';
import './ValidationMessages.css';

interface ValidationMessagesProps {
  errors: TypeValidationError[];
  onErrorClick?: (error: TypeValidationError) => void;
}

const ValidationMessages: React.FC<ValidationMessagesProps> = ({ 
  errors, 
  onErrorClick 
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [messageCount, setMessageCount] = useState({ errors: 0, warnings: 0 });

  // Update message counts when errors change
  useEffect(() => {
    const errorCount = errors.filter(err => err.severity === 'error').length;
    const warningCount = errors.filter(err => err.severity === 'warning').length;
    
    setMessageCount({ errors: errorCount, warnings: warningCount });
  }, [errors]);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // Handle clicking on an error message
  const handleErrorClick = (error: TypeValidationError) => {
    if (onErrorClick) {
      onErrorClick(error);
    }
  };

  // If there are no errors or warnings, don't render anything
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="validation-messages">
      <div className="validation-header" onClick={toggleCollapsed}>
        <div className="validation-summary">
          {messageCount.errors > 0 && (
            <span className="error-count">
              {messageCount.errors} {messageCount.errors === 1 ? 'Error' : 'Errors'}
            </span>
          )}
          {messageCount.warnings > 0 && (
            <span className="warning-count">
              {messageCount.warnings} {messageCount.warnings === 1 ? 'Warning' : 'Warnings'}
            </span>
          )}
        </div>
        <button className="toggle-button">
          {collapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {!collapsed && (
        <div className="validation-content">
          {errors.length === 0 ? (
            <div className="no-issues">No validation issues found.</div>
          ) : (
            <ul className="validation-list">
              {errors.map((error, index) => (
                <li 
                  key={`${error.sourceNodeId}-${error.targetNodeId}-${index}`} 
                  className={`validation-item ${error.severity}`}
                  onClick={() => handleErrorClick(error)}
                >
                  <div className="validation-icon">
                    {error.severity === 'error' ? '⚠️' : '⚠'}
                  </div>
                  <div className="validation-message">
                    {error.message}
                    <div className="validation-detail">
                      From: {error.sourceNodeId} ({error.sourceType}) → 
                      To: {error.targetNodeId} ({error.targetType})
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationMessages; 