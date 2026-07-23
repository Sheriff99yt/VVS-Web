/**
 * Library API Client
 * Fetch library items, search, and upload scripts
 */

import {
  LibraryItemType,
  LibraryItem,
  LibrarySearchRequest,
  LibrarySearchResponse,
  UploadScriptRequest,
  LibraryStatistics,
} from '@/types/libraryService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Search the library with filters
 */
export async function searchLibrary(
  req: LibrarySearchRequest
): Promise<LibrarySearchResponse> {
  const params = new URLSearchParams();

  if (req.q) params.append('q', req.q);
  if (req.type) params.append('type', req.type);
  if (req.languages?.length) params.append('languages', req.languages.join(','));
  if (req.tags?.length) params.append('tags', req.tags.join(','));
  if (req.sortBy) params.append('sortBy', req.sortBy);
  if (req.page) params.append('page', req.page.toString());
  if (req.pageSize) params.append('pageSize', req.pageSize.toString());
  if (req.semantic) params.append('semantic', 'true');

  const response = await fetch(`${API_BASE_URL}/library/search?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search library: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a complete library item by ID (includes full graph)
 */
export async function getLibraryItem(id: string): Promise<LibraryItem> {
  const response = await fetch(`${API_BASE_URL}/library/scripts/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Library item not found: ${id}`);
    }
    throw new Error(`Failed to fetch library item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Upload a new script to the library (requires authentication)
 */
export async function uploadScript(
  req: UploadScriptRequest,
  authToken: string
): Promise<LibraryItem> {
  const response = await fetch(`${API_BASE_URL}/library/scripts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload script: ${error}`);
  }

  return response.json();
}

/**
 * Get library-wide statistics
 */
export async function getLibraryStatistics(): Promise<LibraryStatistics> {
  const response = await fetch(`${API_BASE_URL}/library/statistics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch library statistics: ${response.statusText}`);
  }

  return response.json();
}
