import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsChrome } from '@/components/docs/DocsChrome';
import { getFeatureDoc, listFeatureSlugs } from '@/lib/docsFeatures';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureDoc(slug);
  if (!feature) return { title: 'Unknown feature' };
  return { title: `${feature.title} — VVS docs`, description: feature.summary };
}

export default async function FeatureDocPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeatureDoc(slug);
  if (!feature) notFound();

  return (
    <DocsChrome title={feature.title}>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">{feature.title}</h1>
      <p className="text-zinc-300 mb-6 leading-relaxed">{feature.summary}</p>
      {feature.body.map((para) => (
        <p key={para} className="text-zinc-400 mb-4 leading-relaxed">
          {para}
        </p>
      ))}
    </DocsChrome>
  );
}
