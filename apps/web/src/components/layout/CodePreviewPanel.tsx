'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Loader2,
  Circle,
  AlertTriangle,
  AlignLeft,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { VVSNode, VVSEdge } from '@/types/graph';
import { transpileGraph, withProjectCodegenTarget } from '@/lib/codegen';
import type { TranspileResult } from '@/types/transpile';
import { isOrgOnlyGraphTab } from '@/lib/graphTabs';
import { MAIN_GRAPH_CONTAINER_ID, classForHomeGraphId, classHomeGraphId } from '@/lib/classScope';
import { GeneratedCodeView } from '@/components/code/GeneratedCodeView';
import type { CodeHighlightRange } from '@/components/code/types';
import { CopyPathButton } from '@/components/ui/CopyPathButton';
import { nodeHighlightColor, DEFAULT_NODE_HIGHLIGHT } from '@/lib/nodeHighlightColor';
import { resolveSymbolCodegenLink } from '@/lib/symbolCodegenLink';
import { resolveCodePreviewHighlightNodeIds } from '@/lib/projectSelection';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { useUiPreference } from '@/hooks/useUiPreference';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { TARGET_FILE_EXTENSIONS, formatTargetFileExtension } from '@vvs/graph-types';
import type { TargetLanguage } from '@/contexts/ProjectContext';
import { findNodeIdAtSourceLocation } from '@/lib/sourceMapReverse';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';

