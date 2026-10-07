import { expect, test } from 'bun:test';
import { SaveCoordinator, snapshotRevision } from './saveCoordinator';
import { createEmptyProjectSnapshot } from '@vvs/graph-types';

test('delayed saves are ordered and a failed save does not poison the queue', async () => {
  const queue = new SaveCoordinator();
  const calls: number[] = [];
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const first = queue.run(async () => { calls.push(1); await delayed; throw new Error('permission lost'); });
  const handled = first.catch(() => undefined);
  const second = queue.run(async () => { calls.push(2); return 'new revision'; });
  await Promise.resolve();
  expect(calls).toEqual([1]);
  release(); await handled;
  expect(await second).toBe('new revision');
  expect(calls).toEqual([1, 2]);
});

test('navigation and timestamps do not change content identity; edits do', () => {
  const snapshot = createEmptyProjectSnapshot();
  const before = snapshotRevision(snapshot);
  snapshot.savedAt = 'later'; snapshot.activeGraphTab = 'another';
  expect(snapshotRevision(snapshot)).toBe(before);
  snapshot.projectDetails.moduleName = 'changed';
  expect(snapshotRevision(snapshot)).not.toBe(before);
});
