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

  test('function bodies inline in home file — no separate function files (U80)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
    expect(result.files.some((f) => f.path.includes('Boot'))).toBe(false);
    expect(result.files.some((f) => f.path === 'src/CoverageLab.py')).toBe(true);
    const home = result.files.find((f) => f.path === 'src/CoverageLab.py')!.content;
    expect(home).toContain('def Boot(');
  });

  test('U79 Code panel: Coverage Lab default has on_pulse before on_start', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' }).files.find(
      (f) => f.path === 'src/CoverageLab.py'
    )!.content;
    expect(home.indexOf('def on_pulse(self):')).toBeLessThan(home.indexOf('def on_start(self):'));
  });
});
