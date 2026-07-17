'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { History, Undo2, Redo2 } from 'lucide-react';
import { FloatingPanelShell } from '@/components/layout/FloatingPanelShell';
import { Tooltip } from '@/components/ui/Tooltip';
import { useGraphEdit } from '@/contexts/GraphEditContext';
import { useProject } from '@/contexts/ProjectContext';
import {
  getActivityEntries,
  subscribeActivity,
  logActivity,
  clearActivityLog,
  type ActivityEntry,
} from '@/lib/actionActivityLog';
import { OPEN_ACTION_HISTORY_EVENT } from '@/lib/uiPreferences';
import { playAudioCue } from '@/lib/audioFeedback';

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ActivityList({ entries }: { entries: readonly ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-[10px] text-zinc-600 px-1 py-2">No recent project activity yet.</p>
    );
  }
  return (
    <ul className="space-y-0.5">
      {entries.slice(0, 24).map((entry) => (
        <li
          key={entry.id}
          className="flex items-baseline gap-2 px-1.5 py-1 rounded text-[10px] hover:bg-zinc-900/50"
        >
          <span className="text-zinc-600 tabular-nums shrink-0">{formatTime(entry.at)}</span>
          <span className="text-zinc-400 truncate">{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ActionHistoryPanel() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToPastEntry,
    getPastHistory,
    getFutureCount,
    historyVersion,
  } = useGraphEdit();
  const { activeGraphTab, markTabDirty, setCompileState } = useProject();

  const markDirtyAfterHistory = (tabId: string | null) => {
    markTabDirty(tabId ?? activeGraphTab);
    setCompileState('dirty');
  };

  const activity = useSyncExternalStore(
    subscribeActivity,
    getActivityEntries,
    () => [] as ActivityEntry[]
  );

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setExpanded(true);
    };
    window.addEventListener(OPEN_ACTION_HISTORY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ACTION_HISTORY_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const past = getPastHistory();
  const futureCount = getFutureCount();
  void historyVersion;

  return (
    <FloatingPanelShell
      title="Action history"
      titleIcon={<History size={12} className="text-zinc-500" />}
      corner="bottom-right"
      expanded={expanded}
      onToggleExpanded={() => setExpanded((v) => !v)}
      onClose={() => setOpen(false)}
      widthClass="w-72"
      maxHeightClass="max-h-[min(420px,55vh)]"
      offsetRight={12}
      offsetBottom={48}
      shellClassName="z-[25]"
    >
      <div className="px-2 pb-2 space-y-3 min-h-0 overflow-y-auto">
        <section>
          <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
              Undo
            </p>
            <div className="flex items-center gap-0.5">
              <Tooltip content="Undo">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={() => {
                    markDirtyAfterHistory(undo());
                    logActivity('undo', 'Undo');
                    playAudioCue('undo');
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-40"
                >
                  <Undo2 size={12} />
                </button>
              </Tooltip>
              <Tooltip content="Redo">
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={() => {
                    markDirtyAfterHistory(redo());
                    logActivity('redo', 'Redo');
                    playAudioCue('redo');
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-40"
                >
                  <Redo2 size={12} />
                </button>
              </Tooltip>
            </div>
          </div>
          {past.length === 0 && futureCount === 0 ? (
            <p className="text-[10px] text-zinc-600 px-1">No edits to restore.</p>
          ) : (
            <ul className="space-y-0.5">
              <li className="px-1.5 py-1 text-[10px] text-zinc-300 font-medium border-l-2 border-indigo-500/60">
                Current
              </li>
              {past.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markDirtyAfterHistory(jumpToPastEntry(entry.id));
                      playAudioCue('undo');
                      logActivity('undo', `Restore: ${entry.label}`);
                    }}
                    className="w-full text-left flex items-baseline gap-2 px-1.5 py-1 rounded text-[10px] text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  >
                    <span className="text-zinc-600 tabular-nums shrink-0">{formatTime(entry.at)}</span>
                    <span className="truncate">{entry.label}</span>
                  </button>
                </li>
              ))}
              {futureCount > 0 ? (
                <li className="px-1.5 py-1 text-[10px] text-zinc-600 italic">
                  {futureCount} redo step{futureCount === 1 ? '' : 's'} available
                </li>
              ) : null}
            </ul>
          )}
        </section>

        <section className="border-t border-zinc-800/80 pt-2">
          <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
              Activity
            </p>
            {activity.length > 0 ? (
              <button
                type="button"
                onClick={() => clearActivityLog()}
                className="text-[9px] text-zinc-600 hover:text-zinc-400"
              >
                Clear
              </button>
            ) : null}
          </div>
          <ActivityList entries={activity} />
        </section>
      </div>
    </FloatingPanelShell>
  );
}
