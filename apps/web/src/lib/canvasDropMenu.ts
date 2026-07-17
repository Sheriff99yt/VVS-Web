/**
 * Unified canvas drop menus for tree → graph symbol drops.
 *
 * Shared vocabulary (aligned with functions):
 *   Call / Get / Set  — invoke / use at a flow site
 *   Declare           — member existence on the define chain
 *   Define            — body / handler placement
 *
 * Order is always: use actions first, then Declare, then Define
 * (with a divider before Declare when present).
 */

import type { CanvasDropMenuItem } from '@/components/graph/CanvasDropMenu';

export type CanvasDropRole = 'call' | 'declare' | 'define' | 'get' | 'set' | 'open-ref' | 'open-graph';

export interface CanvasDropAction {
  role: CanvasDropRole;
  /** Symbol name shown after the role, e.g. "Call pulse" */
  name: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  /** Force a divider before this item (defaults: before declare/define groups). */
  dividerBefore?: boolean;
}

const ROLE_LABEL: Record<CanvasDropRole, string> = {
  call: 'Call',
  declare: 'Declare',
  define: 'Define',
  get: 'Get',
  set: 'Set',
  'open-ref': 'Open reference to',
  'open-graph': 'Open',
};

/** Canonical menu label: `Call pulse`, `Declare Boot`, … */
export function canvasDropLabel(role: CanvasDropRole, name: string): string {
  const trimmed = name.trim();
  if (role === 'open-ref') return `Open reference to ${trimmed}`;
  if (role === 'open-graph') return `Open ${trimmed}`;
  return `${ROLE_LABEL[role]} ${trimmed}`;
}

export function toCanvasDropMenuItems(actions: CanvasDropAction[]): {
  items: CanvasDropMenuItem[];
  dividersBefore: string[];
} {
  const dividersBefore: string[] = [];
  const items: CanvasDropMenuItem[] = actions.map((action, index) => {
    const id = `${action.role}-${index}`;
    const needsDivider =
      action.dividerBefore === true ||
      (action.dividerBefore !== false &&
        index > 0 &&
        (action.role === 'declare' || action.role === 'define' || action.role === 'open-ref'));
    if (needsDivider) dividersBefore.push(id);
    return {
      id,
      label: canvasDropLabel(action.role, action.name),
      onClick: action.onClick,
      disabled: action.disabled,
      title: action.title,
    };
  });
  return { items, dividersBefore };
}

export function buildVariableDropActions(input: {
  name: string;
  onActiveClassGraph: boolean;
  declareExists: boolean;
  onGet: () => void;
  onSet: () => void;
  onDeclare: () => void;
}): CanvasDropAction[] {
  const { name, onActiveClassGraph, declareExists, onGet, onSet, onDeclare } = input;
  const actions: CanvasDropAction[] = [
    { role: 'get', name, onClick: onGet },
    { role: 'set', name, onClick: onSet },
  ];
  if (onActiveClassGraph) {
    actions.push({
      role: 'declare',
      name,
      onClick: onDeclare,
      disabled: declareExists,
      title: declareExists ? 'Already declared on member chain' : undefined,
    });
  }
  return actions;
}

/** Functions: Call → Declare → Define */
export function buildFunctionDropActions(input: {
  name: string;
  onActiveClassGraph: boolean;
  declareExists: boolean;
  onCall: () => void;
  onDeclare: () => void;
  onDefine: () => void;
}): CanvasDropAction[] {
  const { name, onActiveClassGraph, declareExists, onCall, onDeclare, onDefine } = input;
  const actions: CanvasDropAction[] = [{ role: 'call', name, onClick: onCall }];
  if (onActiveClassGraph) {
    actions.push({
      role: 'declare',
      name,
      onClick: onDeclare,
      disabled: declareExists,
      title: declareExists ? 'Already declared on member chain' : undefined,
    });
  }
  actions.push({
    role: 'define',
    name,
    onClick: onDefine,
    title: 'Place function body in generated code at this position',
  });
  return actions;
}

/** Events: Call → Declare → Define (same roles as functions) */
export function buildEventDropActions(input: {
  name: string;
  onActiveClassGraph: boolean;
  declareExists: boolean;
  defineExists: boolean;
  onCall: () => void;
  onDeclare: () => void;
  onDefine: () => void;
}): CanvasDropAction[] {
  const {
    name,
    onActiveClassGraph,
    declareExists,
    defineExists,
    onCall,
    onDeclare,
    onDefine,
  } = input;
  const actions: CanvasDropAction[] = [{ role: 'call', name, onClick: onCall }];
  if (onActiveClassGraph) {
    actions.push({
      role: 'declare',
      name,
      onClick: onDeclare,
      disabled: declareExists,
      title: declareExists ? 'Already declared on member chain' : undefined,
    });
  }
  actions.push({
    role: 'define',
    name,
    onClick: onDefine,
    title: defineExists
      ? 'Open existing handler on canvas'
      : 'Add handler entry node to canvas',
  });
  return actions;
}

export function buildClassDropActions(input: {
  name: string;
  declareExists: boolean;
  onOpenRef: () => void;
  onDeclare: () => void;
  onOpenGraph: () => void;
}): CanvasDropAction[] {
  const { name, declareExists, onOpenRef, onDeclare, onOpenGraph } = input;
  return [
    { role: 'open-ref', name, onClick: onOpenRef },
    {
      role: 'declare',
      name,
      onClick: onDeclare,
      disabled: declareExists,
      title: declareExists ? 'Class define node already exists in the project' : undefined,
    },
    {
      role: 'open-graph',
      name,
      onClick: onOpenGraph,
      title: 'Open class home graph',
      dividerBefore: false,
    },
  ];
}

export function buildContainerDropActions(input: {
  name: string;
  onOpenRef: () => void;
}): CanvasDropAction[] {
  return [{ role: 'open-ref', name: input.name, onClick: input.onOpenRef }];
}
