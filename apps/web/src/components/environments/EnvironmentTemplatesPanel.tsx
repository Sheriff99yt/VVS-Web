'use client';

import React, { useMemo } from 'react';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import {
  ENVIRONMENT_CATEGORIES,
  groupEnvironmentsByCategory,
  resolveEnvironmentCategory,
  type EnvironmentCategory,
} from '@vvs/environment-templates';
import { EnvironmentCategoryFilter } from '@/components/environments/EnvironmentCategoryFilter';
import { EnvironmentTemplateCard } from '@/components/environments/EnvironmentTemplateCard';

interface EnvironmentTemplatesPanelProps {
  environments: ProjectEnvironmentManifest[];
  activeCategory: EnvironmentCategory | 'all';
  onCategoryChange: (category: EnvironmentCategory | 'all') => void;
  onSelect: (environmentId: string) => void;
  selectedId?: string | null;
}

export function EnvironmentTemplatesPanel({
  environments,
  activeCategory,
  onCategoryChange,
  onSelect,
  selectedId,
}: EnvironmentTemplatesPanelProps) {
  const categoryCounts = useMemo(() => {
    const counts: Record<EnvironmentCategory | 'all', number> = {
      all: environments.length,
      console: 0,
      web: 0,
      data: 0,
      api: 0,
      game: 0,
    };
    for (const env of environments) {
      counts[resolveEnvironmentCategory(env)] += 1;
    }
    return counts;
  }, [environments]);

  const groupedEnvironments = useMemo(
    () => groupEnvironmentsByCategory(environments),
    [environments]
  );

  const filteredEnvironments = useMemo(() => {
    if (activeCategory === 'all') return environments;
    return environments.filter((e) => resolveEnvironmentCategory(e) === activeCategory);
  }, [environments, activeCategory]);

  if (environments.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-sm">No project templates available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnvironmentCategoryFilter
        active={activeCategory}
        counts={categoryCounts}
        onChange={onCategoryChange}
      />

      {activeCategory === 'all' ? (
        <div className="space-y-10">
          {ENVIRONMENT_CATEGORIES.map((cat) => {
            const items = groupedEnvironments.get(cat.id) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat.id}>
                <div className="mb-4 pb-2 border-b border-zinc-800/80">
                  <h3 className="text-sm font-semibold text-zinc-200">{cat.label}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{cat.description}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((env) => (
                    <div
                      key={env.id}
                      className={
                        selectedId === env.id ? 'ring-1 ring-indigo-500/50 rounded-lg' : undefined
                      }
                    >
                      <EnvironmentTemplateCard manifest={env} onSelect={onSelect} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEnvironments.map((env) => (
            <div
              key={env.id}
              className={selectedId === env.id ? 'ring-1 ring-indigo-500/50 rounded-lg' : undefined}
            >
              <EnvironmentTemplateCard manifest={env} onSelect={onSelect} />
            </div>
          ))}
          {filteredEnvironments.length === 0 ? (
            <p className="text-sm text-zinc-600 col-span-full">No templates in this category.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
