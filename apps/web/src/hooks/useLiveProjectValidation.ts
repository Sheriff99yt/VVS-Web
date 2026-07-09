'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { runProjectAnalysis } from '@/lib/projectAnalysis';
import type { ValidationMessage } from '@/lib/graphValidator';

function messagesEqual(a: ValidationMessage[], b: ValidationMessage[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((msg, i) => {
    const other = b[i]!;
    return (
      msg.level === other.level &&
      msg.message === other.message &&
      msg.tabId === other.tabId &&
      msg.nodeId === other.nodeId &&
      msg.code === other.code &&
      msg.symbolId === other.symbolId
    );
  });
}

function analysisSignature(errors: ValidationMessage[], warnings: ValidationMessage[]): string {
  const pack = (list: ValidationMessage[]) =>
    list
      .map(
        (m) =>
          `${m.level}|${m.code ?? ''}|${m.symbolId ?? ''}|${m.nodeId ?? ''}|${m.tabId ?? ''}|${m.message}`
      )
      .join('\n');
  return `${pack(errors)}::${pack(warnings)}`;
}

/** Keeps ProjectContext validation messages in sync with live graph analysis. */
export function useLiveProjectValidation(): void {
  const {
    functions,
    events,
    variables,
    classes,
    activeClassId,
    openTabs,
    projectDetails,
    targetLanguage,
    crossOverMode,
    environmentId,
    setValidationErrors,
    setValidationWarnings,
  } = useProject();
  const documents = useGraphDocuments();

  const analysis = useMemo(() => {
    if (!documents) return null;
    return runProjectAnalysis({
      documents,
      functions,
      events,
      variables,
      classes,
      activeClassId,
      openTabs,
      projectDetails,
      targetLanguage,
      crossOver: crossOverMode,
      environmentId,
    });
  }, [
    documents,
    functions,
    events,
    variables,
    classes,
    activeClassId,
    openTabs,
    projectDetails,
    targetLanguage,
    crossOverMode,
    environmentId,
  ]);

  const signature = analysis
    ? analysisSignature(analysis.errors, analysis.warnings)
    : '';
  const lastSignatureRef = useRef('');

  useEffect(() => {
    if (!analysis) return;
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;
    setValidationWarnings((prev) =>
      messagesEqual(prev, analysis.warnings) ? prev : analysis.warnings
    );
    setValidationErrors((prev) =>
      messagesEqual(prev, analysis.errors) ? prev : analysis.errors
    );
  }, [analysis, signature, setValidationWarnings, setValidationErrors]);
}
