/** Synchronous DnD session — avoids React setState races on early dragover. */

type SymbolReorderSession = {
  mimeType: string;
  id: string;
};

let active: SymbolReorderSession | null = null;

export function beginSymbolReorder(mimeType: string, id: string): void {
  active = { mimeType, id };
}

export function endSymbolReorder(): void {
  active = null;
}

export function peekSymbolReorder(mimeType: string): string | null {
  return active?.mimeType === mimeType ? active.id : null;
}

export function isSymbolReorderMime(mimeType: string): boolean {
  return active?.mimeType === mimeType;
}

const TEXT_PLAIN_PREFIX = 'vvs-reorder:';

/** Encode reorder identity in text/plain for browsers that hide custom MIME in `types`. */
export function encodeReorderTextPlain(mimeType: string, id: string): string {
  return `${TEXT_PLAIN_PREFIX}${mimeType}:${id}`;
}

export function parseReorderTextPlain(
  raw: string,
  expectedMime: string
): string | null {
  if (!raw.startsWith(TEXT_PLAIN_PREFIX)) return null;
  const rest = raw.slice(TEXT_PLAIN_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep < 0) return null;
  const mime = rest.slice(0, sep);
  const id = rest.slice(sep + 1);
  if (mime !== expectedMime || !id) return null;
  return id;
}
