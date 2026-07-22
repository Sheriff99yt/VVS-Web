'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { VVSNode, VVSEdge } from '@/types/graph';
import { transpileGraph, withProjectCodegenTarget } from '@/lib/codegen';
import type { TranspileResult } from '@/types/transpile';
import { isOrgOnlyGraphTab } from '@/lib/graphTabs';
import { MAIN_GRAPH_CONTAINER_ID, classForHomeGraphId, classHomeGraphId } from '@/lib/classScope';
import { GeneratedCodeView } from '@/components/code/GeneratedCodeView';
import type { CodeHighlightPalette, CodeHighlightRange } from '@/components/code/types';
import { CopyPathButton } from '@/components/ui/CopyPathButton';
import { nodeHighlightColor, DEFAULT_NODE_HIGHLIGHT } from '@/lib/nodeHighlightColor';
import { resolveSymbolCodegenLink } from '@/lib/symbolCodegenLink';
import { resolveCodePreviewHighlightNodeIds } from '@/lib/projectSelection';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { useUiPreference } from '@/hooks/useUiPreference';
import { isCodePreviewPaused } from '@/lib/codePreviewPause';
import { findNodeIdAtSourceLocation, findNodeIdsInSourceRange, findGraphTabContainingNodeId } from '@/lib/sourceMapReverse';
import { dispatchNavigateToNode, dispatchNavigateToNodes } from '@/lib/graphNavigation';
import {
  clearCodeHoverHighlight,
  setCodeHoverHighlight,
} from '@/lib/codeHoverHighlightStore';
import { subscribeHoverChrome, getHoverChromeNodeId } from '@/lib/nodeHoverChromeStore';
import type { ValidationMessage } from '@/lib/graphValidator';
import { LanguageExtensionMenu } from '@/components/ui/LanguageExtensionMenu';
import { Tooltip } from '@/components/ui/Tooltip';

const ERROR_DIAG_HIGHLIGHT: CodeHighlightPalette = {
  accent: '#ef4444',
  lineBg: 'rgba(239, 68, 68, 0.14)',
  markBg: 'rgba(239, 68, 68, 0.32)',
};

const WARNING_DIAG_HIGHLIGHT: CodeHighlightPalette = {
  accent: '#f59e0b',
  lineBg: 'rgba(245, 158, 11, 0.14)',
  markBg: 'rgba(245, 158, 11, 0.32)',
};

/** Quiet zinc chrome — accent only when a toggle is pressed. */
const BAR_BTN =
  'inline-flex items-center justify-center gap-1 h-6 min-w-6 px-1.5 rounded text-[10px] font-medium transition-colors shrink-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80';
const BAR_BTN_ERR_ON =
  'inline-flex items-center justify-center gap-1 h-6 min-w-6 px-1.5 rounded text-[10px] font-medium transition-colors shrink-0 bg-zinc-800 text-red-300';
const BAR_BTN_WARN_ON =
  'inline-flex items-center justify-center gap-1 h-6 min-w-6 px-1.5 rounded text-[10px] font-medium transition-colors shrink-0 bg-zinc-800 text-amber-300';

function buildColoredHighlightRanges(
  selectedNodeIds: string[],
  sourceMap: TranspileResult['sourceMap'],
  filePath: string,
  nodesById: Map<string, VVSNode>
): CodeHighlightRange[] {
  const entries: CodeHighlightRange[] = [];

  for (const nodeId of selectedNodeIds) {
    const ranges = sourceMap[nodeId];
    if (!ranges?.length) continue;

    const node = nodesById.get(nodeId);
    const colors = node ? nodeHighlightColor(node) : DEFAULT_NODE_HIGHLIGHT;

    for (const range of ranges) {
      if (range.filePath !== filePath) continue;
      entries.push({ ...range, colors });
    }
  }

  return entries;
}

function nodeIdsFromValidationMessages(messages: ValidationMessage[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const msg of messages) {
    if (!msg.nodeId || seen.has(msg.nodeId)) continue;
    seen.add(msg.nodeId);
    ids.push(msg.nodeId);
  }
  return ids;
}

function buildDiagnosticHighlightRanges(
  nodeIds: string[],
  sourceMap: TranspileResult['sourceMap'],
  filePath: string,
  colors: CodeHighlightPalette
): CodeHighlightRange[] {
  const entries: CodeHighlightRange[] = [];
  for (const nodeId of nodeIds) {
    const ranges = sourceMap[nodeId];
    if (!ranges?.length) continue;
    for (const range of ranges) {
      if (range.filePath !== filePath) continue;
      entries.push({ ...range, colors });
    }
  }
  return entries;
}

