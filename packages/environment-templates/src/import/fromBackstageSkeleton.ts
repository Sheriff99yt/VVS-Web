import type { HostFileTemplate } from '../types';

export interface BackstageTemplateMeta {
  /** Backstage template metadata.name → env.{name} if id not set */
  name?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export function inferHostFileRole(relativePath: string): HostFileTemplate['role'] {
  const base = relativePath.split('/').pop() ?? relativePath;
  const entryNames = new Set([
    'main.py',
    'main.js',
    'main.ts',
    'index.js',
    'index.ts',
    'app.py',
    '__main__.py',
  ]);
  if (entryNames.has(base)) return 'entry';
  if (base.endsWith('.html') || base === 'README.md') return 'asset';
  return 'config';
}

/** Map Backstage/Nunjucks placeholders to VVS host template slots. */
export function normalizeBackstageTemplate(content: string): string {
  return content
    .replace(/\$\{\{\s*values\.(\w+)\s*\}\}/g, '{moduleName}')
    .replace(/\{\{\s*parameters\.(\w+)\s*\}\}/g, '{moduleName}')
    .replace(/\{\{\s*values\.(\w+)\s*\}\}/g, '{moduleName}');
}

/** Minimal parse of Backstage template.yaml metadata block (no YAML dependency). */
export function parseBackstageTemplateYaml(yamlText: string): BackstageTemplateMeta {
  const meta: BackstageTemplateMeta = {};
  const lines = yamlText.split(/\r?\n/);
  let inMetadata = false;

  for (const line of lines) {
    if (/^metadata:\s*$/.test(line)) {
      inMetadata = true;
      continue;
    }
    if (inMetadata && /^\S/.test(line) && !line.startsWith(' ')) {
      inMetadata = false;
    }
    if (!inMetadata && /^spec:\s*$/.test(line)) break;

    const match = line.match(/^\s{2}(\w+):\s*(.+)?$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = (rawValue ?? '').replace(/^['"]|['"]$/g, '').trim();
    if (key === 'name') meta.name = value;
    if (key === 'title') meta.title = value;
    if (key === 'description') meta.description = value;
  }

  if (!meta.title && !meta.name) {
    const topName = yamlText.match(/^metadata:\s*\n\s+name:\s*(.+)$/m);
    if (topName?.[1]) meta.name = topName[1].trim().replace(/^['"]|['"]$/g, '');
  }

  return meta;
}

export function backstageMetaToEnvId(meta: BackstageTemplateMeta, fallback: string): string {
  const slug = (meta.name ?? fallback).toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
  return slug.startsWith('env.') ? slug : `env.${slug}`;
}
