import type {
  GraphNode,
  GraphEdge,
  VariableSymbol,
  FunctionSymbol,
  ProjectEventDefinition,
  TargetLanguage,
  GraphDocument,
  TranspileResult,
  ProjectIntegrationConfig,
  ClassSymbol,
  ProjectSnapshot,
} from '@vvs/graph-types';
import {
  resolveModuleEmitPath,
  resolveHostEmitPath,
  shouldEmitHostFile,
  MAIN_GRAPH_CONTAINER_ID,
  MAIN_CLASS_ID,
  classForHomeGraphId,
  classHomeGraphId,
  classGraphHasDefineNodes,
} from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { loadEnvironmentManifest, renderHostFileTemplate } from '@vvs/environment-templates';
import { generatedFileName } from './graphTabs';
import type { GraphTab } from '@vvs/graph-types';
import { graphToIr } from './lower/graphToIr';
import { emitIrModule } from './emit';

export interface CodegenContext {
  moduleName: string;
  /** Snapshot project module name — used for cross-class MAIN_CLASS import paths. */
  projectModuleName?: string;
  extendsType: string;
  targetLanguage: TargetLanguage;
  variables: VariableSymbol[];
  projectEvents: ProjectEventDefinition[];
  functions: FunctionSymbol[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  tabLabel?: string;
  tabId?: string;
  documents?: Record<string, GraphDocument>;
  classes?: ClassSymbol[];
  activeClassId?: string;
  environmentId?: string;
  environmentManifest?: ProjectEnvironmentManifest;
  integration?: ProjectIntegrationConfig;
}

function mergeTranspileResults(results: TranspileResult[]): TranspileResult {
  if (results.length === 0) {
    return { language: 'python', files: [], sourceMap: {} };
  }
  const language = results[0]!.language;
  const files = results.flatMap((r) => r.files);
  const sourceMap: TranspileResult['sourceMap'] = {};
  const fragments: TranspileResult['fragments'] = {};
  for (const result of results) {
    Object.assign(sourceMap, result.sourceMap);
    if (result.fragments) Object.assign(fragments, result.fragments);
  }
  return {
    language,
    files,
    sourceMap,
    fragments: Object.keys(fragments).length > 0 ? fragments : undefined,
  };
}

function appendHostFiles(
  result: TranspileResult,
  moduleName: string,
  manifest?: ProjectEnvironmentManifest,
  integration?: ProjectIntegrationConfig
): TranspileResult {
  if (!manifest?.hostFiles?.length) return result;
  const hostFiles = manifest.hostFiles
    .filter((host) => shouldEmitHostFile(integration, host.path))
    .map((host) => ({
      path: resolveHostEmitPath(integration, host.path),
      content: renderHostFileTemplate(host.template, moduleName),
    }));
  if (hostFiles.length === 0) return result;
  return {
    ...result,
    files: [...result.files, ...hostFiles],
  };
}

function resolveTabCodegen(ctx: CodegenContext): {
  moduleName: string;
  extendsType: string;
  activeClassId?: string;
  isClassHomeModule: boolean;
  isFunctionTab: boolean;
  isOrgGraph: boolean;
  appendHost: boolean;
  tabType: GraphTab['type'];
} {
  const activeTabId = ctx.tabId ?? 'main';
  const homeClass = ctx.classes ? classForHomeGraphId(ctx.classes, activeTabId) : undefined;
  const isFunctionTab = ctx.functions.some((f) => f.id === activeTabId);
  const isOrgGraph = activeTabId === MAIN_GRAPH_CONTAINER_ID && !homeClass;
  const isLegacyMain = activeTabId === 'main';
  const isClassHomeModule = homeClass != null;

  let moduleName = ctx.moduleName;
  let extendsType = ctx.extendsType;
  let activeClassId = ctx.activeClassId;

  if (homeClass) {
    moduleName =
      homeClass.id === MAIN_CLASS_ID && ctx.moduleName.trim()
        ? ctx.moduleName
        : homeClass.name;
    extendsType = homeClass.extendsType ?? '';
    activeClassId = homeClass.id;
  } else if (isFunctionTab) {
    const fn = ctx.functions.find((f) => f.id === activeTabId);
    if (fn) {
      moduleName = fn.name;
      activeClassId = fn.classId ?? activeClassId;
    }
  }

  const tabType: GraphTab['type'] = isFunctionTab
    ? 'function'
    : isClassHomeModule || isLegacyMain
      ? 'main'
      : 'container';

  const appendHost = isClassHomeModule || isLegacyMain;

  return {
    moduleName,
    extendsType,
    activeClassId,
    isClassHomeModule,
    isFunctionTab,
    isOrgGraph,
    appendHost,
    tabType,
  };
}

export function generateMockTranspileResult(ctx: CodegenContext): TranspileResult {
  const {
    nodes,
    edges,
    targetLanguage,
    variables,
    functions,
    tabLabel,
    tabId,
  } = ctx;

  const activeTabId = tabId ?? 'main';
  const resolved = resolveTabCodegen(ctx);
  const { moduleName, extendsType, activeClassId, appendHost, tabType } = resolved;
  const projectModuleName = ctx.projectModuleName ?? ctx.moduleName;

  const filePath = resolveModuleEmitPath(ctx.integration, targetLanguage, {
    tabKind: tabType === 'function' ? 'function' : 'main',
    moduleName,
    functionBaseName: tabLabel?.replace(/^Function:\s*/, ''),
    fallbackFileName: generatedFileName(
      { id: activeTabId, type: tabType, name: tabLabel ?? moduleName },
      moduleName,
      targetLanguage,
      resolved.isClassHomeModule ? moduleName : undefined
    ),
  });

  const manifest =
    ctx.environmentManifest ??
    (ctx.environmentId ? loadEnvironmentManifest(ctx.environmentId) : undefined);

  const codegenCtx: CodegenContext = {
    ...ctx,
    moduleName,
    projectModuleName,
    extendsType,
    activeClassId,
    environmentManifest: manifest,
  };

  if (targetLanguage === 'json') {
    const ir = graphToIr(codegenCtx, filePath);
    const content = JSON.stringify(
      {
        metadata: { moduleName, extendsType, tab: tabLabel, tabId },
        variables,
        functions,
        executionOrder: ir.execOrder,
        eventHandlers: ir.handlerNodeLabels,
        graph: { nodes, edges },
      },
      null,
      2
    );
    return {
      language: targetLanguage,
      files: [{ path: filePath, content }],
      sourceMap: {},
    };
  }

  const ir = graphToIr(codegenCtx, filePath);
  const result = emitIrModule(ir);
  if (appendHost && manifest) {
    return appendHostFiles(result, moduleName, manifest, ctx.integration);
  }
  return result;
}

export function generateMockCode(ctx: CodegenContext): string {
  return generateMockTranspileResult(ctx).files[0]?.content ?? '';
}

export interface ProjectTranspileInput {
  projectDetails: ProjectSnapshot['projectDetails'];
  targetLanguage: TargetLanguage;
  variables: VariableSymbol[];
  projectEvents: ProjectEventDefinition[];
  functions: FunctionSymbol[];
  documents: Record<string, GraphDocument>;
  classes?: ClassSymbol[];
  activeClassId?: string;
  openTabs?: GraphTab[];
  environmentId?: string;
  environmentManifest?: ProjectEnvironmentManifest;
  integration?: ProjectIntegrationConfig;
}

/** Emit one module file per class home graph (with defines) and per function tab. */
export function generateProjectTranspileResult(input: ProjectTranspileInput): TranspileResult {
  const results: TranspileResult[] = [];
  const emittedTabIds = new Set<string>();

  const baseCtx: Omit<CodegenContext, 'nodes' | 'edges' | 'tabId' | 'tabLabel'> = {
    moduleName: input.projectDetails.moduleName,
    extendsType: input.projectDetails.extendsType,
    targetLanguage: input.targetLanguage,
    variables: input.variables,
    projectEvents: input.projectEvents,
    functions: input.functions,
    documents: input.documents,
    classes: input.classes,
    activeClassId: input.activeClassId,
    environmentId: input.environmentId,
    environmentManifest: input.environmentManifest,
    integration: input.integration,
  };

  for (const cls of input.classes ?? []) {
    const homeId = classHomeGraphId(cls);
    const doc = input.documents[homeId];
    if (!doc || !classGraphHasDefineNodes(doc)) continue;
    if (emittedTabIds.has(homeId)) continue;
    emittedTabIds.add(homeId);

    const tab = input.openTabs?.find((t) => t.id === homeId);
    results.push(
      generateMockTranspileResult({
        ...baseCtx,
        nodes: doc.nodes,
        edges: doc.edges,
        tabId: homeId,
        tabLabel: tab?.name ?? cls.name,
        activeClassId: cls.id,
      })
    );
  }

  for (const func of input.functions) {
    const doc = input.documents[func.id];
    if (!doc) continue;
    if (emittedTabIds.has(func.id)) continue;
    emittedTabIds.add(func.id);

    const tab = input.openTabs?.find((t) => t.id === func.id);
    results.push(
      generateMockTranspileResult({
        ...baseCtx,
        nodes: doc.nodes,
        edges: doc.edges,
        tabId: func.id,
        tabLabel: tab?.name ?? `Function: ${func.name}`,
      })
    );
  }

  return mergeTranspileResults(results);
}
