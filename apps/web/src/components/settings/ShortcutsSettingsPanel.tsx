'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Lock, RotateCcw, Search } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { fuzzyMatchAny } from '@/lib/fuzzySearch';
import {
  REBINDABLE_SHORTCUT_IDS,
  chordFromKeyboardEvent,
  findShortcutConflicts,
  readShortcutOverrides,
  resetShortcutOverrides,
  writeShortcutOverride,
} from '@/lib/shortcutOverrides';
import {
  SHORTCUT_SETTINGS_GROUPS,
  getShortcutDef,
  isShortcutRebindable,
  shortcutKeys,
  shortcutsForSettingsGroup,
  type GraphShortcutDef,
  type GraphShortcutId,
} from '@/lib/graphShortcuts';

function ShortcutRow({
  def,
  recordingId,
  overrides,
  onStartRecord,
  onCapture,
  onCancelRecord,
  onReset,
}: {
  def: GraphShortcutDef;
  recordingId: GraphShortcutId | null;
  overrides: ReturnType<typeof readShortcutOverrides>;
  onStartRecord: (id: GraphShortcutId) => void;
  onCapture: (e: React.KeyboardEvent, id: GraphShortcutId) => void;
  onCancelRecord: () => void;
  onReset: (id: GraphShortcutId) => void;
}) {
  const id = def.id;
  const keys = shortcutKeys(id) || '—';
  const rebindable = isShortcutRebindable(def);
  const isRecording = recordingId === id;
  const isOverridden = Boolean(overrides[id]);

  return (
    <div
      className={`flex items-start gap-2 px-2.5 py-2 ${
        isRecording ? 'bg-amber-500/5' : 'hover:bg-zinc-900/50'
      }`}
    >
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[11px] text-zinc-300 leading-snug">{def.label}</p>
        {def.hint ? (
          <p className="text-[9px] text-zinc-600 leading-snug mt-0.5">{def.hint}</p>
        ) : null}
      </div>
      <kbd
        className={`shrink-0 mt-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded border tabular-nums max-w-[9.5rem] truncate ${
          isOverridden
            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
            : 'border-zinc-700 bg-zinc-900 text-zinc-500'
        }`}
        title={keys}
      >
        {keys}
      </kbd>
      {rebindable ? (
        <>
          <button
            type="button"
            tabIndex={isRecording ? 0 : -1}
            autoFocus={isRecording}
            onKeyDown={isRecording ? (e) => onCapture(e, id) : undefined}
            onBlur={() => {
              if (recordingId === id) onCancelRecord();
            }}
            onClick={() => onStartRecord(id)}
            className={`shrink-0 mt-0.5 text-[9px] px-2 py-0.5 rounded border transition-colors ${
              isRecording
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                : 'border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
            }`}
          >
            {isRecording ? 'Press keys…' : 'Record'}
          </button>
          {isOverridden ? (
            <Tooltip content="Reset to default">
              <button
                type="button"
                onClick={() => onReset(id)}
                className="shrink-0 mt-0.5 p-1 text-zinc-600 hover:text-zinc-300"
              >
                <RotateCcw size={11} />
              </button>
            </Tooltip>
          ) : (
            <span className="shrink-0 w-[19px]" aria-hidden />
          )}
        </>
      ) : (
        <Tooltip content="Fixed binding — gesture or sequence cannot be remapped">
          <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[9px] text-zinc-600 px-1.5 py-0.5">
            <Lock size={10} />
            Fixed
          </span>
        </Tooltip>
      )}
    </div>
  );
}

interface ShortcutsSettingsPanelProps {
  searchQuery?: string;
}

export function ShortcutsSettingsPanel({ searchQuery }: ShortcutsSettingsPanelProps = {}) {
  const [recordingId, setRecordingId] = useState<GraphShortcutId | null>(null);
  const [conflictHint, setConflictHint] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [, bump] = useState(0);

  const activeFilter = searchQuery !== undefined ? searchQuery : filter;

  const onCapture = useCallback((e: React.KeyboardEvent, id: GraphShortcutId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      setRecordingId(null);
      setConflictHint(null);
      return;
    }
    const chord = chordFromKeyboardEvent(e.nativeEvent);
    if (!chord) return;

    const conflicts = findShortcutConflicts(id, chord);
    if (conflicts.length > 0) {
      const labels = conflicts
        .map((cid) => getShortcutDef(cid)?.label ?? cid)
        .join(', ');
      setConflictHint(`Already used by: ${labels}. Choose another chord.`);
      return;
    }

    writeShortcutOverride(id, chord);
    setRecordingId(null);
    setConflictHint(null);
    bump((v) => v + 1);
  }, []);

  const overrides = readShortcutOverrides();
  const filterQ = activeFilter.trim();

  const groups = useMemo(() => {
    return SHORTCUT_SETTINGS_GROUPS.map((group) => {
      const items = shortcutsForSettingsGroup(group.id).filter((def) => {
        if (!filterQ) return true;
        return fuzzyMatchAny(filterQ, [def.label, def.hint, def.keysWin, def.keysMac, group.label]);
      });
      return { group, items };
    }).filter((g) => g.items.length > 0);
  }, [filterQ]);

  const overrideCount = Object.keys(overrides).length;
  const rebindableCount = REBINDABLE_SHORTCUT_IDS.length;

  return (
    <div className="space-y-3">
      {searchQuery === undefined ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Keyboard shortcuts
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed mt-1">
            {rebindableCount} rebindable · click Record then press a chord · Esc cancels · conflicts
            blocked. Gestures and sequences are listed but fixed. Stored in this browser only.
          </p>
        </div>
      ) : null}

      {searchQuery === undefined ? (
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
          />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter shortcuts…"
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-7 pr-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      ) : null}

      {conflictHint ? (
        <p className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded px-2.5 py-1.5">
          {conflictHint}
        </p>
      ) : null}

      <div className="rounded border border-zinc-800 overflow-hidden">
        <div className="max-h-[min(420px,52vh)] overflow-y-auto">
          {groups.length === 0 ? (
            <p className="text-[10px] text-zinc-600 text-center py-6">No shortcuts match.</p>
          ) : (
            groups.map(({ group, items }) => (
              <section key={group.id} className="border-b border-zinc-800/80 last:border-b-0">
                <header className="sticky top-0 z-[1] px-2.5 py-1.5 bg-zinc-900/95 border-b border-zinc-800/60 backdrop-blur-sm">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
                    {group.label}
                  </p>
                  <p className="text-[9px] text-zinc-600 leading-snug">{group.description}</p>
                </header>
                <div className="divide-y divide-zinc-800/60">
                  {items.map((def) => (
                    <ShortcutRow
                      key={def.id}
                      def={def}
                      recordingId={recordingId}
                      overrides={overrides}
                      onStartRecord={(id) => {
                        setConflictHint(null);
                        setRecordingId(recordingId === id ? null : id);
                      }}
                      onCapture={onCapture}
                      onCancelRecord={() => {
                        setRecordingId(null);
                        setConflictHint(null);
                      }}
                      onReset={(id) => {
                        writeShortcutOverride(id, null);
                        setConflictHint(null);
                        bump((v) => v + 1);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {overrideCount > 0 ? (
        <button
          type="button"
          onClick={() => {
            resetShortcutOverrides();
            setConflictHint(null);
            setRecordingId(null);
            bump((v) => v + 1);
          }}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
        >
          Reset all shortcuts to defaults ({overrideCount})
        </button>
      ) : null}
    </div>
  );
}
