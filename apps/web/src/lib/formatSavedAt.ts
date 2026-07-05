/** Compact relative or absolute label for status chrome. */
export function formatSavedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const saved = new Date(iso);
  if (Number.isNaN(saved.getTime())) return null;

  const diffMs = Date.now() - saved.getTime();
  if (diffMs < 60_000) return 'Saved just now';
  if (diffMs < 3_600_000) {
    const mins = Math.floor(diffMs / 60_000);
    return `Saved ${mins}m ago`;
  }
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000);
    return `Saved ${hours}h ago`;
  }

  return `Saved ${saved.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
