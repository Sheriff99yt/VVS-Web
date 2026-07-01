import { EditorBootstrap } from '@/types/projectRegistry';

const BOOTSTRAP_KEY = 'vvs:editor-bootstrap';

export function setEditorBootstrap(data: EditorBootstrap): void {
  sessionStorage.setItem(BOOTSTRAP_KEY, JSON.stringify(data));
}

export function consumeEditorBootstrap(): EditorBootstrap | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(BOOTSTRAP_KEY);
  sessionStorage.removeItem(BOOTSTRAP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EditorBootstrap;
  } catch {
    return null;
  }
}

export function peekEditorBootstrap(): EditorBootstrap | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(BOOTSTRAP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EditorBootstrap;
  } catch {
    return null;
  }
}
