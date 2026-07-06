'use client';

import { useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import {
  createClassSymbol,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
  type ClassSymbol,
} from '@vvs/graph-types';
import { classGraphTabId, symbolsForClass } from '@/lib/classScope';
import { openGraphContainerTab } from '@/lib/graphTabs';

export function useClassLifecycle() {
  const {
    classes,
    setClasses,
    activeClassId,
    setActiveClassId,
    variables,
    setVariables,
    functions,
    setFunctions,
    events,
    setEvents,
    openTabs,
    setOpenTabs,
    activeGraphTab,
    setActiveGraphTab,
    projectDetails,
    setProjectDetails,
    graphContainers,
    setSelection,
  } = useProject();
  const { patchAllDocuments } = useGraphWorkspace();

  const createClass = useCallback(
    (name: string, containerId: string = MAIN_GRAPH_CONTAINER_ID) => {
      const trimmed = name.trim() || 'NewClass';
      const cls = createClassSymbol(trimmed, { containerId });
      const homeGraphId = classGraphTabId(cls);

      setClasses((list) => [...list, cls]);
      const container = graphContainers.find((c) => c.id === containerId);
      if (container) {
        openGraphContainerTab(container, setOpenTabs, setActiveGraphTab);
      } else {
        setActiveGraphTab(homeGraphId);
      }
      setActiveClassId(cls.id);
      setSelection({ type: 'class', id: cls.id });
      return cls;
    },
    [
      graphContainers,
      setActiveClassId,
      setActiveGraphTab,
      setClasses,
      setOpenTabs,
      setSelection,
    ]
  );

  const renameClass = useCallback(
    (cls: ClassSymbol) => {
      setClasses((list) => list.map((c) => (c.id === cls.id ? cls : c)));
      if (cls.id === MAIN_CLASS_ID) {
        setProjectDetails((d) => ({
          ...d,
          moduleName: cls.name,
          extendsType: cls.extendsType ?? '',
        }));
      }
    },
    [setClasses, setProjectDetails]
  );

  const deleteClass = useCallback(
    (classId: string) => {
      if (classes.length <= 1) return;

      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;

      const homeGraphId = classGraphTabId(cls);
      const classFunctions = symbolsForClass(functions, classId);
      const tabIdsToRemove = new Set<string>();
      for (const fn of classFunctions) {
        for (const ovl of fn.overloads) {
          tabIdsToRemove.add(ovl.graphTabId ?? fn.id);
        }
        tabIdsToRemove.add(fn.id);
      }

      setVariables((list) => list.filter((v) => (v.classId ?? MAIN_CLASS_ID) !== classId));
      setFunctions((list) => list.filter((f) => (f.classId ?? MAIN_CLASS_ID) !== classId));
      setEvents((list) => list.filter((e) => (e.classId ?? MAIN_CLASS_ID) !== classId));
      setOpenTabs((tabs) => tabs.filter((t) => !tabIdsToRemove.has(t.id)));
      setClasses((list) => list.filter((c) => c.id !== classId));

      patchAllDocuments((docs) => {
        const next = { ...docs };
        for (const id of tabIdsToRemove) {
          delete next[id];
        }
        return next;
      });

      if (activeClassId === classId) {
        const remaining = classes.filter((c) => c.id !== classId);
        setActiveClassId(remaining[0]?.id ?? MAIN_CLASS_ID);
      }
      if (activeGraphTab === homeGraphId) {
        setActiveGraphTab(MAIN_GRAPH_CONTAINER_ID);
      }
      setSelection({ type: 'graph', id: null });
    },
    [
      activeClassId,
      activeGraphTab,
      classes,
      functions,
      patchAllDocuments,
      setActiveClassId,
      setActiveGraphTab,
      setClasses,
      setEvents,
      setFunctions,
      setOpenTabs,
      setSelection,
      setVariables,
    ]
  );

  const canDeleteClass = classes.length > 1;

  const moveClassToContainer = useCallback(
    (classId: string, containerId: string) => {
      setClasses((list) =>
        list.map((c) => (c.id === classId ? { ...c, containerId } : c))
      );
    },
    [setClasses]
  );

  return { createClass, renameClass, deleteClass, canDeleteClass, moveClassToContainer };
}
