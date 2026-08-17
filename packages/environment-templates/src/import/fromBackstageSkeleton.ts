import type { HostFileTemplate } from '../types';

export interface BackstageTemplateMeta {
  /** Backstage template metadata.name → env.{name} if id not set */
  name?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

/** Backstage/Nunjucks keys that map onto the VVS `{moduleName}` host slot. */
const MODULE_NAME_KEYS = new Set([
  'name',
  'moduleName',
  'module_name',
  'component_id',
  'projectName',
  'project_name',
]);

const ENTRY_FILE_NAMES = new Set([
  'main.py',
  'main.js',
  'main.ts',
  'main.rs',
  'main.cpp',
  'main.go',
  'index.js',
  'index.ts',
  'app.py',
  '__main__.py',
  'Program.cs',
]);

export function inferHostFileRole(relativePath: string): HostFileTemplate['role'] {
  const normalized = relativePath.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? normalized;
  if (ENTRY_FILE_NAMES.has(base)) return 'entry';
  if (normalized === 'src/main.rs' || normalized.endsWith('/main.rs')) return 'entry';
  if (base.endsWith('.html') || base === 'README.md') return 'asset';
  return 'config';
}

function moduleNameKeyFromExpr(expr: string): string | undefined {
  const match = expr.trim().match(/^(?:values|parameters)\.(\w+)/);
  return match?.[1];
}

function replaceNunjucksExpr(full: string, expr: string): string {
  const key = moduleNameKeyFromExpr(expr);
  if (key && MODULE_NAME_KEYS.has(key)) return '{moduleName}';
  return full;
}

/** Map Backstage/Nunjucks name placeholders to VVS `{moduleName}` slots. */
export function normalizeBackstageTemplate(content: string): string {
  return content
    .replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (full, expr: string) => replaceNunjucksExpr(full, expr))
    .replace(/\{\{\s*([^}]+?)\s*\}\}/g, (full, expr: string) => replaceNunjucksExpr(full, expr))
    .replace(/\{%-?\s*.*?\s*-?%\}/g, '');
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
