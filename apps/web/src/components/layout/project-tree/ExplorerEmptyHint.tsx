'use client';

import React from 'react';
import type { SectionViewMode } from './constants';
import { explorerEmptyHintClassName } from './explorerUtils';

export function ExplorerEmptyHint({
  children,
  viewMode,
}: {
  children: React.ReactNode;
  viewMode?: SectionViewMode;
}) {
  return <div className={explorerEmptyHintClassName(viewMode)}>{children}</div>;
}
