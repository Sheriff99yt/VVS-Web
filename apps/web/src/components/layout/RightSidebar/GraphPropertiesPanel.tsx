'use client';

import React, { useEffect, useReducer, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { GraphTabMetadata } from '@/lib/graphDefaults';
import {
  resolveApiSurface,
  summarizeEnvironmentManifest,
  refreshEnvironmentTemplate,
  type HostFileRefreshNote,
} from '@vvs/environment-templates';
import {
  getLinkedEnvironmentManifest,
  environmentVersionDrift,
  loadEnvironmentManifest,
} from '@/lib/environmentContext';
import { dispatchEnvironmentImportModal } from '@/components/environments/EnvironmentImportModal';
import { useEnvironmentCatalog } from '@/hooks/useEnvironmentCatalog';
import { useProjectFolder } from '@/contexts/ProjectFolderContext';
import { readTextFile, writeTextFile } from '@/lib/projectFolder/fsAccess';
import { formatEmitPreview, resolveHostEmitPath, syncIntegrationEnvironment } from '@vvs/graph-types';
import { SegmentedControl } from '@/components/settings/SettingsControls';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { buildExtendsClassPickerOptions } from '@/lib/classScope';
import { ExtendsListEditor } from '@/components/layout/ExtendsListEditor';
import { ImplementsListEditor } from '@/components/layout/ImplementsListEditor';
import { ClassFormEditor } from '@/components/layout/ClassFormEditor';
import { extendsListUiMode, implementsListUiMode, classFormUiOptions, syncClassExtendsFields, syncClassImplementsFields, normalizeClassForm } from '@vvs/graph-types';

export type GraphPropertiesSection = 'environment' | 'exportPaths' | 'details';

const DEFAULT_SECTIONS: GraphPropertiesSection[] = ['environment', 'exportPaths', 'details'];

interface GraphPropertiesPanelProps {
  onClose?: () => void;
  /** Which blocks to render. Default: Environment, Export paths, Graph details. */
  sections?: GraphPropertiesSection[];
}

export function GraphPropertiesPanel({
  onClose,
  sections = DEFAULT_SECTIONS,
}: GraphPropertiesPanelProps) {
  const {
    activeGraphTab,
    openTabs,
    projectDetails,
    setProjectDetails,
    targetLanguage,
    environmentId,
    environmentVersion,
    setEnvironmentLink,
    classes,
    setClasses,
    activeClassId,
    integration,
    setIntegration,
    installedLibrary,
    setInstalledLibrary,
  } = useProject();
  const { getActiveTabMetadata, updateActiveTabMetadata, subscribeMetadata } = useGraphWorkspace();
  const { environments } = useEnvironmentCatalog();
  const { folderHandle } = useProjectFolder();
  const [refreshNotes, setRefreshNotes] = useState<HostFileRefreshNote[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isMain = activeGraphTab === 'main';
  const activeTab = openTabs.find((t) => t.id === activeGraphTab);
  const [, bumpMetadata] = useReducer((n: number) => n + 1, 0);
  const visible = new Set(sections);

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
    void (async () => {
      const hostPaths = manifest.hostFiles.map((file) => file.path);
      let existing: string[] | undefined;
      if (folderHandle) {
        existing = [];
        for (const path of hostPaths) {
          if ((await readTextFile(folderHandle, path)) !== null) existing.push(path);
        }
      }
      setIntegration((prev) =>
        syncIntegrationEnvironment(prev, manifest.id, manifest.version, hostPaths, existing)
      );
    })();
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

  const handleRefreshEnvironment = async () => {
    if (!environmentId) return;
    const nextManifest = loadEnvironmentManifest(environmentId);
    if (!nextManifest) return;
    setRefreshing(true);
    try {
      let currentHostFiles: Record<string, string> | undefined;
      if (folderHandle) {
        currentHostFiles = {};
        for (const host of nextManifest.hostFiles) {
          const emitPath = resolveHostEmitPath(integration, host.path);
          const textOnDisk = await readTextFile(folderHandle, emitPath);
          if (textOnDisk !== null) currentHostFiles[emitPath] = textOnDisk;
        }
      }
      const result = refreshEnvironmentTemplate({
        moduleName: projectDetails.moduleName,
        integration,
        nextManifest,
        currentHostFiles,
        installedLibrary,
      });
      setIntegration(result.integration);
      setInstalledLibrary(result.installedLibrary);
      setEnvironmentLink(result.environmentId, result.environmentVersion);
      if (folderHandle) {
        for (const file of result.writeFiles) {
          const path = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
          if (!path || path.includes('..')) continue;
          const content = file.content.endsWith('\n') ? file.content : `${file.content}\n`;
          await writeTextFile(folderHandle, path, content);
        }
      }
      setRefreshNotes(result.notes);
    } finally {
      setRefreshing(false);
    }
  };

  const showEnvironment = visible.has('environment') && isMain;
  const showExportPaths = visible.has('exportPaths') && isMain;
  const showDetails = visible.has('details');

  return (
    <div className="text-sm text-zinc-300 space-y-5">
      {onClose && (
        <Tooltip content="Close" placement="top">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors -mt-1 mb-1"
          >
            <ChevronLeft size={14} />
          </button>
        </Tooltip>
      )}
      {!isMain && activeTab && showDetails ? (
        <p className="text-[10px] text-zinc-500">
          Settings for <span className="text-zinc-300">{activeTab.name}</span>
        </p>
      ) : null}

      {showEnvironment ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
            Environment
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed mb-2">
            Linked template for APIs and host files. Saved with the project.
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
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-600">Host files</p>
                    {envSummary.hostFilePaths.map((templatePath) => {
                      const rule = integration.hostFiles[templatePath];
                      const strategy = rule?.strategy === 'skip' ? 'skip' : 'emit';
                      const customPath = rule?.path ?? '';
                      return (
                        <div
                          key={templatePath}
                          className="rounded border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-zinc-400 truncate" title={templatePath}>
                              {templatePath}
                            </span>
                            <SegmentedControl
                              value={strategy}
                              options={[
                                { value: 'skip', label: 'Skip' },
                                { value: 'emit', label: 'Emit' },
                              ]}
                              onChange={(next) => {
                                setIntegration((prev) => ({
                                  ...prev,
                                  hostFiles: {
                                    ...prev.hostFiles,
                                    [templatePath]: {
                                      ...(prev.hostFiles[templatePath] ?? { strategy: 'emit' }),
                                      strategy: next,
                                    },
                                  },
                                }));
                              }}
                            />
                          </div>
                          <label className="block space-y-0.5">
                            <span className="text-[10px] text-zinc-600">Custom path</span>
                            <input
                              type="text"
                              value={customPath}
                              onChange={(e) => {
                                const value = e.target.value;
                                setIntegration((prev) => ({
                                  ...prev,
                                  hostFiles: {
                                    ...prev.hostFiles,
                                    [templatePath]: {
                                      ...(prev.hostFiles[templatePath] ?? { strategy: 'emit' }),
                                      path: value.trim() ? value : undefined,
                                    },
                                  },
                                }));
                              }}
                              placeholder={templatePath}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-zinc-500 font-mono"
                            />
                          </label>
                        </div>
                      );
                    })}
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
                  onClick={() => void handleRefreshEnvironment()}
                  disabled={refreshing}
                  className="text-[10px] font-semibold text-amber-200 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-colors shrink-0 disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            ) : linkedManifest ? (
              <button
                type="button"
                onClick={() => void handleRefreshEnvironment()}
                disabled={refreshing}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Refreshing template…' : 'Refresh template'}
              </button>
            ) : null}
            {refreshNotes && refreshNotes.length > 0 ? (
              <ul className="text-[10px] text-zinc-500 space-y-0.5">
                {refreshNotes.map((note) => (
                  <li key={note.path}>
                    <span className="font-mono text-zinc-400">{note.emitPath}</span>
                    {' · '}
                    {note.action === 'kept-yours'
                      ? 'kept yours'
                      : note.action === 'already-current'
                        ? 'already current'
                        : 'updated'}
                  </li>
                ))}
              </ul>
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

      {showExportPaths ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
            Export paths
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed mb-2">
            Where this project writes generated files for the current language.
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

      {showDetails ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            Graph details
          </p>
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
            {extendsListUiMode(targetLanguage) === 'hidden' ? null : (
            <div className="space-y-1.5">
              {environmentId && isMain ? (
                <>
                  <label className="text-[11px] font-medium text-zinc-400">Extends (optional)</label>
                  <SearchableSelect
                    value={derivedExtends ?? ''}
                    disabled
                    onChange={() => undefined}
                    options={(() => {
                      const options = buildExtendsClassPickerOptions(classes, activeClassId);
                      const current = derivedExtends ?? '';
                      if (current && !options.some((option) => option.value === current)) {
                        return [{ value: current, label: current, description: 'Current value' }, ...options];
                      }
                      return options;
                    })()}
                    placeholder="Parent class…"
                    searchable
                  />
                  <p className="text-[9px] text-zinc-600">Derived from linked environment for {targetLanguage}</p>
                </>
              ) : (
                <ExtendsListEditor
                  cls={
                    classes.find((item) => item.id === activeClassId) ?? {
                      kind: 'class',
                      id: activeClassId ?? 'main-class',
                      name: tabDetails.moduleName || 'Class',
                      extendsType: tabDetails.extendsType || undefined,
                    }
                  }
                  classes={classes}
                  targetLanguage={targetLanguage}
                  onChange={(next) => {
                    const synced = syncClassExtendsFields(next.extendsType, next.extendsTypes);
                    handleChange('extendsType', synced.extendsType ?? '');
                    setClasses((prev) =>
                      prev.map((item) => (item.id === next.id ? { ...item, ...synced } : item))
                    );
                  }}
                />
              )}
            </div>
            )}
            {classFormUiOptions(targetLanguage).length > 0 || implementsListUiMode(targetLanguage) !== 'hidden' ? (
              <div className="space-y-2">
                <ClassFormEditor
                  cls={
                    classes.find((item) => item.id === activeClassId) ?? {
                      kind: 'class',
                      id: activeClassId ?? 'main-class',
                      name: tabDetails.moduleName || 'Class',
                    }
                  }
                  targetLanguage={targetLanguage}
                  onChange={(next) => {
                    const form = normalizeClassForm(next.form);
                    setClasses((prev) =>
                      prev.map((item) =>
                        item.id === next.id
                          ? { ...item, form: form && form !== 'class' ? form : undefined }
                          : item
                      )
                    );
                  }}
                />
                <ImplementsListEditor
                  cls={
                    classes.find((item) => item.id === activeClassId) ?? {
                      kind: 'class',
                      id: activeClassId ?? 'main-class',
                      name: tabDetails.moduleName || 'Class',
                      implementsTypes: [],
                    }
                  }
                  classes={classes}
                  targetLanguage={targetLanguage}
                  onChange={(next) => {
                    const synced = syncClassImplementsFields(next.implementsTypes);
                    setClasses((prev) =>
                      prev.map((item) =>
                        item.id === next.id ? { ...item, implementsTypes: synced.implementsTypes } : item
                      )
                    );
                  }}
                />
              </div>
            ) : null}
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
      ) : null}
    </div>
  );
}
