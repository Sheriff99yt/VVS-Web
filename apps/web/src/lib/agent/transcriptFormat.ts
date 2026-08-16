const SHORT_JSON = 500;
const PREVIEW_CHARS = 420;

function shortJson(value: unknown, max = SHORT_JSON): string {
  try {
    const raw = JSON.stringify(value, null, 2);
    if (!raw) return '';
    return raw.length <= max ? raw : `${raw.slice(0, max)}…`;
  } catch {
    return '';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatGenerateCodeResult(result: unknown): string {
  const rec = asRecord(result);
  if (!rec) return 'Generated code (empty)';
  const language = typeof rec.language === 'string' ? rec.language : 'unknown';
  const files = Array.isArray(rec.files) ? rec.files : [];
  const paths = files
    .map((file) => {
      if (file && typeof file === 'object' && typeof (file as { path?: unknown }).path === 'string') {
        return (file as { path: string }).path;
      }
      return '';
    })
    .filter(Boolean);
  const names = paths.join(', ') || '(no files)';
  const main =
    files.find((file) => file && typeof file === 'object' && typeof (file as { content?: unknown }).content === 'string') as
      | { path?: string; content?: string }
      | undefined;
  const content = (main?.content ?? '').trim();
  const preview = content.length > PREVIEW_CHARS ? `${content.slice(0, PREVIEW_CHARS)}…` : content;
  const lines = [`Generated ${language}: ${names}`];
  if (preview) lines.push(preview);
  return lines.join('\n');
}

function formatAddNodeResult(result: unknown): string {
  const rec = asRecord(result);
  const node = rec ? asRecord(rec.node) : null;
  const data = node ? asRecord(node.data) : null;
  const id = typeof node?.id === 'string' ? node.id : 'node';
  const kind = typeof data?.kindId === 'string' ? data.kindId : 'node';
  const tab = typeof rec?.tabId === 'string' ? rec.tabId : 'graph';
  const human = `Added ${kind} (${id}) on ${tab}`;
  const json = shortJson(result, SHORT_JSON);
  return json ? `${human}\n${json}` : human;
}

/** Human-first tool transcript line; failures are formatted by the caller. */
export function formatAgentToolResult(name: string, result: unknown): string {
  if (name === 'generate_code') return formatGenerateCodeResult(result);
  if (name === 'add_node') return formatAddNodeResult(result);
  if (name === 'remove_node') {
    const json = shortJson(result, SHORT_JSON);
    return json ? `Removed node\n${json}` : 'Removed node';
  }
  if (name === 'connect_pins') {
    const json = shortJson(result, SHORT_JSON);
    return json ? `Connected pins\n${json}` : 'Connected pins';
  }
  if (name === 'add_class') {
    const json = shortJson(result, SHORT_JSON);
    return json ? `Added class\n${json}` : 'Added class';
  }
  const json = shortJson(result, SHORT_JSON);
  return json ? `${name}\n${json}` : name;
}

