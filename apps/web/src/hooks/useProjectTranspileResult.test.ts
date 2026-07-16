import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { emitProjectLikeCodePanel } from '@/lib/emitProjectCode';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '@/lib/usabilityExampleTests/coverageLabUsabilityTest';

describe('multi-class shared home graph emit', () => {
  test('Coverage Lab: one home file contains Machine and Sensor', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    expect(MACHINE_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(SENSOR_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);

    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/CoverageLab.py');
    expect(paths.filter((p) => p.endsWith('machine.py') || p.endsWith('sensor.py'))).toEqual([]);
    const home = result.files.find((f) => f.path === 'src/CoverageLab.py')!.content;
    expect(home).toContain('class Machine:');
    expect(home).toContain('class Sensor(Machine)');
  });
});