const LANGUAGE_OPTIONS: { value: TargetLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JS' },
  { value: 'cpp', label: 'C++' },
  { value: 'verse', label: 'Verse' },
  { value: 'gdscript', label: 'GDScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
  { value: 'json', label: 'JSON' },
];

function countMappedNodes(result: TranspileResult): number {
  return Object.keys(result.sourceMap).length;
}

function lineCount(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

function buildColoredHighlightRanges(
  selectedNodeIds: string[],
  sourceMap: TranspileResult['sourceMap'],
  filePath: string,
  nodesById: Map<string, VVSNode>
): CodeHighlightRange[] | undefined {
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

  return entries.length > 0 ? entries : undefined;
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
    selectedNodeIds,
    validationWarnings,
    validationErrors,
    environmentId,
    integration,
    classes,
    activeClassId,
    syntaxPackLock,
    codegenCapabilities,
  } = useProject();
  const documents = useGraphDocuments();
  const { result: projectResult, fileOwners } = useProjectTranspileResult();

  const [lastCleanResult, setLastCleanResult] = useState<TranspileResult | null>(null);
  const [heldResult, setHeldResult] = useState<TranspileResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [jsonFormatOverride, setJsonFormatOverride] = useState<string | null>(null);
  const [jsonFormatError, setJsonFormatError] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
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
    ]
  );

  const previewTabId = symbolLink?.tabId ?? activeGraphTab;
  const codegenTabId =
    (selectedFilePath ? fileOwners[selectedFilePath] : undefined) ?? previewTabId;

  const {
    targetLanguage,
    targetFileExtension,
    targetFileExtensions,
    setGraphTargetLanguage,
    setGraphTargetFileExtension,
    isOrgGraph: previewOrgGraph,
  } = useActiveGraphCodegenSettings(codegenTabId);
  const [showUnsupportedComments, setShowUnsupportedComments] = useUiPreference(
    'showUnsupportedComments'
  );

  const extensionOptions = useMemo(
    () =>
      TARGET_FILE_EXTENSIONS[targetLanguage].map((ext) => ({
        value: ext,
        label: formatTargetFileExtension(ext),
      })),
    [targetLanguage]
  );

  const previewDocument =
    documents?.[previewTabId] ??
    documents?.[MAIN_GRAPH_CONTAINER_ID] ??
    null;

  const activeTab = openTabs.find((t) => t.id === previewTabId);
  const isOrgGraph = previewOrgGraph || isOrgOnlyGraphTab(previewTabId, classes);

  const liveResult = useMemo(() => {
    if (isOrgGraph) {
      return {
        language: projectTargetLanguage,
        files: [],
        sourceMap: {},
      } satisfies TranspileResult;
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
    if (!isFunctionTab && isModuleGraph && targetLanguage !== 'json') {
      const ownedFiles = projectResult.files.filter((file) => fileOwners[file.path] === previewTabId);
      if (ownedFiles.length > 0) {
        return {
          language: projectResult.language,
          files: ownedFiles,
          sourceMap: projectResult.sourceMap,
        } satisfies TranspileResult;
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
    };

    return transpileGraph(
      withProjectCodegenTarget(codegenCtx, {
        targetLanguage,
        codegenCapabilities,
        syntaxPackLock,
      })
    );
  }, [
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
    syntaxPackLock,
    codegenCapabilities,
    projectResult,
    fileOwners,
    showUnsupportedComments,
  ]);

  const [prevCompileState, setPrevCompileState] = useState(compileState);
  if (prevCompileState !== compileState) {
    setPrevCompileState(compileState);
    if (compileState === 'success' || compileState === 'clean') {
      setLastCleanResult(liveResult);
    }
  }

  useEffect(() => {
    const onCommitPreview = () => {
      setLastCleanResult(liveResult);
    };
    window.addEventListener('vvs:commit-preview', onCommitPreview);
    return () => window.removeEventListener('vvs:commit-preview', onCommitPreview);
  }, [liveResult]);

  useEffect(() => {
    const onCompileState = (event: Event) => {
      const { state } = (event as CustomEvent<{ state: string }>).detail;
      if (state === 'compiling') {
        setHeldResult(lastCleanResult);
      }
    };
    window.addEventListener('vvs:compile-state', onCompileState);
    return () => window.removeEventListener('vvs:compile-state', onCompileState);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const isStale = compileState === 'dirty' && !autoCompile;
  const isCompiling = compileState === 'compiling';
  const showLivePreview = autoCompile || !isStale;
  const displayResult =
    isCompiling && heldResult
      ? heldResult
      : showLivePreview
        ? liveResult
        : lastCleanResult ?? liveResult;

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
  const displayCode = jsonFormatOverride ?? generatedCode;
  const sourceMap = displayResultForView.sourceMap;
  const mappedNodeCount = countMappedNodes(displayResultForView);
  const lines = lineCount(displayCode);

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

  const highlightNodeIds = useMemo(
    () =>
      resolveCodePreviewHighlightNodeIds(
        selection,
        selectedNodeIds,
        symbolLink?.highlightNodeIds
      ),
    [selection, selectedNodeIds, symbolLink?.highlightNodeIds]
  );

  const highlightRanges = useMemo(
    () =>
      highlightNodeIds.length > 0
        ? buildColoredHighlightRanges(highlightNodeIds, sourceMap, filePath, nodesById)
        : undefined,
    [highlightNodeIds, sourceMap, filePath, nodesById]
  );
  const hasSelectionLink = Boolean(highlightRanges?.length);

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
        setPrevHighlightNavKey(navKey);
        break;
      }
      if (prevHighlightNavKey !== navKey) {
        setPrevHighlightNavKey(navKey);
      }
    }
  }


  const hasBlockingAnalysisErrors = validationErrors.length > 0;
  const hasBlockingIssues = compileState === 'error' || hasBlockingAnalysisErrors;

  const syncTitle = isCompiling
    ? 'Generating…'
    : isStale
      ? 'Preview paused — generate or enable auto generate'
      : hasBlockingIssues
        ? hasBlockingAnalysisErrors
          ? 'Analysis errors block export'
          : 'Compile errors'
        : 'In sync';

  const syncTone = isCompiling
    ? 'text-amber-400/90'
    : isStale
      ? 'text-amber-500'
      : hasBlockingIssues
        ? 'text-red-400'
        : 'text-emerald-500';

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

  const handleFormatJson = useCallback(() => {
    try {
      setJsonFormatOverride(JSON.stringify(JSON.parse(generatedCode), null, 2));
      setJsonFormatError(false);
    } catch {
      setJsonFormatOverride(null);
      setJsonFormatError(true);
      window.setTimeout(() => setJsonFormatError(false), 1600);
    }
  }, [generatedCode]);

  const handleReverseSelectLine = useCallback(
    (line: number, col: number) => {
      const nodeId = findNodeIdAtSourceLocation(sourceMap, {
        filePath,
        line,
        col,
      });
      if (!nodeId) return;
      const ownerTab =
        fileOwners[filePath] ??
        (selectedFilePath ? fileOwners[selectedFilePath] : undefined) ??
        previewTabId;
      dispatchNavigateToNode(ownerTab, nodeId);
    },
    [sourceMap, filePath, fileOwners, selectedFilePath, previewTabId]
  );

  useEffect(() => {
    setJsonFormatOverride(null);
    setJsonFormatError(false);
  }, [generatedCode, filePath]);

  const isEmpty = !displayCode.trim();

  const toolbarBtnClass =
    'p-0.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-40 disabled:pointer-events-none rounded hover:bg-zinc-800 transition-colors';

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col min-h-0 min-w-0 relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/95 px-2 h-7 shrink-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <FileCode2 size={11} className="text-zinc-600 shrink-0" />
          <span
            className="text-[10px] text-zinc-400 font-mono truncate"
            title={copyablePath}
          >
            {filePath}
          </span>
          <CopyPathButton
            path={copyablePath}
            title={`Copy path: ${copyablePath}`}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1">
            {validationErrors.length > 0 ? (
              <span
                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-red-400 bg-red-500/10 border border-red-500/20"
                title={validationErrors.map((e) => e.message).join('\n')}
              >
                <AlertTriangle size={9} />
                {validationErrors.length}
              </span>
            ) : null}
            {validationWarnings.length > 0 ? (
              <span
                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20"
                title={`${validationWarnings.length} portability warning(s)`}
              >
                <AlertTriangle size={9} />
                {validationWarnings.length}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center p-0.5 rounded ${syncTone}`}
              title={syncTitle}
            >
              {isCompiling ? (
                <Loader2 size={10} className="animate-spin" />
              ) : isStale ? (
                <AlertTriangle size={10} />
              ) : compileState === 'error' ? (
                <AlertTriangle size={10} />
              ) : (
                <Circle size={6} fill="currentColor" stroke="none" />
              )}
            </span>
          </div>

          {!isOrgGraph ? (
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5">
              <button
                type="button"
                onClick={() => setShowUnsupportedComments(!showUnsupportedComments)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                  showUnsupportedComments
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
                title="Show unsupported as (x) comments"
                aria-pressed={showUnsupportedComments}
                aria-label="Show unsupported as (x) comments"
              >
                (x)
              </button>
              <SearchableSelect
                variant="compact"
                value={targetLanguage}
                onChange={(value) => setGraphTargetLanguage(value as TargetLanguage)}
                options={LANGUAGE_OPTIONS}
                placeholder="Lang"
                className="w-[4.75rem]"
                menuClassName="min-w-[9rem]"
                searchable={LANGUAGE_OPTIONS.length > 6}
              />
              <SearchableSelect
                variant="compact"
                value={targetFileExtension}
                onChange={setGraphTargetFileExtension}
                options={extensionOptions}
                placeholder="ext"
                className="w-[3.25rem]"
                menuClassName="min-w-[6rem] right-0"
                searchable={extensionOptions.length > 1}
                searchMinOptions={1}
              />
            </div>
          ) : null}

          <span
            className="text-[9px] text-zinc-600 tabular-nums hidden sm:inline border-l border-zinc-800 pl-1.5"
            title={`${lines} lines · ${mappedNodeCount} mapped nodes`}
          >
            {lines}L
          </span>

          <div className="flex items-center gap-0.5 border-l border-zinc-800 pl-1.5">
            {isJsonPreview ? (
              <button
                type="button"
                onClick={handleFormatJson}
                disabled={isEmpty}
                className={`${toolbarBtnClass} ${jsonFormatError ? 'text-red-400' : jsonFormatOverride ? 'text-emerald-400' : ''}`}
                title={
                  jsonFormatError
                    ? 'Invalid JSON'
                    : jsonFormatOverride
                      ? 'JSON formatted'
                      : 'Format JSON'
                }
              >
                <AlignLeft size={11} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={isEmpty}
              className={toolbarBtnClass}
              title={copied ? 'Copied' : 'Copy code'}
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      </div>

      {/* Editor surface */}
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
          <div
            className={`h-full transition-opacity duration-150 ${isStale ? 'opacity-55' : 'opacity-100'}`}
            title={isJsonPreview ? undefined : 'Double-click a line to select the canvas node'}
          >
            <GeneratedCodeView
              value={displayCode}
              language={isJsonPreview ? 'json' : targetLanguage}
              highlightRanges={hasSelectionLink ? highlightRanges : undefined}
              onReverseSelectLine={isJsonPreview ? undefined : handleReverseSelectLine}
              readOnly
              className="h-full"
            />
          </div>
        ) : null}

        {isStale && !isEmpty ? (
          <div className="absolute top-2 right-2 z-10 pointer-events-none" title="Preview paused">
            <AlertTriangle size={12} className="text-amber-500/90" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
