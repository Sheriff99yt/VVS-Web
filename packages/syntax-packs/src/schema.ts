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

/** Per-family layout profile (indent, placeholders, comment style). */
export interface PackLayoutProfile {
  indentUnit: string;
  blockPlaceholder: string;
  commentPrefix: string;
  instanceReceiver: string;
  /** Statement terminator (e.g. ";" for C++). */
  statementSuffix?: string;
  /** Indent for on_start / function bodies at print time. */
  bodyIndent?: string;
  /** Indent for event handler bodies at print time. */
  handlerBodyIndent?: string;
  /** Indent for member-chain declare lines. */
  memberChainIndent?: string;
  /** Indent for instance variable declarations in class body. */
  varDeclIndent?: string;
  /** Full line emitted when an event handler body is empty. */
  emptyHandlerBody?: string;
  /** Full line emitted when a function tab body is empty. */
  emptyFunctionBody?: string;
  importTemplate?: { quasi: string };
}

export interface SyntaxPackManifest {
  id: string;
  version: string;
  family: LanguageFamily;
  /** When set, this pack overlays a base pack id. */
  extends?: string;
  capabilities?: string[];
  layout?: PackLayoutProfile;
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
  layout?: PackLayoutProfile;
  /** Trace of pack ids merged (base first, overlays last). */
  sourcePackIds: string[];
}

/** Slot value for template rendering — plain text or span-bearing expression fragment. */
export interface RenderSlotValue {
  text: string;
  spans?: Array<{ nodeId: string; start: number; end: number }>;
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
