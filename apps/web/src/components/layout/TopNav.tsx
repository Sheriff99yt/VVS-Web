'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Save, Zap, RefreshCw, Bot, PenLine, GitBranch, Package, Undo2, Redo2, Scissors, Copy, ClipboardPaste, Files, ZoomIn, Group, Ungroup, FileDown, FileUp, FolderOutput } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { VvsApi, getApiMode } from '@/lib/api';
import { dispatchGraphAction } from '@/lib/graphActions';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { ProjectSnapshot, isProjectSnapshot } from '@/types/projectSnapshot';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { dispatchEditorNavigate } from '@/lib/editorNavigate';
import { useRouter } from 'next/navigation';
import { saveProjectToStore } from '@/lib/projectStore';
import { runProjectAnalysis } from '@/lib/projectAnalysis';

export interface TopNavProps {
  activeTab: 'canvas' | 'references' | 'library';
  onTabChange: (tab: 'canvas' | 'references' | 'library') => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const { navigate } = useEditorNavigation();
  const [showMCPModal, setShowMCPModal] = useState(false);
  const [mcpProbeState, setMcpProbeState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [mcpProbeMessage, setMcpProbeMessage] = useState<string | null>(null);
  const mcpUrl = 'http://localhost:8080/mcp';
  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'view' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    canUndo, canRedo, triggerUndo, triggerRedo,
    compileState, setCompileState,
    variables, setVariables,
    events, setEvents,
    functions, setFunctions,
    openTabs, setOpenTabs,
    activeGraphTab, setActiveGraphTab,
    projectDetails, setProjectDetails,
    targetLanguage, setTargetLanguage,
    autoCompile, setAutoCompile,
    autoSave, setAutoSave,
    dirtyTabIds,
    setSelection,
    setValidationErrors,
    setValidationWarnings,
    setInstalledLibrary,
    installedLibrary,
    projectId,
    projectSource,
    markTabClean,
    setLastSavedAt,
    isTabDirty,
    resetDirtyTabs,
  } = useProject();

  const router = useRouter();

  const { getDocuments, loadDocuments } = useGraphWorkspace();

  const snapshotTarget = useCallback(
    () => ({
      setVariables,
      setEvents,
      setFunctions,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
    }),
    [
      setVariables,
      setEvents,
      setFunctions,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
    ]
  );

  const handleMcpProbe = async () => {
    setMcpProbeState('testing');
    setMcpProbeMessage(null);
    try {
      const result = await VvsApi.probeMcp(mcpUrl);
      setMcpProbeState(result.ok ? 'ok' : 'fail');
      setMcpProbeMessage(result.message);
    } catch {
      setMcpProbeState('fail');
      setMcpProbeMessage('Connection test failed.');
    }
  };

  const openMcpModal = () => {
    setMcpProbeState('idle');
    setMcpProbeMessage(null);
    setShowMCPModal(true);
  };

  const confirmDiscardDirty = useCallback((): boolean => {
    const anyDirty = openTabs.some((t) => isTabDirty(t.id));
    if (!anyDirty && compileState !== 'dirty') return true;
    return window.confirm('Discard unsaved changes?');
  }, [compileState, openTabs, isTabDirty]);

  useEffect(() => {
    const handleGlobalClick = () => setOpenMenu(null);
    if (openMenu) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [openMenu]);

  const buildSnapshot = useCallback((): ProjectSnapshot | null => {
    const documents = getDocuments();
    if (!documents) return null;
    return {
      version: 2,
      projectId,
      savedAt: new Date().toISOString(),
      projectDetails,
      variables,
      events,
      functions,
      openTabs,
      activeGraphTab,
      targetLanguage,
      autoCompile,
      autoSave,
      documents,
      installedLibrary,
    };
  }, [
    getDocuments,
    projectId,
    projectDetails,
    variables,
    events,
    functions,
    openTabs,
    activeGraphTab,
    targetLanguage,
    autoCompile,
    autoSave,
    installedLibrary,
  ]);

  const handleSave = useCallback(async () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    const saved = saveProjectToStore(projectId, snapshot, projectSource);
    await VvsApi.saveProject(snapshot, projectId);
    setLastSavedAt(saved.savedAt);
    setOpenMenu(null);
  }, [buildSnapshot, projectId, projectSource, setLastSavedAt]);

