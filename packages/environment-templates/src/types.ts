import type { ProjectSnapshot, SymbolParameter, TargetLanguage } from '@vvs/graph-types';
import type { EnvironmentCategory } from './categories';

export type { EnvironmentCategory };

export interface ApiTypeRef {
  id: string;
}

export interface ApiTypeDef {
  id: string;
  displayName: string;
  extends?: ApiTypeRef;
  targets?: Partial<Record<TargetLanguage, { extendsName?: string }>>;
}

export interface ApiEventDef {
  id: string;
  name: string;
  parameters: SymbolParameter[];
}

export interface ApiMethodTargetBinding {
  callExpr: string;
  defHeader?: string;
}

export interface ApiMethodDef {
  id: string;
  name: string;
  parameters: SymbolParameter[];
  role: 'native' | 'overrideable' | 'lifecycle';
  targets: Partial<Record<TargetLanguage, ApiMethodTargetBinding>>;
}

export interface ApiSurface {
  types: ApiTypeDef[];
  methods: ApiMethodDef[];
  events: ApiEventDef[];
}

export interface HostFileTemplate {
  path: string;
  role: 'entry' | 'config' | 'asset';
  template: string;
}

export interface ProjectEnvironmentManifest {
  id: string;
  version: string;
  displayName: string;
  description: string;
  category?: EnvironmentCategory;
  defaultTarget: TargetLanguage;
  supportedTargets: TargetLanguage[];
  module: {
    defaultName: string;
    extends?: ApiTypeRef;
  };
  apiSurface: ApiSurface;
  hostFiles: HostFileTemplate[];
  starter?: Partial<ProjectSnapshot>;
}

export interface ResolvedApiSurface {
  extendsType: string;
  events: ApiEventDef[];
  methods: ApiMethodDef[];
  natives: ApiMethodDef[];
  overrideable: ApiMethodDef[];
}
