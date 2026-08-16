export interface AgentLlmSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const DEFAULT_AGENT_LLM_SETTINGS: AgentLlmSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
};

const STORAGE_KEY = 'vvs:agent-llm';

export function readAgentLlmSettings(): AgentLlmSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_AGENT_LLM_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AGENT_LLM_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AgentLlmSettings>;
    return {
      baseUrl:
        typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
          ? parsed.baseUrl.trim()
          : DEFAULT_AGENT_LLM_SETTINGS.baseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model:
        typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_AGENT_LLM_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_AGENT_LLM_SETTINGS };
  }
}

export function writeAgentLlmSettings(patch: Partial<AgentLlmSettings>): AgentLlmSettings {
  const next = { ...readAgentLlmSettings(), ...patch };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  return `${trimmed}/chat/completions`;
}
