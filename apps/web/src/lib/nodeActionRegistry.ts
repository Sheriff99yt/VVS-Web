/**
 * Shared descriptors for node Quick Actions (selection strip) and Node Actions
 * (right-click). Surfaces filter by `inQuickActions` / `inContextMenu` + `when`.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Cable,
  Copy,
  Focus,
  GitBranch,
  LayoutTemplate,
  MessageSquarePlus,
  Plus,
  Scissors,
  Trash2,
  Ungroup,
  Unplug,
  ClipboardPaste,
  Lock,
  Maximize2,
  FunctionSquare,
  Layers,
} from 'lucide-react';
import type { GraphAction } from '@/lib/graphActions';
import type { GraphShortcutId } from '@/lib/graphShortcuts';
import type { VVSEdge, VVSNode } from '@/types/graph';

export type NodeActionSection =
  | 'select'
  | 'wires'
  | 'structure'
  | 'clipboard'
  | 'navigate'
  | 'spawn';

/** Graph actions plus UI-only entries that do not go through dispatchGraphAction. */
export type NodeMenuActionId = GraphAction | 'add-node';

export interface NodeActionContext {
  selectedNodes: VVSNode[];
  count: number;
  canGroup: boolean;
  canUngroup: boolean;
  canDisconnect: boolean;
  canAutoConnect: boolean;
  hasCommentSelection: boolean;
  /** True when system/in-memory paste may apply — menus always offer Paste. */
  canPaste: boolean;
}

export interface NodeActionDescriptor {
  id: NodeMenuActionId;
  section: NodeActionSection;
  label: string;
  /** Existing shortcut registry id for hint display (optional). */
  shortcutId?: GraphShortcutId;
  /** Override chord when not in rebindable shortcuts (e.g. still show S S). */
  shortcutHint?: string;
  inContextMenu: boolean;
  inQuickActions?: boolean;
  icon?: LucideIcon;
  danger?: boolean;
  when: (ctx: NodeActionContext) => boolean;
}

export const NODE_ACTION_SECTION_ORDER: NodeActionSection[] = [
  'select',
  'wires',
  'structure',
  'clipboard',
  'navigate',
  'spawn',
];

export const NODE_ACTION_SECTION_LABEL: Record<NodeActionSection, string> = {
  select: 'Selection',
  wires: 'Wires',
  structure: 'Structure',
  clipboard: 'Clipboard',
  navigate: 'Navigate',
  spawn: 'Add',
};

const hasSelection = (ctx: NodeActionContext) => ctx.count > 0;

