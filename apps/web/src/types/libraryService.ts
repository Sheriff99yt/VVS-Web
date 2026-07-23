/**
 * Library Service Types
 * Client-side types for interacting with the VVS Library backend
 */

export type LibraryItemType = 'script' | 'node_pack' | 'template';

export interface LibraryItemSummary {
  id: string;
  type: LibraryItemType;
  title: string;
  description: string;
  author: string;
  rating: number;
  downloads: number;
  targetLanguages: string[];
  version: string;
}

export interface LibraryItem extends LibraryItemSummary {
  tags: string[];
  graph: any; // ProjectSnapshot or similar
  nodeCount: number;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  licenseId: string;
  gitHubUrl: string;
}

export interface LibrarySearchRequest {
  q?: string;
  type?: LibraryItemType;
  languages?: string[];
  tags?: string[];
  sortBy?: 'downloads' | 'rating' | 'createdAt';
  page?: number;
  pageSize?: number;
  semantic?: boolean;
}

export interface LibrarySearchResponse {
  items: LibraryItemSummary[];
  total: number;
  page: number;
}

export interface UploadScriptRequest {
  title: string;
  description: string;
  graph: any; // ProjectSnapshot
  targetLanguages: string[];
  tags: string[];
  licenseId: string;
}

export interface LibraryStatistics {
  totalItems: number;
  totalScripts: number;
  totalNodePacks: number;
  totalTemplates: number;
}
