'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { GraphVariable } from '@/types/graph';
import type { ValidationMessage } from '@/lib/graphValidator';
import type { InstalledLibraryEntry } from '@/types/libraryAsset';
import type { ProjectSnapshot } from '@/types/projectSnapshot';
import type { ProjectSource } from '@/types/projectRegistry';

export type SelectionType = 'node' | 'variable' | 'graph';
export type TargetLanguage = 'python' | 'javascript' | 'cpp' | 'verse' | 'json';
export type SimulationState = 'idle' | 'playing' | 'paused';

export interface SelectionState {
  type: SelectionType;
  id: string | null;
}

interface ProjectFunction {
  id: string;
  name: string;
}

export interface GraphTab {
  id: string;
  type: 'main' | 'function' | 'macro';
  name: string;
}

interface ProjectContextValue {
  projectId: string;
  projectSource: ProjectSource;

  variables: GraphVariable[];
  setVariables: React.Dispatch<React.SetStateAction<GraphVariable[]>>;
  functions: ProjectFunction[];
  setFunctions: React.Dispatch<React.SetStateAction<ProjectFunction[]>>;
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  openTabs: GraphTab[];
  setOpenTabs: React.Dispatch<React.SetStateAction<GraphTab[]>>;
  activeGraphTab: string;
  setActiveGraphTab: React.Dispatch<React.SetStateAction<string>>;

  projectDetails: { moduleName: string; extendsType: string; description: string };
  setProjectDetails: React.Dispatch<React.SetStateAction<{ moduleName: string; extendsType: string; description: string }>>;

  compileState: 'clean' | 'dirty' | 'compiling' | 'success' | 'error';
  setCompileState: React.Dispatch<React.SetStateAction<'clean' | 'dirty' | 'compiling' | 'success' | 'error'>>;

  autoCompile: boolean;
  setAutoCompile: React.Dispatch<React.SetStateAction<boolean>>;
  targetLanguage: TargetLanguage;
  setTargetLanguage: React.Dispatch<React.SetStateAction<TargetLanguage>>;

  simulationState: SimulationState;
  setSimulationState: React.Dispatch<React.SetStateAction<SimulationState>>;

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

  installedLibrary: InstalledLibraryEntry[];
  setInstalledLibrary: React.Dispatch<React.SetStateAction<InstalledLibraryEntry[]>>;

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
  const [variables, setVariables] = useState<GraphVariable[]>(initialSnapshot.variables);
  const [functions, setFunctions] = useState<ProjectFunction[]>(initialSnapshot.functions);
  const [selection, setSelection] = useState<SelectionState>({ type: 'graph', id: null });
  const [openTabs, setOpenTabs] = useState<GraphTab[]>(
    initialSnapshot.openTabs.length > 0
      ? initialSnapshot.openTabs
      : [{ id: 'main', type: 'main', name: 'Main graph' }]
  );
  const [activeGraphTab, setActiveGraphTabInner] = useState<string>(
    initialSnapshot.activeGraphTab || 'main'
  );

  const [projectDetails, setProjectDetails] = useState(initialSnapshot.projectDetails);

  const [simulationState, setSimulationState] = useState<SimulationState>('idle');
  const [compileState, setCompileStateInner] = useState<'clean' | 'dirty' | 'compiling' | 'success' | 'error'>(
    projectSource === 'new' ? 'clean' : 'success'
  );

  const [autoCompile, setAutoCompile] = useState(initialSnapshot.autoCompile);

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
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(initialSnapshot.targetLanguage);

  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const triggerUndo = () => setUndoTrigger((prev) => prev + 1);
  const triggerRedo = () => setRedoTrigger((prev) => prev + 1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationMessage[]>([]);
  const [installedLibrary, setInstalledLibrary] = useState<InstalledLibraryEntry[]>(
    initialSnapshot.installedLibrary ?? []
  );

  const initialTab = initialSnapshot.activeGraphTab || 'main';
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

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        projectSource,
        variables,
        setVariables,
        functions,
        setFunctions,
        selection,
        setSelection,
        openTabs,
        setOpenTabs,
        activeGraphTab,
        setActiveGraphTab,
        projectDetails,
        setProjectDetails,
        compileState,
        setCompileState,
        autoCompile,
        setAutoCompile,
        targetLanguage,
        setTargetLanguage,
        simulationState,
        setSimulationState,
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
        installedLibrary,
        setInstalledLibrary,
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
