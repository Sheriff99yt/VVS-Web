'use client';

import { Github } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { VVS_CONTRIBUTING_URL } from '@/lib/contribute';
import { topNavIconButtonClass } from '@/lib/mobileViewport';

export function ContributeButton({ enlargeIconHit = false }: { enlargeIconHit?: boolean }) {
  return (
    <Tooltip content="Contribute on GitHub" placement="bottom">
      <a
        href={VVS_CONTRIBUTING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={topNavIconButtonClass(enlargeIconHit)}
        aria-label="Contribute on GitHub"
      >
        <Github size={14} />
      </a>
    </Tooltip>
  );
}
