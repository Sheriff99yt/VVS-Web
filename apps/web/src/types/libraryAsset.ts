export type LibraryAssetCategory = 'Scripts' | 'Node packs' | 'Templates';

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
  importKind: 'function_graph' | 'template_graph' | 'node_pack_only';
}

export interface InstalledLibraryEntry {
  assetId: string;
  installedAt: string;
  linkedGraphId?: string;
}