export const NODE_ACTION_REGISTRY: NodeActionDescriptor[] = [
  // —— Selection ——
  {
    id: 'select-chain-downstream',
    section: 'select',
    label: 'Select chain downstream',
    shortcutId: 'select-chain-downstream',
    inContextMenu: true,
    icon: GitBranch,
    when: hasSelection,
  },
  {
    id: 'layout-selected-chains',
    section: 'select',
    label: 'Layout chain',
    shortcutId: 'layout-selected-chains',
    inContextMenu: true,
    icon: LayoutTemplate,
    when: hasSelection,
  },
  {
    id: 'select-chain-full',
    section: 'select',
    label: 'Select full chain',
    shortcutId: 'select-chain-full',
    inContextMenu: true,
    icon: Layers,
    when: hasSelection,
  },
  {
    id: 'select-similar',
    section: 'select',
    label: 'Select similar',
    shortcutId: 'select-similar',
    inContextMenu: true,
    when: hasSelection,
  },

  // —— Wires ——
  {
    id: 'auto-connect-selection',
    section: 'wires',
    label: 'Auto-connect',
    inContextMenu: true,
    inQuickActions: true,
    icon: Cable,
    when: (ctx) => ctx.canAutoConnect,
  },
  {
    id: 'disconnect-selection',
    section: 'wires',
    label: 'Disconnect wires',
    shortcutId: 'disconnect',
    inContextMenu: true,
    inQuickActions: true,
    icon: Unplug,
    when: (ctx) => ctx.canDisconnect,
  },

  // —— Structure ——
  {
    id: 'group-comment',
    section: 'structure',
    label: 'Comment selection',
    shortcutId: 'group-comment',
    inContextMenu: true,
    inQuickActions: true,
    icon: MessageSquarePlus,
    when: (ctx) => ctx.canGroup,
  },
  {
    id: 'ungroup-comment',
    section: 'structure',
    label: 'Release from comment',
    shortcutId: 'ungroup-comment',
    inContextMenu: true,
    inQuickActions: true,
    icon: Ungroup,
    when: (ctx) => ctx.canUngroup,
  },
  {
    id: 'toggle-comment-lock',
    section: 'structure',
    label: 'Lock / unlock comment',
    shortcutId: 'toggle-comment-lock',
    inContextMenu: true,
    icon: Lock,
    when: (ctx) => ctx.hasCommentSelection,
  },
  {
    id: 'snap-comment-members',
    section: 'structure',
    label: 'Resize comment to fit',
    shortcutId: 'snap-comment-members',
    inContextMenu: true,
    icon: Maximize2,
    when: (ctx) => ctx.hasCommentSelection,
  },
  {
    id: 'extract-function',
    section: 'structure',
    label: 'Extract to function',
    shortcutId: 'extract-function',
    inContextMenu: true,
    icon: FunctionSquare,
    when: (ctx) => ctx.selectedNodes.some((n) => n.type === 'vvs_standard_node'),
  },

  // —— Clipboard ——
  {
    id: 'copy',
    section: 'clipboard',
    label: 'Copy',
    shortcutId: 'copy',
    inContextMenu: true,
    when: hasSelection,
  },
  {
    id: 'cut',
    section: 'clipboard',
    label: 'Cut',
    shortcutId: 'cut',
    inContextMenu: true,
    icon: Scissors,
    when: hasSelection,
  },
  {
    id: 'duplicate',
    section: 'clipboard',
    label: 'Duplicate',
    shortcutId: 'duplicate',
    inContextMenu: true,
    inQuickActions: true,
    icon: Copy,
    when: hasSelection,
  },
  {
    id: 'paste',
    section: 'clipboard',
    label: 'Paste',
    shortcutId: 'paste',
    inContextMenu: true,
    icon: ClipboardPaste,
    when: (ctx) => ctx.canPaste,
  },
  {
    id: 'delete-selection',
    section: 'clipboard',
    label: 'Delete',
    shortcutId: 'delete',
    inContextMenu: true,
    inQuickActions: true,
    icon: Trash2,
    danger: true,
    when: hasSelection,
  },

  // —— Navigate ——
  {
    id: 'focus-selection',
    section: 'navigate',
    label: 'Frame selection',
    shortcutId: 'focus-selection',
    inContextMenu: true,
    icon: Focus,
    when: hasSelection,
  },

  // —— Spawn (context only) ——
  {
    id: 'add-node',
    section: 'spawn',
    label: 'Add node…',
    inContextMenu: true,
    icon: Plus,
    when: () => true,
  },
];

export function buildNodeActionContext(input: {
  selectedNodes: VVSNode[];
  allEdges: VVSEdge[];
  canGroup: boolean;
  canUngroup: boolean;
  canAutoConnect: boolean;
  canPaste?: boolean;
}): NodeActionContext {
  const { selectedNodes, allEdges, canGroup, canUngroup, canAutoConnect } = input;
  const edgeSelected = allEdges.some((e) => e.selected);
  const nodeHasWire = selectedNodes.some((n) =>
    allEdges.some((e) => e.source === n.id || e.target === n.id)
  );
  return {
    selectedNodes,
    count: selectedNodes.length,
    canGroup,
    canUngroup,
    canDisconnect: edgeSelected || nodeHasWire,
    canAutoConnect,
    hasCommentSelection: selectedNodes.some((n) => n.type === 'vvs_comment_node'),
    canPaste: input.canPaste !== false,
  };
}

export function contextMenuActions(ctx: NodeActionContext): NodeActionDescriptor[] {
  return NODE_ACTION_REGISTRY.filter((d) => d.inContextMenu && d.when(ctx));
}

export function quickActionDescriptors(ctx: NodeActionContext): NodeActionDescriptor[] {
  return NODE_ACTION_REGISTRY.filter((d) => d.inQuickActions && d.when(ctx));
}

/** Group enabled context actions by section (empty sections omitted). */
export function contextMenuSections(
  ctx: NodeActionContext
): { section: NodeActionSection; label: string; items: NodeActionDescriptor[] }[] {
  const enabled = contextMenuActions(ctx);
  const bySection = new Map<NodeActionSection, NodeActionDescriptor[]>();
  for (const item of enabled) {
    const list = bySection.get(item.section) ?? [];
    list.push(item);
    bySection.set(item.section, list);
  }
  return NODE_ACTION_SECTION_ORDER.filter((s) => (bySection.get(s)?.length ?? 0) > 0).map(
    (section) => ({
      section,
      label: NODE_ACTION_SECTION_LABEL[section],
      items: bySection.get(section)!,
    })
  );
}
