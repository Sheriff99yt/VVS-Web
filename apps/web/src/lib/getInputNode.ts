import type { VVSNodeData } from '@/types/graph';
import { resolveNodeKindId } from '@/lib/nodeKind';
import type { PinType } from '@/types/graph';

/** Sync Value output pin type when inputKind changes on Get User Input nodes. */
export function syncGetInputNodePorts(data: VVSNodeData): VVSNodeData {
  if (resolveNodeKindId(data) !== 'action_get_input') return data;

  const inputKind =
    typeof data.properties?.inputKind === 'string' ? data.properties.inputKind : 'text';
  const valueType: PinType = inputKind === 'number' ? 'data_number' : 'data_string';

  const outputs = (data.outputs ?? []).map((pin) =>
    pin.id === 'value' ? { ...pin, type: valueType } : pin
  );

  return { ...data, outputs };
}

export function getInputKindLabel(data: VVSNodeData): string | undefined {
  if (resolveNodeKindId(data) !== 'action_get_input') return undefined;
  const kind = data.properties?.inputKind;
  if (kind === 'number') return 'Number';
  if (kind === 'password') return 'Password';
  if (kind === 'text') return 'Text';
  return undefined;
}
