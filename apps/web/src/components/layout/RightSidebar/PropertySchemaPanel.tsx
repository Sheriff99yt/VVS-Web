'use client';

import React from 'react';
import type { PropertyFieldDefinition } from '@vvs/syntax-registry';
import { isPropertyFieldVisible } from '@vvs/syntax-registry';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface PropertySchemaPanelProps {
  fields: PropertyFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: string | number | boolean) => void;
}

const INLINE_MODIFIER_KEYS = new Set([
  'visibility',
  'binding',
  'isConst',
  'isAbstract',
  'isVirtual',
  'isOverride',
  'isAsync',
]);

export function PropertySchemaPanel({ fields, values, onChange }: PropertySchemaPanelProps) {
  const visibleFields = fields.filter(
    (field) => isPropertyFieldVisible(field, values) && !INLINE_MODIFIER_KEYS.has(field.key)
  );

  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-3 mb-2 pb-2 border-b border-zinc-800/80">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Settings</p>
      {visibleFields.map((field) => {
        const raw = values[field.key];
        const descriptionId = field.description ? `${field.key}-desc` : undefined;

        if (field.type === 'enum' && field.enumValues?.length) {
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400" htmlFor={field.key}>
                {field.label}
              </label>
              <SearchableSelect
                id={field.key}
                value={typeof raw === 'string' ? raw : String(field.enumValues[0])}
                onChange={(value) => onChange(field.key, value)}
                options={field.enumValues.map((option) => ({
                  value: option,
                  label: option,
                }))}
                placeholder={`Select ${field.label}…`}
                searchable={field.enumValues.length > 1}
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
            <label
              key={field.key}
              className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                checked={Boolean(raw)}
                onChange={(e) => onChange(field.key, e.target.checked)}
                className="accent-zinc-500 bg-zinc-900 border-zinc-800"
              />
              {field.label}
            </label>
          );
        }

        if (field.type === 'number') {
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400" htmlFor={field.key}>
                {field.label}
              </label>
              <input
                id={field.key}
                type="number"
                value={typeof raw === 'number' ? raw : 0}
                onChange={(e) => onChange(field.key, parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
          );
        }

        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400" htmlFor={field.key}>
              {field.label}
            </label>
            <input
              id={field.key}
              type="text"
              value={typeof raw === 'string' ? raw : ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-zinc-600"
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
