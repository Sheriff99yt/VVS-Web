'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, FileCode2, Play, Square, Pause, SkipForward } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { VvsApi } from '@/lib/api';
import { dispatchGraphAction } from '@/lib/graphActions';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { ProjectSnapshot, isProjectSnapshot } from '@/types/projectSnapshot';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { dispatchEditorNavigate } from '@/lib/editorNavigate';
import { useRouter } from 'next/navigation';
import { saveProjectToStore } from '@/lib/projectStore';
import { validateProjectDocuments } from '@/lib/graphValidator';

export interface TopNavProps {
  activeTab: 'canvas' | 'references' | 'library';
  onTabChange: (tab: 'canvas' | 'references' | 'library') => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const { navigate } = useEditorNavigation();
  const [showMCPModal, setShowMCPModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'view' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    canUndo, canRedo, triggerUndo, triggerRedo,
    simulationState, setSimulationState,
    compileState, setCompileState,
    variables, setVariables,
    functions, setFunctions,
    openTabs, setOpenTabs,
    activeGraphTab, setActiveGraphTab,
    projectDetails, setProjectDetails,
    targetLanguage, setTargetLanguage,
    autoCompile, setAutoCompile,
    setSelection,
    setValidationErrors,
    setInstalledLibrary,
    installedLibrary,
    projectId,
    projectSource,
  } = useProject();

  const router = useRouter();

  const { getDocuments, loadDocuments } = useGraphWorkspace();

  const snapshotTarget = useCallback(
    () => ({
      setVariables,
      setFunctions,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setAutoCompile,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
    }),
    [
      setVariables,
      setFunctions,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setAutoCompile,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
    ]
  );

  const confirmDiscardDirty = useCallback((): boolean => {
    if (compileState !== 'dirty') return true;
    return window.confirm('Discard unsaved changes?');
  }, [compileState]);

  useEffect(() => {
    const handleGlobalClick = () => setOpenMenu(null);
    if (openMenu) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [openMenu]);

  const handleCompile = async () => {
    if (compileState === 'compiling') return;

    const documents = getDocuments();
    if (!documents) return;

    const validation = validateProjectDocuments(documents);
    window.dispatchEvent(
      new CustomEvent('vvs:validation-result', { detail: validation })
    );

    if (!validation.ok) {
      setValidationErrors(validation.messages.filter((m) => m.level === 'error'));
      setCompileState('error');
      return;
    }

    setValidationErrors([]);
    setCompileState('compiling');
    try {
      await VvsApi.compileProject();
      setValidationErrors([]);
      setCompileState('success');
    } catch {
      setCompileState('error');
    }
  };

  const getCompileButtonClass = () => {
    if (compileState === 'dirty') return 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30';
    if (compileState === 'compiling') return 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-not-allowed';
    if (compileState === 'success') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30';
    if (compileState === 'error') return 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30';
    return 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100';
  };

  const buildSnapshot = (): ProjectSnapshot | null => {
    const documents = getDocuments();
    if (!documents) return null;
    return {
      version: 1,
      projectId,
      savedAt: new Date().toISOString(),
      projectDetails,
      variables,
      functions,
      openTabs,
      activeGraphTab,
      targetLanguage,
      autoCompile,
      documents,
      installedLibrary,
    };
  };

  const handleCloseProject = async () => {
    const snapshot = buildSnapshot();
    if (snapshot) {
      saveProjectToStore(projectId, snapshot, projectSource);
      await VvsApi.saveProject(snapshot, projectId);
    }
    setSimulationState('idle');
    setOpenMenu(null);
    router.push('/');
  };

  const handleSave = async () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    saveProjectToStore(projectId, snapshot, projectSource);
    await VvsApi.saveProject(snapshot, projectId);
    setCompileState('success');
    setOpenMenu(null);
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
      setSimulationState('idle');
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
      setCompileState('dirty');
      setOpenMenu(null);
    } catch {
      window.alert('Could not parse JSON file.');
    }
  };

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

  const handlePlay = () => {
    if (simulationState === 'playing') {
      setSimulationState('paused');
    } else {
      setSimulationState('playing');
    }
  };

  const handleStep = () => {
    window.dispatchEvent(new CustomEvent('vvs:simulation-step'));
  };

  const handleStop = () => setSimulationState('idle');

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
                  <button onClick={handleSave} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Save project</button>
                  <button onClick={handleExport} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Export JSON</button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Import JSON</button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={handleCloseProject} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Close project</button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'edit' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>Edit</button>
              {openMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <button onClick={() => { triggerUndo(); setOpenMenu(null); }} disabled={!canUndo} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50">Undo</button>
                  <button onClick={() => { triggerRedo(); setOpenMenu(null); }} disabled={!canRedo} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50">Redo</button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => { dispatchGraphAction('cut'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Cut</button>
                  <button onClick={() => { dispatchGraphAction('copy'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Copy</button>
                  <button onClick={() => { dispatchGraphAction('paste'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Paste</button>
                  <button onClick={() => { dispatchGraphAction('duplicate'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Duplicate</button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'view' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>View</button>
              {openMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <button onClick={() => { dispatchGraphAction('zoom-fit'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Zoom to Fit</button>
                  <button onClick={() => { dispatchGraphAction('group-comment'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Group in Comment (Ctrl+Shift+G)</button>
                  <button onClick={() => { dispatchGraphAction('ungroup-comment'); setOpenMenu(null); }} className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">Ungroup (Ctrl+Shift+U)</button>
                </div>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-2" />

          <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
            <button
              onClick={() => navigate({ editorView: 'canvas' })}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${activeTab === 'canvas' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              Canvas
            </button>
            <button
              onClick={() => navigate({ editorView: 'references' })}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-zinc-800 ${activeTab === 'references' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              References
            </button>
            <button
              onClick={() => navigate({ editorView: 'library' })}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-zinc-800 ${activeTab === 'library' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              Library
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            {projectDetails.moduleName || 'Untitled'}
          </span>

          {activeTab === 'canvas' && (
            <>
              <button
                onClick={handleCompile}
                disabled={compileState === 'compiling'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold transition-colors ${getCompileButtonClass()}`}
              >
                {compileState === 'compiling' ? <Loader2 size={14} className="animate-spin" /> : <FileCode2 size={14} />}
                Generate
              </button>

              <div className="flex items-center border border-zinc-800 rounded overflow-hidden">
                <button
                  onClick={handlePlay}
                  className={`px-2.5 py-1.5 transition-colors ${simulationState === 'playing' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                  title={simulationState === 'playing' ? 'Pause' : 'Play'}
                >
                  {simulationState === 'playing' ? <Pause size={14} /> : <Play size={14} />}
                </button>
                {simulationState === 'paused' && (
                  <button
                    onClick={handleStep}
                    className="px-2.5 py-1.5 border-l border-zinc-800 text-amber-400 hover:bg-zinc-800 transition-colors"
                    title="Single step"
                  >
                    <SkipForward size={14} />
                  </button>
                )}
                <button
                  onClick={handleStop}
                  disabled={simulationState === 'idle'}
                  className="px-2.5 py-1.5 border-l border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40 transition-colors"
                  title="Stop"
                >
                  <Square size={14} />
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setShowMCPModal(true)}
            className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Connect AI
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
                    value="http://localhost:8080/mcp"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono outline-none"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText('http://localhost:8080/mcp')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded font-medium transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-800 text-xs">
                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="text-zinc-400">Not connected — backend not running (mock UI)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
