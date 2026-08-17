/**
 * Compile TypeSpec with `@typespec/compiler` and emit a ProjectEnvironmentManifest.
 *
 * Node / CLI only. Do not import this file from `src/index.ts` or any browser
 * entry — the compiler must stay out of the hosted Pages bundle.
 */
import {
  compile,
  emitFile,
  formatDiagnostic,
  getDoc,
  isArrayModelType,
  isTemplateDeclaration,
  listServices,
  NodeHost,
  type EmitContext,
  type Model,
  type Namespace,
  type Operation,
  type Program,
  type Type,
} from '@typespec/compiler';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { PinType, TargetLanguage } from '@vvs/graph-types';
import { buildEnvironmentManifest } from './buildEnvironmentManifest';
import {
  importApiSurfaceFromTypeSpec,
  suggestedTypeSpecEnvId,
  type TypeSpecImportDocument,
  type TypeSpecImportedModel,
  type TypeSpecImportedOperation,
} from './fromTypeSpec';
import type { ProjectEnvironmentManifest } from '../types';

export interface ImportTypeSpecFileOptions {
  id?: string;
  version?: string;
  displayName?: string;
  description?: string;
  defaultTarget?: TargetLanguage;
  supportedTargets?: TargetLanguage[];
  moduleDefaultName?: string;
  idPrefix?: string;
}

export async function loadTypeSpecDocument(entryPath: string): Promise<TypeSpecImportDocument> {
  const program = await compile(NodeHost, resolve(entryPath), { noEmit: true });
  assertTypeSpecCompileOk(program);
  return programToTypeSpecDocument(program);
}

