'use client';

import React from 'react';
import type { SectionViewMode } from './constants';
import { sectionGridSpan } from './explorerUtils';

/** Full-width anchor for create popovers inside a grid section body. */
export function SectionPopoverAnchor({
  viewMode,
  children,
}: {
  viewMode: SectionViewMode;
  children: React.ReactNode;
}) {
  return <div className={sectionGridSpan(viewMode)}>{children}</div>;
}
