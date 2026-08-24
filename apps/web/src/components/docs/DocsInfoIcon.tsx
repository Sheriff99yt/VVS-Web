'use client';

import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { getNodeDoc } from '@/lib/nodeDocCatalog';
import { nodeDocsHref, nodeDocsHoverText, optionDocsHoverText } from '@/lib/docsHover';

export function DocsInfoIcon({
  kindId,
  optionKey,
  label,
  className = 'nodrag nopan shrink-0 text-zinc-500 hover:text-zinc-200',
}: {
  kindId: string;
  optionKey?: string;
  label: string;
  className?: string;
}) {
  const node = getNodeDoc(kindId);
  if (!node) return null;

  const href = nodeDocsHref(kindId, optionKey);
  const text = optionKey ? optionDocsHoverText(node, optionKey) : nodeDocsHoverText(node);

  return (
    <Tooltip
      content={
        <span className="block whitespace-pre-line">
          {text}
          {'\n'}
          Open docs
        </span>
      }
      placement="top"
    >
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={`Open documentation for ${label}`}
        onClick={(event) => event.stopPropagation()}
      >
        <CircleHelp size={12} strokeWidth={2} />
      </Link>
    </Tooltip>
  );
}