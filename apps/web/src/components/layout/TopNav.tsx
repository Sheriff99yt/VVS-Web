'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Save, Zap, Bot, PenLine, GitBranch, Package, Milestone, Undo2, Redo2, Scissors, Copy, ClipboardPaste, Files, ZoomIn, Group, Ungroup, FileDown, FileUp, FolderOutput, RefreshCw } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { VvsApi, getApiMode, ApiError } from '@/lib/api';
import { dispatchGraphAction } from '@/lib/graphActions';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { ProjectSnapshot, isProjectSnapshot } from '@/types/projectSnapshot';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { dispatchEditorNavigate } from '@/lib/editorNavigate';
import { useRouter } from 'next/navigation';
import { upsertRecentProject, isProjectDraftOnly, removeProjectDraft } from '@/lib/projectStore';
import { persistProjectSnapshot } from '@/lib/cloudPersistence';
import { saveProjectToFolder } from '@/lib/projectFolder';
import { useFolderPickerSupported } from '@/hooks/useFolderPickerSupported';
import { promoteBrowserProjectToDisk, SAVE_ON_DISK_PROMPT_EVENT } from '@/lib/promoteProjectToDisk';
import { SaveOnDiskPromptDialog } from '@/components/layout/SaveOnDiskPromptDialog';
import { useProjectFolder } from '@/contexts/ProjectFolderContext';
import { runProjectAnalysis } from '@/lib/projectAnalysis';
import { AuthButton } from '@/components/auth/AuthButton';
import { getAccessToken } from '@/lib/auth/session';
import { TopNavWorkflowControls } from '@/components/layout/TopNavWorkflowControls';
import { shortcutTitle } from '@/lib/graphShortcuts';

import type { EditorViewTab } from '@/types/editorNavigation';

export interface TopNavProps {
  activeTab: EditorViewTab;
  onTabChange: (tab: EditorViewTab) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const { navigate } = useEditorNavigation();
  const [showMCPModal, setShowMCPModal] = useState(false);
  const [mcpProbeState, setMcpProbeState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [mcpProbeMessage, setMcpProbeMessage] = useState<string | null>(null);
  const mcpUrl =
    process.env.NEXT_PUBLIC_MCP_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080'}/mcp`;
  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'view' | null>(null);
  const [saveOnDiskPromptOpen, setSaveOnDiskPromptOpen] = useState(false);
  const [saveOnDiskPromptMode, setSaveOnDiskPromptMode] = useState<'close' | 'manual'>('close');
  const [saveOnDiskBusy, setSaveOnDiskBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderPickerAvailable = useFolderPickerSupported();

  const {
    canUndo, canRedo, triggerUndo, triggerRedo,
    compileState, setCompileState,
    variables, setVariables,
    events, setEvents,
    functions, setFunctions,
    classes, setClasses,
    graphContainers,
    activeClassId, setActiveClassId,
    openTabs, setOpenTabs,
    activeGraphTab, setActiveGraphTab,
    projectDetails, setProjectDetails,
    targetLanguage, setTargetLanguage,
    crossOverMode,
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
    environmentId,
    environmentVersion,
    setEnvironmentLink,
    integration,
    setIntegration,
    syntaxPackLock,
    setSyntaxPackLock,
  } = useProject();

  const { isFolderProject, folderHandle, folderLabel } = useProjectFolder();

  const router = useRouter();

  const { getDocuments, loadDocuments } = useGraphWorkspace();

  const snapshotTarget = useCallback(
    () => ({
      setVariables,
      setEvents,
      setFunctions,
      setClasses,
      setActiveClassId,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
      setEnvironmentLink,
      setIntegration,
      setSyntaxPackLock,
    }),
    [
      setVariables,
      setEvents,
      setFunctions,
      setClasses,
      setActiveClassId,
      setOpenTabs,
      setActiveGraphTab,
      setProjectDetails,
      setTargetLanguage,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
      setEnvironmentLink,
      setIntegration,
      setSyntaxPackLock,
    ]
  );

  const persistSnapshot = useCallback(
    async (
      snapshot: ProjectSnapshot,
      options?: { requireApiSave?: boolean }
    ): Promise<string> => {
      if (isFolderProject && folderHandle) {
        await saveProjectToFolder(folderHandle, snapshot);
        upsertRecentProject({
          id: projectId,
          moduleName: snapshot.projectDetails.moduleName || 'Untitled',
          savedAt: snapshot.savedAt,
          source: projectSource,
          storage: 'folder',
          folderLabel: folderLabel ?? folderHandle.name,
        });
        if (getApiMode() === 'http') {
          await persistProjectSnapshot(projectId, snapshot, projectSource, options);
        }
        return snapshot.savedAt;
      }
      const saved = await persistProjectSnapshot(projectId, snapshot, projectSource, options);
      return saved.savedAt;
    },
    [isFolderProject, folderHandle, folderLabel, projectId, projectSource]
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
      version: 3,
      projectId,
      savedAt: new Date().toISOString(),
      projectDetails,
      classes,
      activeClassId,
      graphContainers,
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
      environmentId,
      environmentVersion,
      integration,
      syntaxPackLock,
    };
  }, [
    getDocuments,
    projectId,
    projectDetails,
    classes,
    activeClassId,
    variables,
    events,
    functions,
    openTabs,
    activeGraphTab,
    targetLanguage,
    autoCompile,
    autoSave,
    installedLibrary,
    environmentId,
    environmentVersion,
    integration,
    syntaxPackLock,
  ]);

