export type DocsActive =
  | { type: 'home' }
  | { type: 'feature'; id: string }
  | { type: 'node'; id: string };