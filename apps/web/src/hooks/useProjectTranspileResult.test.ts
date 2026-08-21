import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { emitProjectLikeCodePanel } from '@/lib/emitProjectCode';
import {
  createAdvancedSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '@/lib/usabilityExampleTests/advancedUsabilityTest';

describe('multi-class shared home graph emit', () => {
  test('Advanced: one home file contains Machine and Sensor', () => {
    const snapshot = createAdvancedSnapshot();
    expect(MACHINE_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(SENSOR_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);

    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/Advanced.py');
    expect(paths.filter((p) => p.endsWith('machine.py') || p.endsWith('sensor.py'))).toEqual([]);
    const home = result.files.find((f) => f.path === 'src/Advanced.py')!.content;
    expect(home).toContain('class Machine:');
    expect(home).toContain('class Sensor(Machine)');
  });
});
