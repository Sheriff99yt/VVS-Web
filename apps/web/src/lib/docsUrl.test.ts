import { describe, expect, it } from 'vitest';
import { docsPath } from './docsUrl';

describe('docsPath', () => {
  it('uses kindId as the node slug', () => {
    expect(docsPath({ type: 'home' })).toBe('/docs');
    expect(docsPath({ type: 'node', id: 'flow_branch' })).toBe('/docs/nodes/flow_branch');
    expect(docsPath({ type: 'node', id: 'action_wait', hash: 'opt-duration' })).toBe(
      '/docs/nodes/action_wait#opt-duration',
    );
    expect(docsPath({ type: 'feature', id: 'generate' })).toBe('/docs/features/generate');
  });

  it('encodes dotted kind ids without inventing a second name', () => {
    expect(docsPath({ type: 'node', id: 'vvs.project.call_function' })).toBe(
      '/docs/nodes/vvs.project.call_function',
    );
  });
});
