'use client';

import React, { useEffect, useState } from 'react';
import { X, Folder, FileText, Loader2, RefreshCw } from 'lucide-react';
import { listDirectoryTree, type DirectoryEntry } from '@/lib/projectFolder/listDirectory';
import { CopyPathButton, formatRepoRelativePath } from '@/components/ui/CopyPathButton';

interface ProjectFolderBrowserModalProps {
  handle: FileSystemDirectoryHandle;
  projectName: string;
  onClose: () => void;
}

function TreeNode({
  entry,
  depth = 0,
}: {
  entry: DirectoryEntry;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 2 && entry.kind === 'directory');
  const displayPath = formatRepoRelativePath(entry.path);
  const copyPath = displayPath;

  if (entry.kind === 'file') {
    return (
      <div
        className="group/row flex items-center gap-1 py-0.5 pr-1 hover:bg-zinc-800/40 rounded"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <FileText size={12} className="text-zinc-600 shrink-0" />
        <span className="truncate text-[11px] text-zinc-400 font-mono flex-1 min-w-0" title={copyPath}>
          {displayPath}
        </span>
        <CopyPathButton path={copyPath} className="opacity-60 group-hover/row:opacity-100" />
      </div>
    );
  }

  const hasChildren = (entry.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="group/row flex items-center gap-1 py-0.5 pr-1 hover:bg-zinc-800/40 rounded"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 min-w-0 flex-1 text-[11px] text-zinc-300 hover:text-zinc-100 font-mono text-left"
        >
          <Folder size={12} className="text-amber-500/80 shrink-0" />
          <span className="truncate font-semibold" title={copyPath}>
            {displayPath}
          </span>
          {hasChildren ? (
            <span className="text-zinc-600 text-[10px] shrink-0">{open ? '▾' : '▸'}</span>
          ) : null}
        </button>
        <CopyPathButton path={copyPath} className="opacity-60 group-hover/row:opacity-100" />
      </div>
      {open
        ? entry.children?.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} />
          ))
        : null}
    </div>
  );
}

export function ProjectFolderBrowserModal({
  handle,
  projectName,
  onClose,
}: ProjectFolderBrowserModalProps) {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectRootName = handle.name;

  const loadTree = useCallback(async () => {
    await Promise.resolve(); // Yield to prevent synchronous state update in effect
    setLoading(true);
    setError(null);
    try {
      const tree = await listDirectoryTree(handle, { maxDepth: 4 });
      setEntries(tree);
    } catch {
      setError('Could not read folder contents.');
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="folder-browser-title"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
          <Folder size={18} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 id="folder-browser-title" className="text-sm font-semibold text-zinc-100 truncate">
              {projectRootName}
            </h2>
            <p className="text-[10px] text-zinc-500 truncate">
              {projectName} · Click copy for repo-relative paths
            </p>
          </div>
          <CopyPathButton
            path={projectRootName}
            title={`Copy project folder name: ${projectRootName}`}
          />
          <button
            type="button"
            onClick={() => void loadTree()}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-zinc-500 text-xs">
              <Loader2 size={16} className="animate-spin" />
              Reading folder…
            </div>
          ) : error ? (
            <p className="text-xs text-red-400 text-center py-8">{error}</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-8">Folder is empty.</p>
          ) : (
            entries.map((entry) => <TreeNode key={entry.path} entry={entry} />)
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-zinc-800 shrink-0 space-y-1">
          <p className="text-[10px] text-zinc-600">
            Copied paths use forward slashes relative to{' '}
            <span className="font-mono text-zinc-500">{projectRootName}/</span>. Browsers cannot
            expose the full disk path (e.g. <span className="font-mono">C:\…</span>).
          </p>
          <p className="text-[10px] text-zinc-600">
            Graph source lives under{' '}
            <span className="font-mono text-zinc-500">.vvs/</span> — generated code paths are in
            Project settings → Code generation.
          </p>
        </div>
      </div>
    </div>
  );
}
