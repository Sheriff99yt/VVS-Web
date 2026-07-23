'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import {
  TARGET_FILE_EXTENSIONS,
  formatTargetFileExtension,
  type TargetLanguage,
} from '@vvs/graph-types';
import { Tooltip } from '@/components/ui/Tooltip';

const LANGUAGE_OPTIONS: { value: TargetLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JS' },
  { value: 'cpp', label: 'C++' },
  { value: 'verse', label: 'Verse' },
  { value: 'gdscript', label: 'GDScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'json', label: 'JSON' },
];

export function LanguageExtensionMenu({
  language,
  extension,
  onPick,
  disabled = false,
  className = '',
}: {
  language: TargetLanguage;
  extension: string;
  onPick: (language: TargetLanguage, extension: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const autoId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hoveredLang, setHoveredLang] = useState<TargetLanguage | null>(null);

  const selected = LANGUAGE_OPTIONS.find((o) => o.value === language);
  const triggerLabel = `${selected?.label ?? language} ${formatTargetFileExtension(extension)}`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHoveredLang(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (lang: TargetLanguage, ext: string) => {
    onPick(lang, ext);
    setOpen(false);
    setHoveredLang(null);
  };

  const hoveredExts = hoveredLang ? TARGET_FILE_EXTENSIONS[hoveredLang] : null;

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseLeave={() => {
        if (!open) setHoveredLang(null);
      }}
    >
      <Tooltip content="Language and file extension" placement="bottom">
        <button
          id={autoId}
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
            setHoveredLang(null);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-between gap-1 h-6 min-w-[5.5rem] max-w-[7.5rem] px-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-200 hover:border-zinc-700 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronDown size={10} className="text-zinc-500 shrink-0" />
        </button>
      </Tooltip>

      {open ? (
        <div
          className="absolute z-50 top-full right-0 mt-1 min-w-[9rem] rounded border border-zinc-700 bg-zinc-950 shadow-lg py-1"
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const exts = TARGET_FILE_EXTENSIONS[option.value];
            const active = option.value === language;
            const showSub = hoveredLang === option.value;
            return (
              <div
                key={option.value}
                className="relative"
                onMouseEnter={() => setHoveredLang(option.value)}
              >
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup={exts.length > 1 ? 'menu' : undefined}
                  aria-expanded={exts.length > 1 ? showSub : undefined}
                  onClick={() => {
                    // Language-only pick uses the first listed extension for that target.
                    pick(option.value, exts[0]!);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-left ${
                    active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {exts.length > 1 ? (
                    <ChevronLeft size={11} className="text-zinc-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                      {formatTargetFileExtension(exts[0]!)}
                    </span>
                  )}
                </button>

                {showSub && hoveredExts && hoveredExts.length > 0 ? (
                  <div
                    className="absolute right-full top-0 mr-0.5 min-w-[4.5rem] rounded border border-zinc-700 bg-zinc-950 shadow-lg py-1"
                    role="menu"
                  >
                    {hoveredExts.map((ext) => {
                      const extActive = active && extension === ext;
                      return (
                        <button
                          key={ext}
                          type="button"
                          role="menuitem"
                          onClick={() => pick(option.value, ext)}
                          className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono ${
                            extActive
                              ? 'bg-zinc-800 text-zinc-100'
                              : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          {formatTargetFileExtension(ext)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
