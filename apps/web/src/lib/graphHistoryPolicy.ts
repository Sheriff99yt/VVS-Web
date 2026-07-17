/** Helpers for workspace undo capture / apply decisions (unit-tested). */

export function shouldCaptureProjectOnOpposite(
  entryHasProject: boolean,
  entryTab: string,
  currentTab: string
): boolean {
  if (entryHasProject) return true;
  // Lean canvas entry on another tab — fat-capture so redo restores the right graph.
  return Boolean(entryTab && currentTab && entryTab !== currentTab);
}

export function shouldCaptureProjectOnJump(
  targetHasProject: boolean,
  discardedHaveProject: boolean
): boolean {
  return targetHasProject || discardedHaveProject;
}
