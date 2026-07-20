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
import { documentHasFunctionImplement } from './lower/buildMembers';
import { emitIrModule, emitClassModule } from './emit';
import { CodeSink } from './codeSink';
import type { IrModule } from './ir/types';
import { resolveNodeKindId } from '@vvs/graph-types';

/** Dump graph + IR summaries as pretty JSON (Code panel / Files when target is json). */
function emitGraphJsonFile(args: {
  filePath: string;
  moduleName: string;
  extendsType?: string;
  tabLabel?: string;
  tabId?: string;
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  executionOrder?: string[];
  eventHandlers?: IrModule['handlerNodeLabels'];
  classes?: Array<{
    id?: string;
    name: string;
    extendsType?: string;
    executionOrder?: string[];
    eventHandlers?: IrModule['handlerNodeLabels'];
  }>;
}): TranspileResult {
  const content = JSON.stringify(
    {
      metadata: {
        moduleName: args.moduleName,
        extendsType: args.extendsType ?? '',
        tab: args.tabLabel,
        tabId: args.tabId,
        ...(args.classes?.length
          ? {
              classes: args.classes.map((c) => ({
                id: c.id,
                name: c.name,
                extendsType: c.extendsType ?? '',
              })),
            }
          : {}),
      },
      variables: args.variables,
      functions: args.functions,
      ...(args.classes?.length
        ? {
            classes: args.classes.map((c) => ({
              name: c.name,
              executionOrder: c.executionOrder ?? [],
              eventHandlers: c.eventHandlers ?? {},
            })),
          }
        : {
            executionOrder: args.executionOrder ?? [],
            eventHandlers: args.eventHandlers ?? {},
          }),
      graph: { nodes: args.nodes, edges: args.edges },
    },
    null,
    2
  );
  return {
    language: 'json',
    files: [{ path: args.filePath, content }],
    sourceMap: {},
  };
}

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
   * When true (default), ineffective nodes (gated imports, non-C++ Function Declare)
   * emit pack-prefixed `(x)` comment lines instead of being omitted.
   */
  emitUnsupportedComments?: boolean;
  /**
   * When true (default), author Comment [C] boxes emit pack-prefixed comment lines (U69).
   * Independent of emitUnsupportedComments.
   */
  emitUserComments?: boolean;
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
  const isFunctionTab = ctx.functions.some((f) => f.id === activeTabId || activeTabId.startsWith(`${f.id}::`));
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
    const fn = ctx.functions.find((f) => f.id === activeTabId || activeTabId.startsWith(`${f.id}::`));
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
    return emitGraphJsonFile({
      filePath,
      moduleName,
      extendsType,
      tabLabel,
      tabId,
      variables,
      functions,
      nodes,
      edges,
      executionOrder: ir.execOrder,
      eventHandlers: ir.handlerNodeLabels,
    });
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
   * When true (default), ineffective nodes (gated imports, non-C++ Function Declare)
   * emit pack-prefixed `(x)` comment lines instead of being omitted.
   */
  emitUnsupportedComments?: boolean;
  /**
   * When true (default), author Comment [C] boxes emit pack-prefixed comment lines (U69).
   * Independent of emitUnsupportedComments.
   */
  emitUserComments?: boolean;
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
    const ir = { ...classIrs[i]!, filePath, imports: [] };
    // Orphan Comment [C] (no attach target) emit once on the first class only.
    if (i > 0) {
      ir.userComments = (ir.userComments ?? []).filter((c) => Boolean(c.beforeNodeId));
    }
    // Imports live on each class member chain — do not hoist to file top.
    // Follow-up classes must not flush comments owned by another class's emit set.
    emitClassModule(sink, ir, {
      allowUnownedCommentAttachAsOrphan: i === 0,
    });
  }

  return {
    language,
    files: [{ path: filePath, content: sink.content }],
    sourceMap: sink.sourceMap,
    fragments: Object.keys(sink.fragments).length > 0 ? sink.fragments : undefined,
  };
}

