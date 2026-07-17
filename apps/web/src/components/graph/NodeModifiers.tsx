'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { VVSNodeData } from '@/types/graph';
import { resolveNodeKindId } from '@/lib/nodeKind';
import { getNodeKindDefinition } from '@/lib/nodeRegistry';
import { defaultPropertiesFromSchema } from '@vvs/syntax-registry';
import {
  isModifierInteractive,
  modifierIneffectiveTooltip,
  type ModifierKey,
} from '@vvs/language-profiles';
import { Lock, Puzzle, Wand2, RefreshCcw, Shield, Globe, Layers, Package, Box, Clock } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { markNavNodeOptions } from '@/lib/navActivityFlags';
import styles from './VVSNode.module.css';

interface NodeModifiersProps {
  id: string;
  data: VVSNodeData;
  /** True while a modifier menu is open — keeps the hover strip mounted/visible. */
  onInteractionChange?: (active: boolean) => void;
}

/** Whether this node kind exposes any modifier chips. */
export function nodeHasModifierChrome(data: VVSNodeData): boolean {
  const kindId = resolveNodeKindId(data);
  const def = getNodeKindDefinition(kindId);
  const schema = Array.isArray(def?.propertySchema) ? def.propertySchema : [];
  return schema.some(
    (f) =>
      f.key === 'visibility' ||
      f.key === 'binding' ||
      f.key === 'isConst' ||
      f.key === 'isAbstract' ||
      f.key === 'isVirtual' ||
      f.key === 'isOverride' ||
      f.key === 'isAsync'
  );
}

type MenuOption = {
  value: string;
  label: string;
};

const BOOL_MODIFIERS: Array<{
  schemaKey: string;
  modifierKey: ModifierKey;
  title: string;
  icon: React.ReactNode;
  activeClass: string;
  onLabel: string;
  offLabel: string;
}> = [
  {
    schemaKey: 'isConst',
    modifierKey: 'isConst',
    title: 'Const',
    icon: <Lock size={11} strokeWidth={2.5} />,
    activeClass: styles.modifierChipActiveConst,
    onLabel: 'Const',
    offLabel: 'Mutable',
  },
  {
    schemaKey: 'isAbstract',
    modifierKey: 'isAbstract',
    title: 'Abstract',
    icon: <Puzzle size={11} strokeWidth={2.5} />,
    activeClass: styles.modifierChipActiveAmber,
    onLabel: 'Abstract',
    offLabel: 'Concrete',
  },
  {
    schemaKey: 'isVirtual',
    modifierKey: 'isVirtual',
    title: 'Virtual',
    icon: <Wand2 size={11} strokeWidth={2.5} />,
    activeClass: styles.modifierChipActivePurple,
    onLabel: 'Virtual',
    offLabel: 'Non-virtual',
  },
  {
    schemaKey: 'isOverride',
    modifierKey: 'isOverride',
    title: 'Override',
    icon: <RefreshCcw size={11} strokeWidth={2.5} />,
    activeClass: styles.modifierChipActiveEmerald,
    onLabel: 'Override',
    offLabel: 'No override',
  },
  {
    schemaKey: 'isAsync',
    modifierKey: 'isAsync',
    title: 'Async',
    icon: <Clock size={11} strokeWidth={2.5} />,
    activeClass: styles.modifierChipActiveIndigo,
    onLabel: 'Async',
    offLabel: 'Sync',
  },
];

