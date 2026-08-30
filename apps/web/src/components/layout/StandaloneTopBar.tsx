'use client';

import { useRouter } from 'next/navigation';
import { AuthButton } from '@/components/auth/AuthButton';
import { ContributeButton } from '@/components/layout/ContributeButton';
import { BrandLockup } from '@/components/layout/BrandMark';
import { useCoarsePointer, useIsMobile } from '@/hooks/useIsMobile';

export function StandaloneTopBar() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const coarsePointer = useCoarsePointer();
  const enlargeIconHit = coarsePointer || isMobile;

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 text-sm font-sans shrink-0 w-full z-50">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="font-bold text-zinc-100 tracking-wide flex items-center gap-2 hover:text-zinc-300 transition-colors"
      >
        <BrandLockup />
      </button>
      <div className="flex items-center gap-2">
        <ContributeButton enlargeIconHit={enlargeIconHit} />
        <AuthButton />
      </div>
    </header>
  );
}
