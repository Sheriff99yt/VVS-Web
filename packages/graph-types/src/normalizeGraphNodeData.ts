import type { GraphNode, VVSNodeData } from './nodes';

/** Label/category inference — mirrors @vvs/syntax-registry without a circular dependency. */
export function inferKindIdFromLabel(label: string, category: string): string | undefined {
  if (label === 'On Start') return 'event_on_start';
  if (label === 'On Update') return 'event_on_update';
  if (label.startsWith('On ')) return 'event_define';
  if (label.startsWith('Dispatch ')) return 'event_dispatch';
  if (label.startsWith('Emit ')) return 'event_emit';
  if (label.startsWith('Subscribe ')) return 'event_subscribe';
  if (label === 'Branch') return 'flow_branch';
  if (label === 'For Loop') return 'flow_for';
  if (label === 'While Loop') return 'flow_while';
  if (label === 'Switch') return 'flow_switch';
  if (label === 'Sequence') return 'flow_sequence';
  if (label === 'Print String') return 'action_print';
  if (label === 'Get User Input') return 'action_get_input';
  if (label === 'Wait') return 'action_wait';
  if (label === 'Await Wait') return 'action_await_wait';
  if (label === 'To String') return 'convert_to_string';
  if (label === 'To Number') return 'convert_to_number';
  if (label === 'Math Add') return 'math_add';
  if (label === 'Math Subtract') return 'math_subtract';
  if (label === 'Math Multiply') return 'math_multiply';
  if (label === 'Math Divide') return 'math_divide';
  if (label.startsWith('Declare Class') || label.startsWith('Class ')) return 'class_define';
  if (label.startsWith('Declare Variable')) return 'var_define';
  if (label.startsWith('Declare Function')) return 'function_define';
  if (label.startsWith('Define Function')) return 'function_implement';
  if (label.startsWith('Declare Event')) return 'event_member_define';
  if (label.startsWith('Declare ') && category === 'Events') return 'event_member_define';
  if (label.startsWith('Declare ') && category === 'Variables') return 'var_define';
  if (label.startsWith('Declare ')) return 'function_define';
  if (label.startsWith('Define Class')) return 'class_define';
  if (label.startsWith('Define Variable')) return 'var_define';
  if (label.startsWith('Define Event')) return 'event_member_define';
  if (label.startsWith('Define ') && category === 'Events') return 'event_member_define';
  if (label.startsWith('Define ') && category === 'Variables') return 'var_define';
  if (label.startsWith('Define ') && category === 'Project') return 'function_implement';
  if (label.startsWith('Get ')) return 'variable_get';
  if (label.startsWith('Set ')) return 'variable_set';
  if (label.startsWith('Call ')) return 'vvs.project.call_function';
  if (label.startsWith('Import Class ')) return 'import_class';
  if (label.startsWith('Import ')) return 'vvs.project.import_module';
  if (label.startsWith('Use ')) return 'vvs.project.call_function';
  if (category === 'Events' && label !== 'On Start' && label !== 'On Update') return 'event_define';
  return undefined;
}

export function resolveGraphNodeKindId(data: VVSNodeData): string {
  if (data.kindId) {
    if (data.kindId.startsWith('call_function_')) return 'vvs.project.call_function';
    if (data.kindId.startsWith('import_module_')) return 'vvs.project.import_module';
    if (data.kindId.startsWith('use_macro_')) return 'vvs.project.call_function';
    return data.kindId;
  }
  const binding = data.graphBinding?.kind ?? data.linkKind;
  if (binding === 'call_function' || binding === 'call_class_function') {
    return 'vvs.project.call_function';
  }
  if (binding === 'dispatch_event') return 'event_dispatch';
  if (binding === 'import_module') return 'vvs.project.import_module';
  if (binding === 'import_class') return 'import_class';
  if (binding === 'use_macro') return 'vvs.project.call_function';
  if (binding === 'env_native') return 'env.call_native';
  if (binding === 'env_event') return 'env.event_handler';
  return inferKindIdFromLabel(data.label, data.category) ?? data.label;
}

function backfillProperties(kindId: string, data: VVSNodeData): Record<string, unknown> {
  const properties = { ...(data.properties ?? {}) };

  if ((kindId === 'variable_get' || kindId === 'variable_set') && !properties.variableName) {
    if (data.label.startsWith('Get ')) properties.variableName = data.label.slice(4).trim();
    if (data.label.startsWith('Set ')) properties.variableName = data.label.slice(4).trim();
  }

  if ((kindId === 'event_define' || kindId === 'event_custom') && !properties.eventName) {
    const match = data.label.match(/^On\s+(.+)$/i);
    if (match?.[1]) properties.eventName = match[1];
  }

  if (kindId === 'event_dispatch' && !properties.eventName) {
    const match = data.label.match(/^Dispatch\s+(.+)$/i);
    if (match?.[1]) properties.eventName = match[1];
  }

  if (kindId === 'import_class' && !properties.targetClassId) {
    const fromBinding = data.graphBinding?.targetClassId;
    if (typeof fromBinding === 'string') properties.targetClassId = fromBinding;
  }

  return properties;
}

/** KindId-first normalization for saved graph nodes (no React / registry UI deps). */
export function normalizeGraphNodeData(data: VVSNodeData): VVSNodeData {
  const seeded: VVSNodeData =
    !data.kindId && data.graphBinding?.kind
      ? {
          ...data,
          kindId:
            data.graphBinding.kind === 'call_function' || data.graphBinding.kind === 'call_class_function'
              ? 'vvs.project.call_function'
              : data.graphBinding.kind === 'import_module'
                ? 'vvs.project.import_module'
                : data.graphBinding.kind === 'import_class'
                  ? 'import_class'
                  : data.graphBinding.kind === 'env_native'
                    ? 'env.call_native'
                    : data.graphBinding.kind === 'env_event'
                      ? 'env.event_handler'
                      : data.graphBinding.kind === 'dispatch_event'
                        ? 'event_dispatch'
                        : data.graphBinding.kind === 'use_macro'
                          ? 'vvs.project.call_function'
                          : data.kindId,
          linkKind: data.linkKind ?? data.graphBinding.kind,
        }
      : data;

  const kindId = resolveGraphNodeKindId(seeded);
  const properties = backfillProperties(kindId, seeded);

  return {
    ...seeded,
    kindId,
    properties,
    linkKind: seeded.linkKind ?? seeded.graphBinding?.kind,
  };
}

export function normalizeGraphNode(node: GraphNode): GraphNode {
  if (node.type !== 'vvs_standard_node') return node;
  return { ...node, data: normalizeGraphNodeData(node.data) };
}

export function normalizeGraphDocumentNodes(
  nodes: GraphNode[]
): GraphNode[] {
  return nodes.map(normalizeGraphNode);
}
