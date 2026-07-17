'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import { useUiPreference } from '@/hooks/useUiPreference';
import { playAudioCue } from '@/lib/audioFeedback';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] text-zinc-300 group-hover:text-zinc-100">{label}</span>
        {description ? (
          <span className="block text-[10px] text-zinc-600 leading-relaxed mt-0.5">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function AudioSettingsPanel() {
  const [enabled, setEnabled] = useUiPreference('audioFeedbackEnabled');
  const [volume, setVolume] = useUiPreference('audioFeedbackVolume');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Audio</p>
        <p className="text-[10px] text-zinc-600 leading-relaxed mt-1">
          Short, subtle tones for save, generate, undo, and errors. Off by default.
        </p>
      </div>

      <ToggleRow
        label="Enable audio feedback"
        description="Uses the Web Audio API — no sound files loaded"
        checked={enabled}
        onChange={(next) => {
          setEnabled(next);
          if (next) playAudioCue('success');
        }}
      />

      {enabled ? (
        <div className="space-y-2 pl-0.5">
          <label className="flex items-center gap-2 text-[11px] text-zinc-400">
            <Volume2 size={12} className="text-zinc-600 shrink-0" />
            <span className="shrink-0">Volume</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 min-w-0 accent-indigo-500"
            />
            <span className="text-[9px] tabular-nums text-zinc-600 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </label>
          <button
            type="button"
            onClick={() => playAudioCue('generate')}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
          >
            Preview generate sound
          </button>
        </div>
      ) : null}
    </div>
  );
}
