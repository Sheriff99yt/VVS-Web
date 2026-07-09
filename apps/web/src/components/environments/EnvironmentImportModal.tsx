'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUp, Loader2, X } from 'lucide-react';
import {
  buildEnvironmentManifest,
  registerEnvironmentManifest,
  slugifyId,
  validateEnvironmentManifest,
  type OpenApiDocument,
  type AsyncApiDocument,
  type ProjectEnvironmentManifest,
} from '@vvs/environment-templates';
import type { TargetLanguage } from '@vvs/graph-types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VvsApi } from '@/lib/api';
import { linkEnvironmentManifest } from '@/lib/environmentCatalog';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectFolder } from '@/contexts/ProjectFolderContext';
import { writeJsonFile, ensureDirPath } from '@/lib/projectFolder/fsAccess';
import { VVS_DIR } from '@vvs/graph-types';

export const ENVIRONMENT_IMPORT_EVENT = 'vvs:open-environment-import';

type SpecFormat = 'openapi' | 'asyncapi';

export interface EnvironmentImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported?: (manifest: ProjectEnvironmentManifest) => void;
}

function detectFormat(parsed: unknown): SpecFormat | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const doc = parsed as Record<string, unknown>;
  if (typeof doc.openapi === 'string') return 'openapi';
  if (typeof doc.asyncapi === 'string') return 'asyncapi';
  return null;
}

function defaultEnvId(parsed: unknown, format: SpecFormat): string {
  if (!parsed || typeof parsed !== 'object') return 'env.imported.api';
  const doc = parsed as Record<string, unknown>;
  const info = doc.info as { title?: string } | undefined;
  const title = info?.title ?? (format === 'openapi' ? 'openapi' : 'asyncapi');
  return `env.imported.${slugifyId(title)}`;
}

