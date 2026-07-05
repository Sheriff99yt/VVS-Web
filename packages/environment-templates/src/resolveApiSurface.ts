import type { TargetLanguage } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest, ResolvedApiSurface } from './types';

function resolveExtendsName(
  manifest: ProjectEnvironmentManifest,
  targetLanguage: TargetLanguage
): string {
  const typeRef = manifest.module.extends;
  if (!typeRef) return '';

  const typeDef = manifest.apiSurface.types.find((t) => t.id === typeRef.id);
  if (!typeDef) return '';

  const targetExtends = typeDef.targets?.[targetLanguage]?.extendsName;
  if (targetExtends) return targetExtends;

  return typeDef.displayName;
}

export function resolveApiSurface(
  manifest: ProjectEnvironmentManifest,
  targetLanguage: TargetLanguage
): ResolvedApiSurface {
  const natives = manifest.apiSurface.methods.filter(
    (m) => m.role === 'native' && m.targets[targetLanguage]?.callExpr
  );
  const overrideable = manifest.apiSurface.methods.filter(
    (m) => (m.role === 'overrideable' || m.role === 'lifecycle') && m.targets[targetLanguage]
  );
  const methods = manifest.apiSurface.methods.filter((m) => m.targets[targetLanguage]);

  return {
    extendsType: resolveExtendsName(manifest, targetLanguage),
    events: manifest.apiSurface.events,
    methods,
    natives,
    overrideable,
  };
}

export function resolveMethodBinding(
  manifest: ProjectEnvironmentManifest,
  methodId: string,
  targetLanguage: TargetLanguage
) {
  const method = manifest.apiSurface.methods.find((m) => m.id === methodId);
  if (!method) return undefined;
  return method.targets[targetLanguage];
}

export function resolveEventDef(manifest: ProjectEnvironmentManifest, eventId: string) {
  return manifest.apiSurface.events.find((e) => e.id === eventId);
}

export function substituteCallExpr(
  callExpr: string,
  args: Record<string, string>
): string {
  let result = callExpr;
  for (const [key, value] of Object.entries(args)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

export function renderHostFileTemplate(
  template: string,
  moduleName: string
): string {
  return template.replaceAll('{moduleName}', moduleName);
}