/** Emit one module file per container graph (all classes on that graph). Function bodies inline via Define. */
export function transpileProject(input: ProjectTranspileInput): TranspileResult {
  const results: TranspileResult[] = [];
  const emittedHomes = new Set<string>();

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
    emitUserComments: input.emitUserComments,
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

    if (codegen.targetLanguage === 'json') {
      results.push(
        emitGraphJsonFile({
          filePath,
          moduleName: projectModuleName,
          tabLabel: tab?.name ?? projectModuleName,
          tabId: homeId,
          variables: input.variables,
          functions: input.functions,
          nodes: doc.nodes,
          edges: doc.edges,
          classes: sorted.map((cls, i) => ({
            id: cls.id,
            name: cls.name,
            extendsType: cls.extendsType ?? '',
            executionOrder: classIrs[i]?.execOrder,
            eventHandlers: classIrs[i]?.handlerNodeLabels,
          })),
        })
      );
      continue;
    }

    let homeResult = emitMergedHomeGraphModules(filePath, classIrs);
    const manifest =
      input.environmentManifest ??
      (input.environmentId ? loadEnvironmentManifest(input.environmentId) : undefined);
    if (manifest) {
      homeResult = appendHostFiles(homeResult, projectModuleName, manifest, input.integration);
    }
    results.push(homeResult);
  }

  // C++ / multi-file: companion graphs with function_implement but no class_define
  // (user-authored .cpp beside a .h home). Never invent includes or class shells.
  for (const [docId, doc] of Object.entries(input.documents)) {
    if (emittedHomes.has(docId)) continue;
    if (!documentHasFunctionImplement(doc)) continue;

    const codegen = resolveGraphCodegenSettings(doc.metadata, projectDefaults);
    if (codegen.targetLanguage !== 'cpp') continue;

    const firstImpl = doc.nodes.find(
      (n) =>
        n.type === 'vvs_standard_node' && resolveNodeKindId(n.data) === 'function_implement'
    );
    const symbolId =
      (typeof firstImpl?.data.properties?.symbolId === 'string' &&
        firstImpl.data.properties.symbolId) ||
      firstImpl?.data.graphBinding?.symbolId;
    const ownerFn =
      typeof symbolId === 'string'
        ? input.functions.find((f) => f.id === symbolId)
        : undefined;
    const ownerClass =
      (ownerFn?.classId
        ? input.classes?.find((c) => c.id === ownerFn.classId)
        : undefined) ?? input.classes?.[0];
    if (!ownerClass) continue;

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

    const tab = input.openTabs?.find((t) => t.id === docId);
    const moduleName = ownerClass.name;
    const filePath = resolveModuleEmitPath(input.integration, codegen.targetLanguage, {
      tabKind: 'main',
      moduleName,
      fallbackFileName: generatedFileName(
        { id: docId, type: 'main', name: tab?.name ?? moduleName },
        moduleName,
        codegen.targetLanguage,
        codegen.targetFileExtensions,
        moduleName
      ),
      targetFileExtensions: codegen.targetFileExtensions,
      preferFallbackOverModuleFile: false,
    });

    const ctx: CodegenContext = {
      ...baseCtx,
      targetLanguage: codegen.targetLanguage,
      targetFileExtensions: codegen.targetFileExtensions,
      codegenTarget,
      nodes: doc.nodes,
      edges: doc.edges,
      tabId: docId,
      tabLabel: tab?.name ?? moduleName,
      moduleName,
      extendsType: ownerClass.extendsType ?? '',
      activeClassId: ownerClass.id,
    };
    const manifest =
      ctx.environmentManifest ??
      (ctx.environmentId ? loadEnvironmentManifest(ctx.environmentId) : undefined);
    const ir = graphToIr(
      {
        ...ctx,
        environmentManifest: manifest,
        codegenTarget:
          ctx.codegenTarget ??
          resolveCodegenTarget(codegen.targetLanguage) ??
          undefined,
      },
      filePath
    );
    results.push(emitIrModule(ir));
    emittedHomes.add(docId);
  }

  // Function graph tabs are body editors only (Define on host chain pastes the
  // full definition into the class/module file). Do not emit separate files.

  return mergeTranspileResults(results);
}
