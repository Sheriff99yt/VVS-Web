import type { LanguageFamily, SyntaxPackLockEntry } from '@vvs/graph-types';

/** Layout tokens for pack templates (§2.3 Lego rows). */
export const LAYOUT_NEWLINE = '\x01';
export const LAYOUT_INDENT = '\x02';
export const LAYOUT_DEDENT = '\x03';
export const LAYOUT_SEMICOLON = '\x04';
export const LAYOUT_BLOCK_OPEN = '\x05';

export type TemplateSlotKind = 'static' | 'slot';

export interface TemplateSlot {
  kind: TemplateSlotKind;
  /** Slot name when kind=slot; literal text when kind=static. */
  name: string;
}

export interface SyntaxPackManifest {
  id: string;
  version: string;
  family: LanguageFamily;
  /** When set, this pack overlays a base pack id. */
  extends?: string;
  capabilities?: string[];
  templates: Record<string, SyntaxTemplateRow>;
}

export interface SyntaxTemplateRow {
  /** Simple quasi-quote template, e.g. "print({value})" */
  quasi?: string;
  /** Lego row sequence for complex constructs. */
  lego?: TemplateSlot[];
  sourcePackId?: string;
}

export interface ResolvedPrintProfile {
  family: LanguageFamily;
  capabilities: string[];
  templates: Record<string, SyntaxTemplateRow>;
  /** Trace of pack ids merged (base first, overlays last). */
  sourcePackIds: string[];
}

export interface FidelityViolation {
  code: 'MISSING_SOURCE_NODE' | 'DUPLICATE_NODE_ID' | 'SYNTHETIC_UNMARKED';
  message: string;
  nodeId?: string;
}

export interface FidelityLintInput {
  statements: Array<{
    sourceGraphNodeId?: string;
    synthetic?: boolean;
    text?: string;
  }>;
  sourceMap: Record<string, unknown>;
}

export type { SyntaxPackLockEntry };
