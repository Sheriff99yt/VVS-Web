'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
        checked ? 'bg-indigo-600' : 'bg-zinc-800'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-100 shadow-sm ring-0 transition duration-150 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-md border border-zinc-800 bg-zinc-950/60 p-0.5 min-w-0">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`px-2 py-1 text-[10px] rounded font-medium transition-colors ${
              active
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export interface SettingCardProps {
  label: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export function SettingCard({ label, description, badge, children }: SettingCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-800 hover:bg-zinc-900/50 transition-colors min-w-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-200">{label}</span>
          {badge ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  );
}
