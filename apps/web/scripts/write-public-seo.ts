import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { CORE_NODE_REGISTRY } from '@vvs/syntax-registry';
import { FEATURE_DOCS } from '../src/lib/docsFeatures';
import { siteOrigin } from '../src/lib/siteOrigin';

const origin = siteOrigin();
const staticPaths = ['/', '/library', '/roadmap', '/docs'];
const nodePaths = Object.keys(CORE_NODE_REGISTRY)
  .sort()
  .map((kindId) => `/docs/nodes/${kindId}`);
const featurePaths = FEATURE_DOCS.map((f) => `/docs/features/${f.slug}`);
const locs = [...staticPaths, ...nodePaths, ...featurePaths];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map((path) => `  <url><loc>${origin}${path === '/' ? '/' : path}</loc></url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`;

const llms = `# VVS

> Visual graphs that generate real, importable source. Client-first. No product accounts.

The live catalog is the HTML pages under /docs.
Facts come from packages/syntax-registry CORE_NODE_REGISTRY. Do not invent kinds or ports.
Public origin: ${origin}

## Docs

- [Docs home](${origin}/docs)
- [Generate](${origin}/docs/features/generate)
- [Leftover honesty](${origin}/docs/features/leftover)
- [Node / option / pin](${origin}/docs/features/node-option-pin)
- [Contribute](https://github.com/Sheriff99yt/VVS-Web/blob/main/CONTRIBUTING.md)
`;

const pub = resolve(import.meta.dir, '../public');
writeFileSync(resolve(pub, 'sitemap.xml'), sitemap);
writeFileSync(resolve(pub, 'robots.txt'), robots);
writeFileSync(resolve(pub, 'llms.txt'), llms);
console.log(`wrote public SEO for ${origin} (${locs.length} urls)`);
