export type {
  ApiTypeRef,
  ApiTypeDef,
  ApiEventDef,
  ApiMethodDef,
  ApiMethodTargetBinding,
  ApiSurface,
  HostFileTemplate,
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
