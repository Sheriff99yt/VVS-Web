import {
  analyzeProject,
  collectPortabilityFeatures,
  diagnosticsToValidationMessages,
  type TargetLanguage,
  type FunctionSymbol,
  type GraphDocument,
  type ProjectEventDefinition,
} from '@vvs/graph-types';
import { analyzePortability } from '@vvs/language-profiles';
import type { ValidationMessage } from './graphValidator';
import type { GraphVariable } from '@/types/graph';

export interface ProjectAnalysisInput {
  documents: Record<string, GraphDocument>;
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  variables?: GraphVariable[];
  projectDetails: { extendsType: string };
  targetLanguage: TargetLanguage;
}

export function runProjectAnalysis(input: ProjectAnalysisInput): {
  ok: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
} {
  const features = collectPortabilityFeatures({
    projectDetails: input.projectDetails,
    functions: input.functions,
    variables: input.variables,
  });
  const portabilityDiagnostics = analyzePortability(features, input.targetLanguage);
  const result = analyzeProject({
    documents: input.documents,
    functions: input.functions,
    events: input.events.map((e) => ({ id: e.id, name: e.name })),
    variables: input.variables,
    projectDetails: input.projectDetails,
    targetLanguage: input.targetLanguage,
    portabilityDiagnostics,
  });

  const messages = diagnosticsToValidationMessages(result.diagnostics);
  return {
    ok: result.ok,
    errors: messages.filter((m) => m.level === 'error'),
    warnings: messages.filter((m) => m.level === 'warning'),
  };
}
