'use client';

import React from 'react';
import { FolderOutput, Loader2, X } from 'lucide-react';

export interface SaveOnDiskPromptDialogProps {
  open: boolean;
  projectName: string;
  isDraft: boolean;
  /** `close` = leaving the editor; `manual` = user asked to promote without closing. */
  mode: 'close' | 'manual';
  saving: boolean;
  folderPickerAvailable: boolean;
  onSaveOnDisk: () => void;
  onCancel: () => void;
}

export function SaveOnDiskPromptDialog({
  open,
  projectName,
  isDraft,
  mode,
  saving,
  folderPickerAvailable,
  onSaveOnDisk,
  onCancel,
}: SaveOnDiskPromptDialogProps) {
  if (!open) return null;

  const title = isDraft
    ? 'Project not saved yet'
    : 'Project saved in browser only';

  const description = isDraft
    ? `"${projectName}" exists only in this browser session. Save it to a folder on disk as a git-friendly .vvs/ project, or close without saving.`
    : mode === 'close'
      ? `"${projectName}" is stored in browser storage. Save a copy to a folder on disk (.vvs/ overlay), or keep the browser copy and leave the editor.`
      : `"${projectName}" is stored in browser storage. Save a copy to a folder on disk (.vvs/ overlay) to keep working as a folder project.`;

  const secondaryLabel = isDraft
    ? 'Close without saving'
    : mode === 'close'
      ? 'Keep browser copy & close'
      : 'Not now';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={saving ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="save-on-disk-title"
      >
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <FolderOutput size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h2 id="save-on-disk-title" className="text-sm font-semibold text-zinc-100">
              {title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{description}</p>
            {!folderPickerAvailable ? (
              <p className="text-[11px] text-amber-400/90 mt-2">
                Folder save requires Chrome or Edge. You can still keep the browser copy.
              </p>
            ) : null}
          </div>
          {!saving ? (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-300 rounded"
              title={secondaryLabel}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-4 py-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded border border-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-50"
          >
            {secondaryLabel}
          </button>
          {folderPickerAvailable ? (
            <button
              type="button"
              onClick={onSaveOnDisk}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FolderOutput size={14} />}
              Save on disk
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
