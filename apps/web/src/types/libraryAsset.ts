export type LibraryAssetCategory = 'Scripts' | 'Node packs' | 'Templates' | 'Environments';

export interface LibraryAsset {
  id: string;
  title: string;
  author: string;
  type: LibraryAssetCategory;
  downloads: string;
  likes: string;
  description: string;
  tags: string[];
  /** Mock preview snippet for detail panel */
  previewCode: string;
  /** What happens on "Open in project" */
  importKind: 'function_graph' | 'template_graph' | 'node_pack_only' | 'environment';
  /** Built-in environment manifest id when type is Environments */
  environmentId?: string;
  /** Manifest semver when derived from environment templates */
  environmentVersion?: string;
  /** Template category when importKind is environment */
  environmentCategory?: string;
}

export interface InstalledLibraryEntry {
  assetId: string;
  installedAt: string;
  linkedGraphId?: string;
  environmentVersion?: string;
}
