'use client';

import React, { useEffect, useReducer } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { GraphTabMetadata } from '@/lib/graphDefaults';

interface GraphPropertiesPanelProps {
  onClose?: () => void;
}

export function GraphPropertiesPanel({ onClose }: GraphPropertiesPanelProps) {
  const {
    activeGraphTab,
    openTabs,
    projectDetails,
    setProjectDetails,
    targetLanguage,
    setTargetLanguage,
    autoCompile,
    setAutoCompile,
  } = useProject();
  const { getActiveTabMetadata, updateActiveTabMetadata, subscribeMetadata } = useGraphWorkspace();

  const isMain = activeGraphTab === 'main';
  const activeTab = openTabs.find((t) => t.id === activeGraphTab);
  const [, bumpMetadata] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (isMain) return;
    return subscribeMetadata(() => {
      bumpMetadata();
    });
  }, [isMain, subscribeMetadata]);

  const tabDetails = isMain
    ? projectDetails
    : getActiveTabMetadata() ?? { moduleName: '', extendsType: '', description: '' };

  const handleChange = (key: keyof GraphTabMetadata, value: string) => {
    if (isMain) {
      setProjectDetails((prev) => ({ ...prev, [key]: value }));
      return;
    }
    updateActiveTabMetadata({ [key]: value });
    bumpMetadata();
  };

  return (
    <div className="text-sm text-zinc-300 space-y-5">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors -mt-1 mb-1"
        >
          <ChevronLeft size={14} />
          Back to inspector
        </button>
      )}
      {!isMain && activeTab && (
        <p className="text-[10px] text-zinc-500">
          Settings for <span className="text-zinc-300">{activeTab.name}</span>
        </p>
      )}

      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Graph details</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Module name</label>
            <input
              type="text"
              value={tabDetails.moduleName}
              onChange={(e) => handleChange('moduleName', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="e.g. PlayerController"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Extends (optional)</label>
            <input
              type="text"
              value={tabDetails.extendsType}
              onChange={(e) => handleChange('extendsType', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="Base type in target language"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Description</label>
            <textarea
              value={tabDetails.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors resize-none"
              placeholder="What this graph does..."
            />
          </div>
        </div>
      </div>

      {isMain && (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Code generation</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Target language</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as typeof targetLanguage)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="verse">Verse</option>
                <option value="json">Graph JSON</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCompile}
                onChange={(e) => setAutoCompile(e.target.checked)}
                className="accent-zinc-500 bg-zinc-900 border-zinc-800"
              />
              Auto-generate code when the graph changes
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
