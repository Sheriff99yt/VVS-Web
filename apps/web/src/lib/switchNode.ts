import type { PinDefinition, VVSNodeData } from '@vvs/graph-types';

export type SwitchCaseNodeData = Pick<
  VVSNodeData,
  'outputs' | 'inputs' | 'properties' | 'inlineValues'
>;

const CASE_PROP = /^case(\d+)$/;
const CASE_OUT = /^case_(\d+)$/;

function caseIndexFromOutputId(id: string): number | undefined {
  const m = CASE_OUT.exec(id);
  return m ? Number(m[1]) : undefined;
}

function caseIndexFromPropKey(key: string): number | undefined {
  const m = CASE_PROP.exec(key);
  return m ? Number(m[1]) : undefined;
}

/** Indices emit already walks: output pins case_N, unioned with properties.caseN. */
export function switchCaseIndices(data: SwitchCaseNodeData): number[] {
  const ids = new Set<number>();
  for (const pin of data.outputs ?? []) {
    const idx = caseIndexFromOutputId(pin.id);
    if (idx !== undefined) ids.add(idx);
  }
  for (const key of Object.keys(data.properties ?? {})) {
    const idx = caseIndexFromPropKey(key);
    if (idx !== undefined) ids.add(idx);
  }
  return [...ids].sort((a, b) => a - b);
}

export function switchCaseLabel(data: SwitchCaseNodeData, index: number): string {
  const key = `case${index}`;
  const prop = data.properties?.[key];
  if (typeof prop === 'string' && prop.trim()) return prop;
  if (typeof prop === 'number') return String(prop);
  const inline = data.inlineValues?.[key];
  if (typeof inline === 'string' && inline.trim()) return inline;
  if (typeof inline === 'number') return String(inline);
  const out = (data.outputs ?? []).find((pin) => pin.id === `case_${index}`);
  if (out?.label?.trim() && out.label !== `Case ${index}`) return out.label;
  return String(index);
}

function insertCaseOutput(outputs: PinDefinition[], index: number, label: string): PinDefinition[] {
  if (outputs.some((pin) => pin.id === `case_${index}`)) {
    return outputs.map((pin) => (pin.id === `case_${index}` ? { ...pin, label } : pin));
  }
  const next = [...outputs];
  const defaultIdx = next.findIndex((pin) => pin.id === 'default_exec');
  const insertIdx = defaultIdx !== -1 ? defaultIdx : next.length;
  next.splice(insertIdx, 0, { id: `case_${index}`, label, type: 'execution' });
  return next;
}

function ensureCaseInput(inputs: PinDefinition[], index: number): PinDefinition[] {
  if (inputs.some((pin) => pin.id === `case${index}`)) return inputs;
  return [...inputs, { id: `case${index}`, label: `Case ${index} value`, type: 'data_any' }];
}

/** Next unused case index ? never re-adds case_0 when schema pins already exist. */
export function addSwitchCase(
  data: SwitchCaseNodeData,
  memberDefault?: string
): Partial<VVSNodeData> {
  const indices = switchCaseIndices(data);
  const newIdx = indices.length > 0 ? Math.max(...indices) + 1 : 0;
  const label = (memberDefault ?? '').trim() || String(newIdx);
  return {
    properties: { ...(data.properties ?? {}), [`case${newIdx}`]: label },
    inlineValues: { ...(data.inlineValues ?? {}), [`case${newIdx}`]: label },
    outputs: insertCaseOutput([...(data.outputs ?? [])], newIdx, label),
    inputs: ensureCaseInput([...(data.inputs ?? [])], newIdx),
  };
}

export function setSwitchCaseLabel(
  data: SwitchCaseNodeData,
  index: number,
  value: string
): Partial<VVSNodeData> {
  const label = value;
  return {
    properties: { ...(data.properties ?? {}), [`case${index}`]: label },
    inlineValues: { ...(data.inlineValues ?? {}), [`case${index}`]: label },
    outputs: (data.outputs ?? []).map((pin) =>
      pin.id === `case_${index}` ? { ...pin, label: label || pin.label } : pin
    ),
  };
}

export function removeSwitchCase(data: SwitchCaseNodeData, indexToRemove: number): Partial<VVSNodeData> {
  const remaining = switchCaseIndices(data).filter((idx) => idx !== indexToRemove);
  const labels = remaining.map((idx) => switchCaseLabel(data, idx));

  const properties: Record<string, unknown> = { ...(data.properties ?? {}) };
  const inlineValues: Record<string, string | number | boolean> = { ...(data.inlineValues ?? {}) };
  for (const key of Object.keys(properties)) {
    if (CASE_PROP.test(key)) delete properties[key];
  }
  for (const key of Object.keys(inlineValues)) {
    if (CASE_PROP.test(key)) delete inlineValues[key];
  }

  let outputs = (data.outputs ?? []).filter((pin) => caseIndexFromOutputId(pin.id) === undefined);
  const inputs = (data.inputs ?? []).filter((pin) => caseIndexFromPropKey(pin.id) === undefined);

  const defaultIdx = outputs.findIndex((pin) => pin.id === 'default_exec');
  const insertAt = defaultIdx !== -1 ? defaultIdx : outputs.length;
  const caseOutputs: PinDefinition[] = labels.map((label, newIdx) => ({
    id: `case_${newIdx}`,
    label,
    type: 'execution',
  }));
  outputs = [...outputs.slice(0, insertAt), ...caseOutputs, ...outputs.slice(insertAt)];

  const caseInputs: PinDefinition[] = labels.map((_, newIdx) => ({
    id: `case${newIdx}`,
    label: `Case ${newIdx} value`,
    type: 'data_any',
  }));

  labels.forEach((label, newIdx) => {
    properties[`case${newIdx}`] = label;
    inlineValues[`case${newIdx}`] = label;
  });

  return { properties, inlineValues, outputs, inputs: [...inputs, ...caseInputs] };
}
