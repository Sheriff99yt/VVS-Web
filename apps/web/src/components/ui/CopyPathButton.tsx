'use client';

import React, { useCallback, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface CopyPathButtonProps {
  path: string;
  className?: string;
  title?: string;
}

export function CopyPathButton({ path, className = '', title }: CopyPathButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(path);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        setCopied(false);
      }
    },
    [path]
  );

  return (
    <Tooltip content={title ?? `Copy path: ${path}`} placement="top">
      <button
        type="button"
        onClick={handleCopy}
        className={`p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors shrink-0 ${className}`}
        aria-label={`Copy path ${path}`}
      >
        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      </button>
    </Tooltip>
  );
}

/** Repo-relative path for display and clipboard (forward slashes). */
export function formatRepoRelativePath(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .join('/')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/');
}
