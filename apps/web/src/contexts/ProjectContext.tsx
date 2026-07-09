'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { GraphVariable } from '@/types/graph';
import type { ProjectEventDefinition } from '@/types/graph';
import type { ValidationMessage } from '@/lib/graphValidator';
import type { InstalledLibraryEntry } from '@/types/libraryAsset';
import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';

import type { FunctionSymbol, GraphTab, TargetLanguage, CrossOverArchitectureMode, ProjectIntegrationConfig, SyntaxPackLock, ClassSymbol, GraphContainer, CodegenCapabilities, TargetFileExtensions } from '@vvs/graph-types';
import { createDefaultIntegration, normalizeProjectSnapshot, MAIN_GRAPH_CONTAINER_ID, normalizeTargetFileExtensions } from '@vvs/graph-types';
import { readCrossOverMode } from '@/lib/crossOverPreferences';

export type { TargetLanguage, GraphTab, FunctionSymbol, ClassSymbol, GraphContainer };
export type SelectionType = 'node' | 'variable' | 'event' | 'function' | 'graph' | 'class';

export interface SelectionState {
  type: SelectionType;
  id: string | null;
}

interface ProjectFunction extends FunctionSymbol {}

interface ProjectContextValue {
  projectId: string;
  projectSource: ProjectSource;

  variables: GraphVariable[];
  setVariables: React.Dispatch<React.SetStateAction<GraphVariable[]>>;
  events: ProjectEventDefinition[];
  setEvents: React.Dispatch<React.SetStateAction<ProjectEventDefinition[]>>;
  functions: ProjectFunction[];
  setFunctions: React.Dispatch<React.SetStateAction<ProjectFunction[]>>;
  classes: ClassSymbol[];
  setClasses: React.Dispatch<React.SetStateAction<ClassSymbol[]>>;
  graphContainers: GraphContainer[];
  setGraphContainers: React.Dispatch<React.SetStateAction<GraphContainer[]>>;
  activeClassId: string;
  setActiveClassId: React.Dispatch<React.SetStateAction<string>>;
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  /** All selected graph node ids on the active canvas (primary first). */
  selectedNodeIds: string[];
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  openTabs: GraphTab[];
  setOpenTabs: React.Dispatch<React.SetStateAction<GraphTab[]>>;
  activeGraphTab: string;
  setActiveGraphTab: React.Dispatch<React.SetStateAction<string>>;

  projectDetails: { moduleName: string; extendsType: string; description: string };
  setProjectDetails: React.Dispatch<React.SetStateAction<{ moduleName: string; extendsType: string; description: string }>>;

  compileState: 'clean' | 'dirty' | 'compiling' | 'success' | 'error';
  setCompileState: React.Dispatch<React.SetStateAction<'clean' | 'dirty' | 'compiling' | 'success' | 'error'>>;

  /** Per-graph-tab uncompiled changes (U15) */
  dirtyTabIds: Record<string, true>;
  markTabDirty: (tabId: string) => void;
  markTabClean: (tabId: string) => void;
  isTabDirty: (tabId: string) => boolean;
  resetDirtyTabs: () => void;

  /** Last local save timestamp for status chrome (U31) */
  lastSavedAt: string | null;
  setLastSavedAt: React.Dispatch<React.SetStateAction<string | null>>;

  autoCompile: boolean;
  setAutoCompile: React.Dispatch<React.SetStateAction<boolean>>;
  autoSave: boolean;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  targetLanguage: TargetLanguage;
  setTargetLanguage: React.Dispatch<React.SetStateAction<TargetLanguage>>;
  targetFileExtensions: TargetFileExtensions;
  setTargetFileExtensions: React.Dispatch<React.SetStateAction<TargetFileExtensions>>;

  crossOverMode: CrossOverArchitectureMode;
  setCrossOverMode: React.Dispatch<React.SetStateAction<CrossOverArchitectureMode>>;

  undoTrigger: number;
  triggerUndo: () => void;
  redoTrigger: number;
  triggerRedo: () => void;
  canUndo: boolean;
  setCanUndo: React.Dispatch<React.SetStateAction<boolean>>;
  canRedo: boolean;
  setCanRedo: React.Dispatch<React.SetStateAction<boolean>>;

