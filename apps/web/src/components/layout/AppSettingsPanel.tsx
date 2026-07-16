'use client';

import React from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import { useUiPreference } from '@/hooks/useUiPreference';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import {
  dispatchOpenShortcutsHelp,
  dispatchResetCompilerLogLayout,
  dispatchResetDetailsPanelLayout,
} from '@/lib/uiPreferences';
import { shortcutKeys } from '@/lib/graphShortcuts';

interface AppSettingsPanelProps {
  onCloseSettings?: () => void;
}

export function AppSettingsPanel({ onCloseSettings }: AppSettingsPanelProps) {
  const [dimUnsupportedNodes, setDimUnsupportedNodes] = useUiPreference('dimUnsupportedNodes');
  const [showUnsupportedComments, setShowUnsupportedComments] = useUiPreference(
    'showUnsupportedComments'
  );
  const {
    codeOpen,
    graphNavOpen,
    graphChromeOpen,
    toggleCode,
    toggleGraphNav,
    toggleGraphChrome,
  } = useEditorPanels();

  return (
    <div className="space-y-5">
      <section className="space-y-1">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          App preferences
        </p>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Stored in this browser. They apply across projects and do not change generated code.
        </p>
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Canvas</p>
        <ToggleRow
          label="Dim unsupported nodes"
          description="Fade nodes that do not emit for the current language"
          checked={dimUnsupportedNodes}
          onChange={setDimUnsupportedNodes}
        />
        <ToggleRow
          label="Unsupported as (x) comments"
          description="Emit comment lines for language-ineffective nodes in the code panel"
          checked={showUnsupportedComments}
          onChange={setShowUnsupportedComments}
        />
      </section>

      <section className="space-y-2 border-t border-zinc-800/80 pt-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Default panels
        </p>
        <ToggleRow
          label="Code preview open"
          description="Show generated code beside the canvas"
          checked={codeOpen}
          onChange={(next) => {
            if (next !== codeOpen) toggleCode();
          }}
        />
        <ToggleRow
          label="Graph navigator open"
          description="Show the left project tree"
          checked={graphNavOpen}
          onChange={(next) => {
            if (next !== graphNavOpen) toggleGraphNav();
          }}
        />
        <ToggleRow
          label="Minimap & zoom chrome"
          description="Show React Flow controls on the canvas"
          checked={graphChromeOpen}
          onChange={(next) => {
            if (next !== graphChromeOpen) toggleGraphChrome();
          }}
        />
      </section>

      <section className="space-y-2 border-t border-zinc-800/80 pt-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Floating panels
        </p>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Reset size and position if a panel is stuck off-screen or behind another.
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => dispatchResetDetailsPanelLayout()}
            className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
          >
            <RotateCcw size={12} className="text-zinc-500 shrink-0" />
            Reset details panel layout
          </button>
          <button
            type="button"
            onClick={() => dispatchResetCompilerLogLayout()}
            className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
          >
            <RotateCcw size={12} className="text-zinc-500 shrink-0" />
            Reset log panel layout
          </button>
        </div>
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <button
          type="button"
          onClick={() => {
            onCloseSettings?.();
            dispatchOpenShortcutsHelp();
          }}
          className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
          title={`Keyboard shortcuts (${shortcutKeys('help')})`}
        >
          <Keyboard size={12} className="text-zinc-500 shrink-0" />
          <span className="flex-1">Keyboard shortcuts</span>
          <span className="text-[9px] text-zinc-600">{shortcutKeys('help')}</span>
        </button>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer rounded border border-zinc-800/80 bg-zinc-900/30 px-2.5 py-2 hover:bg-zinc-900/60 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-zinc-600 bg-zinc-950 text-indigo-500 focus:ring-indigo-500/40"
      />
      <span className="min-w-0">
        <span className="block text-[11px] text-zinc-200 font-medium">{label}</span>
        <span className="block text-[10px] text-zinc-500 leading-relaxed mt-0.5">{description}</span>
      </span>
    </label>
  );
}
