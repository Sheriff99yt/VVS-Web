import type { GraphNode, GraphEdge, VariableSymbol, FunctionSymbol, ProjectEventDefinition, TargetLanguage, GraphDocument, TranspileResult, ProjectIntegrationConfig } from '@vvs/graph-types';
import { resolveModuleEmitPath, resolveHostEmitPath, shouldEmitHostFile } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { loadEnvironmentManifest, renderHostFileTemplate } from '@vvs/environment-templates';
import { generatedFileName } from './graphTabs';
import type { GraphTab } from '@vvs/graph-types';
import { graphToIr } from './lower/graphToIr';
import { emitIrModule } from './emit';

export interface CodegenContext {
  moduleName: string;
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
  environmentId?: string;
  environmentManifest?: ProjectEnvironmentManifest;
  integration?: ProjectIntegrationConfig;
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

export function generateMockTranspileResult(ctx: CodegenContext): TranspileResult {
  const {
    nodes,
    edges,
    targetLanguage,
    variables,
    functions,
    moduleName,
    extendsType,
    tabLabel,
    tabId,
  } = ctx;

  const activeTabId = tabId ?? 'main';
  const tabType: GraphTab['type'] =
    activeTabId === 'main'
      ? 'main'
      : functions.some((f) => f.id === activeTabId)
        ? 'function'
        : 'main';
  const filePath = resolveModuleEmitPath(ctx.integration, targetLanguage, {
    tabKind: tabType === 'function' ? 'function' : 'main',
    moduleName,
    functionBaseName: tabLabel?.replace(/^Function:\s*/, ''),
    fallbackFileName: generatedFileName(
      { id: activeTabId, type: tabType, name: tabLabel ?? 'Graph' },
      moduleName,
      targetLanguage
    ),
  });

  const manifest =
    ctx.environmentManifest ??
    (ctx.environmentId ? loadEnvironmentManifest(ctx.environmentId) : undefined);

  const codegenCtx: CodegenContext = { ...ctx, environmentManifest: manifest };

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
  if (activeTabId === 'main' && manifest) {
    return appendHostFiles(result, moduleName, manifest, ctx.integration);
  }
  return result;
}

export function generateMockCode(ctx: CodegenContext): string {
  return generateMockTranspileResult(ctx).files[0]?.content ?? '';
}
