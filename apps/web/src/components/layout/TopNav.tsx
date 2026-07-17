'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Save, Zap, Bot, PenLine, GitBranch, Package, Milestone, Undo2, Redo2, Scissors, Copy, ClipboardPaste, Files, ZoomIn, Group, Ungroup, FileDown, FileUp, FolderOutput, RefreshCw, Settings, HelpCircle, History, Search, FilePlus, Keyboard } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { VvsApi, getApiMode, ApiError } from '@/lib/api';
import { dispatchGraphAction } from '@/lib/graphActions';
import { matchesGraphShortcut } from '@/lib/graphShortcuts';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { ProjectSnapshot, isProjectSnapshot } from '@/types/projectSnapshot';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { dispatchEditorNavigate } from '@/lib/editorNavigate';
import { useRouter } from 'next/navigation';
import { isProjectDraftOnly, removeProjectDraft } from '@/lib/projectStore';
import { persistEditorSnapshot, flushBrowserSnapshotSync } from '@/lib/projectPersistence';
import { writeGeneratedFilesToFolder, saveProjectToFolder } from '@/lib/projectFolder';
import { emitProjectLikeCodePanel } from '@/lib/emitProjectCode';
import { useFolderPickerSupported } from '@/hooks/useFolderPickerSupported';
import { promoteBrowserProjectToDisk, SAVE_ON_DISK_PROMPT_EVENT } from '@/lib/promoteProjectToDisk';
import { SaveOnDiskPromptDialog } from '@/components/layout/SaveOnDiskPromptDialog';
import { useProjectFolder } from '@/contexts/ProjectFolderContext';
import { runProjectAnalysis } from '@/lib/projectAnalysis';
import { AuthButton } from '@/components/auth/AuthButton';
import { getAccessToken } from '@/lib/auth/session';
import { isHostedFeaturesEnabled } from '@/lib/hostedFeatures';
import {
  buildClaudeDesktopMcpConfig,
  buildCursorMcpConfig,
  buildLocalMcpCliHint,
  buildWindsurfMcpConfig,
  defaultLocalMcpUrl,
  MCP_TOOL_SUMMARIES,
} from '@/lib/mcpPasteConfig';
import { TopNavWorkflowControls } from '@/components/layout/TopNavWorkflowControls';
import { shortcutTitle, shortcutKeys } from '@/lib/graphShortcuts';
import { dispatchOpenSettings } from '@/components/layout/GraphSettingsModal';
import { useUiPreference } from '@/hooks/useUiPreference';
import { readUiPreference, REQUEST_GENERATE_EVENT, dispatchFocusGraphNodeSearch, dispatchOpenActionHistory, dispatchOpenShortcutsHelp } from '@/lib/uiPreferences';
import { logActivity } from '@/lib/actionActivityLog';
import { playAudioCue } from '@/lib/audioFeedback';
import { PRODUCT_NAME } from '@/lib/productName';
import { Tooltip } from '@/components/ui/Tooltip';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';

const TOPNAV_ICON_BTN =
  'p-1.5 rounded text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900 transition-colors';