  const handleCompile = useCallback(async () => {
    if (compileState === 'compiling') return;

    const documents = getDocuments();
    if (!documents) return;

    const analysis = runProjectAnalysis({
      documents,
      functions,
      events,
      variables,
      projectDetails,
      targetLanguage,
    });
    window.dispatchEvent(
      new CustomEvent('vvs:validation-result', {
        detail: { ok: analysis.ok, messages: [...analysis.errors, ...analysis.warnings] },
      })
    );

    if (!analysis.ok) {
      setValidationErrors(analysis.errors);
      setValidationWarnings(analysis.warnings);
      setCompileState('error');
      return;
    }

    setValidationErrors([]);
    setValidationWarnings(analysis.warnings);
    setCompileState('compiling');
    try {
      await VvsApi.compileProject();
      setValidationErrors([]);
      setValidationWarnings(analysis.warnings);
      markTabClean(activeGraphTab);
      setCompileState('success');
    } catch {
      setCompileState('error');
    }
  }, [
    activeGraphTab,
    compileState,
    events,
    functions,
    getDocuments,
    markTabClean,
    projectDetails,
    setCompileState,
    setValidationErrors,
    setValidationWarnings,
    targetLanguage,
  ]);

  const handleCommitPreview = useCallback(() => {
    window.dispatchEvent(new CustomEvent('vvs:commit-preview'));
    setOpenMenu(null);
  }, []);

  const buildSnapshotRef = useRef(buildSnapshot);
  buildSnapshotRef.current = buildSnapshot;

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const handleCompileRef = useRef(handleCompile);
  handleCompileRef.current = handleCompile;

  const handleCommitPreviewRef = useRef(handleCommitPreview);
  handleCommitPreviewRef.current = handleCommitPreview;

