/** Serializes writes without poisoning subsequent saves after a failed write. */
export class SaveCoordinator {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(write: () => Promise<T>): Promise<T> {
    const result = this.tail.then(write);
    this.tail = result.catch(() => undefined);
    return result;
  }
}

/** Content identity excludes transient editor navigation and save timestamps. */
export function snapshotRevision(snapshot: import('@vvs/graph-types').ProjectSnapshot): string {
  const { savedAt: _savedAt, activeGraphTab: _tab, openTabs: _tabs, ...content } = snapshot;
  const documents = Object.fromEntries(Object.entries(content.documents).map(([id, doc]) => [id, {
    ...doc,
    nodes: doc.nodes.map(({ selected: _selected, dragging: _dragging, measured: _measured, ...node }) => node),
    edges: doc.edges.map(({ selected: _selected, ...edge }) => edge),
  }]));
  return JSON.stringify({ ...content, documents });
}
