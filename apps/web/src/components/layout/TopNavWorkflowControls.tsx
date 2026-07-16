'use client';

import React from 'react';
import { EyeOff, Loader2, Save, Zap } from 'lucide-react';

export interface TopNavWorkflowControlsProps {
  dimUnsupportedNodes: boolean;
  onDimUnsupportedToggle: () => void;
  dimUnsupportedTitle: string;

  autoSave: boolean;
  onAutoSaveToggle: () => void;
  autoSaveTitle: string;
  onSaveNow: () => void;
  saveNowTitle: string;
  saveBusy?: boolean;

  autoGenerate: boolean;
  onAutoGenerateToggle: () => void;
  autoGenerateTitle: string;
  onGenerateNow: () => void;
  generateNowTitle: string;
  generateBusy?: boolean;
}

function toggleSegmentClass(on: boolean): string {
  return on
    ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/25'
    : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900';
}

function actionSegmentClass(disabled?: boolean): string {
  return disabled
    ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100';
}

interface ControlGroupProps {
  toggleLabel: string;
  toggleOn: boolean;
  toggleTitle: string;
  onToggle: () => void;
  actionTitle: string;
  onAction: () => void;
  actionIcon: React.ReactNode;
  actionBusy?: boolean;
  actionDisabled?: boolean;
}

function ControlGroup({
  toggleLabel,
  toggleOn,
  toggleTitle,
  onToggle,
  actionTitle,
  onAction,
  actionIcon,
  actionBusy,
  actionDisabled,
}: ControlGroupProps) {
  return (
    <div className="flex items-stretch rounded border border-zinc-800 overflow-hidden shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium border-r border-zinc-800 transition-colors ${toggleSegmentClass(toggleOn)}`}
        title={toggleTitle}
        aria-pressed={toggleOn}
      >
        <span className="hidden sm:inline">{toggleLabel}</span>
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${toggleOn ? 'bg-indigo-400' : 'bg-zinc-600'}`}
          aria-hidden
        />
      </button>
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled || actionBusy}
        className={`flex items-center justify-center px-2 py-1 transition-colors ${actionSegmentClass(actionDisabled || actionBusy)}`}
        title={actionTitle}
      >
        {actionBusy ? <Loader2 size={14} className="animate-spin" /> : actionIcon}
      </button>
    </div>
  );
}

export function TopNavWorkflowControls({
  dimUnsupportedNodes,
  onDimUnsupportedToggle,
  dimUnsupportedTitle,
  autoSave,
  onAutoSaveToggle,
  autoSaveTitle,
  onSaveNow,
  saveNowTitle,
  saveBusy,
  autoGenerate,
  onAutoGenerateToggle,
  autoGenerateTitle,
  onGenerateNow,
  generateNowTitle,
  generateBusy,
}: TopNavWorkflowControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onDimUnsupportedToggle}
        className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-zinc-800 transition-colors shrink-0 ${toggleSegmentClass(dimUnsupportedNodes)}`}
        title={dimUnsupportedTitle}
        aria-pressed={dimUnsupportedNodes}
        aria-label={dimUnsupportedTitle}
      >
        <EyeOff size={12} aria-hidden />
        <span className="hidden sm:inline">Dim</span>
      </button>
      <ControlGroup
        toggleLabel="Auto save"
        toggleOn={autoSave}
        toggleTitle={autoSaveTitle}
        onToggle={onAutoSaveToggle}
        actionTitle={saveNowTitle}
        onAction={onSaveNow}
        actionBusy={saveBusy}
        actionIcon={<Save size={14} />}
      />
      <ControlGroup
        toggleLabel="Auto generate"
        toggleOn={autoGenerate}
        toggleTitle={autoGenerateTitle}
        onToggle={onAutoGenerateToggle}
        actionTitle={generateNowTitle}
        onAction={onGenerateNow}
        actionBusy={generateBusy}
        actionIcon={<Zap size={14} />}
      />
    </div>
  );
}
