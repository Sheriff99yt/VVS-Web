'use client';

import React, { useRef } from 'react';
import { GRAPH_WHEEL_SHIELD_CLASS, useBlockCanvasWheel } from './useBlockCanvasWheel';

interface GraphWheelShieldProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Wraps node controls so scroll wheel does not zoom the React Flow canvas. */
export function GraphWheelShield({ children, className, style }: GraphWheelShieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  useBlockCanvasWheel(ref);

  return (
    <div
      ref={ref}
      style={style}
      className={className ? `${GRAPH_WHEEL_SHIELD_CLASS} ${className}` : GRAPH_WHEEL_SHIELD_CLASS}
    >
      {children}
    </div>
  );
}
