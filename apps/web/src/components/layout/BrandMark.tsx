'use client';

import { PRODUCT_NAME } from '@/lib/productName';

/** Original vvscodes.com mark. Public file; prefix basePath on GitHub Pages. */
export const BRAND_MARK_SRC = `${process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? ''}/brand/VVS_White2.png`;

export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static PNG; next/image is unused in this app
    <img
      src={BRAND_MARK_SRC}
      alt=""
      width={1024}
      height={546}
      className={className ?? 'h-8 w-auto object-contain'}
    />
  );
}

export function BrandLockup({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={className ?? 'font-bold text-zinc-100 tracking-wide flex items-center gap-2'}>
      <BrandMark className={markClassName} />
      {PRODUCT_NAME}
    </span>
  );
}