function MenuTip({
  tip,
  children,
  className,
  ...props
}: {
  tip: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Tooltip content={tip} placement="right" className="block w-full min-w-0">
      <button type="button" className={className} {...props}>
        {children}
      </button>
    </Tooltip>
  );
}

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
  const [mcpCopiedKey, setMcpCopiedKey] = useState<string | null>(null);
  const [mcpAllowDangerousTools, setMcpAllowDangerousTools] = useUiPreference('mcpAllowDangerousTools');
  const mcpUrl = defaultLocalMcpUrl();
  const cursorMcpConfig = buildCursorMcpConfig(mcpUrl);
  const windsurfMcpConfig = buildWindsurfMcpConfig(mcpUrl);
  const claudeMcpConfig = buildClaudeDesktopMcpConfig(mcpUrl);
  const mcpCliHint = buildLocalMcpCliHint();
  const copyMcpText = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMcpCopiedKey(key);
      window.setTimeout(() => setMcpCopiedKey((prev) => (prev === key ? null : prev)), 1600);
    } catch {
      setMcpCopiedKey(null);
    }
  }, []);
  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'view' | 'help' | null>(null);
  const [saveOnDiskPromptOpen, setSaveOnDiskPromptOpen] = useState(false);
  const [saveOnDiskPromptMode, setSaveOnDiskPromptMode] = useState<'close' | 'manual'>('close');
  const [saveOnDiskBusy, setSaveOnDiskBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderPickerAvailable = useFolderPickerSupported();
  const [dimUnsupportedNodes, setDimUnsupportedNodes] = useUiPreference('dimUnsupportedNodes');
  const { codeOpen, graphNavOpen, toggleCode, toggleGraphNav } = useEditorPanels();

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
    targetFileExtensions, setTargetFileExtensions,
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
    workspaceFiles,
    setWorkspaceFiles,
    syntaxPackLock,
    setSyntaxPackLock,
    codegenCapabilities,
    setCodegenCapabilities,
  } = useProject();
  const { targetLanguage: activeGraphLanguage } = useActiveGraphCodegenSettings();

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
      setTargetFileExtensions,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
      setEnvironmentLink,
      setIntegration,
      setWorkspaceFiles,
      setSyntaxPackLock,
      setCodegenCapabilities,
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
      setTargetFileExtensions,
      setAutoCompile,
      setAutoSave,
      setSelection,
      loadDocuments,
      setInstalledLibrary,
      setEnvironmentLink,
      setIntegration,
      setWorkspaceFiles,
      setSyntaxPackLock,
      setCodegenCapabilities,
    ]
  );

  const persistSnapshot = useCallback(
    async (
      snapshot: ProjectSnapshot,
      options?: { requireApiSave?: boolean }
    ): Promise<string> => {
      const { savedAt } = await persistEditorSnapshot({
        projectId,
        projectSource,
        snapshot,
        folder:
          isFolderProject && folderHandle
            ? { handle: folderHandle, label: folderLabel }
            : null,
        options,
      });
      return savedAt;
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
      targetFileExtensions,
      autoCompile,
      autoSave,
      documents,
      installedLibrary,
      environmentId,
      environmentVersion,
      integration,
      syntaxPackLock,
      codegenCapabilities,
      workspaceFiles,
    };
  }, [
    getDocuments,
    projectId,
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
    targetFileExtensions,
    autoCompile,
    autoSave,
    installedLibrary,
    environmentId,
    environmentVersion,
    integration,
    syntaxPackLock,
    codegenCapabilities,
    workspaceFiles,
  ]);

  const handleSave = useCallback(async () => {
    const snapshot = buildSnapshot();
    if (!snapshot) {
      window.alert('Could not save — graph data is not ready yet.');
      return;
    }
    setSaveBusy(true);
    try {
      const savedAt = await persistSnapshot(snapshot);
      setLastSavedAt(savedAt);
      resetDirtyTabs();
      setOpenMenu(null);
      logActivity('save', 'Saved project');
      playAudioCue('save');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not save project.');
    } finally {
      setSaveBusy(false);
    }
  }, [buildSnapshot, persistSnapshot, setLastSavedAt, resetDirtyTabs]);

  const handleCompile = useCallback(async () => {
    if (compileState === 'compiling') return;

    const snapshot = buildSnapshot();
    if (!snapshot) return;

    const analysisLanguage = activeGraphLanguage || targetLanguage;
    const analysis = runProjectAnalysis({
      documents: snapshot.documents,
      functions,
      events,
      variables,
      classes,
      activeClassId,
      openTabs,
      projectDetails,
      targetLanguage: analysisLanguage,
      crossOver: crossOverMode,
    });
    window.dispatchEvent(
      new CustomEvent('vvs:validation-result', {
        detail: {
          ok: analysis.ok,
          messages: [...analysis.errors, ...analysis.warnings],
          language: analysisLanguage,
        },
      })
    );

    if (!analysis.ok) {
      setValidationErrors(analysis.errors);
      setValidationWarnings(analysis.warnings);
      setCompileState('error');
      logActivity('generate', 'Generate failed — validation errors');
      playAudioCue('error');
      return;
    }

    setValidationErrors([]);
    setValidationWarnings(analysis.warnings);
    setCompileState('compiling');
    try {
      // Same emit as Code | Files (graph → file) before API / disk write (U56).
      const emitResult = emitProjectLikeCodePanel(snapshot, {
        emitUnsupportedComments: readUiPreference('showUnsupportedComments'),
      });
      if (isFolderProject && folderHandle) {
        await writeGeneratedFilesToFolder(folderHandle, emitResult);
        await saveProjectToFolder(folderHandle, snapshot);
        resetDirtyTabs();
      }
      if (getApiMode() === 'http') {
        const savedAt = await persistSnapshot(snapshot, { requireApiSave: true });
        setLastSavedAt(savedAt);
        resetDirtyTabs();
      }
      await VvsApi.compileProject(projectId);
      setValidationErrors([]);
      setValidationWarnings(analysis.warnings);
      markTabClean(activeGraphTab);
      setCompileState('success');
      logActivity('generate', 'Generated code');
      playAudioCue('generate');
    } catch (err) {
      setCompileState('error');
      playAudioCue('error');
      logActivity('generate', 'Generate failed');
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
    activeGraphLanguage,
    buildSnapshot,
    classes,
    compileState,
    events,
    folderHandle,
    functions,
    isFolderProject,
    markTabClean,
    resetDirtyTabs,
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
    activeClassId,
  ]);

  const handleCommitPreview = useCallback(() => {
    window.dispatchEvent(new CustomEvent('vvs:commit-preview'));
    setOpenMenu(null);
  }, []);

  const handleCommitPreviewRef = useRef(handleCommitPreview);
  const handleSaveRef = useRef(handleSave);
  const handleCompileRef = useRef(handleCompile);

  React.useLayoutEffect(() => {
    handleCommitPreviewRef.current = handleCommitPreview;
    handleSaveRef.current = handleSave;
    handleCompileRef.current = handleCompile;
  });

  useEffect(() => {
    const onRequestGenerate = () => {
      void handleCompileRef.current();
    };
    window.addEventListener(REQUEST_GENERATE_EVENT, onRequestGenerate);
    return () => window.removeEventListener(REQUEST_GENERATE_EVENT, onRequestGenerate);
  }, []);

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
      if (matchesGraphShortcut(e, 'save-project')) {
        e.preventDefault();
        void handleSaveRef.current();
        return;
      }
      if (matchesGraphShortcut(e, 'compile')) {
        e.preventDefault();
        void handleCompileRef.current();
        return;
      }
      if (matchesGraphShortcut(e, 'sync-preview')) {
        e.preventDefault();
        handleCommitPreviewRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const finishCloseProject = useCallback(async () => {
    const draftOnly = isProjectDraftOnly(projectId);
    if (draftOnly) {
      // Dialog "Close without saving" for session drafts.
      removeProjectDraft(projectId);
    } else {
      const snapshot = buildSnapshot();
      if (!snapshot) {
        window.alert('Could not save — graph data is not ready yet. Stay in the editor and try again.');
        return;
      }
      try {
        const savedAt = await persistSnapshot(snapshot);
        setLastSavedAt(savedAt);
        resetDirtyTabs();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Could not save project.');
        return;
      }
    }
    setOpenMenu(null);
    setSaveOnDiskPromptOpen(false);
    router.push('/');
  }, [buildSnapshot, persistSnapshot, projectId, router, setLastSavedAt, resetDirtyTabs]);

  const handleSaveOnDisk = useCallback(async () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    setSaveOnDiskBusy(true);
    try {
      const promoted = await promoteBrowserProjectToDisk(projectId, snapshot, projectSource);
      if (!promoted) return;
      setOpenMenu(null);
      setSaveOnDiskPromptOpen(false);
      resetDirtyTabs();
      setLastSavedAt(snapshot.savedAt);
      // Remount editor under the stable folder key (stay in editor as a folder project).
      router.replace(`/editor?id=${encodeURIComponent(promoted.folderKey)}`);
    } finally {
      setSaveOnDiskBusy(false);
    }
  }, [buildSnapshot, projectId, projectSource, router, resetDirtyTabs, setLastSavedAt]);

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

  // Flush browser projects sync on tab close; warn for unsaved folder work (async FS).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(dirtyTabIds).length === 0) return;
      if (!isFolderProject) {
        const snapshot = buildSnapshot();
        if (snapshot) {
          flushBrowserSnapshotSync(projectId, snapshot, projectSource);
          return;
        }
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyTabIds, isFolderProject, buildSnapshot, projectId, projectSource]);

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
      logActivity('import', 'Imported project JSON');
      playAudioCue('success');
    } catch {
      window.alert('Could not parse JSON file.');
    }
  };

  const hosted = isHostedFeaturesEnabled();
  const autoSaveTitle = autoSave
    ? hosted
      ? 'Auto save on — debounced project snapshot to local storage and cloud when signed in'
      : 'Auto save on — debounced project snapshot to local storage'
    : `Auto save off — click Save or use ${shortcutKeys('save-project')}`;
  const autoGenerateTitle = autoCompile
    ? 'Auto generate on — debounced validate and transpile on graph changes'
    : `Auto generate off — click Generate or use ${shortcutKeys('compile')}`;

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
    logActivity('export', 'Exported project JSON');
    playAudioCue('success');
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
          <Tooltip content="Back to projects" placement="bottom">
            <button
              type="button"
              onClick={handleCloseProject}
              className="font-bold text-zinc-100 tracking-wide flex items-center gap-2 hover:text-zinc-300 transition-colors"
            >
              <div className="w-4 h-4 rounded bg-zinc-100" />
              VVS Web
            </button>
          </Tooltip>

          <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'file' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>File</button>
              {openMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <button
                    onClick={() => {
                      handleCloseProject();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <FilePlus size={12} className="shrink-0 opacity-70" />
                    New project…
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <MenuTip
                    tip={shortcutTitle('save-project')}
                    onClick={() => { void handleSave(); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Save size={12} className="shrink-0 opacity-70" />
                    Save project
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('save-project')}</span>
                  </MenuTip>
                  {!isFolderProject && folderPickerAvailable ? (
                    <button
                      onClick={() => {
                        setSaveOnDiskPromptMode('manual');
                        setSaveOnDiskPromptOpen(true);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      <FolderOutput size={12} className="shrink-0 opacity-70" />
                      Save on disk…
                    </button>
                  ) : null}
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
                  <MenuTip
                    tip={shortcutTitle('compile')}
                    onClick={() => { void handleCompile(); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Zap size={12} className="shrink-0 opacity-70" />
                    Generate
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('compile')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('sync-preview')}
                    onClick={() => { handleCommitPreview(); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <RefreshCw size={12} className="shrink-0 opacity-70" />
                    Sync code preview
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('sync-preview')}</span>
                  </MenuTip>
                  <div className="h-px bg-zinc-800 my-1" />
                  <MenuTip
                    tip="History — graph undo states in the Output panel"
                    onClick={() => {
                      dispatchOpenActionHistory();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <History size={12} className="shrink-0 opacity-70" />
                    History…
                  </MenuTip>
                  <div className="h-px bg-zinc-800 my-1" />
                  <MenuTip
                    tip={shortcutTitle('undo')}
                    onClick={() => { triggerUndo(); setOpenMenu(null); }}
                    disabled={!canUndo}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                  >
                    <Undo2 size={12} className="shrink-0 opacity-70" />
                    Undo
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('undo')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('redo')}
                    onClick={() => { triggerRedo(); setOpenMenu(null); }}
                    disabled={!canRedo}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                  >
                    <Redo2 size={12} className="shrink-0 opacity-70" />
                    Redo
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('redo')}</span>
                  </MenuTip>
                  <div className="h-px bg-zinc-800 my-1" />
                  <MenuTip
                    tip={shortcutTitle('cut')}
                    onClick={() => { dispatchGraphAction('cut'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Scissors size={12} className="shrink-0 opacity-70" />
                    Cut
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('cut')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('copy')}
                    onClick={() => { dispatchGraphAction('copy'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Copy size={12} className="shrink-0 opacity-70" />
                    Copy
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('copy')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('paste')}
                    onClick={() => { dispatchGraphAction('paste'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <ClipboardPaste size={12} className="shrink-0 opacity-70" />
                    Paste
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('paste')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('duplicate')}
                    onClick={() => { dispatchGraphAction('duplicate'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Files size={12} className="shrink-0 opacity-70" />
                    Duplicate
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('duplicate')}</span>
                  </MenuTip>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'view' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>View</button>
              {openMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <MenuTip
                    tip={shortcutTitle('node-search')}
                    onClick={() => {
                      dispatchFocusGraphNodeSearch(undefined, { searchAllGraphs: false });
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Search size={12} className="shrink-0 opacity-70" />
                    Find in this graph
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('node-search')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('node-search-all')}
                    onClick={() => {
                      dispatchFocusGraphNodeSearch(undefined, { searchAllGraphs: true });
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Search size={12} className="shrink-0 opacity-70" />
                    Find in all graphs
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('node-search-all')}</span>
                  </MenuTip>
                  <div className="h-px bg-zinc-800 my-1" />
                  <MenuTip
                    tip="Frame selection — with nothing selected, fit all"
                    onClick={() => { dispatchGraphAction('focus-selection'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <ZoomIn size={12} className="shrink-0 opacity-70" />
                    Frame selection
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('focus-selection')}</span>
                  </MenuTip>
                  <MenuTip
                    tip="Zoom to fit all"
                    onClick={() => { dispatchGraphAction('zoom-fit'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <ZoomIn size={12} className="shrink-0 opacity-70" />
                    Zoom to fit all
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('group-comment')}
                    onClick={() => { dispatchGraphAction('group-comment'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Group size={12} className="shrink-0 opacity-70" />
                    Comment selection
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('group-comment')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('extract-function')}
                    onClick={() => { dispatchGraphAction('extract-function'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Extract to function
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('extract-function')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('ungroup-comment')}
                    onClick={() => { dispatchGraphAction('ungroup-comment'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Ungroup size={12} className="shrink-0 opacity-70" />
                    Release from comment
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('ungroup-comment')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('toggle-comment-lock')}
                    onClick={() => { dispatchGraphAction('toggle-comment-lock'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Lock / unlock comment
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('toggle-comment-lock')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('snap-comment-members')}
                    onClick={() => { dispatchGraphAction('snap-comment-members'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Resize comment to fit members
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('snap-comment-members')}</span>
                  </MenuTip>
                  <MenuTip
                    tip={shortcutTitle('disconnect')}
                    onClick={() => { dispatchGraphAction('disconnect-selection'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Disconnect wires
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('disconnect')}</span>
                  </MenuTip>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      toggleCode();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <span className="w-3 text-center shrink-0">{codeOpen ? '✓' : ''}</span>
                    Code preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleGraphNav();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <span className="w-3 text-center shrink-0">{graphNavOpen ? '✓' : ''}</span>
                    Project tree
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button
                    onClick={() => {
                      dispatchOpenSettings('project');
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Settings size={12} className="shrink-0 opacity-70" />
                    Settings…
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'help' ? null : 'help')} className={`px-2 py-1 rounded transition-colors text-xs font-medium ${openMenu === 'help' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>Help</button>
              {openMenu === 'help' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded py-1 z-[100]">
                  <MenuTip
                    tip={shortcutTitle('help')}
                    onClick={() => {
                      dispatchOpenShortcutsHelp();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <HelpCircle size={12} className="shrink-0 opacity-70" />
                    Canvas shortcuts
                    <span className="ml-auto text-[9px] text-zinc-600">{shortcutKeys('help')}</span>
                  </MenuTip>
                  <button
                    onClick={() => {
                      dispatchOpenSettings('shortcuts');
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Keyboard size={12} className="shrink-0 opacity-70" />
                    Keyboard settings…
                  </button>
                  <button
                    onClick={() => {
                      navigate({ editorView: 'roadmap' });
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Milestone size={12} className="shrink-0 opacity-70" />
                    Development roadmap
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button
                    onClick={() => {
                      dispatchOpenSettings('about');
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    About {PRODUCT_NAME}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-2" />

          <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
            <Tooltip content="Canvas" placement="bottom" className="flex">
              <button
                onClick={() => navigate({ editorView: 'canvas' })}
                className={`px-2.5 py-1.5 transition-colors ${activeTab === 'canvas' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
              >
                <PenLine size={14} />
              </button>
            </Tooltip>
            <Tooltip content="References" placement="bottom" className="flex">
              <button
                onClick={() => navigate({ editorView: 'references' })}
                className={`px-2.5 py-1.5 transition-colors border-l border-zinc-800 ${activeTab === 'references' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
              >
                <GitBranch size={14} />
              </button>
            </Tooltip>
            <Tooltip content="Library" placement="bottom" className="flex">
              <button
                onClick={() => navigate({ editorView: 'library' })}
                className={`px-2.5 py-1.5 transition-colors border-l border-zinc-800 ${activeTab === 'library' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Package size={14} />
              </button>
            </Tooltip>
            <Tooltip content="Development roadmap" placement="bottom" className="flex">
              <button
                onClick={() => navigate({ editorView: 'roadmap' })}
                className={`px-2.5 py-1.5 transition-colors border-l border-zinc-800 ${activeTab === 'roadmap' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Milestone size={14} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'canvas' && (
            <TopNavWorkflowControls
              dimUnsupportedNodes={dimUnsupportedNodes}
              onDimUnsupportedToggle={() => setDimUnsupportedNodes(!dimUnsupportedNodes)}
              dimUnsupportedTitle={
                dimUnsupportedNodes
                  ? 'Dim unsupported nodes for current language (on)'
                  : 'Dim unsupported nodes for current language (off)'
              }
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

          <Tooltip content="Connect AI (MCP)" placement="bottom">
            <button type="button" onClick={openMcpModal} className={TOPNAV_ICON_BTN}>
              <Bot size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Settings" placement="bottom">
            <button
              type="button"
              onClick={() => dispatchOpenSettings('project')}
              className={TOPNAV_ICON_BTN}
            >
              <Settings size={14} />
            </button>
          </Tooltip>
          <AuthButton />
        </div>
      </header>

      {showMCPModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-[min(520px,calc(100%-2rem))] max-h-[min(90vh,640px)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-zinc-100 font-semibold text-sm">Connect AI (MCP)</h3>
              <button type="button" onClick={() => setShowMCPModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Paste a config into your IDE (Cursor, Claude Desktop, Windsurf). Run the local Go MCP on{' '}
                <span className="font-medium text-zinc-300">desktop</span> — no VVS account. Mobile AI is not supported yet.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Start local MCP</label>
                <pre className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {mcpCliHint}
                </pre>
                <button
                  type="button"
                  onClick={() => void copyMcpText('cli', mcpCliHint)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  {mcpCopiedKey === 'cli' ? 'Copied' : 'Copy hint'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Cursor mcp.json</label>
                <pre className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-300 font-mono whitespace-pre-wrap max-h-28 overflow-auto">
                  {cursorMcpConfig}
                </pre>
                <button
                  type="button"
                  onClick={() => void copyMcpText('cursor', cursorMcpConfig)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium transition-colors"
                >
                  {mcpCopiedKey === 'cursor' ? 'Copied' : 'Copy Cursor config'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Windsurf mcp.json</label>
                <pre className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-300 font-mono whitespace-pre-wrap max-h-28 overflow-auto">
                  {windsurfMcpConfig}
                </pre>
                <button
                  type="button"
                  onClick={() => void copyMcpText('windsurf', windsurfMcpConfig)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium transition-colors"
                >
                  {mcpCopiedKey === 'windsurf' ? 'Copied' : 'Copy Windsurf config'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Claude Desktop</label>
                <pre className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-300 font-mono whitespace-pre-wrap max-h-28 overflow-auto">
                  {claudeMcpConfig}
                </pre>
                <button
                  type="button"
                  onClick={() => void copyMcpText('claude', claudeMcpConfig)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium transition-colors"
                >
                  {mcpCopiedKey === 'claude' ? 'Copied' : 'Copy Claude config'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  What agents can call
                </label>
                <ul className="max-h-32 overflow-y-auto space-y-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-1.5">
                  {MCP_TOOL_SUMMARIES.map((tool) => (
                    <li
                      key={tool.name}
                      className="flex items-start gap-2 text-[10px] leading-snug"
                    >
                      <span
                        className={`shrink-0 mt-0.5 px-1 rounded ${
                          tool.safety === 'dangerous'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {tool.safety === 'dangerous' ? 'write' : 'read'}
                      </span>
                      <span className="min-w-0">
                        <span className="font-mono text-zinc-300">{tool.name}</span>
                        <span className="text-zinc-600"> — {tool.summary}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="flex items-start gap-2 text-[11px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900"
                  checked={mcpAllowDangerousTools}
                  onChange={(e) => setMcpAllowDangerousTools(e.target.checked)}
                />
                <span>
                  Allow <span className="text-amber-300/90">write</span> MCP tools (add/remove nodes,
                  connect pins, save). Off by default. This is an in-app preference — the local MCP
                  server still needs matching enforcement (full U91).
                </span>
              </label>

              {!hosted ? (
                <div className="flex items-start gap-2 pt-2 border-t border-zinc-800 text-xs">
                  <div className="w-2 h-2 rounded-full mt-0.5 shrink-0 bg-zinc-500" />
                  <span className="text-zinc-400">
                    Hosted probe inactive — use local MCP above. Enable{' '}
                    <span className="font-mono text-zinc-500">NEXT_PUBLIC_API_MODE=http</span> for remote Test connection.
                  </span>
                </div>
              ) : (
                <>
                  <div className="pt-2 border-t border-zinc-800 space-y-3">
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Hosted mode — optional probe against the URL below (Bearer token when signed in).
                    </p>
                    {getAccessToken() ? (
                      <p className="text-[11px] text-emerald-400/90">Signed in — MCP probe includes your access token.</p>
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
                          onClick={() => void copyMcpText('url', mcpUrl)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-4 py-2 rounded font-medium transition-colors"
                        >
                          {mcpCopiedKey === 'url' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleMcpProbe()}
                      disabled={mcpProbeState === 'testing'}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed text-zinc-100 text-xs px-4 py-2 rounded font-medium border border-zinc-700 transition-colors"
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
                    <div className="flex items-start gap-2 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${
                          mcpProbeState === 'ok'
                            ? 'bg-emerald-500'
                            : mcpProbeState === 'fail'
                              ? 'bg-red-500'
                              : 'bg-zinc-500'
                        }`}
                      />
                      <span className="text-zinc-400">
                        {mcpProbeState === 'idle'
                          ? 'Not connected — start the Go server and use Test connection.'
                          : mcpProbeMessage}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <SaveOnDiskPromptDialog
        open={saveOnDiskPromptOpen}
        projectName={projectDetails.moduleName || 'Untitled'}
        isDraft={isProjectDraftOnly(projectId)}
        mode={saveOnDiskPromptMode}
        saving={saveOnDiskBusy}
        folderPickerAvailable={folderPickerAvailable}
        onSaveOnDisk={() => void handleSaveOnDisk()}
        onCancel={handleDismissSaveOnDiskPrompt}
      />
    </>
  );
}
