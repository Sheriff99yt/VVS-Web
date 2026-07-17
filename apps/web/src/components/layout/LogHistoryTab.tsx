'use client';

import React, { useSyncExternalStore } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useGraphEdit } from '@/contexts/GraphEditContext';
import { useProject } from '@/contexts/ProjectContext';
import {
  getActivityEntries,
  subscribeActivity,
  clearActivityLog,
  logActivity,
  ACTIVITY_GROUP,
  formatActivityLabel,
  type ActivityEntry,
} from '@/lib/actionActivityLog';
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
          <span className="text-zinc-400 truncate">{formatActivityLabel(entry)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Graph undo timeline — Undo/Redo commit; list clicks browse (edit may confirm discard). */
export function LogHistoryTab() {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToPastEntry,
    getPastHistory,
    getFutureHistory,
    historyVersion,
  } = useGraphEdit();
  const { activeGraphTab, markTabDirty, setCompileState } = useProject();

  const markDirtyAfterHistory = (reveal: { tabId: string } | null) => {
    markTabDirty(reveal?.tabId ?? activeGraphTab);
    setCompileState('dirty');
  };

  void historyVersion;
  const past = getPastHistory();
  const future = getFutureHistory();

  return (
    <div className="space-y-2 min-h-0">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[9px] text-zinc-600 leading-snug">
          Undo/Redo commit the timeline (edit after undo drops redo without asking). Click a past
          row to browse — editing then asks before discarding newer states.
        </p>
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip content="Undo">
            <button
              type="button"
              disabled={!canUndo}
              onClick={() => {
                markDirtyAfterHistory(undo());
                logActivity('undo', 'Undo', { group: ACTIVITY_GROUP.undo });
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
                logActivity('redo', 'Redo', { group: ACTIVITY_GROUP.redo });
                playAudioCue('redo');
              }}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-40"
            >
              <Redo2 size={12} />
            </button>
          </Tooltip>
        </div>
      </div>

      {past.length === 0 && future.length === 0 ? (
        <p className="text-[10px] text-zinc-600 px-1">No edits to restore.</p>
      ) : (
        <ul className="space-y-0.5">
          {future.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => {
                  markDirtyAfterHistory(jumpToPastEntry(entry.id));
                  playAudioCue('redo');
                  logActivity('redo', `Restore: ${entry.label}`, { group: ACTIVITY_GROUP.redo });
                }}
                className="w-full text-left flex items-baseline gap-2 px-1.5 py-1 rounded text-[10px] text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300 border-l-2 border-zinc-700/80"
              >
                <span className="text-zinc-600 tabular-nums shrink-0">{formatTime(entry.at)}</span>
                <span className="truncate">{entry.label}</span>
                <span className="text-[8px] uppercase tracking-wide text-zinc-600 shrink-0">newer</span>
              </button>
            </li>
          ))}
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
                  logActivity('undo', `Restore: ${entry.label}`, { group: ACTIVITY_GROUP.undo });
                }}
                className="w-full text-left flex items-baseline gap-2 px-1.5 py-1 rounded text-[10px] text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border-l-2 border-transparent"
              >
                <span className="text-zinc-600 tabular-nums shrink-0">{formatTime(entry.at)}</span>
                <span className="truncate">{entry.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LogActivityTab() {
  const activity = useSyncExternalStore(
    subscribeActivity,
    getActivityEntries,
    () => [] as ActivityEntry[]
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[9px] text-zinc-600">Save, generate, import, and other project events.</p>
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
    </div>
  );
}