/** First generated file that contains a source-map hit for any of the node ids. */
function firstMappedFileForNodes(
  nodeIds: string[],
  sourceMap: TranspileResult['sourceMap'],
  preferredFilePath?: string
): string | null {
  if (preferredFilePath) {
    for (const nodeId of nodeIds) {
      const ranges = sourceMap[nodeId];
      if (ranges?.some((r) => r.filePath === preferredFilePath)) return preferredFilePath;
    }
  }
  for (const nodeId of nodeIds) {
    const ranges = sourceMap[nodeId];
    if (ranges?.length) return ranges[0]!.filePath;
  }
  return null;
}

interface CodePreviewPanelProps {
  selectedFilePath?: string | null;
  onSelectedFilePathChange?: (path: string) => void;
  onClearPinnedFile?: () => void;
}

export function CodePreviewPanel({
  selectedFilePath = null,
  onSelectedFilePathChange,
  onClearPinnedFile,
}: CodePreviewPanelProps = {}) {
  const {
    compileState,
    autoCompile,
    targetLanguage: projectTargetLanguage,
    variables,
    events,
    functions,
    projectDetails,
    activeGraphTab,
    openTabs,
    selection,
    setSelection,
    selectedNodeIds,
    selectedTreeSymbols,
    validationWarnings,
    validationErrors,
    environmentId,
    integration,
    classes,
    activeClassId,
    syntaxPackLock,
    codegenCapabilities,
    dirtyTabIds,
  } = useProject();
  const documents = useGraphDocuments();
  const { result: projectResult, fileOwners } = useProjectTranspileResult();

  const [lastCleanResult, setLastCleanResult] = useState<TranspileResult | null>(null);
  const [heldResult, setHeldResult] = useState<TranspileResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [highlightErrors, setHighlightErrors] = useState(false);
  const [highlightWarnings, setHighlightWarnings] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightNavKeyRef = useRef<string | null>(null);

  const activeDocument =
    documents?.[activeGraphTab] ??
    documents?.[MAIN_GRAPH_CONTAINER_ID] ??
    null;

  const symbolLink = useMemo(
    () =>
      resolveSymbolCodegenLink({
        selection,
        documents: documents ?? null,
        classes,
        functions,
        events,
        variables,
        activeGraphTab,
        selectedNodeIds,
        selectedTreeSymbols,
      }),
    [
      selection,
      documents,
      classes,
      functions,
      events,
      variables,
      activeGraphTab,
      selectedNodeIds,
      selectedTreeSymbols,
    ]
  );

  const previewTabId = symbolLink?.tabId ?? activeGraphTab;
  const codegenTabId =
    (selectedFilePath ? fileOwners[selectedFilePath] : undefined) ?? previewTabId;

  const {
    targetLanguage,
    targetFileExtension,
    targetFileExtensions,
    setGraphLanguageWithExtension,
    isOrgGraph: previewOrgGraph,
  } = useActiveGraphCodegenSettings(codegenTabId);
  const [showUnsupportedComments] = useUiPreference('showUnsupportedComments');
  const [showUserComments] = useUiPreference('showUserComments');
  const [nodeToCodeHighlight] = useUiPreference('nodeToCodeHighlight');

  const hoveredNodeId = useSyncExternalStore(
    subscribeHoverChrome,
    getHoverChromeNodeId,
    () => null
  );

  const previewDocument =
    documents?.[previewTabId] ??
    documents?.[MAIN_GRAPH_CONTAINER_ID] ??
    null;

  const activeTab = openTabs.find((t) => t.id === previewTabId);
  const isOrgGraph = previewOrgGraph || isOrgOnlyGraphTab(previewTabId, classes);
  const previewPaused = isCodePreviewPaused(
    autoCompile,
    compileState,
    Object.keys(dirtyTabIds).length > 0
  );
  const pausedLiveRef = useRef<TranspileResult | null>(null);

  const liveResult = useMemo(() => {
    if (previewPaused) {
      const emptyPaused: TranspileResult = {
        language: targetLanguage,
        files: [],
        sourceMap: {},
      };
      return pausedLiveRef.current ?? emptyPaused;
    }

    if (isOrgGraph) {
      const empty: TranspileResult = {
        language: projectTargetLanguage,
        files: [],
        sourceMap: {},
      };
      pausedLiveRef.current = empty;
      return empty;
    }

    const nodes = (previewDocument?.nodes ?? []) as VVSNode[];
    const edges = (previewDocument?.edges ?? []) as VVSEdge[];
    const previewMetadata = previewDocument?.metadata;
    const classesOnPreview = classes.filter((c) => classHomeGraphId(c) === previewTabId);
    const homeClass =
      (activeClassId ? classesOnPreview.find((c) => c.id === activeClassId) : undefined) ??
      classForHomeGraphId(classes, previewTabId);
    const isModuleGraph = homeClass != null || previewTabId === 'main';
    const isFunctionTab = functions.some((f) => f.id === previewTabId);

    // Container / class-home graphs: show project emit (one graph → one file),
    // except JSON — always dump via transpileGraph so the panel matches the lang picker.
    let next: TranspileResult;
    if (!isFunctionTab && isModuleGraph && targetLanguage !== 'json') {
      const ownedFiles = projectResult.files.filter((file) => fileOwners[file.path] === previewTabId);
      if (ownedFiles.length > 0) {
        next = {
          language: projectResult.language,
          files: ownedFiles,
          sourceMap: projectResult.sourceMap,
        } as TranspileResult;
        pausedLiveRef.current = next;
        return next;
      }
    }

    const codegenCtx = {
      moduleName: homeClass?.name ?? (isModuleGraph ? projectDetails.moduleName : previewMetadata?.moduleName ?? activeTab?.name ?? 'Graph'),
      extendsType: homeClass?.extendsType ?? (isModuleGraph ? projectDetails.extendsType : previewMetadata?.extendsType ?? ''),
      targetLanguage,
      targetFileExtensions,
      variables,
      projectEvents: events,
      functions,
      nodes,
      edges,
      tabLabel: activeTab?.name,
      tabId: previewTabId,
      documents: documents ?? undefined,
      classes,
      activeClassId: homeClass?.id ?? activeClassId,
      environmentId,
      integration,
      emitUnsupportedComments: showUnsupportedComments,
      emitUserComments: showUserComments,
    };

    next = transpileGraph(
      withProjectCodegenTarget(codegenCtx, {
        targetLanguage,
        codegenCapabilities,
        syntaxPackLock,
      })
    );
    pausedLiveRef.current = next;
    return next;
  }, [
    previewPaused,
    previewDocument,
    openTabs,
    previewTabId,
    activeTab,
    isOrgGraph,
    targetLanguage,
    targetFileExtensions,
    projectTargetLanguage,
    projectDetails,
    variables,
    events,
    functions,
    documents,
    environmentId,
    integration,
    classes,
    activeClassId,
    codegenCapabilities,
    syntaxPackLock,
    projectResult,
    fileOwners,
    showUnsupportedComments,
    showUserComments,
  ]);

  useEffect(() => {
    if (!previewPaused) {
      setLastCleanResult(liveResult);
    }
  }, [liveResult, previewPaused]);

  useEffect(() => {
    const onCommitPreview = () => {
      setLastCleanResult(liveResult);
      pausedLiveRef.current = liveResult;
    };
    window.addEventListener('vvs:commit-preview', onCommitPreview);
    return () => window.removeEventListener('vvs:commit-preview', onCommitPreview);
  }, [liveResult]);

  useEffect(() => {
    const onCompileState = (event: Event) => {
      const { state } = (event as CustomEvent<{ state: string }>).detail;
      if (state === 'compiling') {
        setHeldResult(lastCleanResult);
      } else if (state === 'success' || state === 'clean' || state === 'error') {
        setHeldResult(null);
      }
    };
    window.addEventListener('vvs:compile-state', onCompileState);
    return () => window.removeEventListener('vvs:compile-state', onCompileState);
  }, [lastCleanResult]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const isStale = previewPaused;
  const isCompiling = compileState === 'compiling';
  const displayResult =
    isCompiling && heldResult
      ? heldResult
      : isStale
        ? (lastCleanResult ?? liveResult)
        : liveResult;

  const [prevPreviewTabId, setPrevPreviewTabId] = useState(previewTabId);
  if (prevPreviewTabId !== previewTabId) {
    setPrevPreviewTabId(previewTabId);
    setActiveFileIndex(0);
  }

  useEffect(() => {
    if (prevPreviewTabId !== previewTabId) {
      highlightNavKeyRef.current = null;
    }
  }, [previewTabId, prevPreviewTabId]);

  const [prevLangExt, setPrevLangExt] = useState(`${targetLanguage}:${targetFileExtension}`);
  if (prevLangExt !== `${targetLanguage}:${targetFileExtension}`) {
    setPrevLangExt(`${targetLanguage}:${targetFileExtension}`);
    setActiveFileIndex(0);
  }

  useEffect(() => {
    if (
      selectedFilePath &&
      fileOwners[selectedFilePath] &&
      fileOwners[selectedFilePath] !== previewTabId
    ) {
      onClearPinnedFile?.();
    }
  }, [previewTabId, selectedFilePath, fileOwners, onClearPinnedFile]);

  // projectResult is held by useProjectTranspileResult while paused — Files pin stays frozen too.
  const graphDisplayResult = displayResult;
  const displayResultForView =
    selectedFilePath && projectResult.files.some((file) => file.path === selectedFilePath)
      ? projectResult
      : graphDisplayResult;

  const displayFilePathsKey = useMemo(
    () => displayResultForView.files.map((file) => file.path).join('\0'),
    [displayResultForView.files]
  );

  const [prevFilePathParams, setPrevFilePathParams] = useState(`${selectedFilePath}:${displayFilePathsKey}`);
  if (prevFilePathParams !== `${selectedFilePath}:${displayFilePathsKey}`) {
    setPrevFilePathParams(`${selectedFilePath}:${displayFilePathsKey}`);
    if (!selectedFilePath) {
      setActiveFileIndex(0);
    } else {
      const fileIndex = displayResultForView.files.findIndex((file) => file.path === selectedFilePath);
      if (fileIndex >= 0) {
        setActiveFileIndex(fileIndex);
      }
    }
  }

  const safeFileIndex = Math.min(
    activeFileIndex,
    Math.max(0, (displayResultForView?.files.length ?? 1) - 1)
  );
  const activeFile = displayResultForView.files[safeFileIndex] ?? displayResultForView.files[0];
  const generatedCode = activeFile?.content ?? '';
  const filePath = activeFile?.path ?? 'output';
  const copyablePath = filePath;
  const isJsonPreview =
    targetLanguage === 'json' || /\.json$/i.test(filePath);
  const displayCode = generatedCode;
  const sourceMap = displayResultForView.sourceMap;

  const previewNodes = useMemo(
    () => (previewDocument?.nodes ?? []) as VVSNode[],
    [previewDocument]
  );
  const nodesById = useMemo(() => {
    const map = new Map<string, VVSNode>();
    for (const node of previewNodes) {
      map.set(node.id, node);
    }
    return map;
  }, [previewNodes]);

  const [hoveredCodeNodeId, setHoveredCodeNodeId] = useState<string | null>(null);

  const highlightNodeIds = useMemo(() => {
    if (nodeToCodeHighlight === 'off') {
      return [];
    }

    const selectedIds = resolveCodePreviewHighlightNodeIds(
      selection,
      selectedNodeIds,
      symbolLink?.highlightNodeIds
    );

    if (nodeToCodeHighlight === 'hover-selection' && hoveredNodeId) {
      if (!selectedIds.includes(hoveredNodeId)) {
        return [...selectedIds, hoveredNodeId];
      }
    }

    return selectedIds;
  }, [nodeToCodeHighlight, selection, selectedNodeIds, symbolLink?.highlightNodeIds, hoveredNodeId]);

  const hoverCodeHighlightRanges = useMemo(() => {
    if (!hoveredCodeNodeId || nodeToCodeHighlight === 'off') return [];
    const ranges = buildColoredHighlightRanges([hoveredCodeNodeId], sourceMap, filePath, nodesById);
    return ranges.map((r) => ({ ...r, isCodeHover: true }));
  }, [hoveredCodeNodeId, nodeToCodeHighlight, sourceMap, filePath, nodesById]);

  const errorNodeIds = useMemo(
    () => nodeIdsFromValidationMessages(validationErrors),
    [validationErrors]
  );
  const warningNodeIds = useMemo(
    () => nodeIdsFromValidationMessages(validationWarnings),
    [validationWarnings]
  );

  useEffect(() => {
    if (validationErrors.length === 0) setHighlightErrors(false);
  }, [validationErrors.length]);

  useEffect(() => {
    if (validationWarnings.length === 0) setHighlightWarnings(false);
  }, [validationWarnings.length]);

  const selectionHighlightRanges = useMemo(
    () =>
      highlightNodeIds.length > 0
        ? buildColoredHighlightRanges(highlightNodeIds, sourceMap, filePath, nodesById)
        : [],
    [highlightNodeIds, sourceMap, filePath, nodesById]
  );

  const errorHighlightRanges = useMemo(
    () =>
      highlightErrors
        ? buildDiagnosticHighlightRanges(errorNodeIds, sourceMap, filePath, ERROR_DIAG_HIGHLIGHT)
        : [],
    [highlightErrors, errorNodeIds, sourceMap, filePath]
  );

  const warningHighlightRanges = useMemo(
    () =>
      highlightWarnings
        ? buildDiagnosticHighlightRanges(
            warningNodeIds,
            sourceMap,
            filePath,
            WARNING_DIAG_HIGHLIGHT
          )
        : [],
    [highlightWarnings, warningNodeIds, sourceMap, filePath]
  );

  const highlightRanges = useMemo(() => {
    const merged = [
      ...errorHighlightRanges,
      ...warningHighlightRanges,
      ...selectionHighlightRanges,
      ...hoverCodeHighlightRanges,
    ];
    return merged.length > 0 ? merged : undefined;
  }, [errorHighlightRanges, warningHighlightRanges, selectionHighlightRanges, hoverCodeHighlightRanges]);

  // When diagnostic toggles turn on, jump to a file that contains mapped ranges.
  const diagNavKey = `${highlightErrors}:${highlightWarnings}:${errorNodeIds.join(',')}|${warningNodeIds.join(',')}`;
  const [prevDiagNavKey, setPrevDiagNavKey] = useState(diagNavKey);
  if (prevDiagNavKey !== diagNavKey) {
    setPrevDiagNavKey(diagNavKey);
    if (highlightErrors || highlightWarnings) {
      const ids = [
        ...(highlightErrors ? errorNodeIds : []),
        ...(highlightWarnings ? warningNodeIds : []),
      ];
      const targetPath = firstMappedFileForNodes(ids, sourceMap, filePath);
      if (targetPath) {
        const fileIndex = displayResultForView.files.findIndex((file) => file.path === targetPath);
        if (fileIndex >= 0 && fileIndex !== safeFileIndex) {
          setActiveFileIndex(fileIndex);
        }
        if (targetPath !== selectedFilePath) {
          setTimeout(() => onSelectedFilePathChange?.(targetPath), 0);
        }
      }
    }
  }

  const [scrollToLine, setScrollToLine] = useState<{ line: number; sequenceId: number } | null>(null);
  const scrollSeqRef = useRef(0);
  const [prevHighlightNavKey, setPrevHighlightNavKey] = useState<string | null>(null);
  
  if (highlightNodeIds.length === 0 && prevHighlightNavKey !== null) {
    setPrevHighlightNavKey(null);
  } else if (highlightNodeIds.length > 0) {
    const navKey = `${highlightNodeIds.join(',')}|${displayFilePathsKey}`;
    if (prevHighlightNavKey !== navKey) {
      for (const nodeId of highlightNodeIds) {
        const ranges = sourceMap[nodeId];
        if (!ranges?.length) continue;
        const targetPath = ranges[0]!.filePath;
        const fileIndex = displayResultForView.files.findIndex((file) => file.path === targetPath);
        if (fileIndex >= 0) {
          setActiveFileIndex(fileIndex);
        }
        if (targetPath !== selectedFilePath) {
          // Fire on next tick to avoid updating parent during render
          setTimeout(() => onSelectedFilePathChange?.(targetPath), 0);
        }
        scrollSeqRef.current += 1;
        setScrollToLine({ line: ranges[0]!.startLine, sequenceId: scrollSeqRef.current });
        setPrevHighlightNavKey(navKey);
        break;
      }
      if (prevHighlightNavKey !== navKey) {
        setPrevHighlightNavKey(navKey);
      }
    }
  }


  const selectCodePreview = useCallback(() => {
    setSelection((prev) =>
      prev.type === 'code' && prev.id === filePath ? prev : { type: 'code', id: filePath }
    );
  }, [filePath, setSelection]);

  useEffect(() => {
    if (selection.type === 'code' && selection.id !== filePath) {
      setSelection({ type: 'code', id: filePath });
    }
  }, [filePath, selection.type, selection.id, setSelection]);

  const handleCopy = useCallback(async () => {
    if (!displayCode) return;
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [displayCode]);

  const handleReverseSelectLine = useCallback(
    (line: number, col: number) => {
      const nodeId = findNodeIdAtSourceLocation(sourceMap, {
        filePath,
        line,
        col,
      });
      if (!nodeId) return;
      // Prefer the graph document that actually contains the node (function body tab)
      // over the module file owner (class home). Prefer active tab when it owns the node.
      const containingTab = findGraphTabContainingNodeId(
        documents,
        nodeId,
        activeGraphTab
      );
      const ownerTab =
        containingTab ??
        fileOwners[filePath] ??
        (selectedFilePath ? fileOwners[selectedFilePath] : undefined) ??
        previewTabId;
      dispatchNavigateToNode(ownerTab, nodeId);
    },
    [
      sourceMap,
      filePath,
      fileOwners,
      selectedFilePath,
      previewTabId,
      documents,
      activeGraphTab,
    ]
  );

  const handleHoverSourceLocation = useCallback(
    (line: number, col: number) => {
      const nodeId = findNodeIdAtSourceLocation(sourceMap, {
        filePath,
        line,
        col,
      });
      if (!nodeId) {
        setHoveredCodeNodeId(null);
        clearCodeHoverHighlight();
        return;
      }
      setHoveredCodeNodeId(nodeId);
      const owningTab =
        findGraphTabContainingNodeId(documents, nodeId, activeGraphTab) ??
        fileOwners[filePath] ??
        (selectedFilePath ? fileOwners[selectedFilePath] : undefined) ??
        previewTabId;
      const onCurrentGraph = owningTab === activeGraphTab;
      // Outline current tab when local; other open tab when remote; never closed tabs.
      const outlineTab = onCurrentGraph
        ? activeGraphTab
        : owningTab && openTabs.some((t) => t.id === owningTab)
          ? owningTab
          : null;
      setCodeHoverHighlight({
        nodeId: onCurrentGraph ? nodeId : null,
        tabId: outlineTab,
      });
    },
    [
      sourceMap,
      filePath,
      documents,
      activeGraphTab,
      fileOwners,
      selectedFilePath,
      previewTabId,
      openTabs,
    ]
  );

  const handleHoverSourceLeave = useCallback(() => {
    setHoveredCodeNodeId(null);
    clearCodeHoverHighlight();
  }, []);

  const handleSelectionRangeChange = useCallback(
    (sel: { startLine: number; startCol: number; endLine: number; endCol: number } | null) => {
      if (!sel) return;
      const allNodeIds = findNodeIdsInSourceRange(sourceMap, { ...sel, filePath });
      if (allNodeIds.length === 0) return;

      const targetTab =
        findGraphTabContainingNodeId(documents, allNodeIds[0]!, activeGraphTab) ??
        fileOwners[filePath] ??
        (selectedFilePath ? fileOwners[selectedFilePath] : undefined) ??
        previewTabId;

      const tabNodeIds = allNodeIds.filter(
        (id) => findGraphTabContainingNodeId(documents, id, activeGraphTab) === targetTab
      );
      if (tabNodeIds.length === 0) return;

      dispatchNavigateToNodes(targetTab, tabNodeIds);
    },
    [sourceMap, filePath, documents, activeGraphTab, fileOwners, selectedFilePath, previewTabId]
  );

  useEffect(() => () => clearCodeHoverHighlight(), []);

  // Tab / file changes leave the cursor on old mapped text — drop stale rings.
  useEffect(() => {
    clearCodeHoverHighlight();
  }, [activeGraphTab, filePath]);

  const isEmpty = !displayCode.trim();

  const mappedErrorCount = errorNodeIds.filter((id) => Boolean(sourceMap[id]?.length)).length;
  const mappedWarningCount = warningNodeIds.filter((id) => Boolean(sourceMap[id]?.length)).length;

  return (
    <div
      onMouseDown={selectCodePreview}
      className="w-full h-full bg-zinc-950 flex flex-col min-h-0 min-w-0 relative overflow-hidden"
    >
      {/* Match GraphTabBar height (h-9). Primary affordances only. */}
      <div className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-950 px-2 h-9 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <FileCode2 size={12} className="text-zinc-600 shrink-0" />
          <Tooltip content={copyablePath} placement="bottom" className="block min-w-0 flex-1">
            <span className="text-[11px] text-zinc-400 font-mono truncate min-w-0 block">
              {filePath}
            </span>
          </Tooltip>
          <CopyPathButton path={copyablePath} />
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {!isOrgGraph ? (
            <LanguageExtensionMenu
              language={targetLanguage}
              extension={targetFileExtension}
              onPick={(lang, ext) => {
                selectCodePreview();
                setGraphLanguageWithExtension(lang, ext);
              }}
            />
          ) : null}
          {validationErrors.length > 0 ? (
            <Tooltip
              content={
                highlightErrors
                  ? `Hide error highlights in code\n${validationErrors.map((e) => e.message).join('\n')}`
                  : `Highlight errors in code${
                      mappedErrorCount === 0 ? ' (no mapped lines yet)' : ''
                    }\n${validationErrors.map((e) => e.message).join('\n')}`
              }
              placement="bottom"
            >
              <button
                type="button"
                onClick={() => {
                  selectCodePreview();
                  setHighlightErrors((on) => !on);
                }}
                className={highlightErrors ? BAR_BTN_ERR_ON : BAR_BTN}
                aria-pressed={highlightErrors}
                aria-label="Toggle error highlights"
              >
                <AlertTriangle size={11} />
                {validationErrors.length}
              </button>
            </Tooltip>
          ) : null}
          {validationWarnings.length > 0 ? (
            <Tooltip
              content={
                highlightWarnings
                  ? `Hide warning highlights in code\n${validationWarnings.map((w) => w.message).join('\n')}`
                  : `Highlight warnings in code${
                      mappedWarningCount === 0 ? ' (no mapped lines yet)' : ''
                    }\n${validationWarnings.map((w) => w.message).join('\n')}`
              }
              placement="bottom"
            >
              <button
                type="button"
                onClick={() => {
                  selectCodePreview();
                  setHighlightWarnings((on) => !on);
                }}
                className={highlightWarnings ? BAR_BTN_WARN_ON : BAR_BTN}
                aria-pressed={highlightWarnings}
                aria-label="Toggle warning highlights"
              >
                <AlertTriangle size={11} />
                {validationWarnings.length}
              </button>
            </Tooltip>
          ) : null}
          <Tooltip content={copied ? 'Copied' : 'Copy code'} placement="bottom">
            <button
              type="button"
              onClick={() => {
                selectCodePreview();
                void handleCopy();
              }}
              disabled={isEmpty}
              className={`${BAR_BTN} disabled:opacity-40 disabled:pointer-events-none`}
            >
              {copied ? <Check size={12} className="text-zinc-200" /> : <Copy size={12} />}
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {isCompiling && !autoCompile ? (
          <div className="absolute inset-x-0 top-0 z-10 h-px bg-zinc-600/80" />
        ) : null}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <FileCode2 size={20} className="text-zinc-700" />
            <p className="text-[11px] text-zinc-500">
              {isOrgGraph
                ? 'Visual organization graph — no generated code. Open a class graph to preview output.'
                : validationErrors.length > 0
                  ? 'Fix compile errors to export — restore missing Declare nodes on the class graph.'
                  : 'Wire nodes to preview code.'}
            </p>
          </div>
        ) : null}

        {!isEmpty ? (
          <Tooltip
            content="Hover to highlight the node · Double-click to select it"
            placement="top"
            disabled={isJsonPreview}
            className="block h-full w-full min-w-0"
          >
            <div
              className={`h-full transition-opacity duration-150 ${isStale ? 'opacity-55' : 'opacity-100'}`}
            >
              <GeneratedCodeView
                value={displayCode}
                language={isJsonPreview ? 'json' : targetLanguage}
                highlightRanges={highlightRanges}
                scrollToLine={scrollToLine}
                onReverseSelectLine={isJsonPreview ? undefined : handleReverseSelectLine}
                onHoverSourceLocation={isJsonPreview ? undefined : handleHoverSourceLocation}
                onHoverSourceLeave={isJsonPreview ? undefined : handleHoverSourceLeave}
                onSelectionRangeChange={isJsonPreview ? undefined : handleSelectionRangeChange}
                readOnly
                className="h-full"
              />
            </div>
          </Tooltip>
        ) : null}

        {isStale && !isEmpty ? (
          <Tooltip content="Preview paused" placement="left">
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <AlertTriangle size={12} className="text-zinc-500" />
            </div>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