export function EnvironmentImportModal({ open, onClose, onImported }: EnvironmentImportModalProps) {
  const {
    targetLanguage,
    setEnvironmentLink,
    setProjectDetails,
    setTargetLanguage,
  } = useProject();
  const { isFolderProject, folderHandle } = useProjectFolder();

  const [rawText, setRawText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [envId, setEnvId] = useState('');
  const [defaultTarget, setDefaultTarget] = useState<TargetLanguage>(targetLanguage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProjectEnvironmentManifest | null>(null);

  const reset = useCallback(() => {
    setRawText('');
    setDisplayName('');
    setEnvId('');
    setDefaultTarget(targetLanguage);
    setError(null);
    setPreview(null);
  }, [targetLanguage]);

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const parseInput = useCallback((): { format: SpecFormat; parsed: unknown } | null => {
    setError(null);
    setPreview(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      setError('Invalid JSON — paste or upload OpenAPI / AsyncAPI JSON.');
      return null;
    }
    const format = detectFormat(parsed);
    if (!format) {
      setError('JSON must include an "openapi" or "asyncapi" version field.');
      return null;
    }
    return { format, parsed };
  }, [rawText]);

  const buildPreview = useCallback(() => {
    const input = parseInput();
    if (!input) return;
    const { format, parsed } = input;
    const info = (parsed as { info?: { title?: string; description?: string; version?: string } }).info;
    const id = envId.trim() || defaultEnvId(parsed, format);
    const name = displayName.trim() || info?.title || id;
    try {
      const manifest = buildEnvironmentManifest({
        id,
        version: info?.version ?? '1.0.0',
        displayName: name,
        description: info?.description ?? `Imported from ${format.toUpperCase()}`,
        defaultTarget: defaultTarget === 'json' ? 'python' : defaultTarget,
        supportedTargets: ['python', 'javascript'],
        openapi: format === 'openapi' ? (parsed as OpenApiDocument) : undefined,
        asyncapi: format === 'asyncapi' ? (parsed as AsyncApiDocument) : undefined,
      });
      const validated = validateEnvironmentManifest(manifest);
      if (!validated.ok) {
        setError(validated.issues.map((i) => `${i.path}: ${i.message}`).join('; '));
        return;
      }
      setPreview(validated.manifest);
      if (!envId.trim()) setEnvId(validated.manifest.id);
      if (!displayName.trim()) setDisplayName(validated.manifest.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build environment manifest.');
    }
  }, [parseInput, envId, displayName, defaultTarget]);

  const methodCount = preview?.apiSurface.methods.length ?? 0;
  const eventCount = preview?.apiSurface.events.length ?? 0;

  const previewSummary = useMemo(() => {
    if (!preview) return null;
    return `${methodCount} method${methodCount === 1 ? '' : 's'}, ${eventCount} event${eventCount === 1 ? '' : 's'}`;
  }, [preview, methodCount, eventCount]);

  const handleImport = async () => {
    if (!preview) {
      buildPreview();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await VvsApi.importEnvironment({
        format: detectFormat(JSON.parse(rawText))!,
        raw: JSON.parse(rawText),
        id: preview.id,
        displayName: preview.displayName,
        defaultTarget: preview.defaultTarget,
      });
      registerEnvironmentManifest(preview);

      if (isFolderProject && folderHandle) {
        await ensureDirPath(folderHandle, `${VVS_DIR}/environments`);
        await writeJsonFile(
          folderHandle,
          `${VVS_DIR}/environments/${preview.id}.json`,
          preview
        );
      }

      const link = linkEnvironmentManifest(preview, targetLanguage);
      setEnvironmentLink(link.environmentId, link.environmentVersion);
      setProjectDetails((prev) => ({
        ...prev,
        ...link.projectDetails,
      }));
      setTargetLanguage(link.targetLanguage);

      onImported?.(preview);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setRawText(await file.text());
      setError(null);
      setPreview(null);
    } catch {
      setError('Could not read file.');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center pt-[8vh] bg-black/60 p-4"
      onClick={busy ? undefined : handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="env-import-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h2 id="env-import-title" className="text-sm font-semibold text-zinc-100">
            Import OpenAPI / AsyncAPI
          </h2>
          {!busy ? (
            <button type="button" onClick={handleClose} className="text-zinc-500 hover:text-zinc-300">
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Paste or upload a spec to generate a linkable environment manifest. Methods come from
            OpenAPI paths; events from AsyncAPI channels.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-400">Spec JSON</label>
              <label className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
                <FileUp size={12} />
                Upload file
                <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => void handleFile(e)} />
              </label>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setPreview(null);
                setError(null);
              }}
              rows={8}
              placeholder='{ "openapi": "3.0.0", "info": { ... }, "paths": { ... } }'
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 resize-y min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Environment id</label>
              <input
                type="text"
                value={envId}
                onChange={(e) => setEnvId(e.target.value)}
                placeholder="env.imported.my_api"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My API"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400">Default codegen target</label>
            <SearchableSelect
              value={defaultTarget}
              onChange={(value) => setDefaultTarget(value as TargetLanguage)}
              options={[
                { value: 'python', label: 'Python' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'cpp', label: 'C++' },
              ]}
              placeholder="Codegen target…"
            />
          </div>

          {preview ? (
            <div className="rounded border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200/90">
              Preview: <span className="font-mono">{preview.id}</span> — {previewSummary}
            </div>
          ) : null}

          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded border border-zinc-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => (preview ? void handleImport() : buildPreview())}
            disabled={busy || !rawText.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-indigo-400 hover:bg-indigo-300 rounded disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            {preview ? 'Import & link to project' : 'Validate & preview'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook-friendly listener for opening the import modal from graph settings or library. */
export function useEnvironmentImportModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(ENVIRONMENT_IMPORT_EVENT, onOpen);
    return () => window.removeEventListener(ENVIRONMENT_IMPORT_EVENT, onOpen);
  }, []);
  return { open, setOpen };
}

export function dispatchEnvironmentImportModal(): void {
  window.dispatchEvent(new CustomEvent(ENVIRONMENT_IMPORT_EVENT));
}
