/** Public site URL + Pages base path. Flip VVS_CUSTOM_DOMAIN when vvscodes.com is verified. */
export const DEFAULT_PAGES_ORIGIN = 'https://sheriff99yt.github.io/VVS-Web';
export const CUSTOM_DOMAIN_ORIGIN = 'https://vvscodes.com';

export function isCustomDomainBuild(): boolean {
  return process.env.VVS_CUSTOM_DOMAIN === 'true';
}

/** Origin with no trailing slash. Pages project URL until the custom-domain flip. */
export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return isCustomDomainBuild() ? CUSTOM_DOMAIN_ORIGIN : DEFAULT_PAGES_ORIGIN;
}

/** Empty on localhost and on the custom-domain Pages build. `/VVS-Web` on today's github.io project site. */
export function siteBasePath(): string {
  if (isCustomDomainBuild()) return '';
  const fromPublic = process.env.NEXT_PUBLIC_SITE_BASE_PATH;
  if (typeof fromPublic === 'string') return fromPublic.trim().replace(/\/$/, '');
  if (process.env.GITHUB_PAGES === 'true') return '/VVS-Web';
  return '';
}
