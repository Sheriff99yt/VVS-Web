'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Terminal, FileCode2, FolderTree, Map, WifiOff, CheckCircle2, CircleDashed } from 'lucide-react';
import { isCoaAuthoringActive } from '@/lib/coaPolicy';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { useEditorView } from '@/contexts/EditorViewContext';
import { useApiHealth } from '@/hooks/useApiHealth';
import { useFolderPickerSupported } from '@/hooks/useFolderPickerSupported';
import { formatSavedAt } from '@/lib/formatSavedAt';
import { useProjectFolder } from '@/contexts/ProjectFolderContext';
import { dispatchSaveOnDiskPrompt } from '@/lib/promoteProjectToDisk';
import { dispatchResetCompilerLogLayout } from '@/lib/uiPreferences';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { shortcutKeys } from '@/lib/graphShortcuts';
import { Tooltip } from '@/components/ui/Tooltip';
import { GraphBreadcrumb } from './GraphBreadcrumb';
import { isHostedFeaturesEnabled } from '@/lib/hostedFeatures';
import {
  CompilerLogDiagChips,
  LOG_CHIP_BUSY,
  LOG_CHIP_DIRTY,
  LOG_CHIP_OK,
} from './CompilerLogDiagChips';
import {
  dispatchFocusFirstValidationError,
  firstNavigableValidationMessage,
  navigateToValidationMessage,
} from '@/lib/graphNavigation';

function apiModeShort(
  apiMode: ReturnType<typeof useApiHealth>['apiMode'],
  healthState: ReturnType<typeof useApiHealth>['healthState'],
  serviceName: string | null,
  storeMode: string | null,
  authMode: string | null,
  userId: string | null
): { label: string; className?: string; title?: string } {
  if (apiMode === 'mock') return { label: 'Offline', className: 'text-zinc-500' };
  if (healthState === 'checking') return { label: 'API…', className: 'text-zinc-500' };
  if (healthState === 'connected') {
    const details = [
      serviceName ? `${serviceName} healthy` : 'API server connected',
      storeMode ? `store: ${storeMode}` : null,
      authMode ? `auth: ${authMode}` : null,
      userId ? `user: ${userId.slice(0, 8)}…` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      label: serviceName ? `API · ${serviceName}` : 'API',
      className: 'text-emerald-500/90',
      title: details,
    };
  }
  return { label: 'API unreachable', className: 'text-amber-500/90', title: 'Could not reach API health endpoint' };
}

