import { fuzzyMatchAny } from '@/lib/fuzzySearch';
import {
  GRAPH_SHORTCUTS,
  SHORTCUT_SETTINGS_GROUPS,
} from '@/lib/graphShortcuts';
import { PRODUCT_NAME } from '@/lib/productName';

/** Searchable Settings blocks. Keep labels in sync with the live controls. */
export type SettingsSearchBlockId =
  | 'editor'
  | 'shortcuts'
  | 'audio'
  | 'this-graph'
  | 'project-defaults'
  | 'environment'
  | 'export-paths'
  | 'graph-details'
  | 'pack-lock'
  | 'portability'
  | 'coa'
  | 'about';

export interface SettingsSearchBlock {
  id: SettingsSearchBlockId;
  section: 'project' | 'editor' | 'shortcuts' | 'audio' | 'about';
  title: string;
  terms: string[];
}

export const SETTINGS_SEARCH_BLOCKS: SettingsSearchBlock[] = [
  {
    id: 'editor',
    section: 'editor',
    title: 'Editor',
    terms: [
      'Editor',
      'App preferences',
      'Canvas & Layout',
      'Conventions & Safety',
      'Default Panels',
      'Output Window Tabs',
      'Floating Panels',
      'Dim unsupported nodes',
      'Fade nodes that do not emit for the current language',
      'Show node strip on select',
      'one shared strip follows hover',
      'Unsupported as (x) comments',
      'Emit comment lines for language-ineffective nodes',
      'Author comments',
      'Emit Comment [C] box text',
      'Node → Code highlight',
      'Highlight generated code lines when interacting with canvas nodes',
      'Chain attribute direction (S S)',
      'Where expression trees hang on S S layout',
      'Animate auto layout',
      'Smoothly move nodes when running S S chain layout',
      'Step animate layout',
      'move columns left-to-right in sequence',
      'Step animation speed',
      'How quickly staggered columns move',
      'Naming convention',
      'Make node titles and symbol roles follow target keywords python javascript cpp verse gdscript rust csharp go',
      'Allow multiple exec connections (U119)',
      'Allow multiple execution outputs to wire into a single input',
      'Dynamic/weak typing warnings (U119)',
      'Warn in the Compiler Log for dynamic typing models',
      'Code preview open',
      'Show generated code beside the canvas',
      'Graph navigator open',
      'Show the left project tree',
      'Minimap',
      'Canvas map chrome',
      'Log',
      'Compiler Log',
      'Compiler and validator messages',
      'History',
      'Graph History',
      'Graph undo / redo timeline',
      'Activity',
      'Activity Feed',
      'Save, generate, and other project events',
      'Compact action lines',
      'show three live action lines in the bottom-right',
      'Reset details panel layout',
      'details size position',
      'Reset log panel layout',
      'log size position',
      'Canvas help',
      'shortcuts help',
    ],
  },
  {
    id: 'shortcuts',
    section: 'shortcuts',
    title: 'Shortcuts',
    terms: [
      'Shortcuts',
      'Keyboard shortcuts',
      'Record',
      'rebindable',
      'Fixed binding',
      'Reset all shortcuts to defaults',
    ],
  },
  {
    id: 'audio',
    section: 'audio',
    title: 'Audio',
    terms: [
      'Audio',
      'Audio Settings',
      'Enable audio feedback',
      'Uses the Web Audio API',
      'Volume',
      'Preview generate sound',
      'sound',
      'mute',
      'buzz',
      'feedback',
    ],
  },
  {
    id: 'this-graph',
    section: 'project',
    title: 'This graph',
    terms: [
      'Project',
      'This graph',
      'Active graph',
      'Generated language',
      'File extension',
      'Language capabilities',
      'Reset to defaults',
      'codegen',
      'target language',
      'syntax packs',
      'Organizational graphs',
      'Python',
      'JavaScript',
      'C++',
      'Verse',
      'GDScript',
      'Rust',
      'C#',
      'Go',
      'Graph JSON',
    ],
  },
  {
    id: 'project-defaults',
    section: 'project',
    title: 'Project defaults',
    terms: [
      'Project',
      'Project defaults',
      'Default language',
      'Default file extension',
      'New graphs start with this language',
    ],
  },
  {
    id: 'environment',
    section: 'project',
    title: 'Environment',
    terms: [
      'Project',
      'Environment',
      'Project environment',
      'Select environment',
      'None (blank project)',
      'Import OpenAPI / AsyncAPI',
      'OpenAPI',
      'AsyncAPI',
      'Linked template',
      'Host files',
    ],
  },
  {
    id: 'export-paths',
    section: 'project',
    title: 'Export paths',
    terms: [
      'Project',
      'Export paths',
      'Code generation',
      'Output directory',
      'Module file',
      'Function output directory',
      'export',
      'emit',
    ],
  },
  {
    id: 'graph-details',
    section: 'project',
    title: 'Graph details',
    terms: [
      'Project',
      'Graph details',
      'Module name',
      'Extends',
      'Parent class',
      'Description',
      'What this graph does',
    ],
  },
  {
    id: 'pack-lock',
    section: 'project',
    title: 'Pack lock',
    terms: [
      'Project',
      'Syntax pack lock',
      'Pack lock',
      'Base pack id',
      'Overlays',
      'python.base',
      'javascript.base',
      'syntax pack',
      '.vvs/project.json',
    ],
  },
  {
    id: 'portability',
    section: 'project',
    title: 'Portability',
    terms: [
      'Project',
      'Portability',
      'Cross-language status',
      'Data types',
      'Python-style names',
      'portability warnings',
      'Target',
    ],
  },
  {
    id: 'coa',
    section: 'project',
    title: 'COA',
    terms: [
      'Project',
      'COA',
      'Cross Over Architecture',
      'cross-over',
      'crossover',
      'Planned',
      'multi-target export',
      'node effectiveness',
    ],
  },
  {
    id: 'about',
    section: 'about',
    title: 'About',
    terms: [
      'About',
      PRODUCT_NAME,
      'Live preview',
      'Docs',
      'Visual graphs',
      'importable source code',
      'roadmap',
      'github.io',
    ],
  },
];

function blockTerms(block: SettingsSearchBlock): string[] {
  if (block.id !== 'shortcuts') return block.terms;
  return [
    ...block.terms,
    ...SHORTCUT_SETTINGS_GROUPS.flatMap((group) => [group.label, group.description]),
    ...GRAPH_SHORTCUTS.flatMap((def) => [def.label, def.hint, def.keysWin, def.keysMac]),
  ].filter((term): term is string => Boolean(term));
}

export function settingsBlockMatches(query: string, blockId: SettingsSearchBlockId): boolean {
  const block = SETTINGS_SEARCH_BLOCKS.find((item) => item.id === blockId);
  if (!block) return false;
  return fuzzyMatchAny(query, blockTerms(block));
}

export function matchingSettingsBlockIds(query: string): SettingsSearchBlockId[] {
  const q = query.trim();
  if (!q) return SETTINGS_SEARCH_BLOCKS.map((block) => block.id);
  return SETTINGS_SEARCH_BLOCKS.filter((block) => fuzzyMatchAny(q, blockTerms(block))).map(
    (block) => block.id
  );
}

export function anySettingsMatch(query: string): boolean {
  return matchingSettingsBlockIds(query).length > 0;
}
