'use client';

import React, { useEffect, useRef } from 'react';

export function SymbolCreatePopover({
  open,
  onClose,
  title,
  children,
  anchorClassName = '',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  anchorClassName?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={rootRef} className={`relative z-20 ${anchorClassName}`}>
      <div className="absolute left-0 right-2 top-0 mt-1 rounded border border-zinc-700 bg-zinc-950 shadow-lg p-2.5 space-y-2">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{title}</p>
        {children}
      </div>
    </div>
  );
}