export function StatusBar() {
  const { compileState, validationErrors, validationWarnings, lastSavedAt, crossOverMode } = useProject();
  const { isFolderProject } = useProjectFolder();
  const { consoleOpen, codeOpen, graphNavOpen, graphChromeMode, graphChromeOpen, toggleConsole, toggleCode, toggleGraphNav, toggleGraphChrome, setCompilerLogOpen } =
    useEditorPanels();
  const { isCanvasActive } = useEditorView();
  const { apiMode, healthState, serviceName, storeMode, authMode, userId } = useApiHealth();
  const folderPickerReady = useFolderPickerSupported();
  const hosted = isHostedFeaturesEnabled();
  const [logMenu, setLogMenu] = useState<{ x: number; y: number } | null>(null);
  const logMenuRef = useRef<HTMLDivElement>(null);

  const errorCount = validationErrors.length;
  const warningCount = validationWarnings.length;
  const hasErrors = compileState === 'error' || errorCount > 0;
  const isCompiling = compileState === 'compiling';
  const isDirty = compileState === 'dirty';
  /** On canvas, log owns error/warning chips (compact strip when closed). */
  const showDiagInStatusBar = !isCanvasActive;

  const [prevLastSavedAt, setPrevLastSavedAt] = useState(lastSavedAt);
  const [savedLabel, setSavedLabel] = useState<string | null>(() => formatSavedAt(lastSavedAt));

  if (prevLastSavedAt !== lastSavedAt) {
    setPrevLastSavedAt(lastSavedAt);
    setSavedLabel(formatSavedAt(lastSavedAt));
  }
  const api = apiModeShort(apiMode, healthState, serviceName, storeMode, authMode, userId);

  const statusTitle = isCompiling
    ? 'Compiling…'
    : isDirty
      ? 'Graph changed'
      : hasErrors && errorCount > 0
        ? `${errorCount} error${errorCount === 1 ? '' : 's'}`
        : 'No errors';

  useEffect(() => {
    if (!logMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLogMenu(null);
    };
    const onDown = (e: MouseEvent) => {
      if (logMenuRef.current?.contains(e.target as Node)) return;
      setLogMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [logMenu]);

  return (
    <div className="h-6 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-2 text-[10px] font-medium text-zinc-500 relative z-50">
      <div className="flex items-center gap-2 shrink-0 min-w-0 max-w-[55%]">
        <GraphBreadcrumb compact showModeBadge />
        <div className="w-px h-3 bg-zinc-800 shrink-0" />
        {hosted ? (
          <>
            <Tooltip content="MCP connection (Connect AI)" placement="top">
              <div className="flex items-center gap-1 px-1.5 text-zinc-600">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>MCP</span>
              </div>
            </Tooltip>
            <Tooltip content={api.title ?? api.label} placement="top">
              <span className={`flex items-center gap-1 ${api.className ?? ''}`}>
                {apiMode === 'mock' ? <WifiOff size={10} /> : null}
                {api.label}
              </span>
            </Tooltip>
          </>
        ) : (
          <Tooltip
            content="Client-first — edit and Generate offline; Connect AI for local MCP paste config"
            placement="top"
          >
            <span className="flex items-center gap-1 px-1.5 text-zinc-600">Local</span>
          </Tooltip>
        )}
        {isCoaAuthoringActive(crossOverMode) ? (
          <Tooltip
            content={`Cross Over Architecture: ${crossOverMode.allowedLanguages.join(', ')}`}
            placement="top"
          >
            <span className="px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              COA
            </span>
          </Tooltip>
        ) : null}
        {!isFolderProject && folderPickerReady ? (
          <>
            <div className="w-px h-3 bg-zinc-800" />
            <Tooltip
              content="This project is browser-only — save to a folder on disk"
              placement="top"
            >
              <button
                type="button"
                onClick={() => dispatchSaveOnDiskPrompt()}
                className="px-1.5 py-0.5 rounded border border-amber-500/25 bg-amber-500/10 text-amber-400/90 hover:bg-amber-500/15 transition-colors"
              >
                Browser only · Save to disk
              </button>
            </Tooltip>
          </>
        ) : null}
        {savedLabel ? (
          <>
            <div className="w-px h-3 bg-zinc-800" />
            <Tooltip content="Last saved" placement="top">
              <span className="text-zinc-600 normal-case tracking-normal">{savedLabel}</span>
            </Tooltip>
          </>
        ) : null}
        <div className="w-px h-3 bg-zinc-800" />
        {isCanvasActive ? (
          <>
            <Tooltip content="Graph navigator" placement="top">
              <button
                type="button"
                onClick={toggleGraphNav}
                className={`p-1 rounded transition-colors ${
                  graphNavOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
                }`}
                aria-label="Graph navigator"
                aria-pressed={graphNavOpen}
              >
                <FolderTree size={11} />
              </button>
            </Tooltip>
            <Tooltip
              content={
                graphChromeMode === 'map'
                  ? `Minimap (${shortcutKeys('toggle-minimap')}) — next: map + controls`
                  : graphChromeMode === 'map-controls'
                    ? `Minimap + controls (${shortcutKeys('toggle-minimap')}) — next: hide`
                    : `Map hidden (${shortcutKeys('toggle-minimap')}) — next: map`
              }
              placement="top"
            >
              <button
                type="button"
                onClick={toggleGraphChrome}
                className={`p-1 rounded transition-colors ${
                  graphChromeOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
                }`}
                aria-label="Cycle minimap"
                aria-pressed={graphChromeOpen}
              >
                <Map size={11} />
              </button>
            </Tooltip>
          </>
        ) : null}
        <Tooltip
          content={`Compiler log (${shortcutKeys('toggle-log-pin')}) · right-click to reset layout`}
          placement="top"
        >
          <button
            type="button"
            onClick={toggleConsole}
            onContextMenu={(e) => {
              e.preventDefault();
              setLogMenu(paneMenuPosition(e.clientX, e.clientY, 180, 40));
            }}
            className={`p-1 rounded transition-colors ${
              consoleOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Terminal size={11} />
          </button>
        </Tooltip>
        <Tooltip content="Generated code" placement="top">
          <button
            type="button"
            onClick={toggleCode}
            className={`p-1 rounded transition-colors ${
              codeOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <FileCode2 size={11} />
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 min-w-2" />

      <div className="flex items-center gap-1.5 shrink-0">
        {showDiagInStatusBar ? (
          <>
            <CompilerLogDiagChips
              errorCount={errorCount}
              warningCount={warningCount}
              onJumpErrors={() => {
                const target = firstNavigableValidationMessage(validationErrors, validationWarnings);
                if (target && navigateToValidationMessage(target)) return;
                dispatchFocusFirstValidationError();
              }}
              onJumpWarnings={() => {
                const target = firstNavigableValidationMessage([], validationWarnings);
                if (target) navigateToValidationMessage(target);
              }}
            />
            {errorCount === 0 ? (
              <Tooltip content={statusTitle} placement="top">
                <span
                  className={
                    isCompiling ? LOG_CHIP_BUSY : isDirty ? LOG_CHIP_DIRTY : LOG_CHIP_OK
                  }
                >
                  {isCompiling ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : isDirty ? (
                    <CircleDashed size={10} />
                  ) : (
                    <CheckCircle2 size={10} />
                  )}
                </span>
              </Tooltip>
            ) : null}
          </>
        ) : null}
      </div>
      {logMenu ? (
        <div
          ref={logMenuRef}
          className="fixed z-[80] min-w-[168px] py-0.5 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
          style={{ left: logMenu.x, top: logMenu.y }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-800"
            onClick={() => {
              dispatchResetCompilerLogLayout();
              setCompilerLogOpen(true);
              setLogMenu(null);
            }}
          >
            Reset size & position
          </button>
        </div>
      ) : null}
    </div>
  );
}
