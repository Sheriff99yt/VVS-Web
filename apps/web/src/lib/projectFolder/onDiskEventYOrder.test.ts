import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { emitProjectLikeCodePanel } from '@/lib/emitProjectCode';
import {
  loadProjectSnapshotFromPath,
  saveProjectSnapshotToPath,
} from '@/lib/projectFolder/nodeIo';
import { createComplexSnapshot } from '@/lib/usabilityExampleTests/complexUsabilityTest';

function pythonHome(snapshot: NonNullable<ReturnType<typeof loadProjectSnapshotFromPath>>) {
  const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
  return result.files.find((f) => f.path === 'src/Counter.py')?.content ?? '';
}

describe('on-disk Test Projects cycle (U79 event Y order)', () => {
  test('load-from-disk Complex emits on_start and Add', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'vvs-complex-'));
    try {
      saveProjectSnapshotToPath(projectDir, createComplexSnapshot());
      const loaded = loadProjectSnapshotFromPath(projectDir);
      expect(loaded).not.toBeNull();
      const home = loaded!.documents![MAIN_GRAPH_CONTAINER_ID]!;
      expect(home.nodes.find((n) => n.id === 'cx-start-mem')).toBeDefined();
      const code = pythonHome(loaded!);
      expect(code).toContain('def on_start(self):');
      expect(code).toContain('def Add(');
      expect(code).toContain('print("go")');
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
