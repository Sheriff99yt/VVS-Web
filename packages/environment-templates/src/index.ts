export type {
  ApiTypeRef,
  ApiTypeDef,
  ApiEventDef,
  ApiMethodDef,
  ApiMethodTargetBinding,
  ApiSurface,
  HostFileTemplate,
  EnvironmentDevcontainerRef,
  ProjectEnvironmentManifest,
  ResolvedApiSurface,
} from './types';

export {
  listBuiltinEnvironments,
  listAllEnvironments,
  loadEnvironmentManifest,
  isEnvironmentManifest,
  mergeEnvironmentManifest,
  registerEnvironmentManifest,
} from './loader';

export { validateEnvironmentManifest, type ManifestValidationIssue } from './validate';

export {
  jsonSchemaTypeToPinType,
  parametersFromJsonSchemaProperties,
  slugifyId,
  importMethodsFromOpenApi,
  importEventsFromAsyncApi,
  parseBackstageTemplateYaml,
  normalizeBackstageTemplate,
  inferHostFileRole,
  backstageMetaToEnvId,
  buildEnvironmentManifest,
  type OpenApiDocument,
  type VvsOperationExtension,
  type ImportOpenApiOptions,
  type AsyncApiDocument,
  type ImportAsyncApiOptions,
  type BackstageTemplateMeta,
  type BuildEnvironmentManifestInput,
  importApiSurfaceFromTypeSpec,
  suggestedTypeSpecEnvId,
  type TypeSpecImportDocument,
  type TypeSpecImportedModel,
  type TypeSpecImportedOperation,
  type ImportTypeSpecOptions,
} from './import';

export {
  resolveApiSurface,
  resolveMethodBinding,
  resolveEventDef,
  substituteCallExpr,
  renderHostFileTemplate,
} from './resolveApiSurface';

export {
  expandEnvironmentSymbols,
  buildEnvironmentSpawnDetail,
  type ExpandEnvironmentSymbolsOptions,
} from './expandEnvironmentSymbols';

export { createProjectFromEnvironment } from './createProjectFromEnvironment';

export {
  summarizeEnvironmentManifest,
  previewHostEntry,
  type EnvironmentManifestSummary,
} from './environmentSummary';

export {
  ENVIRONMENT_CATEGORIES,
  resolveEnvironmentCategory,
  environmentCategoryLabel,
  groupEnvironmentsByCategory,
  isEnvironmentCategory,
  type EnvironmentCategory,
} from './categories';

export {
  adoptHostFileRules,
  filterGeneratedFilesForHostPolicy,
  generateHostFiles,
  hashHostContent,
  mergeImportedManifest,
  normalizeHostFileContent,
  planHostFileWrites,
  recordAppliedHostFiles,
  refreshLinkedEnvironment,
  skippedHostEmitPaths,
  type HostFileDrift,
  type HostFileSkipReason,
  type HostFileWritePlan,
} from './hostFiles';

export {
  refreshEnvironmentTemplate,
  type HostFileRefreshAction,
  type HostFileRefreshNote,
  type RefreshEnvironmentTemplateInput,
  type RefreshEnvironmentTemplateResult,
} from './refreshEnvironmentTemplate';

export { threeWayMerge, type ThreeWayMergeResult } from './threeWayMerge';
