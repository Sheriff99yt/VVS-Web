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
  return {
    ok: result.ok,
    errors: messages.filter((m) => m.level === 'error'),
    warnings: messages.filter((m) => m.level === 'warning'),
  };
}
