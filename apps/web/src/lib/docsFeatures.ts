export interface FeatureDoc {
  slug: string;
  title: string;
  summary: string;
  body: string[];
}

export const FEATURE_DOCS: FeatureDoc[] = [
  {
    slug: 'generate',
    title: 'Generate',
    summary: 'The user action that turns the canvas into ordinary source. Emit is Stage C only.',
    body: [
      'Generate walks the graph, builds IR, and prints one of the eight shipped targets. The canvas stays the source of truth.',
      'VVS does not run the result. Execution is a third-party IDE, engine, or CI after export.',
    ],
  },
  {
    slug: 'leftover',
    title: 'Leftover honesty',
    summary: 'If a pack cannot print a construct, Generate writes leftover (x) instead of inventing an API.',
    body: [
      'A leftover is visible in the code panel. Docs and the editor must agree. If Generate would print (x), the node page says leftover first.',
      'Do not invent a language API to make a page or an import look complete. Verse GetInput is the teaching case.',
    ],
  },
  {
    slug: 'node-option-pin',
    title: 'Node, option, pin',
    summary: 'If it is a construct you would type, it is a node. If it only changes how that construct is written, it is an option. If it is a value that could come from another expression, it is a pin.',
    body: [
      'Two canvas positions or existence-without-body stay two nodes (Declare vs Define).',
      'Live docs tables are generated from the registry. Overlays must not invent ports.',
    ],
  },
];

export function getFeatureDoc(slug: string): FeatureDoc | undefined {
  return FEATURE_DOCS.find((f) => f.slug === slug);
}

export function listFeatureSlugs(): string[] {
  return FEATURE_DOCS.map((f) => f.slug);
}
