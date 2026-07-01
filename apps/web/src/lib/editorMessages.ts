export function dispatchEditorWarning(message: string, source = 'Editor'): void {
  window.dispatchEvent(
    new CustomEvent('vvs:editor-message', { detail: { level: 'warning' as const, message, source } })
  );
}
