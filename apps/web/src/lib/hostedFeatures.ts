import { getApiMode } from '@/lib/api';

/**
 * Hosted Auth / cloud API / remote MCP probe — kept in codebase but inactive
 * unless HTTP API mode (or explicit override) is on. Client-first default.
 *
 * Enable: NEXT_PUBLIC_API_MODE=http
 * Or:     NEXT_PUBLIC_HOSTED_FEATURES=true
 */
export function isHostedFeaturesEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_HOSTED_FEATURES === 'true') return true;
  return getApiMode() === 'http';
}
