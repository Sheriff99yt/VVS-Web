/** Move an item with `id` so it sits at the position of `toId` (same array order semantics as function reorder). */
export function reorderById<T extends { id: string }>(
  items: T[],
  fromId: string,
  toId: string
): T[] {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;
  const next = items.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item!);
  return next;
}