  useEffect(() => {
    if (!autoCompile) return;
    if (Object.keys(dirtyTabIds).length === 0) return;
    const timer = window.setTimeout(() => {
      void handleCompileRef.current();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoCompile, dirtyTabIds]);

  useEffect(() => {
    if (!autoSave) return;
    if (Object.keys(dirtyTabIds).length === 0) return;
    const timer = window.setTimeout(() => {
      handleCommitPreviewRef.current();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [autoSave, dirtyTabIds, variables, events, functions, projectDetails, openTabs, targetLanguage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        void handleSaveRef.current();
      }
      if (e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault();
        void handleCompileRef.current();
      }
      if (e.key.toLowerCase() === 's' && e.shiftKey) {
        e.preventDefault();
        handleCommitPreviewRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleCloseProject = async () => {
    const snapshot = buildSnapshot();
    if (snapshot) {
      const saved = saveProjectToStore(projectId, snapshot, projectSource);
      await VvsApi.saveProject(snapshot, projectId);
      setLastSavedAt(saved.savedAt);
    }
    setOpenMenu(null);
    router.push('/');
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!confirmDiscardDirty()) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isProjectSnapshot(parsed)) {
        window.alert('Invalid VVS project file. Expected version 1 snapshot with documents.');
        return;
      }
      applyProjectSnapshot({ ...parsed, projectId }, snapshotTarget());
      dispatchEditorNavigate(
        {
          graphTab: parsed.activeGraphTab || 'main',
          editorView: 'canvas',
          referenceGraphId: parsed.activeGraphTab || 'main',
          referenceVariableName: null,
          selection: { type: 'graph', id: null },
          focusedNodeId: null,
        },
        { history: 'replace' }
      );
      resetDirtyTabs();
      setLastSavedAt(parsed.savedAt ?? null);
      setCompileState('success');
      setOpenMenu(null);
    } catch {
      window.alert('Could not parse JSON file.');
    }
  };

  const togglePillClass = (on: boolean) =>
    on
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700';

  const handleExport = () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    const data =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const a = document.createElement('a');
    a.href = data;
    a.download = `${projectDetails.moduleName || 'project'}.vvs.json`;
    a.click();
    setOpenMenu(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <header className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 text-sm font-sans shrink-0 w-full z-50">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleCloseProject}
            className="font-bold text-zinc-100 tracking-wide flex items-center gap-2 hover:text-zinc-300 transition-colors"
            title="Back to projects"
          >
            <div className="w-4 h-4 rounded bg-zinc-100" />
            VVS 2.0
          </button>

          <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'file' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>File</button>
              {openMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <button onClick={handleSave} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Save size={12} className="shrink-0 opacity-70" />
                    Save
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+S</span>
                  </button>
                  <button onClick={handleExport} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <FileDown size={12} className="shrink-0 opacity-70" />
                    Export
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <FileUp size={12} className="shrink-0 opacity-70" />
                    Import
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={handleCloseProject} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <FolderOutput size={12} className="shrink-0 opacity-70" />
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'edit' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>Edit</button>
              {openMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <button onClick={() => { void handleCompile(); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Zap size={12} className="shrink-0 opacity-70" />
                    Compile
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+G</span>
                  </button>
                  <button onClick={() => { handleCommitPreview(); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <RefreshCw size={12} className="shrink-0 opacity-70" />
                    Sync preview
                    <span className="ml-auto text-[9px] text-zinc-600">⇧S</span>
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => { triggerUndo(); setOpenMenu(null); }} disabled={!canUndo} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                    <Undo2 size={12} className="shrink-0 opacity-70" />
                    Undo
                  </button>
                  <button onClick={() => { triggerRedo(); setOpenMenu(null); }} disabled={!canRedo} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                    <Redo2 size={12} className="shrink-0 opacity-70" />
                    Redo
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => { dispatchGraphAction('cut'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Scissors size={12} className="shrink-0 opacity-70" />
                    Cut
                  </button>
                  <button onClick={() => { dispatchGraphAction('copy'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Copy size={12} className="shrink-0 opacity-70" />
                    Copy
                  </button>
                  <button onClick={() => { dispatchGraphAction('paste'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <ClipboardPaste size={12} className="shrink-0 opacity-70" />
                    Paste
                  </button>
                  <button onClick={() => { dispatchGraphAction('duplicate'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Files size={12} className="shrink-0 opacity-70" />
                    Duplicate
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'view' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>View</button>
              {openMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <button onClick={() => { dispatchGraphAction('zoom-fit'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <ZoomIn size={12} className="shrink-0 opacity-70" />
                    Zoom to fit
                  </button>
                  <button onClick={() => { dispatchGraphAction('group-comment'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Group size={12} className="shrink-0 opacity-70" />
                    Group
                    <span className="ml-auto text-[9px] text-zinc-600">⇧G</span>
                  </button>
                  <button onClick={() => { dispatchGraphAction('extract-function'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Extract to function
                    <span className="ml-auto text-[9px] text-zinc-600">⇧E</span>
                  </button>
                  <button onClick={() => { dispatchGraphAction('ungroup-comment'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Ungroup size={12} className="shrink-0 opacity-70" />
                    Ungroup
                    <span className="ml-auto text-[9px] text-zinc-600">⇧U</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-2" />

          <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
            <button
              onClick={() => navigate({ editorView: 'canvas' })}
              title="Canvas"
              className={`px-2.5 py-1.5 transition-colors ${activeTab === 'canvas' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              <PenLine size={14} />
            </button>
            <button
              onClick={() => navigate({ editorView: 'references' })}
              title="References"
              className={`px-2.5 py-1.5 transition-colors border-l border-zinc-800 ${activeTab === 'references' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              <GitBranch size={14} />
            </button>
            <button
              onClick={() => navigate({ editorView: 'library' })}
              title="Library"
              className={`px-2.5 py-1.5 transition-colors border-l border-zinc-800 ${activeTab === 'library' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              <Package size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'canvas' && (
            <>
              <button
                type="button"
                onClick={() => setAutoCompile(!autoCompile)}
                className={`p-1.5 rounded border transition-colors ${togglePillClass(autoCompile)}`}
                title={autoCompile ? 'Auto-compile on' : 'Auto-compile off (Ctrl+G)'}
                aria-pressed={autoCompile}
              >
                <Zap size={14} />
              </button>
              <button
                type="button"
                onClick={() => setAutoSave(!autoSave)}
                className={`p-1.5 rounded border transition-colors ${togglePillClass(autoSave)}`}
                title={autoSave ? 'Auto-sync preview on' : 'Auto-sync off (Ctrl+Shift+S)'}
                aria-pressed={autoSave}
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={handleCommitPreview}
                className="p-1.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                title="Sync preview (Ctrl+Shift+S)"
              >
                <Save size={14} />
              </button>
            </>
          )}

          <button
            onClick={openMcpModal}
            className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            title="Connect AI (MCP)"
          >
            <Bot size={14} />
          </button>
        </div>
      </header>

      {showMCPModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-[480px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-zinc-100 font-semibold text-sm">Connect AI (MCP)</h3>
              <button onClick={() => setShowMCPModal(false)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect your IDE (Cursor, Claude Desktop, or Windsurf) to this VVS session so AI can read and write node graphs.
              </p>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">MCP Server URL</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={mcpUrl}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(mcpUrl)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-4 py-2 rounded font-medium transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleMcpProbe()}
                disabled={mcpProbeState === 'testing'}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs px-4 py-2 rounded font-medium transition-colors"
              >
                {mcpProbeState === 'testing' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Testing connection…
                  </>
                ) : (
                  'Test connection'
                )}
              </button>
              <div className="flex items-start gap-2 pt-4 border-t border-zinc-800 text-xs">
                <div
                  className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${
                    mcpProbeState === 'ok'
                      ? 'bg-emerald-500'
                      : mcpProbeState === 'fail'
                        ? 'bg-red-500'
                        : 'bg-zinc-500'
                  }`}
                />
                <div className="space-y-1">
                  <span className="text-zinc-400 block">
                    {mcpProbeState === 'idle'
                      ? getApiMode() === 'mock'
                        ? 'Offline mode — MCP requires a running Go server (Phase 2).'
                        : 'Not connected — use Test connection when the server is running.'
                      : mcpProbeMessage}
                  </span>
                  {mcpProbeState === 'fail' && getApiMode() === 'mock' ? (
                    <span className="text-zinc-600 block">Local graph editing and save/load still work.</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
