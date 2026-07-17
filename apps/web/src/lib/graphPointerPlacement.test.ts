import { describe, expect, test } from 'bun:test';
import {
  offsetNodesToTarget,
  reportGraphPointer,
  resolvePlacementFlowPosition,
} from './graphPointerPlacement';

describe('graphPointerPlacement', () => {
  test('offsetNodesToTarget centers the group on the target', () => {
    const nodes = [
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 100, y: 0 } },
    ];
    const placed = offsetNodesToTarget(nodes, { x: 200, y: 100 });
    expect(placed[0]!.position).toEqual({ x: 150, y: 100 });
    expect(placed[1]!.position).toEqual({ x: 250, y: 100 });
  });

  test('resolvePlacementFlowPosition prefers cursor over graph', () => {
    reportGraphPointer({ x: 10, y: 20 }, true);
    expect(resolvePlacementFlowPosition({ x: 0, y: 0 })).toEqual({ x: 10, y: 20 });
    reportGraphPointer(null, false);
    expect(resolvePlacementFlowPosition({ x: 5, y: 6 })).toEqual({ x: 5, y: 6 });
  });
});
