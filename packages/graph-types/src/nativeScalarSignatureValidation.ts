import type { AnalyzeProjectInput } from './analyze';
import type { Diagnostic } from './diagnostic';
import { analyzeNativeScalarFunctionGraph, NativeScalarFunctionGraphFailure } from './nativeScalarFunctionGraphs';
import { NativeConstantGraphFailure } from './nativeConstantGraphs';
import { NativeRuntimeGraphFailure } from './nativeRuntimeGraphs';
import { NativeRuntimeTypeFailure } from './nativeRuntimeTypes';
import { NativeScalarLocalFailure } from './nativeScalarLocalBindings';
import { NativeScalarFailure, type NativeScalarLanguage } from './nativeScalarContracts';
import { nativeSignatureProblem } from './nativeSignatures';
import { nativeScalarSignaturePin } from './nativeScalarSignatures';
import { classHomeGraphId } from './symbols';

/** Whole-project definition/body/slot ownership for the reviewed scalar function domain. */
export function validateNativeScalarSignatureBodies(input: AnalyzeProjectInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const definitions = Object.entries(input.documents).flatMap(([homeId, doc]) => doc.nodes.map(node => ({ homeId, node }))).filter(({ node }) => ['cpp', 'rust', 'gdscript'].includes(String(node.data.properties?.nativeSignatureLanguage)) && node.data.kindId === 'function_implement');
  for (const { homeId, node } of definitions) {
    const language = node.data.properties!.nativeSignatureLanguage as NativeScalarLanguage;
    const error = (code: string, message: string) => diagnostics.push({ level: 'error', source: 'semantic', code, message, tabId: homeId, nodeId: node.id });
    const symbol = input.functions.find(fn => fn.id === node.data.graphBinding?.symbolId);
    const overload = node.data.graphBinding?.overloadId ? symbol?.overloads.find(item => item.id === node.data.graphBinding?.overloadId) : symbol?.overloads[0];
    const bodyId = overload?.graphTabId ?? symbol?.id;
    const body = bodyId && input.documents[bodyId];
    const target = input.documents[homeId].metadata?.targetLanguage ?? input.targetLanguage;
    if (target !== language || nativeSignatureProblem(node.data, target)) { error('NATIVE_SCALAR_SIGNATURE_INVALID', 'Native scalar header must match its reviewed target/profile.'); continue; }
    if (!symbol || !overload || !body || symbol.binding !== 'module' || !input.classes?.some(owner => owner.id === symbol.classId && owner.isGlobalScope && classHomeGraphId(owner) === homeId) || node.data.properties?.functionName !== symbol.name || definitions.filter(item => item.node.data.graphBinding?.symbolId === symbol.id).length !== 1) { error('NATIVE_SCALAR_FUNCTION_OWNER', 'Native scalar function requires one definition, global module ownership and its declared body graph.'); continue; }
    if (symbol.flags?.async || symbol.flags?.virtual || symbol.flags?.abstract || symbol.flags?.override || node.data.properties?.isAsync || node.data.properties?.isVirtual || node.data.properties?.isAbstract || node.data.properties?.isOverride || node.data.properties?.role && node.data.properties.role !== 'function') { error('NATIVE_SCALAR_FUNCTION_CONTEXT', 'These function roles/modifiers require another native contract.'); continue; }
    try {
      const analysis = analyzeNativeScalarFunctionGraph(node.data, body, language);
      for (const local of analysis.locals ?? []) {
        const matches = (input.variables ?? []).filter(variable => variable.id === local.id);
        const variable = matches[0];
        if (matches.length !== 1 || variable.name !== local.name || variable.type !== nativeScalarSignaturePin(local.nativeType, language)
          || variable.graphTabId !== bodyId || variable.classId !== symbol.classId || (variable.flags?.readonly ?? false) !== !local.mutable || variable.defaultValue !== undefined) throw new NativeScalarLocalFailure('SYMBOL_OWNER', local.declarationId);
      }
      const params = node.data.properties?.nativeParameters as { id: string; name: string; nativeType: string }[];
      if (JSON.stringify(params.map(parameter => [parameter.id, parameter.name, nativeScalarSignaturePin(parameter.nativeType, language)])) !== JSON.stringify(overload.parameters.map(parameter => [parameter.id, parameter.label, parameter.type]))) throw new NativeScalarFunctionGraphFailure('SYMBOL_PARAMETERS');
      const unit = analysis.signature.nativeReturnType === (language === 'rust' ? '()' : 'void');
      if (overload.returnType !== (unit ? 'void' : nativeScalarSignaturePin(analysis.signature.nativeReturnType, language))) throw new NativeScalarFunctionGraphFailure('SYMBOL_RETURN');
      if (body.metadata?.targetLanguage && body.metadata.targetLanguage !== language) throw new NativeScalarFunctionGraphFailure('BODY_LANGUAGE');
    } catch (failure) {
      if (!(failure instanceof NativeScalarFunctionGraphFailure) && !(failure instanceof NativeConstantGraphFailure) && !(failure instanceof NativeScalarFailure) && !(failure instanceof NativeRuntimeGraphFailure) && !(failure instanceof NativeRuntimeTypeFailure) && !(failure instanceof NativeScalarLocalFailure)) throw failure;
      error('NATIVE_SCALAR_FUNCTION_BODY', failure.message);
    }
  }
  return diagnostics;
}
