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
import { EnvironmentLanguageFilter } from '@/components/environments/EnvironmentLanguageFilter';
import { EnvironmentTemplateCard } from '@/components/environments/EnvironmentTemplateCard';
import {
  collectEnvironmentLanguages,
  environmentLanguageIds,
  filterEnvironmentsByLanguage,
} from '@/lib/librarySearch';

interface EnvironmentTemplatesPanelProps {
  environments: ProjectEnvironmentManifest[];
  activeCategory: EnvironmentCategory | 'all';
  onCategoryChange: (category: EnvironmentCategory | 'all') => void;
  activeLanguage?: string | 'all';
  onLanguageChange?: (language: string | 'all') => void;
  onSelect: (environmentId: string) => void;
  selectedId?: string | null;
  emptyLabel?: string;
}

export function EnvironmentTemplatesPanel({
  environments,
  activeCategory,
  onCategoryChange,
  activeLanguage = 'all',
  onLanguageChange,
  onSelect,
  selectedId,
  emptyLabel,
}: EnvironmentTemplatesPanelProps) {
  const languageFiltered = useMemo(
    () => filterEnvironmentsByLanguage(environments, activeLanguage),
    [environments, activeLanguage]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<EnvironmentCategory | 'all', number> = {
      all: languageFiltered.length,
      console: 0,
      web: 0,
      data: 0,
      api: 0,
      game: 0,
    };
    for (const env of languageFiltered) {
      counts[resolveEnvironmentCategory(env)] += 1;
    }
    return counts;
  }, [languageFiltered]);

  const languageIds = useMemo(() => collectEnvironmentLanguages(environments), [environments]);

  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: environments.length };
    for (const env of environments) {
      for (const id of environmentLanguageIds(env)) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [environments]);

  const groupedEnvironments = useMemo(
    () => groupEnvironmentsByCategory(languageFiltered),
    [languageFiltered]
  );

  const filteredEnvironments = useMemo(() => {
    if (activeCategory === 'all') return languageFiltered;
    return languageFiltered.filter((e) => resolveEnvironmentCategory(e) === activeCategory);
  }, [languageFiltered, activeCategory]);

  if (environments.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-sm">{emptyLabel ?? 'No project templates available.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <EnvironmentCategoryFilter
          active={activeCategory}
          counts={categoryCounts}
          onChange={onCategoryChange}
        />
        {onLanguageChange ? (
          <EnvironmentLanguageFilter
            active={activeLanguage}
            languages={languageIds}
            counts={languageCounts}
            onChange={onLanguageChange}
          />
        ) : null}
      </div>

      {activeCategory === 'all' ? (
        <div className="space-y-10">
          {languageFiltered.length === 0 ? (
            <p className="text-sm text-zinc-600">
              {emptyLabel ??
                (activeLanguage !== 'all'
                  ? 'No templates match this language.'
                  : 'No project templates available.')}
            </p>
          ) : null}
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
            <p className="text-sm text-zinc-600 col-span-full">
              {activeLanguage !== 'all'
                ? 'No templates match this language in this category.'
                : 'No templates in this category.'}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
