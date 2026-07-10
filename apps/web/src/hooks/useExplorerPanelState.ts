'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ClassSymbol,
  FunctionSymbol,
  GraphContainer,
  ProjectEventDefinition,
  ProjectFolderPathEntry,
  VariableSymbol,
} from '@vvs/graph-types';
import { containerMatchesFilter, classContainerId } from '@/lib/classScope';
import { listSymbolEventEntries } from '@/lib/projectTree';
import type { GraphDocument } from '@/lib/graphDefaults';
import { countMatchingProjectPaths } from '@/components/layout/project-tree/ProjectFilesExplorer';
import {
  DEFAULT_SECTION_VIEWS,
  type ExplorerTab,
  type SectionViewKey,
  type SectionViewMode,
  type SymbolCategoryKey,
} from '@/components/layout/project-tree/constants';
import {
  matchesExplorerFilter,
  sectionVisible,
} from '@/components/layout/project-tree/explorerUtils';

type SelectionType = { type: string; id: string | null };

export function useExplorerPanelState(input: {
  classes: ClassSymbol[];
  classFunctions: FunctionSymbol[];
  classVariables: VariableSymbol[];
  classEvents: ProjectEventDefinition[];
  graphContainers: GraphContainer[];
  documents: Record<string, GraphDocument> | null;
  projectFolderPaths: ProjectFolderPathEntry[];
  showApiTab: boolean;
  selection: SelectionType;
  isAdding: {
    class: boolean;
    function: boolean;
    event: boolean;
    variable: boolean;
  };
}) {
  const {
    classes,
    classFunctions,
    classVariables,
    classEvents,
    graphContainers,
    documents,
    projectFolderPaths,
    showApiTab,
    selection,
    isAdding,
  } = input;

  const [filterQuery, setFilterQuery] = useState('');
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>('symbols');
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const [sectionViewModes, setSectionViewModes] =
    useState<Record<SectionViewKey, SectionViewMode>>(DEFAULT_SECTION_VIEWS);
  const [expanded, setExpanded] = useState<Record<SymbolCategoryKey, boolean>>({
    classes: false,
    functions: false,
    events: false,
    variables: false,
  });

  const [isAddingContainer, setIsAddingContainer] = useState(false);

  const q = filterQuery.trim().toLowerCase();
  const panelTab: ExplorerTab = explorerTab === 'api' && !showApiTab ? 'symbols' : explorerTab;

  const symbolEventEntries = useMemo(
    () => listSymbolEventEntries(classEvents, documents, classes),
    [classEvents, documents, classes]
  );

  const filteredClasses = useMemo(
    () =>
      classes.filter((cls) => {
        if (matchesExplorerFilter(cls.name, q)) return true;
        const container = graphContainers.find((c) => c.id === classContainerId(cls));
        return container ? matchesExplorerFilter(container.name, q) : false;
      }),
    [classes, graphContainers, q]
  );

  const filteredFunctions = useMemo(
    () => classFunctions.filter((f) => matchesExplorerFilter(f.name, q)),
    [classFunctions, q]
  );

  const filteredVariables = useMemo(
    () =>
      classVariables.filter(
        (v) => matchesExplorerFilter(v.name, q) || matchesExplorerFilter(v.type, q)
      ),
    [classVariables, q]
  );

  const filteredEvents = useMemo(
    () => symbolEventEntries.filter((d) => matchesExplorerFilter(d.label, q)),
    [symbolEventEntries, q]
  );

  const visibleGraphContainers = useMemo(() => {
    return graphContainers.filter((container) =>
      containerMatchesFilter(container, classes, q, matchesExplorerFilter)
    );
  }, [graphContainers, classes, q]);

  const filteredProjectFileCount = useMemo(
    () => countMatchingProjectPaths(projectFolderPaths, q),
    [projectFolderPaths, q]
  );

  const showGraphFoldersSection = sectionVisible(
    visibleGraphContainers.length,
    isAddingContainer,
    q
  );
  const showClassesSection = sectionVisible(filteredClasses.length, isAdding.class, q);
  const showFunctionsSection = sectionVisible(filteredFunctions.length, isAdding.function, q);
  const showEventsSection = sectionVisible(filteredEvents.length, isAdding.event, q);
  const showVariablesSection = sectionVisible(filteredVariables.length, isAdding.variable, q);

  const toggleCategory = useCallback((key: SymbolCategoryKey) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const setSectionView = useCallback((key: SectionViewKey, mode: SectionViewMode) => {
    setSectionViewModes((prev) => ({ ...prev, [key]: mode }));
  }, []);

  const expandCategory = useCallback((key: SymbolCategoryKey) => {
    setExpanded((s) => ({ ...s, [key]: true }));
  }, []);

  useEffect(() => {
    if (!q) return;
    setExpanded((state) => ({
      ...state,
      ...(filteredClasses.length > 0 && !state.classes ? { classes: true } : {}),
      ...(filteredFunctions.length > 0 && !state.functions ? { functions: true } : {}),
      ...(filteredEvents.length > 0 && !state.events ? { events: true } : {}),
      ...(filteredVariables.length > 0 && !state.variables ? { variables: true } : {}),
    }));
    if (visibleGraphContainers.length > 0) {
      setFoldersExpanded(true);
    }
  }, [
    q,
    filteredClasses.length,
    filteredFunctions.length,
    filteredEvents.length,
    filteredVariables.length,
    visibleGraphContainers.length,
  ]);

  useEffect(() => {
    setExpanded((state) => ({
      ...state,
      ...(classes.length > 0 && !state.classes ? { classes: true } : {}),
      ...(classEvents.length > 0 && !state.events ? { events: true } : {}),
    }));
  }, [classes.length, classEvents.length]);

  useEffect(() => {
    switch (selection.type) {
      case 'graph':
        setFoldersExpanded(true);
        break;
      case 'class':
        setExpanded((state) => ({ ...state, classes: true }));
        break;
      case 'function':
        setExpanded((state) => ({ ...state, functions: true }));
        break;
      case 'event':
        setExpanded((state) => ({ ...state, events: true }));
        break;
      case 'variable':
        setExpanded((state) => ({ ...state, variables: true }));
        break;
      default:
        break;
    }
  }, [selection.type, selection.id]);

  return {
    filterQuery,
    setFilterQuery,
    q,
    explorerTab,
    setExplorerTab,
    panelTab,
    foldersExpanded,
    setFoldersExpanded,
    sectionViewModes,
    setSectionView,
    expanded,
    setExpanded,
    toggleCategory,
    expandCategory,
    isAddingContainer,
    setIsAddingContainer,
    symbolEventEntries,
    filteredClasses,
    filteredFunctions,
    filteredVariables,
    filteredEvents,
    visibleGraphContainers,
    filteredProjectFileCount,
    showGraphFoldersSection,
    showClassesSection,
    showFunctionsSection,
    showEventsSection,
    showVariablesSection,
  };
}
