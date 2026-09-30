import type { ImportDiagnostic, SourceSpan } from './contracts';

/** Source adapters stop at typed facts; parser trees never become persisted authoring state. */
export interface SourceAdapterContext {
  profileId: string; profileVersion: number; grammar: string; sourceMode: string;
  environment: string; graphSchemaVersion: number;
  files: readonly { name: string; source: string; sha256: string; encoding: 'utf8'; originalBytes?: Uint8Array }[];
  externalSignatures: readonly { id: string; signature: string; sourceFile: string; sha256: string }[];
  buildFlags: readonly string[];
}
export interface CompilationUnitFacts {
  id: string; fileName: string; kind: 'file' | 'module' | 'package' | 'crate'; span: SourceSpan;
  entryPolicy: 'library' | 'explicit-program-entry' | 'host-lifecycle';
  declarations: readonly { id: string; scopeId: string; name: string; span: SourceSpan; kind: 'function' | 'class' | 'import' | 'export' | 'type' | 'variable' }[];
  dependencies: readonly { declarationId: string; scopeId: string; span: SourceSpan; resolution: 'local' | 'supplied-signature' | 'unresolved' }[];
}
export type AdapterParseResult =
  { status: 'clean'; units: readonly CompilationUnitFacts[]; diagnostics: readonly ImportDiagnostic[] } |
  { status: 'unsupported' | 'ambiguous' | 'unvalidated'; diagnostics: readonly ImportDiagnostic[] };
export interface SourceAdapter {
  id: string; version: string; profileId: string; profileVersion: number;
  parse(context: SourceAdapterContext, signal: AbortSignal): Promise<AdapterParseResult>;
}
export type SourceAdapterLoader = () => Promise<SourceAdapter>;
/** Lazy admission supports future adapters without language dispatch switches. */
export class SourceAdapterRegistry {
  private readonly loaders = new Map<string, { version: number; load: SourceAdapterLoader }>();
  register(profileId: string, profileVersion: number, load: SourceAdapterLoader): void {
    if (!profileId.trim() || !Number.isSafeInteger(profileVersion) || profileVersion < 1) throw new Error('ADAPTER_PROFILE_INVALID');
    if (this.loaders.has(profileId)) throw new Error('ADAPTER_PROFILE_DUPLICATE');
    this.loaders.set(profileId, { version: profileVersion, load });
  }
  async load(profileId: string, profileVersion: number): Promise<SourceAdapter | undefined> {
    const entry = this.loaders.get(profileId);
    if (!entry) return undefined;
    if (entry.version !== profileVersion) throw new Error('ADAPTER_PROFILE_STALE');
    const adapter = await entry.load();
    if (adapter.profileId !== profileId || adapter.profileVersion !== profileVersion || !adapter.id.trim() || !adapter.version.trim()) throw new Error('ADAPTER_IDENTITY_MISMATCH');
    return adapter;
  }
}
