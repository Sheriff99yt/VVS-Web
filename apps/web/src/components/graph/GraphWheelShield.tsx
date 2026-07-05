'use client';

import React, { useRef } from 'react';
import { GRAPH_WHEEL_SHIELD_CLASS, useBlockCanvasWheel } from './useBlockCanvasWheel';

interface GraphWheelShieldProps {
  children: React.ReactNode;
  className?: string;
}

/** Wraps node controls so scroll wheel does not zoom the React Flow canvas. */
export function GraphWheelShield({ children, className }: GraphWheelShieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  useBlockCanvasWheel(ref);

  return (
    <div ref={ref} className={className ? `${GRAPH_WHEEL_SHIELD_CLASS} ${className}` : GRAPH_WHEEL_SHIELD_CLASS}>
      {children}
    </div>
  );
}
