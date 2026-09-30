import type { VVSNodeData } from './nodes';
import type { ProjectEventDefinition } from './symbols';

export function applyEventDefineBinding(
  data: VVSNodeData,
  event: ProjectEventDefinition
): VVSNodeData {
  const outputs = [{ id: 'exec_out', label: '', type: 'execution' as const }, ...event.parameters.map(p => ({ id: p.id, label: p.label, type: p.type }))];
  return {
    ...data,
    kindId: 'event_define',
    category: 'Events',
    label: event.name.trim() || 'Custom event',
    properties: {
      ...(data.properties ?? {}),
      eventId: event.id,
      eventName: event.name,
      ...(event.role ? { role: event.role } : {}),
    },
    inputs: [],
    outputs,
  };
}

