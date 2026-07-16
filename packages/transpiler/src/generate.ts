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
  CodegenTarget,
  TargetFileExtensions,
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
  resolveCodegenTarget,
  resolveGraphCodegenSettings,
} from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { loadEnvironmentManifest, renderHostFileTemplate } from '@vvs/environment-templates';
import { generatedFileName } from './graphTabs';
import type { GraphTab } from '@vvs/graph-types';
import { graphToIr } from './lower/graphToIr';
import { emitIrModule, emitClassModule } from './emit';
import { CodeSink } from './codeSink';
import type { IrModule } from './ir/types';
import { resolveNodeKindId } from '@vvs/graph-types';

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
  /** Resolved syntax-pack target — family, capabilities, optional pack lock. */
  codegenTarget?: CodegenTarget;
  /** Per-graph / per-project extension overrides for emit paths. */
  targetFileExtensions?: TargetFileExtensions;
  /** Container folder prefix for emitted files (from graph folder placement). */
  emitSubdir?: string;
  /**
   * When true (default), language-gated imports that do not match the target
   * emit pack-prefixed `(x)` comment lines instead of being silently omitted.
   */
  emitUnsupportedComments?: boolean;
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
  const classesOnHome =
    ctx.classes?.filter((c) => classHomeGraphId(c) === activeTabId) ?? [];
  const homeClass =
    (ctx.activeClassId
      ? classesOnHome.find((c) => c.id === ctx.activeClassId)
      : undefined) ??
    (ctx.classes ? classForHomeGraphId(ctx.classes, activeTabId) : undefined);
  const isFunctionTab = ctx.functions.some((f) => f.id === activeTabId);
  const isOrgGraph = activeTabId === MAIN_GRAPH_CONTAINER_ID && !homeClass;
  const isLegacyMain = activeTabId === 'main';
  const isClassHomeModule = homeClass != null;

  let moduleName = ctx.moduleName;
  let extendsType = ctx.extendsType;
  let activeClassId = ctx.activeClassId;

  if (homeClass) {
    // ClassDecl / IR moduleName stays the class name. File path for multi-class
    // homes is chosen in transpileProject (one graph → one file).
    moduleName =
      homeClass.id === MAIN_CLASS_ID &&
      classesOnHome.length <= 1 &&
      ctx.moduleName.trim()
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

export function transpileGraph(ctx: CodegenContext): TranspileResult {
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
      ctx.targetFileExtensions,
      resolved.isClassHomeModule ? moduleName : undefined
    ),
    targetFileExtensions: ctx.targetFileExtensions,
    subdirPrefix: ctx.emitSubdir,
    // Single-class focused transpileGraph may still use class-named fallback.
    // Project emit (transpileProject) merges classes and resolves path without this flag.
    preferFallbackOverModuleFile: resolved.isClassHomeModule,
  });

  const manifest =
    ctx.environmentManifest ??
    (ctx.environmentId ? loadEnvironmentManifest(ctx.environmentId) : undefined);

  const codegenTarget =
    ctx.codegenTarget ??
    resolveCodegenTarget(targetLanguage, {
      capabilities: undefined,
      syntaxPackLock: undefined,
    }) ??
    undefined;

  const codegenCtx: CodegenContext = {
    ...ctx,
    moduleName,
    projectModuleName,
    extendsType,
    activeClassId,
    environmentManifest: manifest,
    codegenTarget,
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

export function transpileGraphCode(ctx: CodegenContext): string {
  return transpileGraph(ctx).files[0]?.content ?? '';
}

export interface ProjectTranspileInput {
  projectDetails: ProjectSnapshot['projectDetails'];
  targetLanguage: TargetLanguage;
  targetFileExtensions?: TargetFileExtensions;
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
  codegenTarget?: CodegenTarget;
  /**
   * When true (default), language-gated imports that do not match the target
   * emit pack-prefixed `(x)` comment lines instead of being silently omitted.
   */
  emitUnsupportedComments?: boolean;
}

function classDefineY(doc: GraphDocument, cls: ClassSymbol): number {
  for (const node of doc.nodes) {
    if (resolveNodeKindId(node.data) !== 'class_define') continue;
    const sym =
      (typeof node.data.properties?.symbolId === 'string' && node.data.properties.symbolId) ||
      (typeof node.data.graphBinding?.symbolId === 'string' && node.data.graphBinding.symbolId) ||
      '';
    if (sym === cls.id) return node.position.y;
  }
  return Number.POSITIVE_INFINITY;
}

function sortClassesByDefineY(doc: GraphDocument, classes: ClassSymbol[]): ClassSymbol[] {
  return [...classes].sort((a, b) => classDefineY(doc, a) - classDefineY(doc, b));
}

/** One container graph → one file: emit each class body (imports in chain order). */
export function emitMergedHomeGraphModules(filePath: string, classIrs: IrModule[]): TranspileResult {
  if (classIrs.length === 0) {
    return { language: 'python', files: [], sourceMap: {} };
  }
  if (classIrs.length === 1) {
    const only = classIrs[0]!;
    return emitIrModule({ ...only, filePath });
  }

  const sink = new CodeSink(filePath);
  const language = classIrs[0]!.targetLanguage;

  for (let i = 0; i < classIrs.length; i++) {
    if (i > 0 && sink.lineCount > 0) sink.appendRaw('');
    // Imports live on each class member chain — do not hoist to file top.
    emitClassModule(sink, { ...classIrs[i]!, filePath, imports: [] });
  }

  return {
    language,
    files: [{ path: filePath, content: sink.content }],
    sourceMap: sink.sourceMap,
    fragments: Object.keys(sink.fragments).length > 0 ? sink.fragments : undefined,
  };
}

/** Emit one module file per container graph (all classes on that graph) and per function tab. */
export function transpileProject(input: ProjectTranspileInput): TranspileResult {
  const results: TranspileResult[] = [];
  const emittedHomes = new Set<string>();
  const emittedFunctions = new Set<string>();

  const projectDefaults = {
    targetLanguage: input.targetLanguage,
    targetFileExtensions: input.targetFileExtensions,
  };

  const baseCtx: Omit<
    CodegenContext,
    'nodes' | 'edges' | 'tabId' | 'tabLabel' | 'targetLanguage' | 'targetFileExtensions' | 'codegenTarget'
  > = {
    moduleName: input.projectDetails.moduleName,
    projectModuleName: input.projectDetails.moduleName,
    extendsType: input.projectDetails.extendsType,
    variables: input.variables,
    projectEvents: input.projectEvents,
    functions: input.functions,
    documents: input.documents,
    classes: input.classes,
    activeClassId: input.activeClassId,
    environmentId: input.environmentId,
    environmentManifest: input.environmentManifest,
    integration: input.integration,
    emitUnsupportedComments: input.emitUnsupportedComments,
  };

  const classesByHome = new Map<string, ClassSymbol[]>();
  for (const cls of input.classes ?? []) {
    const homeId = classHomeGraphId(cls);
    const doc = input.documents[homeId];
    if (!doc || (!classGraphHasDefineNodes(doc) && cls.id !== MAIN_CLASS_ID)) continue;
    const list = classesByHome.get(homeId) ?? [];
    list.push(cls);
    classesByHome.set(homeId, list);
  }

  for (const [homeId, homeClasses] of classesByHome) {
    if (emittedHomes.has(homeId)) continue;
    emittedHomes.add(homeId);

    const doc = input.documents[homeId]!;
    const codegen = resolveGraphCodegenSettings(doc.metadata, projectDefaults);
    const codegenTarget =
      resolveCodegenTarget(codegen.targetLanguage, {
        capabilities: input.codegenTarget
          ? { [input.codegenTarget.family]: input.codegenTarget.capabilities }
          : undefined,
        syntaxPackLock: input.codegenTarget?.packLock
          ? { [input.codegenTarget.family]: input.codegenTarget.packLock }
          : undefined,
      }) ??
      input.codegenTarget ??
      undefined;

    const sorted = sortClassesByDefineY(doc, homeClasses);
    const projectModuleName = input.projectDetails.moduleName.trim() || sorted[0]!.name;
    const tab = input.openTabs?.find((t) => t.id === homeId);
    const filePath = resolveModuleEmitPath(input.integration, codegen.targetLanguage, {
      tabKind: 'main',
      moduleName: projectModuleName,
      fallbackFileName: generatedFileName(
        { id: homeId, type: 'main', name: tab?.name ?? projectModuleName },
        projectModuleName,
        codegen.targetLanguage,
        codegen.targetFileExtensions,
        projectModuleName
      ),
      targetFileExtensions: codegen.targetFileExtensions,
      preferFallbackOverModuleFile: false,
    });

    const classIrs: IrModule[] = sorted.map((cls) => {
      const ctx: CodegenContext = {
        ...baseCtx,
        targetLanguage: codegen.targetLanguage,
        targetFileExtensions: codegen.targetFileExtensions,
        codegenTarget,
        nodes: doc.nodes,
        edges: doc.edges,
        tabId: homeId,
        tabLabel: tab?.name ?? cls.name,
        moduleName: cls.name,
        extendsType: cls.extendsType ?? '',
        activeClassId: cls.id,
      };
      const manifest =
        ctx.environmentManifest ??
        (ctx.environmentId ? loadEnvironmentManifest(ctx.environmentId) : undefined);
      const resolvedTarget =
        ctx.codegenTarget ??
        resolveCodegenTarget(codegen.targetLanguage, {
          capabilities: undefined,
          syntaxPackLock: undefined,
        }) ??
        undefined;
      return graphToIr(
        {
          ...ctx,
          moduleName: cls.name,
          projectModuleName,
          extendsType: cls.extendsType ?? '',
          activeClassId: cls.id,
          environmentManifest: manifest,
          codegenTarget: resolvedTarget,
        },
        filePath
      );
    });

    let homeResult = emitMergedHomeGraphModules(filePath, classIrs);
    const manifest =
      input.environmentManifest ??
      (input.environmentId ? loadEnvironmentManifest(input.environmentId) : undefined);
    if (manifest) {
      homeResult = appendHostFiles(homeResult, projectModuleName, manifest, input.integration);
    }
    results.push(homeResult);
  }

  for (const func of input.functions) {
    if (emittedFunctions.has(func.id)) continue;
    emittedFunctions.add(func.id);
    const doc = input.documents[func.id];
    if (!doc) continue;
    const tab = input.openTabs?.find((t) => t.id === func.id);
    const codegen = resolveGraphCodegenSettings(doc.metadata, projectDefaults);
    const codegenTarget =
      resolveCodegenTarget(codegen.targetLanguage, {
        capabilities: input.codegenTarget
          ? { [input.codegenTarget.family]: input.codegenTarget.capabilities }
          : undefined,
        syntaxPackLock: input.codegenTarget?.packLock
          ? { [input.codegenTarget.family]: input.codegenTarget.packLock }
          : undefined,
      }) ??
      input.codegenTarget ??
      undefined;
    results.push(
      transpileGraph({
        ...baseCtx,
        targetLanguage: codegen.targetLanguage,
        targetFileExtensions: codegen.targetFileExtensions,
        codegenTarget,
        nodes: doc.nodes,
        edges: doc.edges,
        tabId: func.id,
        tabLabel: tab?.name ?? `Function: ${func.name}`,
        activeClassId: func.classId ?? input.activeClassId,
      })
    );
  }

  return mergeTranspileResults(results);
}
