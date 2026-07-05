export function inputTempVarName(nodeId: string): string {
  return `_vvs_input_${nodeId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

export function getInputKind(
  properties?: Record<string, unknown>
): 'text' | 'number' | 'password' {
  const kind = properties?.inputKind;
  if (kind === 'number' || kind === 'password') return kind;
  return 'text';
}
