export interface LibraryCategory {
  name: string;
  items: LibraryNodeTemplate[];
}

import { PinDefinition } from './graph';

export interface LibraryNodeTemplate {
  type: string;             
  label: string;
  category: string;
  description?: string;
  inputs?: PinDefinition[];
  outputs?: PinDefinition[];
  linkedGraphId?: string;
  linkKind?: 'call_function' | 'use_macro' | 'import_module';
}

export interface CodePreviewState {
  code: string;
  language: 'typescript' | 'go' | 'json';
  isCompiling: boolean;
  errors?: string[];
}

export interface NodePropertyDef {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[]; // Used if type is 'select'
  defaultValue?: unknown;
}

export interface NodeState {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  propertyDefs: NodePropertyDef[];
}
