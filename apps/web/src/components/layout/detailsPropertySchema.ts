/** Details PropertySchema keys that are linking IDs or replaced by a dedicated panel. */
export function hiddenDetailsPropertyKeys(kindId: string | null | undefined): Set<string> {
  const hidden = new Set<string>();
  if (kindId === 'graph_ref') {
    hidden.add('classId');
    hidden.add('containerId');
    hidden.add('graphTabId');
    hidden.add('refLabel');
  }
  if (kindId === 'import_class') {
    hidden.add('targetClassId');
  }
  // Linking IDs - not user codegen options
  hidden.add('symbolId');
  hidden.add('eventId');
  // Bind / Dispatch / On: picker + Event Properties rename write-through.
  // Raw eventName only patches the node; emit prefers eventId, so the field is a no-op after bind.
  hidden.add('eventName');
  if (kindId === 'function_define') {
    hidden.add('graphTabId');
  }
  if (kindId === 'class_define') {
    hidden.add('extendsType');
    hidden.add('extendsTypes');
    hidden.add('implementsTypes');
    hidden.add('form');
  }
  return hidden;
}

export function filterDetailsPropertySchema<T extends { key: string }>(
  fields: T[] | undefined,
  kindId: string | null | undefined
): T[] {
  if (!fields?.length) return [];
  const hidden = hiddenDetailsPropertyKeys(kindId);
  return fields.filter((field) => !hidden.has(field.key));
}
