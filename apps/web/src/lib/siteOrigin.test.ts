import { describe, expect, it } from 'vitest';
import { CUSTOM_DOMAIN_ORIGIN, DEFAULT_PAGES_ORIGIN, isCustomDomainBuild, siteBasePath, siteOrigin } from './siteOrigin';

describe('siteOrigin', () => {
  it('defaults to the GitHub project Pages URL', () => {
    expect(isCustomDomainBuild()).toBe(false);
    expect(siteOrigin()).toBe(DEFAULT_PAGES_ORIGIN);
    expect(siteOrigin().endsWith('/')).toBe(false);
    expect(CUSTOM_DOMAIN_ORIGIN).toBe('https://vvscodes.com');
  });

  it('uses /VVS-Web only for the project Pages build', () => {
    const pages = process.env.GITHUB_PAGES === 'true';
    expect(siteBasePath()).toBe(pages ? '/VVS-Web' : '');
  });
});
