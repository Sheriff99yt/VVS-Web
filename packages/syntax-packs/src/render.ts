import {
  LAYOUT_BLOCK_OPEN,
  LAYOUT_DEDENT,
  LAYOUT_INDENT,
  LAYOUT_NEWLINE,
  LAYOUT_SEMICOLON,
  type PackLayoutProfile,
  type RenderSlotValue,
  type ResolvedPrintProfile,
  type SyntaxTemplateRow,
  type TemplateSlot,
} from './schema';

export class PackRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PackRenderError';
  }
}

export class PackTemplateMissingError extends Error {
  constructor(
    public readonly templateKey: string,
    public readonly family: string
  ) {
    super(`Missing syntax pack template "${templateKey}" for family "${family}"`);
    this.name = 'PackTemplateMissingError';
  }
}

export interface RenderedFragment {
  text: string;
  expressionSpans: Array<{ nodeId: string; start: number; end: number }>;
}

export interface RenderQuasiOptions {
  /** When true, throw if a slot token has no value. */
  strict?: boolean;
}

const SLOT_RE = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

function slotText(value: string | RenderSlotValue): string {
  return typeof value === 'string' ? value : value.text;
}

function slotSpans(value: string | RenderSlotValue): RenderSlotValue['spans'] {
  return typeof value === 'string' ? undefined : value.spans;
}

/** Replace `{slot}` tokens in a quasi template; accumulate expression span offsets. */
export function renderQuasi(
  template: string,
  slots: Record<string, string | RenderSlotValue>,
  options: RenderQuasiOptions = {}
): RenderedFragment {
  const strict = options.strict ?? true;
  const expressionSpans: RenderedFragment['expressionSpans'] = [];
  let cursor = 0;
  let text = '';

  const parts = template.split(SLOT_RE);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (i % 2 === 0) {
      text += part;
      cursor += part.length;
      continue;
    }
    const slotName = part;
    const value = slots[slotName];
    if (value === undefined) {
      if (strict) {
        throw new PackRenderError(`Missing slot "${slotName}" in quasi template`);
      }
      continue;
    }
    const slotStr = slotText(value);
    const spans = slotSpans(value);
    if (spans) {
      for (const span of spans) {
        expressionSpans.push({
          nodeId: span.nodeId,
          start: span.start + cursor,
          end: span.end + cursor,
        });
      }
    }
    text += slotStr;
    cursor += slotStr.length;
  }

  return { text, expressionSpans };
}

function renderLegoSlot(
  slot: TemplateSlot,
  slots: Record<string, string | RenderSlotValue>,
  strict: boolean
): string {
  if (slot.kind === 'static') return slot.name;
  const value = slots[slot.name];
  if (value === undefined) {
    if (strict) throw new PackRenderError(`Missing slot "${slot.name}" in lego row`);
    return '';
  }
  return slotText(value);
}

/** Interpret Lego row sequence with layout tokens \x01–\x05. */
export function renderLego(
  rows: TemplateSlot[],
  slots: Record<string, string | RenderSlotValue>,
  layout?: PackLayoutProfile,
  options: RenderQuasiOptions = {}
): RenderedFragment {
  const strict = options.strict ?? true;
  let indentLevel = 0;
  const indentUnit = layout?.indentUnit ?? '    ';
  const lines: string[] = [];
  let currentLine = '';

  const flushLine = () => {
    if (currentLine.length > 0 || lines.length === 0) {
      lines.push(currentLine);
      currentLine = '';
    }
  };

  for (const row of rows) {
    const token = row.kind === 'static' ? row.name : '';
    if (token === LAYOUT_NEWLINE) {
      flushLine();
      continue;
    }
    if (token === LAYOUT_INDENT) {
      indentLevel += 1;
      continue;
    }
    if (token === LAYOUT_DEDENT) {
      indentLevel = Math.max(0, indentLevel - 1);
      continue;
    }
    if (token === LAYOUT_SEMICOLON) {
      currentLine += layout?.statementSuffix ?? ';';
      continue;
    }
    if (token === LAYOUT_BLOCK_OPEN) {
      currentLine += ' {';
      continue;
    }
    const fragment = renderLegoSlot(row, slots, strict);
    if (fragment.length > 0) {
      if (currentLine.length === 0 && indentLevel > 0) {
        currentLine = indentUnit.repeat(indentLevel);
      }
      currentLine += fragment;
    }
  }
  flushLine();

  return { text: lines.join('\n'), expressionSpans: [] };
}

/** Render a template row (quasi or lego). */
export function renderTemplate(
  row: SyntaxTemplateRow,
  slots: Record<string, string | RenderSlotValue>,
  layout?: PackLayoutProfile,
  options?: RenderQuasiOptions
): RenderedFragment {
  if (row.quasi) return renderQuasi(row.quasi, slots, options);
  if (row.lego) return renderLego(row.lego, slots, layout, options);
  throw new PackRenderError('Template row has neither quasi nor lego');
}

/** Lookup a template from a resolved print profile. */
export function getTemplate(
  profile: ResolvedPrintProfile | undefined,
  key: string
): SyntaxTemplateRow | undefined {
  return profile?.templates[key];
}

/** Require a template or throw PackTemplateMissingError. */
export function requireTemplate(
  profile: ResolvedPrintProfile | undefined,
  key: string,
  family: string
): SyntaxTemplateRow {
  const row = getTemplate(profile, key);
  if (!row) throw new PackTemplateMissingError(key, family);
  return row;
}