  validationErrors: ValidationMessage[];
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationMessage[]>>;
  validationWarnings: ValidationMessage[];
  setValidationWarnings: React.Dispatch<React.SetStateAction<ValidationMessage[]>>;

  installedLibrary: InstalledLibraryEntry[];
  setInstalledLibrary: React.Dispatch<React.SetStateAction<InstalledLibraryEntry[]>>;

  environmentId?: string;
  environmentVersion?: string;
  setEnvironmentLink: (id: string | undefined, version?: string) => void;

  integration: ProjectIntegrationConfig;
  setIntegration: React.Dispatch<React.SetStateAction<ProjectIntegrationConfig>>;

  /** Repo-relative workspace paths shown in project folder browser. */
  workspaceFiles?: string[];
  setWorkspaceFiles: React.Dispatch<React.SetStateAction<string[] | undefined>>;

  syntaxPackLock?: SyntaxPackLock;
  setSyntaxPackLock: React.Dispatch<React.SetStateAction<SyntaxPackLock | undefined>>;

  codegenCapabilities?: CodegenCapabilities;
  setCodegenCapabilities: React.Dispatch<React.SetStateAction<CodegenCapabilities | undefined>>;

  /** Root for References view graph/tree — updated from project tree selection */
  referenceRootGraphId: string;
  referenceVariableName: string | null;
  focusReference: (graphId: string, variableName?: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  projectId: string;
  projectSource: ProjectSource;
  initialSnapshot: ProjectSnapshot;
}

export function ProjectProvider({
  children,
  projectId,
  projectSource,
  initialSnapshot,
}: ProjectProviderProps) {
  const snapshot = normalizeProjectSnapshot(initialSnapshot) ?? initialSnapshot;

  const [variables, setVariables] = useState<GraphVariable[]>(snapshot.variables);
  const [events, setEvents] = useState<ProjectEventDefinition[]>(snapshot.events ?? []);
  const [functions, setFunctions] = useState<ProjectFunction[]>(snapshot.functions);
  const [classes, setClasses] = useState<ClassSymbol[]>(snapshot.classes);
  const [graphContainers, setGraphContainers] = useState<GraphContainer[]>(
    snapshot.graphContainers
  );
  const [activeClassId, setActiveClassId] = useState<string>(snapshot.activeClassId);
  const [selection, setSelection] = useState<SelectionState>({ type: 'graph', id: null });
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [openTabs, setOpenTabs] = useState<GraphTab[]>(
    snapshot.openTabs.length > 0
      ? snapshot.openTabs
      : [{ id: 'main', type: 'main', name: 'Main graph' }]
  );
  const [activeGraphTab, setActiveGraphTabInner] = useState<string>(
    snapshot.activeGraphTab || MAIN_GRAPH_CONTAINER_ID
  );

  const [projectDetails, setProjectDetails] = useState(snapshot.projectDetails);

  const [compileState, setCompileStateInner] = useState<'clean' | 'dirty' | 'compiling' | 'success' | 'error'>(
    projectSource === 'new' ? 'clean' : 'success'
  );
  const [dirtyTabIds, setDirtyTabIds] = useState<Record<string, true>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(snapshot.savedAt ?? null);

  const markTabDirty = useCallback((tabId: string) => {
    setDirtyTabIds((prev) => (prev[tabId] ? prev : { ...prev, [tabId]: true }));
  }, []);

  const markTabClean = useCallback((tabId: string) => {
    setDirtyTabIds((prev) => {
      if (!prev[tabId]) return prev;
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  }, []);

  const isTabDirty = useCallback((tabId: string) => Boolean(dirtyTabIds[tabId]), [dirtyTabIds]);

  const resetDirtyTabs = useCallback(() => setDirtyTabIds({}), []);

  const [autoCompile, setAutoCompile] = useState(snapshot.autoCompile);
  const [autoSave, setAutoSave] = useState(snapshot.autoSave ?? false);

  const setCompileState = useCallback(
    (action: React.SetStateAction<'clean' | 'dirty' | 'compiling' | 'success' | 'error'>) => {
      setCompileStateInner((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        if (autoCompile && next === 'dirty') {
          return 'success';
        }
        return next;
      });
    },
    [autoCompile]
  );
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(snapshot.targetLanguage);
  const [targetFileExtensions, setTargetFileExtensions] = useState<TargetFileExtensions>(
    () => normalizeTargetFileExtensions(snapshot.targetFileExtensions)
  );
  const [crossOverMode, setCrossOverMode] = useState<CrossOverArchitectureMode>(() => readCrossOverMode());

  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const triggerUndo = () => setUndoTrigger((prev) => prev + 1);
  const triggerRedo = () => setRedoTrigger((prev) => prev + 1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationMessage[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationMessage[]>([]);
  const [installedLibrary, setInstalledLibrary] = useState<InstalledLibraryEntry[]>(
    snapshot.installedLibrary ?? []
  );
  const [environmentId, setEnvironmentId] = useState<string | undefined>(
    snapshot.environmentId
  );
  const [environmentVersion, setEnvironmentVersion] = useState<string | undefined>(
    snapshot.environmentVersion
  );

  const [integration, setIntegration] = useState<ProjectIntegrationConfig>(
    () =>
      snapshot.integration ??
      createDefaultIntegration({
        environmentId: snapshot.environmentId,
        environmentVersion: snapshot.environmentVersion,
        moduleName: snapshot.projectDetails.moduleName,
        defaultTarget: snapshot.targetLanguage,
        adoptExisting: true,
      })
  );
  const [workspaceFiles, setWorkspaceFiles] = useState<string[] | undefined>(
    snapshot.workspaceFiles
  );

  const [syntaxPackLock, setSyntaxPackLock] = useState<SyntaxPackLock | undefined>(
    snapshot.syntaxPackLock
  );
  const [codegenCapabilities, setCodegenCapabilities] = useState<CodegenCapabilities | undefined>(
    snapshot.codegenCapabilities
  );

  const setEnvironmentLink = useCallback((id: string | undefined, version?: string) => {
    setEnvironmentId(id);
    setEnvironmentVersion(version);
  }, []);

  const initialTab = snapshot.activeGraphTab || MAIN_GRAPH_CONTAINER_ID;
  const [referenceRootGraphId, setReferenceRootGraphId] = useState(initialTab);
  const [referenceVariableName, setReferenceVariableName] = useState<string | null>(null);

  const focusReference = useCallback((graphId: string, variableName?: string | null) => {
    setReferenceRootGraphId(graphId);
    setReferenceVariableName(variableName ?? null);
  }, []);

  const activeGraphTabRef = useRef(activeGraphTab);

  useEffect(() => {
    activeGraphTabRef.current = activeGraphTab;
  }, [activeGraphTab]);

  const setActiveGraphTab = useCallback((action: React.SetStateAction<string>) => {
    const prev = activeGraphTabRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    if (next === prev) return;
    activeGraphTabRef.current = next;
    setActiveGraphTabInner(next);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('vvs:compile-state', { detail: { state: compileState } }));
  }, [compileState]);

  useEffect(() => {
    setCompileStateInner((prev) => {
      if (prev === 'compiling') return prev;
      return dirtyTabIds[activeGraphTab] ? 'dirty' : prev === 'error' ? 'error' : 'success';
    });
  }, [activeGraphTab, dirtyTabIds]);

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        projectSource,
        variables,
        setVariables,
        events,
        setEvents,
        functions,
        setFunctions,
        classes,
        setClasses,
        graphContainers,
        setGraphContainers,
        activeClassId,
        setActiveClassId,
        selection,
        setSelection,
        selectedNodeIds,
        setSelectedNodeIds,
        openTabs,
        setOpenTabs,
        activeGraphTab,
        setActiveGraphTab,
        projectDetails,
        setProjectDetails,
        compileState,
        setCompileState,
        dirtyTabIds,
        markTabDirty,
        markTabClean,
        isTabDirty,
        resetDirtyTabs,
        lastSavedAt,
        setLastSavedAt,
        autoCompile,
        setAutoCompile,
        autoSave,
        setAutoSave,
        targetLanguage,
        setTargetLanguage,
        targetFileExtensions,
        setTargetFileExtensions,
        crossOverMode,
        setCrossOverMode,
        undoTrigger,
        triggerUndo,
        redoTrigger,
        triggerRedo,
        canUndo,
        setCanUndo,
        canRedo,
        setCanRedo,
        validationErrors,
        setValidationErrors,
        validationWarnings,
        setValidationWarnings,
        installedLibrary,
        setInstalledLibrary,
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
        referenceRootGraphId,
        referenceVariableName,
        focusReference,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
