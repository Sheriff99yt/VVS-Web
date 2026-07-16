import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MAIN_GRAPH_CONTAINER_ID, VVS_DIR } from '@vvs/graph-types';
import { emitProjectLikeCodePanel } from '@/lib/emitProjectCode';
import {
  loadProjectSnapshotFromPath,
  saveProjectSnapshotToPath,
} from '@/lib/projectFolder/nodeIo';
import { createCoverageLabUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/coverageLabUsabilityTest';

const HOME_GRAPH_REL = 'graphs/containers/main-graph.graph.json';

function pythonHome(snapshot: NonNullable<ReturnType<typeof loadProjectSnapshotFromPath>>) {
  const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
  return result.files.find((f) => f.path === 'src/CoverageLab.py')?.content ?? '';
}

function swapEventDeclareYOnDisk(projectDir: string) {
  const graphPath = join(projectDir, VVS_DIR, HOME_GRAPH_REL);
  const doc = JSON.parse(readFileSync(graphPath, 'utf8')) as {
    nodes: Array<{ id: string; position: { x: number; y: number } }>;
  };
  for (const n of doc.nodes) {
    if (n.id === 'lab-evt-pulse-mem') n.position.y = -120;
    if (n.id === 'lab-evt-start-mem') n.position.y = -280;
  }
  writeFileSync(graphPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
}

describe('on-disk Test Projects cycle (U79 event Y order)', () => {
  test('load-from-disk Order A then Order B flips on_pulse / on_start in Code panel emit', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'vvs-coverage-lab-'));
    try {
      // 1. Seed Coverage Lab to disk (same as validate_test_projects_folder)
      saveProjectSnapshotToPath(projectDir, createCoverageLabUsabilityTestSnapshot());

      // 2. Order A — load from disk (do not use in-memory fixture for emit)
      const orderASnap = loadProjectSnapshotFromPath(projectDir);
      expect(orderASnap).not.toBeNull();
      const homeA = orderASnap!.documents![MAIN_GRAPH_CONTAINER_ID]!;
      const pulseNodeA = homeA.nodes.find((n) => n.id === 'lab-evt-pulse-mem')!;
      const startNodeA = homeA.nodes.find((n) => n.id === 'lab-evt-start-mem')!;
      expect(pulseNodeA.position.y).toBeLessThan(startNodeA.position.y);

      const codeA = pythonHome(orderASnap!);
      const pulseA = codeA.indexOf('def on_pulse(self):');
      const startA = codeA.indexOf('def on_start(self):');
      expect(pulseA).toBeGreaterThan(-1);
      expect(startA).toBeGreaterThan(-1);
      expect(pulseA).toBeLessThan(startA);

      // 3. Mutate graph.json on disk (simulates saving after drag swap)
      swapEventDeclareYOnDisk(projectDir);

      // 4. Order B — reload from disk and emit again
      const orderBSnap = loadProjectSnapshotFromPath(projectDir);
      expect(orderBSnap).not.toBeNull();
      const homeB = orderBSnap!.documents![MAIN_GRAPH_CONTAINER_ID]!;
      const pulseNodeB = homeB.nodes.find((n) => n.id === 'lab-evt-pulse-mem')!;
      const startNodeB = homeB.nodes.find((n) => n.id === 'lab-evt-start-mem')!;
      expect(startNodeB.position.y).toBeLessThan(pulseNodeB.position.y);

      const codeB = pythonHome(orderBSnap!);
      const pulseB = codeB.indexOf('def on_pulse(self):');
      const startB = codeB.indexOf('def on_start(self):');
      expect(startB).toBeGreaterThan(-1);
      expect(pulseB).toBeGreaterThan(-1);
      expect(startB).toBeLessThan(pulseB);

      expect(codeA).not.toEqual(codeB);
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
