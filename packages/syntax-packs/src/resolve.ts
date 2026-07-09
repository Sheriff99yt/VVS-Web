import type { LanguageFamily, SyntaxPackLockEntry } from '@vvs/graph-types';
import type { PackLayoutProfile, ResolvedPrintProfile, SyntaxPackManifest, SyntaxTemplateRow } from './schema';
import pythonBase from './packs/python.base.json';
import javascriptBase from './packs/javascript.base.json';
import cppBase from './packs/cpp.base.json';
import verseBase from './packs/verse.base.json';
import gdscriptBase from './packs/gdscript.base.json';
import rustBase from './packs/rust.base.json';
import csharpBase from './packs/csharp.base.json';
import javascriptEs2022 from './packs/overlays/javascript.es2022.json';

const PACKS: SyntaxPackManifest[] = [
  pythonBase as SyntaxPackManifest,
  javascriptBase as SyntaxPackManifest,
  cppBase as SyntaxPackManifest,
  verseBase as SyntaxPackManifest,
  gdscriptBase as SyntaxPackManifest,
  rustBase as SyntaxPackManifest,
  csharpBase as SyntaxPackManifest,
  javascriptEs2022 as SyntaxPackManifest,
];

const packById = new Map<string, SyntaxPackManifest>(
  PACKS.map((p) => [`${p.id}@${p.version}`, p])
);

export function listSyntaxPacks(): SyntaxPackManifest[] {
  return [...PACKS];
}

export function getSyntaxPack(packRef: string): SyntaxPackManifest | undefined {
  return packById.get(packRef) ?? PACKS.find((p) => p.id === packRef);
}

function mergeTemplates(
  base: Record<string, SyntaxTemplateRow>,
  overlay: Record<string, SyntaxTemplateRow>,
  overlayPackId: string
): Record<string, SyntaxTemplateRow> {
  const merged = { ...base };
  for (const [key, row] of Object.entries(overlay)) {
    merged[key] = { ...row, sourcePackId: overlayPackId };
  }
  return merged;
}

export function resolvePack(
  family: LanguageFamily,
  capabilities: string[] = [],
  packLock?: SyntaxPackLockEntry
): ResolvedPrintProfile {
  const sourcePackIds: string[] = [];
  let templates: Record<string, SyntaxTemplateRow> = {};
  let layout: PackLayoutProfile | undefined;

  const baseRef = packLock?.base ?? `${family}.base@1`;
  const basePack = getSyntaxPack(baseRef);
  if (basePack) {
    templates = { ...basePack.templates };
    layout = basePack.layout;
    sourcePackIds.push(`${basePack.id}@${basePack.version}`);
  }

  const overlayRefs = packLock?.overlays ?? [];
  for (const ref of overlayRefs) {
    const overlay = getSyntaxPack(ref);
    if (overlay) {
      templates = mergeTemplates(templates, overlay.templates, `${overlay.id}@${overlay.version}`);
      sourcePackIds.push(`${overlay.id}@${overlay.version}`);
    }
  }

  // Auto-apply capability overlays when not locked
  if (!packLock?.overlays?.length) {
    if (family === 'javascript' && capabilities.includes('es2022')) {
      const overlay = getSyntaxPack('javascript.es2022@1');
      if (overlay) {
        templates = mergeTemplates(templates, overlay.templates, `${overlay.id}@${overlay.version}`);
        sourcePackIds.push(`${overlay.id}@${overlay.version}`);
      }
    }
  }

  return { family, capabilities, templates, layout, sourcePackIds };
}

/** Alias used by transpiler PrintContext. */
export function resolvePrintProfile(
  family: LanguageFamily,
  capabilities: string[] = [],
  packLock?: SyntaxPackLockEntry
): ResolvedPrintProfile {
  return resolvePack(family, capabilities, packLock);
}
