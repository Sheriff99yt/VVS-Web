import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '@/lib/emitProjectCode';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '@/lib/usabilityExampleTests/coverageLabUsabilityTest';

describe('emitProjectLikeCodePanel (U56)', () => {
  test('Coverage Lab: one home file owned by main graph', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    expect(MACHINE_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(SENSOR_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);

    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    const owners = fileOwnersForEmitResult(snapshot, result);

    expect(result.files.some((f) => f.path === 'src/CoverageLab.py')).toBe(true);
    expect(owners['src/CoverageLab.py']).toBe(MAIN_GRAPH_CONTAINER_ID);
    const home = result.files.find((f) => f.path === 'src/CoverageLab.py')!.content;
    expect(home).toContain('class Machine:');
    expect(home).toContain('class Sensor(Machine)');
  });

  test('function tabs remain separate files', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    expect(result.files.some((f) => f.path.includes('Boot'))).toBe(true);
  });
});
