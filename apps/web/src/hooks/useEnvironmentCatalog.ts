'use client';

import { useEffect, useState } from 'react';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import {
  bootstrapEnvironmentCatalog,
  isEnvironmentCatalogReady,
  listProjectEnvironments,
} from '@/lib/environmentCatalog';

export function useEnvironmentCatalog(): {
  environments: ProjectEnvironmentManifest[];
  ready: boolean;
} {
  const [ready, setReady] = useState(isEnvironmentCatalogReady());
  const [environments, setEnvironments] = useState<ProjectEnvironmentManifest[]>(() =>
    listProjectEnvironments()
  );

  useEffect(() => {
    let cancelled = false;
    bootstrapEnvironmentCatalog().then(() => {
      if (cancelled) return;
      setEnvironments(listProjectEnvironments());
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { environments, ready };
}
