'use client';

import { useAgentHost } from '@/hooks/useAgentHost';

/** Starts the in-page agent worker when the editor mounts. */
export function AgentHost() {
  useAgentHost();
  return null;
}
