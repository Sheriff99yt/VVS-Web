import type { SyntaxPackManifest } from './schema';
import { listSyntaxPacks } from './resolve';

const customPacks: SyntaxPackManifest[] = [];

export function registerPack(pack: SyntaxPackManifest): void {
  customPacks.push(pack);
}

export function getRegisteredPacks(): SyntaxPackManifest[] {
  return [...listSyntaxPacks(), ...customPacks];
}