  const handleSave = useCallback(async () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    setSaveBusy(true);
    try {
      const savedAt = await persistSnapshot(snapshot);
      setLastSavedAt(savedAt);
      setOpenMenu(null);
    } finally {
      setSaveBusy(false);
    }
  }, [buildSnapshot, persistSnapshot, setLastSavedAt]);

  const handleCompile = useCallback(async () => {
    if (compileState === 'compiling') return;

    const snapshot = buildSnapshot();
    if (!snapshot) return;

    const analysis = runProjectAnalysis({
      documents: snapshot.documents,
      functions,
      events,
      variables,
      classes,
      activeClassId,
      openTabs,
      projectDetails,
      targetLanguage,
      crossOver: crossOverMode,
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
      if (getApiMode() === 'http') {
        const savedAt = await persistSnapshot(snapshot, { requireApiSave: true });
        setLastSavedAt(savedAt);
      }
      await VvsApi.compileProject(projectId);
      setValidationErrors([]);
      setValidationWarnings(analysis.warnings);
      markTabClean(activeGraphTab);
      setCompileState('success');
    } catch (err) {
      setCompileState('error');
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Generate failed.';
      setValidationErrors([{ level: 'error', message }]);
    }
  }, [
    activeGraphTab,
    buildSnapshot,
    compileState,
    events,
    functions,
    markTabClean,
    persistSnapshot,
    projectDetails,
    projectId,
    setCompileState,
    setLastSavedAt,
    setValidationErrors,
    setValidationWarnings,
    targetLanguage,
    crossOverMode,
    variables,
    openTabs,
  ]);

  const handleCommitPreview = useCallback(() => {
    window.dispatchEvent(new CustomEvent('vvs:commit-preview'));
    setOpenMenu(null);
  }, []);

  const handleCommitPreviewRef = useRef(handleCommitPreview);
  handleCommitPreviewRef.current = handleCommitPreview;

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const handleCompileRef = useRef(handleCompile);
  handleCompileRef.current = handleCompile;

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
      void handleSaveRef.current();
    }, 800);
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

  const finishCloseProject = useCallback(async () => {
    const draftOnly = isProjectDraftOnly(projectId);
    if (!draftOnly) {
      const snapshot = buildSnapshot();
      if (snapshot) {
        const savedAt = await persistSnapshot(snapshot);
        setLastSavedAt(savedAt);
      }
    } else {
      removeProjectDraft(projectId);
    }
    setOpenMenu(null);
    setSaveOnDiskPromptOpen(false);
    router.push('/');
  }, [buildSnapshot, persistSnapshot, projectId, router, setLastSavedAt]);

  const handleSaveOnDisk = useCallback(async () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    setSaveOnDiskBusy(true);
    try {
      const handle = await promoteBrowserProjectToDisk(projectId, snapshot, projectSource);
      if (!handle) return;
      setOpenMenu(null);
      setSaveOnDiskPromptOpen(false);
      router.push('/');
    } finally {
      setSaveOnDiskBusy(false);
    }
  }, [buildSnapshot, projectId, projectSource, router]);

  const handleCloseProject = useCallback(() => {
    if (isFolderProject) {
      void finishCloseProject();
      return;
    }
    setSaveOnDiskPromptMode('close');
    setSaveOnDiskPromptOpen(true);
  }, [isFolderProject, finishCloseProject]);

  const handleDismissSaveOnDiskPrompt = useCallback(() => {
    if (saveOnDiskPromptMode === 'close') {
      void finishCloseProject();
      return;
    }
    setSaveOnDiskPromptOpen(false);
  }, [saveOnDiskPromptMode, finishCloseProject]);

  useEffect(() => {
    const onPrompt = () => {
      setSaveOnDiskPromptMode('manual');
      setSaveOnDiskPromptOpen(true);
    };
    window.addEventListener(SAVE_ON_DISK_PROMPT_EVENT, onPrompt);
    return () => window.removeEventListener(SAVE_ON_DISK_PROMPT_EVENT, onPrompt);
  }, []);

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

  const autoSaveTitle = autoSave
    ? 'Auto save on — debounced project snapshot to local storage and cloud when signed in'
    : 'Auto save off — click Save or use Ctrl+S';
  const autoGenerateTitle = autoCompile
    ? 'Auto generate on — debounced validate and transpile on graph changes'
    : 'Auto generate off — click Generate or use Ctrl+G';

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
                  <button onClick={() => { void handleSave(); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Save size={12} className="shrink-0 opacity-70" />
                    Save project
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
                    Generate
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+G</span>
                  </button>
                  <button onClick={() => { handleCommitPreview(); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <RefreshCw size={12} className="shrink-0 opacity-70" />
                    Sync code preview
                    <span className="ml-auto text-[9px] text-zinc-600">⇧S</span>
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => { triggerUndo(); setOpenMenu(null); }} disabled={!canUndo} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                    <Undo2 size={12} className="shrink-0 opacity-70" />
                    Undo
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+Z</span>
                  </button>
                  <button onClick={() => { triggerRedo(); setOpenMenu(null); }} disabled={!canRedo} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                    <Redo2 size={12} className="shrink-0 opacity-70" />
                    Redo
                    <span className="ml-auto text-[9px] text-zinc-600">⇧Z</span>
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={() => { dispatchGraphAction('cut'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Scissors size={12} className="shrink-0 opacity-70" />
                    Cut
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+X</span>
                  </button>
                  <button onClick={() => { dispatchGraphAction('copy'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Copy size={12} className="shrink-0 opacity-70" />
                    Copy
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+C</span>
                  </button>
                  <button onClick={() => { dispatchGraphAction('paste'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <ClipboardPaste size={12} className="shrink-0 opacity-70" />
                    Paste
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+V</span>
                  </button>
                  <button onClick={() => { dispatchGraphAction('duplicate'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Files size={12} className="shrink-0 opacity-70" />
                    Duplicate
                    <span className="ml-auto text-[9px] text-zinc-600">Ctrl+D</span>
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
                    <span className="ml-auto text-[9px] text-zinc-600">Shift+F</span>
                  </button>
                  <button onClick={() => { dispatchGraphAction('focus-selection'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <ZoomIn size={12} className="shrink-0 opacity-70" />
                    Frame selection
                    <span className="ml-auto text-[9px] text-zinc-600">F</span>
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
                  <button onClick={() => { dispatchGraphAction('disconnect-selection'); setOpenMenu(null); }} className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Disconnect wires
                    <span className="ml-auto text-[9px] text-zinc-600">Alt+D</span>
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
            <button
              onClick={() => navigate({ editorView: 'roadmap' })}
              title="Development roadmap"
              className={`px-2.5 py-1.5 transition-colors border-l border-zinc-800 ${activeTab === 'roadmap' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              <Milestone size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'canvas' && (
            <TopNavWorkflowControls
              autoSave={autoSave}
              onAutoSaveToggle={() => setAutoSave(!autoSave)}
              autoSaveTitle={autoSaveTitle}
              onSaveNow={() => void handleSave()}
              saveNowTitle={shortcutTitle('save-project')}
              saveBusy={saveBusy}
              autoGenerate={autoCompile}
              onAutoGenerateToggle={() => setAutoCompile(!autoCompile)}
              autoGenerateTitle={autoGenerateTitle}
              onGenerateNow={() => void handleCompile()}
              generateNowTitle={shortcutTitle('compile')}
              generateBusy={compileState === 'compiling'}
            />
          )}

          <button
            onClick={openMcpModal}
            className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            title="Connect AI (MCP)"
          >
            <Bot size={14} />
          </button>
          <AuthButton />
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
                Connect your IDE (Cursor, Claude Desktop, or Windsurf) to this VVS session so AI can read and write node graphs via MCP.
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                <span className="text-zinc-400">Local dev:</span> run the Go server with{' '}
                <span className="font-mono text-zinc-400">NEXT_PUBLIC_API_MODE=http</span> — no auth token required when{' '}
                <span className="font-mono text-zinc-400">AUTH_REQUIRED=false</span>.
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                <span className="text-zinc-400">Production:</span> use your HTTPS API host, e.g.{' '}
                <span className="font-mono text-zinc-400">https://api.your-domain/mcp</span>. Set{' '}
                <span className="font-mono text-zinc-400">NEXT_PUBLIC_MCP_URL</span> in{' '}
                <span className="font-mono text-zinc-400">.env.local</span>. When signed in, Test connection sends your Bearer token; add the same header in your IDE MCP config when{' '}
                <span className="font-mono text-zinc-400">AUTH_REQUIRED=true</span>.
              </p>
              {getAccessToken() ? (
                <p className="text-[11px] text-emerald-400/90">
                  Signed in — MCP probe includes your access token.
                </p>
              ) : null}
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
                        ? 'Offline mode — set NEXT_PUBLIC_API_MODE=http and start the Go server for local MCP.'
                        : 'Not connected — start the Go server and use Test connection.'
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
      <SaveOnDiskPromptDialog
        open={saveOnDiskPromptOpen}
        projectName={projectDetails.moduleName || 'Untitled'}
        isDraft={isProjectDraftOnly(projectId)}
        saving={saveOnDiskBusy}
        folderPickerAvailable={folderPickerAvailable}
        onSaveOnDisk={() => void handleSaveOnDisk()}
        onCancel={handleDismissSaveOnDiskPrompt}
      />
    </>
  );
}
