import { ProjectTree, type ProjectTreeMode } from './ProjectTree';

export { type ProjectTreeMode };

export function GraphExplorer({ mode = 'canvas' }: { mode?: ProjectTreeMode }) {
  return <ProjectTree mode={mode} />;
}
