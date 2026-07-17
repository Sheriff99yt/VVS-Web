/** Auto generate off + dirty (or compiling) → Code panel freezes until Generate. */
export function isCodePreviewPaused(
  autoCompile: boolean,
  compileState: 'clean' | 'dirty' | 'compiling' | 'success' | 'error',
  hasDirtyTabs = false
): boolean {
  if (autoCompile) return false;
  return (
    compileState === 'dirty' ||
    compileState === 'compiling' ||
    hasDirtyTabs
  );
}
