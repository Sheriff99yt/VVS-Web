import { expect, test, describe } from 'bun:test';
import { registerPack, getRegisteredPacks } from './registry';
import { getSyntaxPack, resolvePack } from './resolve';
import type { SyntaxPackManifest } from './schema';

describe('syntax packs resolution & registry system', () => {
  test('resolves registered custom packs correctly', () => {
    const customPack: SyntaxPackManifest = {
      id: 'custom.base',
      version: '2.0.0-rc1',
      family: 'python',
      templates: {
        Print: { quasi: 'custom_print({value})' }
      },
      layout: {
        indentUnit: '  ',
        blockPlaceholder: 'TODO',
        commentPrefix: '#',
        instanceReceiver: 'self'
      }
    };

    // Before registration, getSyntaxPack should return undefined
    expect(getSyntaxPack('custom.base@2.0.0-rc1')).toBeUndefined();

    // Register custom pack
    registerPack(customPack);

    // Verify it is registered
    const all = getRegisteredPacks();
    expect(all.some(p => p.id === 'custom.base' && p.version === '2.0.0-rc1')).toBe(true);

    // After registration, getSyntaxPack should find it
    const resolved = getSyntaxPack('custom.base@2.0.0-rc1');
    expect(resolved).toBeDefined();
    expect(resolved?.id).toBe('custom.base');
    expect(resolved?.version).toBe('2.0.0-rc1');

    // Test resolving via resolvePack
    const resolvedProfile = resolvePack('python', [], {
      base: 'custom.base@2.0.0-rc1',
      overlays: []
    });

    expect(resolvedProfile.templates['Print']).toBeDefined();
    expect(resolvedProfile.templates['Print'].quasi).toBe('custom_print({value})');
  });
});
