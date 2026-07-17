'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, CircleDashed, Loader2, Terminal } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { CompactActionHistory } from '@/components/layout/CompactActionHistory';
import { useUiPreference } from '@/hooks/useUiPreference';

/** Status-bar-matched chip styles for validation counts on the compiler log. */
export const LOG_CHIP =
  'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors';
export const LOG_CHIP_WARN = `${LOG_CHIP} text-amber-400 bg-amber-500/15 hover:bg-amber-500/25`;
export const LOG_CHIP_ERR = `${LOG_CHIP} text-red-400 bg-red-500/20 hover:bg-red-500/30`;
export const LOG_CHIP_OK = `${LOG_CHIP} text-emerald-400 bg-emerald-500/15`;
export const LOG_CHIP_DIRTY = `${LOG_CHIP} text-zinc-400 bg-zinc-800`;
export const LOG_CHIP_BUSY = `${LOG_CHIP} text-amber-400 bg-amber-500/20`;

export function CompilerLogDiagChips({
  errorCount,
  warningCount,
  onJumpErrors,
  onJumpWarnings,
  compact = false,
}: {
  errorCount: number;
  warningCount: number;
  onJumpErrors: () => void;
  onJumpWarnings: () => void;
  /** Tighter chips for floating-panel header. */
  compact?: boolean;
}) {
  const size = compact ? 9 : 10;
  return (
    <>
      {warningCount > 0 ? (
        <Tooltip
          content={`${warningCount} warning${warningCount === 1 ? '' : 's'} — jump to related node`}
          placement="top"
        >
          <button type="button" onClick={onJumpWarnings} className={LOG_CHIP_WARN}>
            <AlertCircle size={size} />
            {warningCount}
          </button>
        </Tooltip>
      ) : null}
      {errorCount > 0 ? (
        <Tooltip
          content={`${errorCount} error${errorCount === 1 ? '' : 's'} — click to jump`}
          placement="top"
        >
          <button type="button" onClick={onJumpErrors} className={LOG_CHIP_ERR}>
            <AlertCircle size={size} />
            {errorCount}
          </button>
        </Tooltip>
      ) : null}
    </>
  );
}

export function CompilerLogCompactStrip({
  errorCount,
  warningCount,
  isCompiling,
  isDirty,
  onOpen,
  onOpenActivity,
  onJumpErrors,
  onJumpWarnings,
}: {
  errorCount: number;
  warningCount: number;
  isCompiling: boolean;
  isDirty: boolean;
  onOpen: () => void;
  onOpenActivity: () => void;
  onJumpErrors: () => void;
  onJumpWarnings: () => void;
}) {
  const [showCompactActions] = useUiPreference('compactActionHistory');
  const hasDiag = errorCount > 0 || warningCount > 0;

  return (
    <div
      className="absolute bottom-2.5 right-2.5 z-30 pointer-events-none"
      data-vvs-log-compact=""
    >
      <div className="pointer-events-auto flex flex-row items-end gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 pl-1.5 pr-1 py-1 shadow-sm shadow-black/40">
        {showCompactActions ? (
          <CompactActionHistory onOpenActivity={onOpenActivity} />
        ) : null}
        <div className="flex items-center gap-1 shrink-0 self-end pb-px">
          <CompilerLogDiagChips
            errorCount={errorCount}
            warningCount={warningCount}
            onJumpErrors={onJumpErrors}
            onJumpWarnings={onJumpWarnings}
          />
          {!hasDiag ? (
            <Tooltip
              content={
                isCompiling ? 'Generating…' : isDirty ? 'Graph changed' : 'No errors — open log'
              }
              placement="top"
            >
              <button
                type="button"
                onClick={onOpen}
                className={isCompiling ? LOG_CHIP_BUSY : isDirty ? LOG_CHIP_DIRTY : LOG_CHIP_OK}
              >
                {isCompiling ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : isDirty ? (
                  <CircleDashed size={10} />
                ) : (
                  <CheckCircle2 size={10} />
                )}
              </button>
            </Tooltip>
          ) : null}
          <Tooltip content="Open Output panel (`)" placement="top">
            <button
              type="button"
              onClick={onOpen}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition-colors"
              aria-label="Open Output panel"
            >
              <Terminal size={11} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
