'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Loader2,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { VVSNode, VVSEdge } from '@/types/graph';
import { transpileGraph, withProjectCodegenTarget } from '@/lib/codegen';
import type { TranspileResult } from '@/types/transpile';
import { runProjectAnalysis } from '@/lib/projectAnalysis';
import { isOrgOnlyGraphTab } from '@/lib/graphTabs';
import { MAIN_GRAPH_CONTAINER_ID, classForHomeGraphId } from '@/lib/classScope';
import type { ValidationMessage } from '@/lib/graphValidator';
import { GeneratedCodeView } from '@/components/code/GeneratedCodeView';
import type { CodeHighlightRange } from '@/components/code/types';
import { CopyPathButton } from '@/components/ui/CopyPathButton';
import { nodeHighlightColor, DEFAULT_NODE_HIGHLIGHT } from '@/lib/nodeHighlightColor';
import { resolveSymbolCodegenLink } from '@/lib/symbolCodegenLink';
import { resolveCodePreviewHighlightNodeIds } from '@/lib/projectSelection';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { TARGET_FILE_EXTENSIONS, formatTargetFileExtension } from '@vvs/graph-types';
import type { TargetLanguage } from '@/contexts/ProjectContext';

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

function warningsEqual(a: ValidationMessage[], b: ValidationMessage[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((msg, i) => {
    const other = b[i]!;
    return (
      msg.level === other.level &&
      msg.message === other.message &&
      msg.tabId === other.tabId &&
      msg.nodeId === other.nodeId &&
      msg.code === other.code &&
      msg.symbolId === other.symbolId
    );
  });
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
    setValidationWarnings,
    crossOverMode,
    environmentId,
    integration,
    classes,
    activeClassId,
    syntaxPackLock,
    codegenCapabilities,
  } = useProject();
  const documents = useGraphDocuments();
  const { result: projectResult, fileOwners } = useProjectTranspileResult();

  const [heldResult, setHeldResult] = useState<TranspileResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const lastCleanResultRef = useRef<TranspileResult | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const homeClass = classForHomeGraphId(classes, previewTabId);
    const isModuleGraph = homeClass != null || previewTabId === 'main';

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
  ]);

  useEffect(() => {
    if (!documents) return;
    const analysis = runProjectAnalysis({
      documents,
      functions,
      events,
      variables,
      classes,
      activeClassId,
      openTabs,
      projectDetails,
      targetLanguage: projectTargetLanguage,
      crossOver: crossOverMode,
      environmentId,
    });
    setValidationWarnings((prev) =>
      warningsEqual(prev, analysis.warnings) ? prev : analysis.warnings
    );
  }, [documents, functions, events, variables, classes, activeClassId, openTabs, projectDetails, projectTargetLanguage, crossOverMode, environmentId, setValidationWarnings]);

  useEffect(() => {
    if (compileState === 'success' || compileState === 'clean') {
      lastCleanResultRef.current = liveResult;
    }
  }, [compileState, liveResult]);

  useEffect(() => {
    const onCommitPreview = () => {
      lastCleanResultRef.current = liveResult;
    };
    window.addEventListener('vvs:commit-preview', onCommitPreview);
    return () => window.removeEventListener('vvs:commit-preview', onCommitPreview);
  }, [liveResult]);

  useEffect(() => {
    const onCompileState = (event: Event) => {
      const { state } = (event as CustomEvent<{ state: string }>).detail;
      if (state === 'compiling') {
        setHeldResult(lastCleanResultRef.current);
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
        : lastCleanResultRef.current ?? liveResult;

  useEffect(() => {
    onClearPinnedFile?.();
    setActiveFileIndex(0);
  }, [previewTabId, targetLanguage, targetFileExtension, onClearPinnedFile]);

  const graphDisplayResult = displayResult;
  const displayResultForView =
    selectedFilePath && projectResult.files.some((file) => file.path === selectedFilePath)
      ? projectResult
      : graphDisplayResult;

  useEffect(() => {
    if (!selectedFilePath) {
      setActiveFileIndex(0);
      return;
    }
    const fileIndex = displayResultForView.files.findIndex((file) => file.path === selectedFilePath);
    if (fileIndex >= 0) setActiveFileIndex(fileIndex);
  }, [selectedFilePath, displayResultForView.files]);

  const safeFileIndex = Math.min(
    activeFileIndex,
    Math.max(0, (displayResultForView?.files.length ?? 1) - 1)
  );
  const activeFile = displayResultForView.files[safeFileIndex] ?? displayResultForView.files[0];
  const generatedCode = activeFile?.content ?? '';
  const filePath = activeFile?.path ?? 'output';
  const copyablePath = filePath;
  const sourceMap = graphDisplayResult.sourceMap;
  const mappedNodeCount = countMappedNodes(graphDisplayResult);
  const lines = lineCount(generatedCode);

  const previewNodes = (previewDocument?.nodes ?? []) as VVSNode[];
  const nodesById = useMemo(() => {
    const map = new Map<string, VVSNode>();
    for (const node of previewNodes) {
      map.set(node.id, node);
    }
    return map;
  }, [previewNodes]);

  const highlightNodeIds = resolveCodePreviewHighlightNodeIds(
    selection,
    selectedNodeIds,
    symbolLink?.highlightNodeIds
  );

  const highlightRanges = useMemo(
    () =>
      highlightNodeIds.length > 0
        ? buildColoredHighlightRanges(highlightNodeIds, sourceMap, filePath, nodesById)
        : undefined,
    [highlightNodeIds, sourceMap, filePath, nodesById]
  );
  const hasSelectionLink = Boolean(highlightRanges?.length);

  useEffect(() => {
    if (highlightNodeIds.length === 0) return;

    for (const nodeId of highlightNodeIds) {
      const ranges = sourceMap[nodeId];
      if (!ranges?.length) continue;
      const targetPath = ranges[0]!.filePath;
      const fileIndex = displayResultForView.files.findIndex((file) => file.path === targetPath);
      if (fileIndex >= 0 && fileIndex !== safeFileIndex) {
        setActiveFileIndex(fileIndex);
        onSelectedFilePathChange?.(targetPath);
      }
      break;
    }
  }, [
    highlightNodeIds,
    sourceMap,
    displayResultForView.files,
    safeFileIndex,
    onSelectedFilePathChange,
  ]);

  const syncTitle = isCompiling
    ? 'Generating…'
    : isStale
      ? 'Preview paused — generate or enable auto generate'
      : compileState === 'error'
        ? 'Compile errors'
        : 'In sync';

  const syncTone = isCompiling
    ? 'text-amber-400/90'
    : isStale
      ? 'text-amber-500'
      : compileState === 'error'
        ? 'text-red-400'
        : 'text-emerald-500';

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [generatedCode]);

  const isEmpty = !generatedCode.trim();

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col min-h-0 min-w-0 relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950 px-2 h-7 shrink-0">
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

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
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

          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={isEmpty}
            className="p-0.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-40 disabled:pointer-events-none rounded hover:bg-zinc-800 transition-colors"
            title={copied ? 'Copied' : 'Copy code'}
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </div>
      </div>

      {/* Editor surface */}
      <div className="flex-1 min-h-0 relative">
        {isCompiling && !autoCompile ? (
          <div className="absolute inset-x-0 top-0 z-10 h-px bg-indigo-500/60" />
        ) : null}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <FileCode2 size={20} className="text-zinc-700" />
            <p className="text-[11px] text-zinc-500">
              {isOrgGraph
                ? 'Visual organization graph — no generated code. Open a class graph to preview output.'
                : 'Wire nodes to preview code.'}
            </p>
          </div>
        ) : (
          <div className={`h-full transition-opacity duration-150 ${isStale ? 'opacity-55' : 'opacity-100'}`}>
            <GeneratedCodeView
              value={generatedCode}
              language={targetLanguage}
              highlightRanges={hasSelectionLink ? highlightRanges : undefined}
              readOnly
              className="h-full"
            />
          </div>
        )}

        {isStale && !isEmpty ? (
          <div className="absolute top-2 right-2 z-10 pointer-events-none" title="Preview paused">
            <AlertTriangle size={12} className="text-amber-500/90" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
