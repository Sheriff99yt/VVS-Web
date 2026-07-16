'use client';

import React from 'react';
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
import styles from './VVSNode.module.css';

interface NodeModifiersProps {
  id: string;
  data: VVSNodeData;
}

const MODIFIER_CHIP_CONFIG: Array<{
  schemaKey: string;
  modifierKey: ModifierKey;
  title: string;
  icon: React.ReactNode;
  activeClass: string;
}> = [
  { schemaKey: 'isConst', modifierKey: 'isConst', title: 'Const', icon: <Lock size={11} strokeWidth={2.5} />, activeClass: styles.modifierChipActiveConst },
  { schemaKey: 'isAbstract', modifierKey: 'isAbstract', title: 'Abstract', icon: <Puzzle size={11} strokeWidth={2.5} />, activeClass: styles.modifierChipActiveAmber },
  { schemaKey: 'isVirtual', modifierKey: 'isVirtual', title: 'Virtual', icon: <Wand2 size={11} strokeWidth={2.5} />, activeClass: styles.modifierChipActivePurple },
  { schemaKey: 'isOverride', modifierKey: 'isOverride', title: 'Override', icon: <RefreshCcw size={11} strokeWidth={2.5} />, activeClass: styles.modifierChipActiveEmerald },
  { schemaKey: 'isAsync', modifierKey: 'isAsync', title: 'Async', icon: <Clock size={11} strokeWidth={2.5} />, activeClass: styles.modifierChipActiveIndigo },
];

export function NodeModifiers({ id, data }: NodeModifiersProps) {
  const { updateNodeData } = useReactFlow();
  const { variables, functions, events } = useProject();
  /** Active graph language (falls back to project default) — chips re-evaluate when this changes. */
  const { targetLanguage } = useActiveGraphCodegenSettings();
  const { renameVariable, renameFunction, renameEvent } = useSymbolLifecycle();

  const kindId = resolveNodeKindId(data);
  const def = getNodeKindDefinition(kindId);
  const schema = Array.isArray(def?.propertySchema) ? def.propertySchema : [];

  const hasModifier = (key: string) => schema.some((f) => f.key === key);

  const hasVisibility = hasModifier('visibility');
  const hasBinding = hasModifier('binding');
  const hasConst = hasModifier('isConst');
  const hasAbstract = hasModifier('isAbstract');
  const hasVirtual = hasModifier('isVirtual');
  const hasOverride = hasModifier('isOverride');
  const hasAsync = hasModifier('isAsync');
  const bindingField = schema.find((f) => f.key === 'binding');
  const bindingChoices =
    bindingField?.type === 'enum' && bindingField.enumValues?.length
      ? bindingField.enumValues
      : ['instance', 'static'];

  if (!hasVisibility && !hasBinding && !hasConst && !hasAbstract && !hasVirtual && !hasOverride && !hasAsync) {
    return null;
  }

  const defaults = defaultPropertiesFromSchema(schema);
  const props = { ...defaults, ...(data.properties || {}) };

  const handleUpdate = (key: string, value: unknown) => {
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

  const chipClass = (active: boolean, enabled: boolean, activeTone?: string) =>
    [
      styles.modifierChip,
      active && enabled ? `${styles.modifierChipActive} ${activeTone ?? ''}` : '',
      !enabled ? styles.modifierChipDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className={styles.modifierRow} onMouseDown={(e) => e.stopPropagation()}>
      {hasVisibility && (
        <div
          className={chipClass(false, visibilityEffective)}
          title={visibilityEffective ? 'Visibility' : modifierIneffectiveTooltip(targetLanguage, 'visibility')}
        >
          {getVisibilityIcon(String(props.visibility))}
          <select
            value={String(props.visibility)}
            onChange={(e) => handleUpdate('visibility', e.target.value)}
            disabled={!visibilityEffective}
            className={styles.modifierSelect}
            aria-label="Visibility"
          >
            <option value="public" className="bg-zinc-800 text-zinc-200">
              Public
            </option>
            <option value="protected" className="bg-zinc-800 text-zinc-200">
              Protected
            </option>
            <option value="private" className="bg-zinc-800 text-zinc-200">
              Private
            </option>
          </select>
        </div>
      )}

      {hasBinding && (
        <div
          className={chipClass(false, bindingEffective)}
          title={bindingEffective ? 'Binding' : modifierIneffectiveTooltip(targetLanguage, 'binding')}
        >
          {getBindingIcon(String(props.binding))}
          <select
            value={String(props.binding)}
            onChange={(e) => handleUpdate('binding', e.target.value)}
            disabled={!bindingEffective}
            className={styles.modifierSelect}
            aria-label="Binding"
          >
            <option value="instance" className="bg-zinc-800 text-zinc-200">
              Instance
            </option>
            <option value="static" className="bg-zinc-800 text-zinc-200">
              Static
            </option>
            {bindingChoices.includes('module') ? (
              <option value="module" className="bg-zinc-800 text-zinc-200">
                Module
              </option>
            ) : null}
          </select>
        </div>
      )}

      {MODIFIER_CHIP_CONFIG.map(({ schemaKey, modifierKey, title, icon, activeClass }) => {
        if (!hasModifier(schemaKey)) return null;
        const enabled = isModifierInteractive(targetLanguage, modifierKey);
        const active = Boolean(props[schemaKey as keyof typeof props]);
        return (
          <button
            key={`${schemaKey}-${targetLanguage}`}
            type="button"
            onClick={() => enabled && handleUpdate(schemaKey, !active)}
            disabled={!enabled}
            className={chipClass(active, enabled, activeClass)}
            title={enabled ? title : modifierIneffectiveTooltip(targetLanguage, modifierKey)}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
