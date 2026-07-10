import { ProjectTree, type ProjectTreeProps } from './ProjectTree';
import type { ProjectTreeMode } from './project-tree/constants';

export type { ProjectTreeMode };
export type { ProjectTreeProps };

export function GraphExplorer({ mode = 'canvas' }: { mode?: ProjectTreeMode }) {
  return <ProjectTree mode={mode} />;
}
