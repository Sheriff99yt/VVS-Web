'use client';

import React, { forwardRef, useRef } from 'react';
import { GRAPH_WHEEL_SHIELD_CLASS, useBlockCanvasWheel } from './useBlockCanvasWheel';

interface GraphWheelShieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Wraps node controls so scroll wheel does not zoom the React Flow canvas. */
export const GraphWheelShield = forwardRef<HTMLDivElement, GraphWheelShieldProps>(
  function GraphWheelShield({ children, className, style, ...rest }, forwardedRef) {
    const localRef = useRef<HTMLDivElement>(null);
    useBlockCanvasWheel(localRef);

    const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <div
        ref={setRefs}
        style={style}
        className={className ? `${GRAPH_WHEEL_SHIELD_CLASS} ${className}` : GRAPH_WHEEL_SHIELD_CLASS}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
