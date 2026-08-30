import { describe, expect, it } from 'vitest';
import { getNodeDoc } from './nodeDocCatalog';
import { nodeDocsHref, nodeDocsOpenHref, nodeDocsHoverText, optionDocsHoverText } from './docsHover';
import { siteBasePath } from './siteOrigin';

describe('docsHover', () => {
  it('uses registry fields for Print String', () => {
    const node = getNodeDoc('action_print');
    expect(node).toBeTruthy();
    const text = nodeDocsHoverText(node!);
    expect(text).toContain('Print String');
    expect(text).toContain('action_print');
    expect(text).toContain('in in_str');
    expect(text).not.toContain('invent');
    expect(nodeDocsHref('action_print')).toContain('/docs/nodes/action_print');
  });

  it('uses registry option fields without inventing a type', () => {
    const wait = getNodeDoc('action_wait');
    expect(wait).toBeTruthy();
    const seconds = wait!.options.find((o) => o.key === 'seconds' || o.key === 'duration' || o.key);
    expect(seconds).toBeTruthy();
    const text = optionDocsHoverText(wait!, seconds!.key);
    expect(text).toContain(seconds!.key);
    expect(text).toContain(seconds!.type);
    expect(nodeDocsHref('action_wait', seconds!.key)).toContain(`#opt-${seconds!.key}`);
  });
  it('prefixes site base path for window.open, not for Next Link', () => {
    expect(nodeDocsHref('action_print', 'visibility')).toBe('/docs/nodes/action_print#opt-visibility');
    expect(nodeDocsOpenHref('action_print', 'visibility')).toBe(
      `${siteBasePath()}/docs/nodes/action_print#opt-visibility`,
    );
  });
});
