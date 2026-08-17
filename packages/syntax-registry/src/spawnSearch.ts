/** Extra tokens so spawn-menu search matches fixture labels and common synonyms. */
const SPAWN_SEARCH_ALIASES: Record<string, readonly string[]> = {
  'vvs.project.import_module': ['import', 'module', 'stdlib', 'include', 'utils', 'iostream', 'enum'],
  import_class: ['import', 'class', 'reference'],
  function_define: ['declare', 'signature', 'prototype'],
  function_implement: ['define', 'body', 'implement', 'constructor', 'ctor', '__init__', 'destructor', 'dtor'],
  class_define: ['declare', 'class', 'define class'],
  var_define: ['declare', 'variable', 'field', 'member'],
  event_member_define: ['declare', 'event', 'member'],
  event_define: ['on', 'handler', 'event handler', 'tick', 'update', 'frame', 'on update', 'on start', 'entry'],
  event_dispatch: ['dispatch', 'invoke', 'emit'],
  'vvs.project.call_function': ['call', 'invoke', 'function'],
  flow_branch: ['if', 'branch', 'condition'],
  flow_switch: ['switch', 'case', 'match'],
  flow_for: ['for', 'loop'],
  flow_while: ['while', 'loop'],
  flow_try: ['try', 'catch', 'except', 'finally'],
  yield_stmt: ['yield', 'generator'],
  lambda_define: ['lambda', 'arrow', 'closure', 'anonymous'],
  action_print: ['print', 'log', 'output'],
  action_get_input: ['input', 'read', 'prompt', 'stdin'],
  action_wait: ['wait', 'delay', 'sleep', 'await', 'async'],
  convert_to_string: ['string', 'cast', 'convert'],
  convert_to_number: ['number', 'cast', 'convert'],
  variable_get: ['get', 'read'],
  variable_set: ['set', 'assign', 'write'],
  enum_define: ['enum', 'declare'],
  math_add: ['add', 'math', '+', 'sum', 'plus', 'addition'],
  math_subtract: ['subtract', 'math', '-', 'minus', 'difference', 'subtraction'],
  math_multiply: ['multiply', 'math', '*', 'times', 'product', 'multiplication'],
  math_divide: ['divide', 'math', '/', 'div', 'quotient', 'division'],
  expr_enum_member: ['enum', 'member', 'access', 'dot', 'value'],
  array_push: ['array', 'push', 'add', 'append', 'insert', 'list'],
  string_concat: ['string', 'concat', 'combine', 'join', 'merge', 'add'],
};

/** Lowercase haystack for spawn-menu filtering (label, kindId, category, aliases). */
export function spawnItemSearchHaystack(
  item: { label: string; kindId?: string; type?: string; category: string },
  catalogCategoryName?: string
): string {
  const kindId = item.kindId ?? item.type ?? '';
  const aliases = SPAWN_SEARCH_ALIASES[kindId] ?? [];
  return [item.label, kindId, item.category, catalogCategoryName, ...aliases]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function spawnItemMatchesQuery(
  item: { label: string; kindId?: string; type?: string; category: string },
  query: string,
  catalogCategoryName?: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return spawnItemSearchHaystack(item, catalogCategoryName).includes(q);
}