function ModifierDropdown({
  icon,
  title,
  value,
  options,
  enabled,
  disabledTitle,
  active,
  activeClass,
  onChange,
  onOpenChange,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  options: MenuOption[];
  enabled: boolean;
  disabledTitle: string;
  active: boolean;
  activeClass?: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (openRef.current) onOpenChange?.(false);
    };
  }, [onOpenChange]);

  const setMenuOpen = (next: boolean) => {
    if (openRef.current === next) return;
    openRef.current = next;
    setOpen(next);
    onOpenChange?.(next);
  };

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearClose();
    if (enabled) setMenuOpen(true);
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setMenuOpen(false), 160);
  };

  const chipClass = [
    styles.modifierChip,
    active && enabled ? `${styles.modifierChipActive} ${activeClass ?? ''}` : '',
    !enabled ? styles.modifierChipDisabled : '',
    open && enabled ? styles.modifierChipOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tooltip content={enabled ? title : disabledTitle} placement="top">
      <div
        className={chipClass}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
      {icon}
      {open && enabled ? (
        <div
          className={styles.modifierMenu}
          role="listbox"
          aria-label={title}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`${styles.modifierMenuItem} ${selected ? styles.modifierMenuItemActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setMenuOpen(false);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
      </div>
    </Tooltip>
  );
}

export function NodeModifiers({
  id,
  data,
  onInteractionChange,
}: NodeModifiersProps) {
  const { updateNodeData } = useReactFlow();
  const { variables, functions, events } = useProject();
  const { targetLanguage } = useActiveGraphCodegenSettings();
  const { renameVariable, renameFunction, renameEvent } = useSymbolLifecycle();
  const openMenuCount = useRef(0);

  const handleMenuOpenChange = (open: boolean) => {
    openMenuCount.current = Math.max(0, openMenuCount.current + (open ? 1 : -1));
    onInteractionChange?.(openMenuCount.current > 0);
  };

  const kindId = resolveNodeKindId(data);
  const def = getNodeKindDefinition(kindId);
  const schema = Array.isArray(def?.propertySchema) ? def.propertySchema : [];

  const hasModifier = (key: string) => schema.some((f) => f.key === key);

  const hasVisibility = hasModifier('visibility');
  const hasBinding = hasModifier('binding');
  const bindingField = schema.find((f) => f.key === 'binding');
  const bindingChoices =
    bindingField?.type === 'enum' && bindingField.enumValues?.length
      ? bindingField.enumValues
      : ['instance', 'static'];

  const boolKeysPresent = BOOL_MODIFIERS.some(({ schemaKey }) => hasModifier(schemaKey));

  if (!hasVisibility && !hasBinding && !boolKeysPresent) {
    return null;
  }

  const defaults = defaultPropertiesFromSchema(schema);
  const props = { ...defaults, ...(data.properties || {}) };

  const handleUpdate = (key: string, value: unknown) => {
    markNavNodeOptions();
    updateNodeData(id, {
      properties: {
        ...props,
        [key]: value,
      },
    });

    const symbolId = data.properties?.symbolId;
    if (symbolId && typeof symbolId === 'string') {
      const isFlag = ['isConst', 'isAbstract', 'isVirtual', 'isOverride', 'isAsync'].includes(key);
      const flagKey = key === 'isConst' ? 'readonly' : isFlag ? key.slice(2).toLowerCase() : null;

      if (kindId === 'var_define') {
        const v = variables.find((x) => x.id === symbolId);
        if (v) {
          if (isFlag) renameVariable({ ...v, flags: { ...v.flags, [flagKey!]: value } });
          else renameVariable({ ...v, [key]: value });
        }
      } else if (kindId === 'function_define') {
        const f = functions.find((x) => x.id === symbolId);
        if (f) {
          if (isFlag) renameFunction({ ...f, flags: { ...f.flags, [flagKey!]: value } });
          else renameFunction({ ...f, [key]: value });
        }
      } else if (kindId === 'event_member_define') {
        const e = events.find((x) => x.id === symbolId);
        if (e) renameEvent({ ...e, [key]: value });
      }
    }
  };

  const visibilityEffective = isModifierInteractive(targetLanguage, 'visibility');
  const bindingEffective = isModifierInteractive(targetLanguage, 'binding');

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case 'private':
        return <Lock size={11} strokeWidth={2.5} />;
      case 'protected':
        return <Shield size={11} strokeWidth={2.5} />;
      case 'public':
      default:
        return <Globe size={11} strokeWidth={2.5} />;
    }
  };

  const getBindingIcon = (bind: string) => {
    switch (bind) {
      case 'static':
        return <Layers size={11} strokeWidth={2.5} />;
      case 'module':
        return <Package size={11} strokeWidth={2.5} />;
      case 'instance':
      default:
        return <Box size={11} strokeWidth={2.5} />;
    }
  };

  const visibilityValue = String(props.visibility ?? 'public');
  const bindingValue = String(props.binding ?? 'instance');

  const bindingOptions: MenuOption[] = [
    { value: 'instance', label: 'Instance' },
    { value: 'static', label: 'Static' },
    ...(bindingChoices.includes('module') ? [{ value: 'module', label: 'Module' }] : []),
  ];

  return (
    <div className={styles.modifierRow} onMouseDown={(e) => e.stopPropagation()}>
      {hasVisibility ? (
        <ModifierDropdown
          icon={getVisibilityIcon(visibilityValue)}
          title="Visibility"
          value={visibilityValue}
          options={[
            { value: 'public', label: 'Public' },
            { value: 'protected', label: 'Protected' },
            { value: 'private', label: 'Private' },
          ]}
          enabled={visibilityEffective}
          disabledTitle={modifierIneffectiveTooltip(targetLanguage, 'visibility')}
          active={false}
          onChange={(v) => handleUpdate('visibility', v)}
          onOpenChange={handleMenuOpenChange}
        />
      ) : null}

      {hasBinding ? (
        <ModifierDropdown
          icon={getBindingIcon(bindingValue)}
          title="Binding"
          value={bindingValue}
          options={bindingOptions}
          enabled={bindingEffective}
          disabledTitle={modifierIneffectiveTooltip(targetLanguage, 'binding')}
          active={false}
          onChange={(v) => handleUpdate('binding', v)}
          onOpenChange={handleMenuOpenChange}
        />
      ) : null}

      {BOOL_MODIFIERS.map(
        ({ schemaKey, modifierKey, title, icon, activeClass, onLabel, offLabel }) => {
          if (!hasModifier(schemaKey)) return null;
          const enabled = isModifierInteractive(targetLanguage, modifierKey);
          const active = Boolean(props[schemaKey as keyof typeof props]);
          return (
            <ModifierDropdown
              key={`${schemaKey}-${targetLanguage}`}
              icon={icon}
              title={title}
              value={active ? 'true' : 'false'}
              options={[
                { value: 'true', label: onLabel },
                { value: 'false', label: offLabel },
              ]}
              enabled={enabled}
              disabledTitle={modifierIneffectiveTooltip(targetLanguage, modifierKey)}
              active={active}
              activeClass={activeClass}
              onChange={(v) => handleUpdate(schemaKey, v === 'true')}
              onOpenChange={handleMenuOpenChange}
            />
          );
        }
      )}
    </div>
  );
}
