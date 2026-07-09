import { describe, expect, test } from 'bun:test';
import { resolveGraphCodegenSettings, codegenMetadataSeed } from './graphCodegen';

describe('graphCodegen', () => {
  test('inherits project defaults when graph metadata is empty', () => {
    const settings = resolveGraphCodegenSettings(undefined, {
      targetLanguage: 'python',
      targetFileExtensions: { cpp: 'hpp' },
    });
    expect(settings.targetLanguage).toBe('python');
    expect(settings.targetFileExtension).toBe('py');
  });

  test('graph metadata overrides project language and extension', () => {
    const settings = resolveGraphCodegenSettings(
      { moduleName: 'M', extendsType: '', description: '', targetLanguage: 'cpp', targetFileExtension: 'h' },
      { targetLanguage: 'python', targetFileExtensions: { cpp: 'hpp' } }
    );
    expect(settings.targetLanguage).toBe('cpp');
    expect(settings.targetFileExtension).toBe('h');
  });

  test('codegenMetadataSeed does not freeze project defaults on new graphs', () => {
    expect(
      codegenMetadataSeed({ targetLanguage: 'rust', targetFileExtensions: { rust: 'rs' } })
    ).toEqual({});
  });
});
