import { describe, expect, test } from 'bun:test';
import {
  GRAPH_CAMERA,
  GRAPH_ZOOM,
  fitAllGraphNodes,
  focusGraphNodes,
  graphCameraEaseOut,
  openGraphCamera,
} from './graphCamera';

describe('graphCameraEaseOut', () => {
  test('starts at 0 and ends at 1', () => {
    expect(graphCameraEaseOut(0)).toBe(0);
    expect(graphCameraEaseOut(1)).toBe(1);
  });

  test('decelerates (midpoint above linear)', () => {
    expect(graphCameraEaseOut(0.5)).toBeGreaterThan(0.5);
  });
});

describe('focusGraphNodes / fitAllGraphNodes / openGraphCamera', () => {
  test('focusGraphNodes no-ops on empty selection', () => {
    let called = 0;
    focusGraphNodes(() => {
      called += 1;
    }, []);
    expect(called).toBe(0);
  });

  test('focusGraphNodes passes smooth clamped options', () => {
    let opts: Record<string, unknown> | undefined;
    focusGraphNodes((o) => {
      opts = o as Record<string, unknown>;
    }, ['n1', 'n2']);
    expect(opts?.nodes).toEqual([{ id: 'n1' }, { id: 'n2' }]);
    expect(opts?.duration).toBe(GRAPH_CAMERA.focusDurationMs);
    expect(opts?.maxZoom).toBe(GRAPH_CAMERA.focusMaxZoom);
    expect(opts?.interpolate).toBe('smooth');
    expect(typeof opts?.ease).toBe('function');
  });

  test('fitAllGraphNodes clamps zoom for empty-selection F', () => {
    let opts: Record<string, unknown> | undefined;
    fitAllGraphNodes((o) => {
      opts = o as Record<string, unknown>;
    });
    expect(opts?.nodes).toBeUndefined();
    expect(opts?.maxZoom).toBe(GRAPH_CAMERA.fitAllMaxZoom);
    expect(opts?.minZoom).toBe(GRAPH_CAMERA.fitAllMinZoom);
    expect(opts?.duration).toBe(GRAPH_CAMERA.fitAllDurationMs);
    expect(opts?.interpolate).toBe('smooth');
  });

  test('openGraphCamera settles instantly (no open snap animation)', () => {
    let opts: Record<string, unknown> | undefined;
    openGraphCamera((o) => {
      opts = o as Record<string, unknown>;
    });
    expect(opts?.duration).toBe(0);
    expect(opts?.maxZoom).toBe(GRAPH_CAMERA.openMaxZoom);
  });

  test('GRAPH_ZOOM.min allows deep mouse zoom-out', () => {
    expect(GRAPH_CAMERA.fitAllMinZoom).toBe(GRAPH_ZOOM.min);
    expect(GRAPH_ZOOM.min).toBeLessThan(0.5);
  });
});
