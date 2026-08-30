'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { useUiPreference } from '@/hooks/useUiPreference';
import { PRODUCT_NAME } from '@/lib/productName';
import { START_POSITIONING_LINE } from '@/lib/startCopy';

export function StartWelcomeModal({ onTrySimple }: { onTrySimple: () => void }) {
  const [dontShowAgain, setDontShowAgain] = useUiPreference('startWelcomeDontShowAgain');
  const [sessionClosed, setSessionClosed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = mounted && !dontShowAgain && !sessionClosed;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSessionClosed(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const closeThisVisit = () => setSessionClosed(true);
  const neverAgain = () => {
    setDontShowAgain(true);
    setSessionClosed(true);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      role="presentation"
      onClick={closeThisVisit}
    >
      <div
        className="relative w-full max-w-lg flex flex-col bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden shadow-lg shadow-black/40"
        role="dialog"
        aria-labelledby="start-welcome-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={closeThisVisit}
          className="absolute top-2.5 right-2.5 p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80"
          aria-label="Close welcome"
        >
          <X size={14} />
        </button>
        <div className="px-8 pt-10 pb-8 space-y-6 text-center">
          <BrandMark className="h-14 sm:h-16 w-auto mx-auto object-contain" />
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Welcome to {PRODUCT_NAME}
            </p>
            <h1
              id="start-welcome-title"
              className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight leading-snug"
            >
              {START_POSITIONING_LINE}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              closeThisVisit();
              onTrySimple();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:border-indigo-400/60 text-sm text-indigo-200 transition-colors"
          >
            Try Simple
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="shrink-0 border-t border-zinc-800/80 px-4 py-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={closeThisVisit}
            className="px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={neverAgain}
            className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
