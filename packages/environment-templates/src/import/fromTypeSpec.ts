/**
 * TypeSpec → `apiSurface` mapping (compiler-free).
 *
 * A `.tsp` file is compiled with `@typespec/compiler` in `fromTypeSpec.node.ts`
 * (Node / CLI only) into this document shape. This module never imports the
 * compiler so the Pages bundle stays free of TypeSpec.
 *
 * Supported after compile: `@service` title + namespace, `model` (properties +
 * `extends`), `interface` operations, namespace `op` signatures. Decorators
 * other than `@service` are ignored for emit. Host files are not invented.
 */
import type { PinType, SymbolParameter, TargetLanguage } from '@vvs/graph-types';
import type { ApiMethodDef, ApiMethodTargetBinding, ApiTypeDef } from '../types';
import { slugifyId } from './jsonSchema';

export interface TypeSpecImportedProperty {
  name: string;
  optional: boolean;
  typeName: string;
  pinType: PinType;
}

export interface TypeSpecImportedModel {
  name: string;
  properties: TypeSpecImportedProperty[];
  extendsName?: string;
}

export interface TypeSpecImportedParameter {
  name: string;
  typeName: string;
  pinType: PinType;
}

export interface TypeSpecImportedOperation {
  name: string;
  interfaceName?: string;
  namespaceName?: string;
  parameters: TypeSpecImportedParameter[];
  returnTypeName?: string;
}

/** Compiler-free snapshot of a TypeSpec program used for manifest import. */
export interface TypeSpecImportDocument {
  serviceTitle?: string;
  serviceNamespace?: string;
  description?: string;
  models: TypeSpecImportedModel[];
  operations: TypeSpecImportedOperation[];
}

export interface ImportTypeSpecOptions {
  idPrefix?: string;
  defaultTargets?: TargetLanguage[];
}

export function importApiSurfaceFromTypeSpec(
  doc: TypeSpecImportDocument,
  options: ImportTypeSpecOptions = {}
): { types: ApiTypeDef[]; methods: ApiMethodDef[] } {
  const idPrefix = options.idPrefix ?? 'api';
  const defaultTargets = options.defaultTargets ?? ['python', 'javascript'];

  const types: ApiTypeDef[] = doc.models.map((model) => ({
    id: typeSpecTypeId(idPrefix, model.name),
    displayName: model.name,
    extends: model.extendsName ? { id: typeSpecTypeId(idPrefix, model.extendsName) } : undefined,
  }));

  const methods: ApiMethodDef[] = doc.operations.map((op) => {
    const qualified = op.interfaceName ? `${op.interfaceName}_${op.name}` : op.name;
    const methodId = `${idPrefix}.${slugifyId(qualified)}`;
    const parameters: SymbolParameter[] = op.parameters.map((p) => ({
      id: `${methodId}_${slugifyId(p.name)}`,
      label: p.name,
      type: p.pinType,
    }));
    return {
      id: methodId,
      name: op.name,
      parameters,
      role: 'native',
      targets: buildDefaultTypeSpecTargets(op.name, parameters, defaultTargets),
    };
  });

  return { types, methods };
}

export function typeSpecTypeId(idPrefix: string, typeName: string): string {
  return `${idPrefix}.type.${slugifyId(typeName)}`;
}

export function suggestedTypeSpecEnvId(doc: TypeSpecImportDocument): string {
  const raw = doc.serviceNamespace || doc.serviceTitle || 'typespec';
  return `env.imported.${slugifyId(raw)}`;
}

function buildDefaultTypeSpecTargets(
  name: string,
  parameters: { id: string }[],
  targets: TargetLanguage[]
): Partial<Record<TargetLanguage, ApiMethodTargetBinding>> {
  const argPlaceholders = parameters.map((p) => `{${p.id}}`).join(', ');
  const callInner = argPlaceholders ? `${name}(${argPlaceholders})` : `${name}()`;

  const out: Partial<Record<TargetLanguage, ApiMethodTargetBinding>> = {};
  for (const lang of targets) {
    if (lang === 'python') {
      out.python = { callExpr: callInner };
    } else if (lang === 'javascript') {
      out.javascript = { callExpr: `${callInner};` };
    } else if (lang === 'cpp') {
      out.cpp = { callExpr: `${callInner};` };
    } else if (lang === 'verse') {
      out.verse = { callExpr: callInner };
    } else if (lang === 'gdscript') {
      out.gdscript = { callExpr: callInner };
    } else if (lang === 'csharp') {
      out.csharp = { callExpr: `${callInner};` };
    } else if (lang === 'go') {
      out.go = { callExpr: callInner };
    } else if (lang === 'rust') {
      out.rust = { callExpr: callInner };
    }
  }
  return out;
}
