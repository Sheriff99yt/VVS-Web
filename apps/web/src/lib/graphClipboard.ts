import { VVSNode, VVSEdge } from '@/types/graph';

const CLIPBOARD_VERSION = 1;

export interface GraphClipboardPayload {
  version: typeof CLIPBOARD_VERSION;
  nodes: VVSNode[];
  edges: VVSEdge[];
}

export function serializeGraphClipboard(nodes: VVSNode[], edges: VVSEdge[]): string {
  const payload: GraphClipboardPayload = { version: CLIPBOARD_VERSION, nodes, edges };
  return JSON.stringify(payload);
}

export function parseGraphClipboard(text: string): GraphClipboardPayload | null {
  try {
    const parsed = JSON.parse(text) as Partial<GraphClipboardPayload>;
    if (parsed.version !== CLIPBOARD_VERSION) return null;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return { version: CLIPBOARD_VERSION, nodes: parsed.nodes, edges: parsed.edges };
  } catch {
    return null;
  }
}

export async function writeSystemGraphClipboard(nodes: VVSNode[], edges: VVSEdge[]): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
  try {
    await navigator.clipboard.writeText(serializeGraphClipboard(nodes, edges));
  } catch {
    // Clipboard permission denied — in-app clipboard still works
  }
}

export async function readSystemGraphClipboard(): Promise<GraphClipboardPayload | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return null;
  try {
    const text = await navigator.clipboard.readText();
    return text ? parseGraphClipboard(text) : null;
  } catch {
    return null;
  }
}
