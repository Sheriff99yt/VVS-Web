'use client';

import React from 'react';
import type { PropertyFieldDefinition } from '@vvs/syntax-registry';
import { isPropertyFieldVisible } from '@vvs/syntax-registry';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DocsInfoIcon } from '@/components/docs/DocsInfoIcon';

interface PropertySchemaPanelProps {
  fields: PropertyFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: string | number | boolean) => void;
  fieldOptions?: Record<string, Array<{ value: string; label: string; description?: string; group?: string; dimmed?: boolean }>>;
  kindId?: string | null;
}

const INLINE_MODIFIER_KEYS = new Set([
  'visibility',
  'binding',
  'isConst',
  'isAbstract',
  'isVirtual',
  'isOverride',
  'isAsync',
  'isSuper',
]);

function FieldLabel({
  kindId,
  fieldKey,
  htmlFor,
  children,
}: {
  kindId?: string | null;
  fieldKey: string;
  htmlFor?: string;
  children: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-[11px] font-medium text-zinc-400" htmlFor={htmlFor}>
        {children}
      </label>
      {kindId ? (
        <DocsInfoIcon
          kindId={kindId}
          optionKey={fieldKey}
          label={children}
          className="text-zinc-500 hover:text-zinc-200"
        />
      ) : null}
    </div>
  );
}

export function PropertySchemaPanel({ fields, values, onChange, fieldOptions, kindId }: PropertySchemaPanelProps) {
  const visibleFields = fields.filter(
    (field) => isPropertyFieldVisible(field, values) && !INLINE_MODIFIER_KEYS.has(field.key)
  );

  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-2.5 mb-2 pb-2 border-b border-zinc-800/50">
      <p className="text-[11px] font-medium text-zinc-500">Settings</p>
      {visibleFields.map((field) => {
        const raw = values[field.key];
        const descriptionId = field.description ? `${field.key}-desc` : undefined;

        const choiceOptions =
          fieldOptions?.[field.key] ??
          (field.type === 'enum' && field.enumValues?.length
            ? field.enumValues.map((option) => ({ value: option, label: option }))
            : field.type === 'class'
              ? []
              : undefined);
        if (choiceOptions) {
          const current = typeof raw === 'string' ? raw : '';
          const options =
            current && !choiceOptions.some((option) => option.value === current)
              ? [{ value: current, label: current, description: 'Current value' }, ...choiceOptions]
              : choiceOptions;
          return (
            <div key={field.key} className="space-y-1">
              <FieldLabel kindId={kindId} fieldKey={field.key} htmlFor={field.key}>
                {field.label}
              </FieldLabel>
              <SearchableSelect
                id={field.key}
                value={current}
                onChange={(value) => onChange(field.key, value)}
                options={options}
                placeholder={`Select ${field.label}`}
                searchable={options.length > 1}
              />
              {field.description ? (
                <p id={descriptionId} className="text-[10px] text-zinc-600 leading-relaxed">
                  {field.description}
                </p>
              ) : null}
            </div>
          );
        }

        if (field.type === 'boolean') {
          return (
            <div key={field.key} className="flex items-center gap-2 text-[11px] text-zinc-300 py-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(raw)}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  className="accent-zinc-500 bg-zinc-900 border-zinc-800"
                />
                {field.label}
              </label>
              {kindId ? (
                <DocsInfoIcon
                  kindId={kindId}
                  optionKey={field.key}
                  label={field.label}
                  className="text-zinc-500 hover:text-zinc-200"
                />
              ) : null}
            </div>
          );
        }

        if (field.type === 'number') {
          return (
            <div key={field.key} className="space-y-1">
              <FieldLabel kindId={kindId} fieldKey={field.key} htmlFor={field.key}>
                {field.label}
              </FieldLabel>
              <input
                id={field.key}
                type="number"
                value={typeof raw === 'number' ? raw : 0}
                onChange={(e) => onChange(field.key, parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          );
        }

        return (
          <div key={field.key} className="space-y-1">
            <FieldLabel kindId={kindId} fieldKey={field.key} htmlFor={field.key}>
              {field.label}
            </FieldLabel>
            <input
              id={field.key}
              type="text"
              value={typeof raw === 'string' ? raw : ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              aria-describedby={descriptionId}
            />
            {field.description ? (
              <p id={descriptionId} className="text-[10px] text-zinc-600 leading-relaxed">
                {field.description}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}