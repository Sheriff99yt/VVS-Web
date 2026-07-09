'use client';

import React, { useEffect, useReducer } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { GraphTabMetadata } from '@/lib/graphDefaults';
import { resolveApiSurface, summarizeEnvironmentManifest } from '@vvs/environment-templates';
import {
  getLinkedEnvironmentManifest,
  environmentVersionDrift,
  loadEnvironmentManifest,
} from '@/lib/environmentContext';
import { dispatchEnvironmentImportModal } from '@/components/environments/EnvironmentImportModal';
import { useEnvironmentCatalog } from '@/hooks/useEnvironmentCatalog';
import { formatEmitPreview } from '@vvs/graph-types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

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
    environmentId,
    environmentVersion,
    setEnvironmentLink,
    integration,
    setIntegration,
  } = useProject();
  const { getActiveTabMetadata, updateActiveTabMetadata, subscribeMetadata } = useGraphWorkspace();
  const { environments } = useEnvironmentCatalog();

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

  const linkedManifest = getLinkedEnvironmentManifest(environmentId);
  const envSummary = linkedManifest ? summarizeEnvironmentManifest(linkedManifest) : null;
  const derivedExtends =
    linkedManifest && isMain
      ? resolveApiSurface(linkedManifest, targetLanguage).extendsType
      : tabDetails.extendsType;
  const versionDrift = environmentVersionDrift(environmentId, environmentVersion);

  const handleChange = (key: keyof GraphTabMetadata, value: string) => {
    if (isMain) {
      setProjectDetails((prev) => ({ ...prev, [key]: value }));
      return;
    }
    updateActiveTabMetadata({ [key]: value });
    bumpMetadata();
  };

  const handleEnvironmentChange = (nextId: string) => {
    if (!nextId) {
      setEnvironmentLink(undefined, undefined);
      return;
    }
    const manifest = loadEnvironmentManifest(nextId);
    if (!manifest) return;
    if (
      environmentId &&
      environmentId !== nextId &&
      !window.confirm('Changing environment may leave stale manifest-bound nodes. Continue?')
    ) {
      return;
    }
    setEnvironmentLink(manifest.id, manifest.version);
    if (isMain) {
      const surface = resolveApiSurface(manifest, targetLanguage);
      setProjectDetails((prev) => ({
        ...prev,
        extendsType: surface.extendsType,
        description: prev.description || manifest.description,
      }));
    }
  };

  const emitPreview = formatEmitPreview(integration, targetLanguage, projectDetails.moduleName);

  const updateEmitField = (field: 'moduleDir' | 'moduleFile' | 'functionDir', value: string) => {
    setIntegration((prev) => ({
      ...prev,
      emit: {
        ...prev.emit,
        [targetLanguage]: {
          ...prev.emit[targetLanguage],
          [field]: value,
        },
      },
    }));
  };

  const targetEmit = integration.emit[targetLanguage] ?? {};

  const handleUpgradeEnvironment = () => {
    if (!environmentId || !versionDrift.currentVersion) return;
    setEnvironmentLink(environmentId, versionDrift.currentVersion);
  };

  return (
    <div className="text-sm text-zinc-300 space-y-5">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors -mt-1 mb-1"
          title="Close"
        >
          <ChevronLeft size={14} />
        </button>
      )}
      {!isMain && activeTab && (
        <p className="text-[10px] text-zinc-500">
          Settings for <span className="text-zinc-300">{activeTab.name}</span>
        </p>
      )}

      {isMain ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            Project environment
          </p>
          <div className="space-y-2">
            <SearchableSelect
              value={environmentId ?? ''}
              onChange={(id) => handleEnvironmentChange(id)}
              options={[
                { value: '', label: 'None (blank project)' },
                ...environments.map((env) => ({
                  value: env.id,
                  label: `${env.displayName} · v${env.version}`,
                })),
              ]}
              placeholder="Select environment…"
            />
            {linkedManifest ? (
              <>
                <p className="text-[10px] text-zinc-500">{linkedManifest.description}</p>
                <div className="text-[10px] text-zinc-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    Linked: <span className="font-mono text-zinc-400">v{environmentVersion ?? '?'}</span>
                  </span>
                  <span>Current: <span className="font-mono text-zinc-400">v{linkedManifest.version}</span></span>
                  {envSummary?.entryPath ? (
                    <span className="font-mono truncate">Entry: {envSummary.entryPath}</span>
                  ) : null}
                </div>
                {envSummary && envSummary.hostFilePaths.length > 0 ? (
                  <div className="text-[10px] text-zinc-600">
                    Host files:{' '}
                    <span className="font-mono text-zinc-500">
                      {envSummary.hostFilePaths.join(', ')}
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}
            {versionDrift.drift ? (
              <div className="flex items-center justify-between gap-2 rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1.5">
                <p className="text-[10px] text-amber-400">
                  Template update available (v{environmentVersion} → v{versionDrift.currentVersion})
                </p>
                <button
                  type="button"
                  onClick={handleUpgradeEnvironment}
                  className="text-[10px] font-semibold text-amber-200 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-colors shrink-0"
                >
                  Update
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => dispatchEnvironmentImportModal()}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Import OpenAPI / AsyncAPI…
            </button>
          </div>
        </div>
      ) : null}

      {isMain ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            Code generation
          </p>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Output directory</label>
              <input
                type="text"
                value={targetEmit.moduleDir ?? ''}
                onChange={(e) => updateEmitField('moduleDir', e.target.value)}
                placeholder="src"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Module file</label>
              <input
                type="text"
                value={targetEmit.moduleFile ?? ''}
                onChange={(e) => updateEmitField('moduleFile', e.target.value)}
                placeholder={`${projectDetails.moduleName}.py`}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Function output directory</label>
              <input
                type="text"
                value={targetEmit.functionDir ?? ''}
                onChange={(e) => updateEmitField('functionDir', e.target.value)}
                placeholder="Same as output directory"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-600">
              Main graph emits to{' '}
              <span className="font-mono text-zinc-400">{emitPreview}</span>
            </p>
          </div>
        </div>
      ) : null}

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
              value={derivedExtends}
              readOnly={Boolean(environmentId && isMain)}
              onChange={(e) => handleChange('extendsType', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-70"
              placeholder="Base type in target language"
            />
            {environmentId && isMain ? (
              <p className="text-[9px] text-zinc-600">Derived from linked environment for {targetLanguage}</p>
            ) : null}
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
    </div>
  );
}
