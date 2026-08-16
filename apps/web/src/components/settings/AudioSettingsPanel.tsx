'use client';

import React, { useCallback } from 'react';
import { useUiPreference } from '@/hooks/useUiPreference';
import { playAudioCue } from '@/lib/audioFeedback';
import { fuzzyMatchAny } from '@/lib/fuzzySearch';
import { SettingCard, Switch } from '@/components/settings/SettingsControls';

interface AudioSettingsPanelProps {
  searchQuery?: string;
}

export function AudioSettingsPanel({ searchQuery }: AudioSettingsPanelProps = {}) {
  const [enabled, setEnabled] = useUiPreference('audioFeedbackEnabled');
  const [volume, setVolume] = useUiPreference('audioFeedbackVolume');

  const query = (searchQuery ?? '').trim();
  const match = useCallback(
    (label: string, description: string = '') => {
      if (!query) return true;
      return fuzzyMatchAny(query, [label, description, 'Audio', 'sound', 'mute', 'buzz', 'feedback']);
    },
    [query]
  );

  const enableMatch = match(
    'Enable audio feedback',
    'Uses the Web Audio API — no sound files loaded'
  );
  const volumeMatch = match('Volume', 'Feedback loudness');
  const previewMatch = match('Preview generate sound', 'Play a sample generate tone');

  if (query && !enableMatch && !volumeMatch && !previewMatch) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!query ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Audio</p>
          <p className="text-[10px] text-zinc-600 leading-relaxed mt-1">
            Short, subtle tones for save, generate, undo, and errors. Off by default.
          </p>
        </div>
      ) : null}

      {enableMatch ? (
        <SettingCard
          label="Enable audio feedback"
          description="Uses the Web Audio API — no sound files loaded"
        >
          <Switch
            checked={enabled}
            onChange={(next) => {
              setEnabled(next);
              if (next) playAudioCue('success');
            }}
          />
        </SettingCard>
      ) : null}

      {volumeMatch ? (
        <SettingCard label="Volume" description="Loudness of save, generate, undo, and error cues">
          <label className="flex items-center gap-2 text-[11px] text-zinc-400">
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={volume}
              disabled={!enabled}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-28 min-w-0 accent-indigo-500 disabled:opacity-40"
            />
            <span className="text-[9px] tabular-nums text-zinc-600 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </label>
        </SettingCard>
      ) : null}

      {previewMatch && enabled ? (
        <button
          type="button"
          onClick={() => playAudioCue('generate')}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
        >
          Preview generate sound
        </button>
      ) : null}
    </div>
  );
}