export async function loadTypeSpecDocumentFromSource(
  source: string,
  filename = 'main.tsp'
): Promise<TypeSpecImportDocument> {
  const dir = await mkdtemp(join(tmpdir(), 'vvs-tsp-'));
  const file = join(dir, filename);
  await writeFile(file, source, 'utf8');
  try {
    return await loadTypeSpecDocument(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function importTypeSpecFile(
  entryPath: string,
  options: ImportTypeSpecFileOptions = {}
): Promise<ProjectEnvironmentManifest> {
  const doc = await loadTypeSpecDocument(entryPath);
  return manifestFromTypeSpecDocument(doc, options);
}

export async function importTypeSpecSource(
  source: string,
  options: ImportTypeSpecFileOptions = {}
): Promise<ProjectEnvironmentManifest> {
  const doc = await loadTypeSpecDocumentFromSource(source);
  return manifestFromTypeSpecDocument(doc, options);
}

export function programToTypeSpecDocument(program: Program): TypeSpecImportDocument {
  const services = listServices(program);
  const service = services[0];
  const models: TypeSpecImportedModel[] = [];
  const operations: TypeSpecImportedOperation[] = [];
  const seenModels = new Set<string>();
  const seenOps = new Set<string>();

  const namespaces = collectUserNamespaces(program);
  for (const ns of namespaces) {
    for (const model of ns.models.values()) {
      const imported = modelToImported(program, model);
      if (!imported || seenModels.has(imported.name)) continue;
      seenModels.add(imported.name);
      models.push(imported);
    }
    for (const op of ns.operations.values()) {
      const imported = operationToImported(program, op, ns.name);
      const key = `${imported.interfaceName ?? ''}.${imported.name}`;
      if (seenOps.has(key)) continue;
      seenOps.add(key);
      operations.push(imported);
    }
    for (const iface of ns.interfaces.values()) {
      if (isTemplateDeclaration(iface)) continue;
      for (const op of iface.operations.values()) {
        const imported = operationToImported(program, op, ns.name, iface.name);
        const key = `${imported.interfaceName ?? ''}.${imported.name}`;
        if (seenOps.has(key)) continue;
        seenOps.add(key);
        operations.push(imported);
      }
    }
  }

  return {
    serviceTitle: service?.title,
    serviceNamespace: service?.type.name || namespaces[0]?.name,
    description: service ? getDoc(program, service.type) : undefined,
    models,
    operations,
  };
}

export function manifestFromTypeSpecDocument(
  doc: TypeSpecImportDocument,
  options: ImportTypeSpecFileOptions = {}
): ProjectEnvironmentManifest {
  const defaultTarget = options.defaultTarget ?? 'python';
  const supportedTargets =
    options.supportedTargets ??
    (defaultTarget === 'javascript' ? (['javascript'] as TargetLanguage[]) : (['python', 'javascript'] as TargetLanguage[]));
  const surface = importApiSurfaceFromTypeSpec(doc, {
    idPrefix: options.idPrefix,
    defaultTargets: supportedTargets,
  });
  const displayName = options.displayName ?? doc.serviceTitle ?? doc.serviceNamespace ?? 'TypeSpec service';
  const manifest = buildEnvironmentManifest({
    id: options.id ?? suggestedTypeSpecEnvId(doc),
    version: options.version ?? '1.0.0',
    displayName,
    description:
      options.description ??
      doc.description ??
      `Generated from TypeSpec${doc.serviceNamespace ? ` (${doc.serviceNamespace})` : ''}`,
    defaultTarget,
    supportedTargets,
    moduleDefaultName: options.moduleDefaultName ?? doc.serviceNamespace ?? 'App',
    extraTypes: surface.types,
    extraMethods: surface.methods,
    hostFiles: [],
  });
  manifest.category = 'api';
  return manifest;
}

/** TypeSpec emitter entry: write ProjectEnvironmentManifest JSON. */
export async function $onEmit(
  context: EmitContext<{ id?: string; title?: string; filename?: string }>
): Promise<void> {
  if (context.program.compilerOptions.noEmit) return;
  assertTypeSpecCompileOk(context.program);
  const doc = programToTypeSpecDocument(context.program);
  const manifest = manifestFromTypeSpecDocument(doc, {
    id: context.options.id,
    displayName: context.options.title,
  });
  const filename = context.options.filename ?? 'environment-manifest.json';
  await emitFile(context.program, {
    path: join(context.emitterOutputDir, filename),
    content: JSON.stringify(manifest, null, 2),
  });
}

function assertTypeSpecCompileOk(program: Program): void {
  if (!program.hasError()) return;
  const details = program.diagnostics
    .filter((d) => d.severity === 'error')
    .map((d) => formatDiagnostic(d))
    .join('\n');
  throw new Error(`TypeSpec compile failed:\n${details}`);
}

function collectUserNamespaces(program: Program): Namespace[] {
  const global = program.getGlobalNamespaceType();
  const out: Namespace[] = [];
  const visit = (ns: Namespace, isGlobal: boolean) => {
    if (!isGlobal) {
      if (ns.name === 'TypeSpec') return;
      out.push(ns);
    }
    for (const child of ns.namespaces.values()) {
      if (isGlobal && child.name === 'TypeSpec') continue;
      visit(child, false);
    }
  };
  visit(global, true);
  return out;
}

function modelToImported(program: Program, model: Model): TypeSpecImportedModel | undefined {
  if (!model.name) return undefined;
  if (isTemplateDeclaration(model)) return undefined;
  if (isArrayModelType(model) || model.name === 'Array' || model.name === 'Record') return undefined;
  const properties = [...model.properties.values()].map((prop) => ({
    name: prop.name,
    optional: prop.optional,
    typeName: typeSpecTypeName(prop.type),
    pinType: pinTypeFromTypeSpec(program, prop.type),
  }));
  return {
    name: model.name,
    properties,
    extendsName: model.baseModel?.name || undefined,
  };
}

function operationToImported(
  program: Program,
  op: Operation,
  namespaceName?: string,
  interfaceName?: string
): TypeSpecImportedOperation {
  const parameters = [...op.parameters.properties.values()].map((prop) => ({
    name: prop.name,
    typeName: typeSpecTypeName(prop.type),
    pinType: pinTypeFromTypeSpec(program, prop.type),
  }));
  return {
    name: op.name,
    interfaceName,
    namespaceName,
    parameters,
    returnTypeName: typeSpecTypeName(op.returnType),
  };
}

function typeSpecTypeName(type: Type): string {
  if ('name' in type && typeof type.name === 'string' && type.name) return type.name;
  return type.kind;
}

function pinTypeFromTypeSpec(program: Program, type: Type): PinType {
  if (type.kind === 'Scalar') {
    const family = scalarFamilyName(type);
    if (
      family === 'string' ||
      family === 'url' ||
      family === 'uri' ||
      family === 'bytes' ||
      family === 'utcDateTime' ||
      family === 'offsetDateTime' ||
      family === 'plainDate' ||
      family === 'plainTime' ||
      family === 'duration'
    ) {
      return 'data_string';
    }
    if (family === 'boolean') return 'data_boolean';
    if (
      family === 'numeric' ||
      family === 'integer' ||
      family === 'float' ||
      family === 'int8' ||
      family === 'int16' ||
      family === 'int32' ||
      family === 'int64' ||
      family === 'safeint' ||
      family === 'uint8' ||
      family === 'uint16' ||
      family === 'uint32' ||
      family === 'uint64' ||
      family === 'float32' ||
      family === 'float64' ||
      family === 'decimal' ||
      family === 'decimal128'
    ) {
      return 'data_number';
    }
    if (type.baseScalar) return pinTypeFromTypeSpec(program, type.baseScalar);
    return 'data_any';
  }
  if (type.kind === 'Model') {
    if (isArrayModelType(type) || type.name === 'Array') return 'data_array';
    return 'data_object';
  }
  if (type.kind === 'Enum') return 'data_string';
  if (type.kind === 'Tuple') return 'data_array';
  if (type.kind === 'Union') {
    const variants = [...type.variants.values()].map((v) => v.type);
    const nonNull = variants.filter((v) => v.kind !== 'Intrinsic' || (v as { name?: string }).name !== 'null');
    if (nonNull.length === 1) return pinTypeFromTypeSpec(program, nonNull[0]!);
    return 'data_any';
  }
  if (type.kind === 'Intrinsic') {
    return 'data_any';
  }
  return 'data_any';
}

function scalarFamilyName(type: { name: string; baseScalar?: { name: string; baseScalar?: unknown } }): string {
  let current: { name: string; baseScalar?: { name: string; baseScalar?: unknown } } | undefined = type;
  const names: string[] = [];
  while (current) {
    names.push(current.name);
    current = current.baseScalar as typeof current;
  }
  const known = [
    'string',
    'boolean',
    'bytes',
    'numeric',
    'integer',
    'float',
    'int32',
    'int64',
    'float64',
    'url',
    'uri',
  ];
  for (const name of names) {
    if (known.includes(name)) return name;
  }
  return type.name;
}
