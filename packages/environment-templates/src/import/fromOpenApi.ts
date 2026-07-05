import type { TargetLanguage } from '@vvs/graph-types';
import type { ApiMethodDef, ApiMethodTargetBinding } from '../types';
import { jsonSchemaTypeToPinType, parametersFromJsonSchemaProperties, slugifyId } from './jsonSchema';

/** OpenAPI 3.x document subset for import. */
export interface OpenApiDocument {
  openapi?: string;
  info?: { title?: string; description?: string; version?: string };
  paths?: Record<
    string,
    Record<
      string,
      {
        operationId?: string;
        summary?: string;
        description?: string;
        parameters?: Array<{ name: string; in: string; schema?: unknown; required?: boolean }>;
        requestBody?: { content?: Record<string, { schema?: unknown }> };
        'x-vvs'?: VvsOperationExtension;
      }
    >
  >;
}

export interface VvsOperationExtension {
  role?: 'native' | 'overrideable' | 'lifecycle';
  id?: string;
  targets?: Partial<Record<TargetLanguage, ApiMethodTargetBinding>>;
}

export interface ImportOpenApiOptions {
  idPrefix?: string;
  defaultTargets?: TargetLanguage[];
}

export function importMethodsFromOpenApi(
  doc: OpenApiDocument,
  options: ImportOpenApiOptions = {}
): ApiMethodDef[] {
  const idPrefix = options.idPrefix ?? 'api';
  const defaultTargets = options.defaultTargets ?? ['python', 'javascript'];
  const methods: ApiMethodDef[] = [];
  const paths = doc.paths ?? {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== 'object') continue;
      const httpMethod = method.toLowerCase();
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(httpMethod)) {
        continue;
      }

      const op = operation;
      const vvs = op['x-vvs'];
      const operationId =
        op.operationId ?? `${httpMethod}_${slugifyId(path.replace(/\//g, '_'))}`;
      const name = op.operationId ?? slugifyId(op.summary ?? operationId);
      const methodId = vvs?.id ?? `${idPrefix}.${slugifyId(operationId)}`;

      const parameters = collectOpenApiParameters(op, methodId);

      const targets: Partial<Record<TargetLanguage, ApiMethodTargetBinding>> =
        vvs?.targets ??
        buildDefaultOpenApiTargets(name, parameters, path, httpMethod, defaultTargets);

      methods.push({
        id: methodId,
        name,
        parameters,
        role: vvs?.role ?? 'native',
        targets,
      });
    }
  }

  return methods;
}

function collectOpenApiParameters(
  op: {
    parameters?: Array<{ name: string; in: string; schema?: unknown; required?: boolean }>;
    requestBody?: { content?: Record<string, { schema?: unknown }> };
  },
  methodId: string
) {
  const params = (op.parameters ?? [])
    .filter((p) => p.in === 'query' || p.in === 'path' || p.in === 'header')
    .map((p) => ({
      id: `${methodId}_${slugifyId(p.name)}`,
      label: p.name,
      type: jsonSchemaTypeToPinType(p.schema),
    }));

  const bodySchema = op.requestBody?.content?.['application/json']?.schema as
    | Record<string, unknown>
    | undefined;
  if (bodySchema?.properties && typeof bodySchema.properties === 'object') {
    params.push(
      ...parametersFromJsonSchemaProperties(
        bodySchema.properties as Record<string, unknown>,
        `${methodId}_body`
      )
    );
  }

  return params;
}

function buildDefaultOpenApiTargets(
  name: string,
  parameters: { id: string }[],
  path: string,
  httpMethod: string,
  targets: TargetLanguage[]
): Partial<Record<TargetLanguage, ApiMethodTargetBinding>> {
  const argPlaceholders = parameters.map((p) => `{${p.id}}`).join(', ');
  const callInner = argPlaceholders ? `${name}(${argPlaceholders})` : `${name}()`;
  const comment = `${httpMethod.toUpperCase()} ${path}`;

  const out: Partial<Record<TargetLanguage, ApiMethodTargetBinding>> = {};
  for (const lang of targets) {
    if (lang === 'python') {
      out.python = { callExpr: argPlaceholders ? callInner : `# ${comment}` };
    } else if (lang === 'javascript') {
      out.javascript = { callExpr: argPlaceholders ? `${callInner};` : `// ${comment}` };
    } else if (lang === 'cpp') {
      out.cpp = { callExpr: `// ${comment}` };
    } else if (lang === 'verse') {
      out.verse = { callExpr: `# ${comment}` };
    }
  }
  return out;
}
