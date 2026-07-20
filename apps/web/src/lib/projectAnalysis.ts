import {
  analyzeProject,
  collectPortabilityFeatures,
  diagnosticsToValidationMessages,
  variablePortabilityFeatureSets,
  type TargetLanguage,
  type FunctionSymbol,
  type GraphDocument,
  type ProjectEventDefinition,
  type VariableSymbol,
  type CrossOverArchitectureMode,
  type ClassSymbol,
} from '@vvs/graph-types';
import {
  analyzePortability,
  analyzeVariablePortabilityDiagnostics,
  analyzeCrossOverDiagnostics,
} from '@vvs/language-profiles';
import type { ValidationMessage } from './graphValidator';
import type { GraphTab } from '@/contexts/ProjectContext';
import { environmentAnalysisContext } from '@/lib/environmentContext';
import { effectiveCrossOverMode } from '@/lib/coaPolicy';
import { readUiPreferences } from './uiPreferences';

export interface ProjectAnalysisInput {
  documents: Record<string, GraphDocument>;
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  variables?: VariableSymbol[];
  classes?: ClassSymbol[];
  activeClassId?: string;
  openTabs?: GraphTab[];
  projectDetails: { extendsType: string };
  targetLanguage: TargetLanguage;
  crossOver?: CrossOverArchitectureMode;
  environmentId?: string;
}

export function runProjectAnalysis(input: ProjectAnalysisInput): {
  ok: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
} {
  const variables = input.variables ?? [];
  const features = collectPortabilityFeatures({
    projectDetails: input.projectDetails,
    functions: input.functions,
    variables,
  });
  const variableFeatureSets = variablePortabilityFeatureSets(variables);
  const portabilityDiagnostics = [
    ...analyzePortability(features, input.targetLanguage),
    ...analyzeVariablePortabilityDiagnostics(variableFeatureSets, input.targetLanguage),
  ];
  const crossOver = effectiveCrossOverMode(input.crossOver ?? { enabled: false, allowedLanguages: [] });
  const crossOverDiagnostics = analyzeCrossOverDiagnostics(
    crossOver,
    features,
    variableFeatureSets
  );
  const envContext = environmentAnalysisContext(input.environmentId, input.targetLanguage);

  const result = analyzeProject({
    documents: input.documents,
    functions: input.functions,
    events: input.events,
    variables,
    classes: input.classes,
    activeClassId: input.activeClassId,
    openTabs: input.openTabs,
    projectDetails: input.projectDetails,
    targetLanguage: input.targetLanguage,
    portabilityDiagnostics,
    crossOver,
    crossOverDiagnostics,
    ...envContext,
  });

  const messages = diagnosticsToValidationMessages(result.diagnostics);
  const errors = messages.filter((m) => m.level === 'error');
  const warnings = messages.filter((m) => m.level === 'warning');

  // Verify that for every overload of every function, a corresponding function_define node is present on the canvas
  for (const func of input.functions) {
    for (const overload of func.overloads) {
      let found = false;
      for (const [tabId, doc] of Object.entries(input.documents)) {
        const node = doc.nodes.find(
          (n) =>
            n.data.kindId === 'function_define' &&
            n.data.properties?.symbolId === func.id &&
            (n.data.graphBinding?.overloadId === overload.id || n.data.properties?.overloadId === overload.id)
        );
        if (node) {
          found = true;
          break;
        }
      }

      if (!found) {
        const classHomeTabId = input.classes?.find((c) => c.id === func.classId)?.id || 'main';
        errors.push({
          level: 'error',
          message: `The overload of function "${func.name}" is missing its visual declaration node on the canvas. Place a Declare node for this signature to resolve.`,
          tabId: classHomeTabId,
          code: 'DEFINE_NODE_MISSING',
        });
      }
    }
  }

  const prefs = readUiPreferences();

  // (1) Allow connecting multiple execution outputs to one input (warns when enabled)
  if (prefs.allowMultipleExecToInput) {
    for (const [tabId, doc] of Object.entries(input.documents)) {
      const execInputCounts = new Map<string, number>();
      for (const edge of doc.edges) {
        const isExec = edge.data?.pinType === 'execution' ||
          (edge.sourceHandle && edge.sourceHandle.includes('exec')) ||
          (edge.targetHandle && edge.targetHandle.includes('exec'));
        if (isExec && edge.targetHandle) {
          const key = `${edge.target}:${edge.targetHandle}`;
          execInputCounts.set(key, (execInputCounts.get(key) || 0) + 1);
        }
      }

      for (const [key, count] of execInputCounts.entries()) {
        if (count > 1) {
          const [nodeId, pinId] = key.split(':');
          const node = doc.nodes.find((n) => n.id === nodeId);
          const label = node?.data?.label || nodeId;
          warnings.push({
            level: 'warning',
            message: `Multiple execution outputs (${count}) are connected to the input pin "${pinId}" on "${label}". This is not recommended and can cause duplicate or redundant code generation.`,
            tabId,
            nodeId,
            code: 'MULTIPLE_EXEC_TO_INPUT',
          });
        }
      }
    }
  }

  // (2) Dynamic/weak typing warnings
  if (prefs.warnDynamicWeakTyping) {
    const isDynamicLang = input.targetLanguage === 'python' ||
      input.targetLanguage === 'javascript' ||
      input.targetLanguage === 'gdscript';

    if (isDynamicLang) {
      warnings.push({
        level: 'warning',
        message: `The project target language "${input.targetLanguage}" defaults to dynamic/weak typing. This can lead to implicit coercion, unexpected runtime exceptions, and increased cognitive overhead.`,
        code: 'DYNAMIC_TYPING_LANGUAGE',
      });
    }

    for (const [tabId, doc] of Object.entries(input.documents)) {
      for (const edge of doc.edges) {
        if (edge.data?.pinType === 'data_any') {
          warnings.push({
            level: 'warning',
            message: `Wire is using dynamic typing (any). This bypasses static type checks and can lead to runtime exceptions.`,
            tabId,
            nodeId: edge.target,
            code: 'DYNAMIC_TYPING_WIRE',
          });
        }
      }
    }
  }

  return {
    ok: result.ok,
    errors,
    warnings,
  };
}
