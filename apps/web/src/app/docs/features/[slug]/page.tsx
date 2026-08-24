import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsChrome } from '@/components/docs/DocsChrome';
import { docsPath } from '@/lib/docsUrl';
import { getFeatureDoc, listFeatureSlugs } from '@/lib/docsFeatures';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureDoc(slug);
  if (!feature) return { title: 'Unknown feature' };
  return { title: `${feature.title} - VVS docs`, description: feature.summary };
}

export default async function FeatureDocPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeatureDoc(slug);
  if (!feature) notFound();

  return (
    <DocsChrome title={feature.title} active={{ type: 'feature', id: feature.slug }}>
      <nav className="mb-6 text-[12px] text-zinc-500">
        <Link href={docsPath({ type: 'home' })} className="hover:text-zinc-200">
          Docs
        </Link>
        <span className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-300">{feature.title}</span>
      </nav>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300/80">Feature</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">{feature.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">{feature.summary}</p>
      <div className="mt-8 space-y-4 border-t border-zinc-800 pt-6">
        {feature.body.map((para) => (
          <p key={para} className="text-[15px] leading-relaxed text-zinc-400">
            {para}
          </p>
        ))}
      </div>
    </DocsChrome>
  );
}