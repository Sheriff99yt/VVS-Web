import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  emitProjectLikeCodePanelOffThread,
  fileOwnersForEmitResult,
} from '@/lib/emitProjectCode';
import {
  createAdvancedSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '@/lib/usabilityExampleTests/advancedUsabilityTest';

describe('emitProjectLikeCodePanel (U56)', () => {
  test('Advanced: one home file owned by main graph', () => {
    const snapshot = createAdvancedSnapshot();
    expect(MACHINE_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(SENSOR_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);

    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    const owners = fileOwnersForEmitResult(snapshot, result);

    expect(result.files.some((f) => f.path === 'src/Advanced.py')).toBe(true);
    expect(owners['src/Advanced.py']).toBe(MAIN_GRAPH_CONTAINER_ID);
    const home = result.files.find((f) => f.path === 'src/Advanced.py')!.content;
    expect(home).toContain('class Machine:');
    expect(home).toContain('class Sensor(Machine)');
  });

  test('function bodies inline in home file — no separate function files (U80)', () => {
    const snapshot = createAdvancedSnapshot();
    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    expect(result.files.some((f) => f.path.includes('Diagnose'))).toBe(false);
    expect(result.files.some((f) => f.path === 'src/Advanced.py')).toBe(true);
    const home = result.files.find((f) => f.path === 'src/Advanced.py')!.content;
    expect(home).toContain('def Diagnose(');
  });

  test('off-thread fallback matches sync emit', async () => {
    const snapshot = createAdvancedSnapshot();
    const sync = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    const off = await emitProjectLikeCodePanelOffThread(snapshot, {
      targetLanguage: 'python',
      forceMainThread: true,
    });
    expect(off.language).toBe(sync.language);
    expect(off.files.map((f) => f.path)).toEqual(sync.files.map((f) => f.path));
    expect(off.files.map((f) => f.content)).toEqual(sync.files.map((f) => f.content));
  });
});
