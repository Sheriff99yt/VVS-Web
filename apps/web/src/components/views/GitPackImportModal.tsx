'use client';

import React, { useState } from 'react';
import { X, GitBranch, Download, AlertCircle } from 'lucide-react';
import { parseGitHubUrl } from '@/lib/gitCatalog';

interface GitPackImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRepo: (url: string) => boolean;
}

export function GitPackImportModal({
  isOpen,
  onClose,
  onImportRepo,
}: GitPackImportModalProps) {
  const [repoInput, setRepoInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!repoInput.trim()) return;

    const success = onImportRepo(repoInput);
    if (success) {
      setRepoInput('');
      onClose();
    } else {
      setErrorMessage('Failed to import repository. Verify format (e.g. owner/repository).');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-[min(480px,calc(100%-2rem))] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-indigo-400" />
            <h3 className="text-zinc-100 font-semibold text-xs uppercase tracking-wider">
              Import Git Repository / Pack
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Enter a GitHub repository URL or <span className="font-mono text-zinc-300">owner/repo</span> path to import custom syntax packs, node definitions, or environment templates directly from GitHub.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              GitHub Repository
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. owner/vvs-community-packs or https://github.com/owner/repo"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              Import Catalog Repo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
