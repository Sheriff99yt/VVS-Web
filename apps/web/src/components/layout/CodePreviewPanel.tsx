'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { VVSNode, VVSEdge } from '@/types/graph';
import { generateMockCode } from '@/lib/mockCodegen';
import { useLatestRef } from '@/hooks/useLatestRef';

export function CodePreviewPanel() {
  const {
    compileState,
    autoCompile,
    targetLanguage,
    variables,
    functions,
    projectDetails,
    activeGraphTab,
    openTabs,
  } = useProject();
  const { getActiveTabMetadata } = useGraphWorkspace();
  const documents = useGraphDocuments();

  const [heldCode, setHeldCode] = useState('// Generate code to see a preview');

  const activeDocument = documents?.[activeGraphTab] ?? documents?.main ?? null;

  const liveCode = useMemo(() => {
    const nodes = (activeDocument?.nodes ?? []) as VVSNode[];
    const edges = (activeDocument?.edges ?? []) as VVSEdge[];
    const tabMeta = getActiveTabMetadata();
    const activeTab = openTabs.find((t) => t.id === activeGraphTab);
    const isMain = activeGraphTab === 'main';

    return generateMockCode({
      moduleName: isMain ? projectDetails.moduleName : tabMeta?.moduleName ?? activeTab?.name ?? 'Graph',
      extendsType: isMain ? projectDetails.extendsType : tabMeta?.extendsType ?? '',
      targetLanguage,
      variables,
      functions,
      nodes,
      edges,
      tabLabel: activeTab?.name,
    });
  }, [
    activeDocument,
    getActiveTabMetadata,
    openTabs,
    activeGraphTab,
    projectDetails,
    targetLanguage,
    variables,
    functions,
  ]);

  const liveCodeRef = useLatestRef(liveCode);

  useEffect(() => {
    const onCompileState = (event: Event) => {
      const { state } = (event as CustomEvent<{ state: string }>).detail;
      if (state === 'compiling') {
        setHeldCode(liveCodeRef.current);
      }
    };
    window.addEventListener('vvs:compile-state', onCompileState);
    return () => window.removeEventListener('vvs:compile-state', onCompileState);
  }, [liveCodeRef]);

  const generatedCode = compileState === 'compiling' ? heldCode : liveCode;

  const languageLabel = {
    python: 'Python',
    javascript: 'JavaScript',
    cpp: 'C++',
    verse: 'Verse',
    json: 'Graph JSON',
  }[targetLanguage];

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col border-t border-zinc-800 min-h-0 min-w-0 relative">
      {compileState === 'dirty' && !autoCompile && (
        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none flex items-start justify-end p-2">
          <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-semibold uppercase tracking-widest">Out of date</span>
        </div>
      )}
      {compileState === 'compiling' && !autoCompile && (
        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none flex items-center justify-center">
          <span className="text-zinc-300 text-sm font-semibold">Generating...</span>
        </div>
      )}

      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex-1 py-2 text-xs font-semibold text-zinc-300 text-center">
          Generated code — {languageLabel}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-zinc-950">
        <pre className={`text-xs font-mono leading-relaxed transition-opacity ${compileState === 'dirty' && !autoCompile ? 'opacity-50 text-zinc-500' : 'text-zinc-300'}`}>
          <code>{generatedCode}</code>
        </pre>
      </div>
    </div>
  );
}
