'use client';

import React, { useCallback } from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import { useUiPreference } from '@/hooks/useUiPreference';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import {
  dispatchOpenShortcutsHelp,
  dispatchResetCompilerLogLayout,
  dispatchResetDetailsPanelLayout,
} from '@/lib/uiPreferences';
import { shortcutKeys } from '@/lib/graphShortcuts';
import { Tooltip } from '@/components/ui/Tooltip';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

import { fuzzyMatchAny } from '@/lib/fuzzySearch';

import { SettingCard, Switch, SegmentedControl } from '@/components/settings/SettingsControls';

interface AppSettingsPanelProps {
  onCloseSettings?: () => void;
  searchQuery?: string;
}

export function AppSettingsPanel({ onCloseSettings, searchQuery }: AppSettingsPanelProps) {
  const [dimUnsupportedNodes, setDimUnsupportedNodes] = useUiPreference('dimUnsupportedNodes');
  const [nodeOptionsStripOnSelect, setNodeOptionsStripOnSelect] = useUiPreference(
    'nodeOptionsStripOnSelect'
  );
  const [showUnsupportedComments, setShowUnsupportedComments] = useUiPreference(
    'showUnsupportedComments'
  );
  const [showUserComments, setShowUserComments] = useUiPreference('showUserComments');
  const [chainAttributeDirection, setChainAttributeDirection] = useUiPreference(
    'chainAttributeDirection'
  );
  const [animateChainLayout, setAnimateChainLayout] = useUiPreference('animateChainLayout');
  const [stepAnimateChainLayout, setStepAnimateChainLayout] = useUiPreference(
    'stepAnimateChainLayout'
  );
  const [stepAnimateChainLayoutSpeed, setStepAnimateChainLayoutSpeed] = useUiPreference(
    'stepAnimateChainLayoutSpeed'
  );
  const [showLogTab, setShowLogTab] = useUiPreference('logPanelTabLog');
  const [showHistoryTab, setShowHistoryTab] = useUiPreference('logPanelTabHistory');
  const [showActivityTab, setShowActivityTab] = useUiPreference('logPanelTabActivity');
  const [compactActionHistory, setCompactActionHistory] = useUiPreference('compactActionHistory');
  const [namingConvention, setNamingConvention] = useUiPreference('namingConvention');
  const [allowMultipleExecToInput, setAllowMultipleExecToInput] = useUiPreference('allowMultipleExecToInput');
  const [warnDynamicWeakTyping, setWarnDynamicWeakTyping] = useUiPreference('warnDynamicWeakTyping');
  const [nodeToCodeHighlight, setNodeToCodeHighlight] = useUiPreference('nodeToCodeHighlight');
  const {
    codeOpen,
    graphNavOpen,
    graphChromeMode,
    toggleCode,
    toggleGraphNav,
    setGraphChromeMode,
  } = useEditorPanels();

  const query = (searchQuery ?? '').trim();
  const match = useCallback(
    (label: string, description: string = '') => {
      if (!query) return true;
      return fuzzyMatchAny(query, [label, description]);
    },
    [query]
  );

  const canvasMatch =
    match('Dim unsupported nodes', 'Fade nodes that do not emit for the current language') ||
    match('Show node strip on select', 'one shared strip follows hover') ||
    match('Unsupported as (x) comments', 'Emit comment lines for language-ineffective nodes') ||
    match('Author comments', 'Emit Comment [C] box text') ||
    match('Node → Code highlight', 'Highlight generated code lines when interacting with canvas nodes') ||
    match('Chain attribute direction (S S)', 'Where expression trees hang on S S layout') ||
    match('Animate auto layout', 'Smoothly move nodes when running S S chain layout') ||
    match('Step animate layout', 'move columns left-to-right in sequence') ||
    match('Step animation speed', 'How quickly staggered columns move');

  const safetyMatch =
    match('Naming convention', 'Make node titles and symbol roles follow target keywords python javascript cpp verse gdscript rust csharp') ||
    match('Allow multiple exec connections (U119)', 'Allow multiple execution outputs to wire into a single input') ||
    match('Dynamic/weak typing warnings (U119)', 'Warn in the Compiler Log for dynamic typing models');

  const panelMatch =
    match('Code preview open', 'Show generated code beside the canvas') ||
    match('Graph navigator open', 'Show the left project tree') ||
    match('Minimap', 'Canvas map chrome');

  const outputMatch =
    match('Log', 'Compiler and validator messages') ||
    match('History', 'Graph undo / redo timeline') ||
    match('Activity', 'Save, generate, and other project events') ||
    match('Compact action lines', 'show three live action lines in the bottom-right');

  const floatMatch =
    match('Reset details panel layout', 'details size position') ||
    match('Reset log panel layout', 'log size position');

  const helpMatch = match('Canvas help', 'shortcuts help');

  const hasAnyMatch = canvasMatch || safetyMatch || panelMatch || outputMatch || floatMatch || helpMatch;

  if (!hasAnyMatch) {
    return (
      <div className="py-8 text-center text-zinc-500 text-[11px]">
        No editor settings match &quot;{searchQuery}&quot;
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!query ? (
        <section className="space-y-1">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            App preferences
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Stored in this browser. They apply across projects and do not change generated code.
          </p>
        </section>
      ) : null}

      {canvasMatch ? (
        <section className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Canvas & Layout</p>
          {match('Dim unsupported nodes', 'Fade nodes that do not emit for the current language') ? (
            <SettingCard label="Dim unsupported nodes" description="Fade nodes that do not emit for the active target language">
              <Switch checked={dimUnsupportedNodes} onChange={setDimUnsupportedNodes} />
            </SettingCard>
          ) : null}
          {match('Show node strip on select', 'one shared strip follows hover') ? (
            <SettingCard label="Show node strip on select" description="Off: shared strip follows hover. On: strip on selected node">
              <Switch checked={nodeOptionsStripOnSelect} onChange={setNodeOptionsStripOnSelect} />
            </SettingCard>
          ) : null}
          {match('Unsupported as (x) comments', 'Emit comment lines for language-ineffective nodes') ? (
            <SettingCard label="Unsupported as (x) comments" description="Emit comment lines for unsupported nodes in the code panel">
              <Switch checked={showUnsupportedComments} onChange={setShowUnsupportedComments} />
            </SettingCard>
          ) : null}
          {match('Author comments', 'Emit Comment [C] box text') ? (
            <SettingCard label="Author comments" description="Emit Comment [C] box text in generated code">
              <Switch checked={showUserComments} onChange={setShowUserComments} />
            </SettingCard>
          ) : null}
          {match('Node → Code highlight', 'Highlight generated code lines when interacting with canvas nodes') ? (
            <SettingCard label="Node → Code highlight" description="Highlight generated code lines when interacting with canvas nodes">
              <SegmentedControl
                value={nodeToCodeHighlight}
                options={[
                  { value: 'off', label: 'Off' },
                  { value: 'selection', label: 'Select' },
                  { value: 'hover-selection', label: 'Hover + Select' },
                ]}
                onChange={setNodeToCodeHighlight}
              />
            </SettingCard>
          ) : null}
          {match('Chain attribute direction (S S)', 'Where expression trees hang on S S layout') ? (
            <SettingCard label="Chain attribute direction (S S)" description="Where expression trees hang on auto-layout">
              <SegmentedControl
                value={chainAttributeDirection}
                options={[
                  { value: 'above', label: 'Above' },
                  { value: 'below', label: 'Below' },
                  { value: 'below-extended', label: 'Extended' },
                ]}
                onChange={setChainAttributeDirection}
              />
            </SettingCard>
          ) : null}
          {match('Animate auto layout', 'Smoothly move nodes when running S S chain layout') ? (
            <SettingCard label="Animate auto layout" description="Smoothly animate node movements on layout">
              <Switch checked={animateChainLayout} onChange={setAnimateChainLayout} />
            </SettingCard>
          ) : null}
          {match('Step animate layout', 'move columns left-to-right in sequence') ? (
            <SettingCard label="Step animate layout" description="Move columns in left-to-right sequence">
              <Switch checked={stepAnimateChainLayout} onChange={setStepAnimateChainLayout} />
            </SettingCard>
          ) : null}
          {match('Step animation speed', 'How quickly staggered columns move') ? (
            <SettingCard label="Step animation speed" description="How quickly staggered layout columns move">
              <SegmentedControl
                value={stepAnimateChainLayoutSpeed}
                options={[
                  { value: 'slow', label: 'Slow' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'fast', label: 'Fast' },
                ]}
                onChange={setStepAnimateChainLayoutSpeed}
              />
            </SettingCard>
          ) : null}
        </section>
      ) : null}

      {safetyMatch ? (
        <section className="space-y-2 border-t border-zinc-800/80 pt-4">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Conventions & Safety
          </p>
          {match('Naming convention', 'Make node titles and symbol roles follow target keywords python javascript cpp verse gdscript rust csharp') ? (
            <SettingCard label="Naming convention" description="Make node titles follow target keywords">
              <SearchableSelect
                value={namingConvention}
                onChange={(next) => setNamingConvention(next as any)}
                searchable={false}
                options={[
                  { value: 'global', label: 'Global' },
                  { value: 'auto', label: 'Auto' },
                  { value: 'python', label: 'Python' },
                  { value: 'javascript', label: 'JS/TS' },
                  { value: 'cpp', label: 'C++' },
                  { value: 'verse', label: 'Verse' },
                  { value: 'gdscript', label: 'GDScript' },
                  { value: 'rust', label: 'Rust' },
                  { value: 'csharp', label: 'C#' },
                ]}
              />
            </SettingCard>
          ) : null}
          {match('Allow multiple exec connections (U119)', 'Allow multiple execution outputs to wire into a single input') ? (
            <SettingCard label="Allow multiple exec connections (U119)" description="Allow multiple exec outputs to wire into a single input">
              <Switch checked={allowMultipleExecToInput} onChange={setAllowMultipleExecToInput} />
            </SettingCard>
          ) : null}
          {match('Dynamic/weak typing warnings (U119)', 'Warn in the Compiler Log for dynamic typing models') ? (
            <SettingCard label="Dynamic/weak typing warnings (U119)" description="Warn in Compiler Log for untyped ports">
              <Switch checked={warnDynamicWeakTyping} onChange={setWarnDynamicWeakTyping} />
            </SettingCard>
          ) : null}
        </section>
      ) : null}

      {panelMatch ? (
        <section className="space-y-2 border-t border-zinc-800/80 pt-4">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Default Panels
          </p>
          {match('Code preview open', 'Show generated code beside the canvas') ? (
            <SettingCard label="Code preview open" description="Show generated code panel beside canvas">
              <Switch
                checked={codeOpen}
                onChange={(next) => {
                  if (next !== codeOpen) toggleCode();
                }}
              />
            </SettingCard>
          ) : null}
          {match('Graph navigator open', 'Show the left project tree') ? (
            <SettingCard label="Graph navigator open" description="Show left project tree sidebar">
              <Switch
                checked={graphNavOpen}
                onChange={(next) => {
                  if (next !== graphNavOpen) toggleGraphNav();
                }}
              />
            </SettingCard>
          ) : null}
          {match('Minimap', 'Canvas map chrome') ? (
            <SettingCard label="Minimap" description={`Canvas map chrome (${shortcutKeys('toggle-minimap')})`}>
              <SegmentedControl
                value={graphChromeMode}
                options={[
                  { value: 'map', label: 'Map' },
                  { value: 'map-controls', label: 'Map + Controls' },
                  { value: 'hidden', label: 'Hidden' },
                ]}
                onChange={setGraphChromeMode}
              />
            </SettingCard>
          ) : null}
        </section>
      ) : null}

      {outputMatch ? (
        <section className="space-y-2 border-t border-zinc-800/80 pt-4">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Output Window Tabs
          </p>
          {match('Log', 'Compiler and validator messages') ? (
            <SettingCard label="Compiler Log" description="Compiler and validator diagnostic messages">
              <Switch checked={showLogTab} onChange={setShowLogTab} />
            </SettingCard>
          ) : null}
          {match('History', 'Graph undo / redo timeline') ? (
            <SettingCard label="Graph History" description="Graph undo / redo timeline">
              <Switch checked={showHistoryTab} onChange={setShowHistoryTab} />
            </SettingCard>
          ) : null}
          {match('Activity', 'Save, generate, and other project events') ? (
            <SettingCard label="Activity Feed" description="Save, generate, and project events">
              <Switch checked={showActivityTab} onChange={setShowActivityTab} />
            </SettingCard>
          ) : null}
          {match('Compact action lines', 'show three live action lines in the bottom-right') ? (
            <SettingCard label="Compact action lines" description="Live action status in bottom-right corner">
              <Switch checked={compactActionHistory} onChange={setCompactActionHistory} />
            </SettingCard>
          ) : null}
        </section>
      ) : null}

      {floatMatch ? (
        <section className="space-y-2 border-t border-zinc-800/80 pt-4">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Floating Panels
          </p>
          <div className="flex flex-col gap-1.5">
            {match('Reset details panel layout', 'details size position') ? (
              <button
                type="button"
                onClick={() => dispatchResetDetailsPanelLayout()}
                className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
              >
                <RotateCcw size={12} className="text-zinc-500 shrink-0" />
                Reset details panel layout
              </button>
            ) : null}
            {match('Reset log panel layout', 'log size position') ? (
              <button
                type="button"
                onClick={() => dispatchResetCompilerLogLayout()}
                className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
              >
                <RotateCcw size={12} className="text-zinc-500 shrink-0" />
                Reset log panel layout
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {helpMatch ? (
        <section className="border-t border-zinc-800/80 pt-4">
          <Tooltip content={`Canvas help (${shortcutKeys('help')})`} placement="top" className="block w-full min-w-0">
            <button
              type="button"
              onClick={() => {
                onCloseSettings?.();
                dispatchOpenShortcutsHelp();
              }}
              className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
            >
              <Keyboard size={12} className="text-zinc-500 shrink-0" />
              <span className="flex-1">Canvas help</span>
              <span className="text-[9px] text-zinc-600">{shortcutKeys('help')}</span>
            </button>
          </Tooltip>
        </section>
      ) : null}
    </div>
  );
}

