import { describe, expect, it } from 'vitest';
import { VVS_CONTRIBUTING_URL, VVS_GITHUB_REPO_URL } from './contribute';

describe('contribute urls', () => {
  it('points at the public VVS-Web repo and CONTRIBUTING.md', () => {
    expect(VVS_GITHUB_REPO_URL).toBe('https://github.com/Sheriff99yt/VVS-Web');
    expect(VVS_CONTRIBUTING_URL).toBe(
      'https://github.com/Sheriff99yt/VVS-Web/blob/main/CONTRIBUTING.md',
    );
  });
});
