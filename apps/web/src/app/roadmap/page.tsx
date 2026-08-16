'use client';

import { BrowseShell } from '@/components/start/BrowseShell';
import { RoadmapView } from '@/components/views/RoadmapView';

export default function RoadmapPage() {
  return (
    <BrowseShell title="Roadmap">
      <RoadmapView />
    </BrowseShell>
  );
}
