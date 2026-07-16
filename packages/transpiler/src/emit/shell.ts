import type { FunctionSymbol, PinType, TargetLanguage } from '@vvs/graph-types';
import {
  defaultCodegenTarget,
  eventCodegenHandlerName,
  targetLanguageToFamily,
} from '@vvs/graph-types';
import {
  getTemplate,
  renderTemplate,
  requireTemplate,
  resolvePrintProfile,
} from '@vvs/syntax-packs';
import { parameterCodegenName } from '../nodeHelpers';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrModule } from '../ir/types';
import { handlerBodyIndent } from '../lower/graphToIr';
import { createPrintContext, type PrintContext } from '../print';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { emptyHandlerBodyLine } from './layout';
import { appendIrStatements } from './sinkStatements';
import { typedParamFragment, typeNameForPin } from './emitTypes';

export function overloadParamNames(func: FunctionSymbol): string[] {
  return func.overloads[0]?.parameters.map((p) => parameterCodegenName(p)) ?? [];
}

export function printContextForIr(
  ir: IrModule,
  indent: string,
  environmentManifest?: ProjectEnvironmentManifest
): PrintContext {
  const target = ir.codegenTarget ?? defaultCodegenTarget(ir.targetLanguage);
  const family = target?.family ?? 'python';
  return createPrintContext(
    family,
    target?.capabilities ?? [],
    indent,
    target?.packLock,
    environmentManifest
  );
}

function profileFor(lang: TargetLanguage) {
  const family = targetLanguageToFamily(lang) ?? 'python';
  return resolvePrintProfile(family);
}

export function renderShell(
  lang: TargetLanguage,
  templateKey: string,
  slots: Record<string, string>
): string {
  const profile = profileFor(lang);
  const row = requireTemplate(profile, templateKey, lang);
  return renderTemplate(row, slots, profile.layout).text;
}

function optionalShell(
  lang: TargetLanguage,
  templateKey: string,
  slots: Record<string, string> = {}
): string | null {
  const profile = profileFor(lang);
  const row = getTemplate(profile, templateKey);
  if (!row) return null;
  return renderTemplate(row, slots, profile.layout).text;
}

export function classExtendsSuffix(lang: TargetLanguage, extendsType?: string): string {
  if (!extendsType) return '';
  switch (lang) {
    case 'python':
      return `(${extendsType})`;
    case 'javascript':
      return ` extends ${extendsType}`;
    case 'cpp':
      return ` : public ${extendsType}`;
    case 'verse':
      return `(${extendsType})`;
    case 'gdscript':
      return `\nextends ${extendsType}`;
    case 'rust':
      return '';
    case 'csharp':
      return extendsType ? ` : ${extendsType}` : '';
    default:
      return '';
  }
}

export function renderClassModuleOpen(
  lang: TargetLanguage,
  name: string,
  extendsType?: string,
  properties?: Record<string, unknown>
): string {
  // Unset visibility omits keyword — do not invent `public`.
  const mods = resolveModifierSlots(lang, properties);
  const extendsField =
    lang === 'rust' && extendsType?.trim()
      ? `    base: ${extendsType.trim()},\n`
      : '';
  return renderShell(lang, 'ClassModuleOpen', {
    visibility: mods.visibility,
    abstractKw: mods.abstractKw,
    prefix: mods.visibility + mods.abstractKw,
    name,
    extendsSuffix: classExtendsSuffix(lang, extendsType),
    extendsField,
  });
}

export function renderClassModuleClose(lang: TargetLanguage): string | null {
  return optionalShell(lang, 'ClassModuleClose');
}

export function renderClassImplOpen(lang: TargetLanguage, name: string): string | null {
  return optionalShell(lang, 'ClassImplOpen', { name });
}

export function renderClassPublicSection(lang: TargetLanguage): string | null {
  return optionalShell(lang, 'ClassPublicSection');
}

function eventHandlerParamList(
  lang: TargetLanguage,
  handler: IrEventHandler,
  paramTypes?: (PinType | string | undefined)[]
): string {
  const typed = (name: string, i: number) =>
    typedParamFragment(name, paramTypes?.[i] ?? 'data_number', lang);

  if (lang === 'python') {
    return handler.paramNames.length > 0
      ? `self, ${handler.paramNames.join(', ')}`
      : 'self';
  }
  if (lang === 'gdscript' || lang === 'javascript') {
    return handler.paramNames.join(', ');
  }
  if (lang === 'rust') {
    const extras = handler.paramNames.map((p, i) => typed(p, i)).join(', ');
    return extras ? `&mut self, ${extras}` : '&mut self';
  }
  if (
    lang === 'csharp' ||
    lang === 'cpp' ||
    lang === 'verse'
  ) {
    return handler.paramNames.map((p, i) => typed(p, i)).join(', ');
  }
  return handler.paramNames.join(', ');
}

function eventHandlerSignature(
  lang: TargetLanguage,
  handler: IrEventHandler,
  properties?: Record<string, unknown>,
  paramTypes?: (PinType | string | undefined)[]
): string {
  if (lang === 'cpp') {
    const params = eventHandlerParamList(lang, handler, paramTypes);
    const isOverride = Boolean(properties?.isOverride);
    const isVirtual = Boolean(properties?.isVirtual) || isOverride;
    const virtualKw = isVirtual ? 'virtual ' : '';
    const overrideSuffix = isOverride ? ' override' : '';
    const base = params
      ? `void on_${handler.handlerName}(${params})`
      : `void on_${handler.handlerName}()`;
    return `${virtualKw}${base}${overrideSuffix}`;
  }
  if (lang === 'verse') {
    const params = eventHandlerParamList(lang, handler, paramTypes);
    const overrideTag = properties?.isOverride ? '<override>' : '';
    return params
      ? `on_${handler.handlerName}${overrideTag}(${params}) : void =`
      : `on_${handler.handlerName}${overrideTag}() : void =`;
  }
  return '';
}

function eventHandlerTagAnchor(lang: TargetLanguage, handler: IrEventHandler): string {
  if (lang === 'python') return `def on_${handler.handlerName}(`;
  if (lang === 'gdscript') return `func on_${handler.handlerName}(`;
  if (lang === 'rust') return `fn on_${handler.handlerName}(`;
  if (lang === 'csharp') return `void on_${handler.handlerName}(`;
  if (lang === 'javascript') return `on_${handler.handlerName}(`;
  if (lang === 'cpp') return eventHandlerSignature(lang, handler);
  return `on_${handler.handlerName}`;
}

/** Emit a full event handler definition (open line, body, optional close brace). */
export function appendEventHandlerDefinition(
  sink: CodeSink,
  ir: IrModule,
  handler: IrEventHandler,
  handlerSourceGraphNodeId: string,
  options?: {
    leadingBlankLine?: boolean;
    leadingNewline?: boolean;
    defineNodeId?: string;
    memberProperties?: Record<string, unknown>;
    paramTypes?: (PinType | string | undefined)[];
    onBeforeFlowNode?: (sourceGraphNodeId: string, indent: string) => void;
  }
): void {
  const lang = ir.targetLanguage;
  if (options?.leadingBlankLine && sink.lineCount > 0) sink.appendRaw('');

  const memberProps = options?.memberProperties;
  // Prefer event symbol parameters when types not passed explicitly.
  const paramTypes =
    options?.paramTypes ??
    ir.projectEvents.find((e) => eventCodegenHandlerName(e) === handler.handlerName)?.parameters.map(
      (p) => p.type
    );

  const mods = resolveModifierSlots(lang, memberProps);

  const slots: Record<string, string> = {
    linePrefix: options?.leadingNewline && sink.lineCount > 0 ? '\n' : '',
    handler: handler.handlerName,
    paramList: eventHandlerParamList(lang, handler, paramTypes),
    class: ir.activeClass?.name || 'Main',
    visibility: mods.visibility,
    comma_params:
      handler.paramNames.length > 0
        ? ', ' + eventHandlerParamList(lang, handler, paramTypes)
        : '',
  };
  if (lang === 'cpp' || lang === 'verse') {
    slots.signature = eventHandlerSignature(lang, handler, memberProps, paramTypes);
  }

  const startLine = sink.lineCount + 1;
  const templateName = handler.isConstructor ? 'ConstructorOpen' : 'EventHandlerOpen';
  sink.appendRaw(renderShell(lang, templateName as any, slots));

  const anchor = eventHandlerTagAnchor(lang, handler);
  const signatureLine =
    options?.leadingNewline && slots.linePrefix.includes('\n') ? startLine + 1 : startLine;
  // Dual-node events: event_member_define owns the signature line; On handler owns the full span.
  if (options?.defineNodeId) {
    sink.tagRange(options.defineNodeId, signatureLine, signatureLine, anchor);
  }

  const family = targetLanguageToFamily(lang) ?? 'python';
  const ctx = printContextForIr(ir, handlerBodyIndent(family), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw(emptyHandlerBodyLine(lang));
  else
    appendIrStatements(sink, handler.body, ctx, {
      emitUnsupportedComments: ir.emitUnsupportedComments,
      onBeforeNode: options?.onBeforeFlowNode,
    });

  const close = optionalShell(lang, 'EventHandlerClose');
  if (close) sink.appendRaw(close);

  sink.tagRange(
    handlerSourceGraphNodeId,
    signatureLine,
    sink.lineCount,
    eventHandlerTagAnchor(lang, handler)
  );
}

function functionParamList(
  func: FunctionSymbol,
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): string {
  const params = overloadParamNames(func);
  const overloadParams = func.overloads[0]?.parameters ?? [];
  const binding = properties?.binding ?? func.binding ?? 'instance';
  if (lang === 'python' && binding === 'instance') {
    return ['self', ...params].join(', ');
  }
  if (lang === 'gdscript' || lang === 'javascript' || lang === 'cpp') {
    // C++ FunctionDefOpen embeds types only when paramList supplies them — use typed fragments.
    if (lang === 'cpp') {
      return params
        .map((p, i) => typedParamFragment(p, overloadParams[i]?.type, lang))
        .join(', ');
    }
    return params.join(', ');
  }
  if (lang === 'rust') {
    const typed = params
      .map((p, i) => typedParamFragment(p, overloadParams[i]?.type, lang))
      .join(', ');
    if (binding === 'static') return typed;
    return typed ? `&mut self, ${typed}` : '&mut self';
  }
  if (lang === 'csharp' || lang === 'verse') {
    return params
      .map((p, i) => typedParamFragment(p, overloadParams[i]?.type, lang))
      .join(', ');
  }
  return params.join(', ');
}

/** Return type token for C++ / C# prototypes and defs — from Declare props or overload. */
export function functionReturnTypeName(
  func: FunctionSymbol,
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): string {
  const fromProps = properties?.returnType;
  const raw =
    (typeof fromProps === 'string' && fromProps.trim() ? fromProps.trim() : undefined) ||
    func.overloads[0]?.returnType ||
    'void';
  if (raw === 'void') return 'void';
  if (lang === 'cpp' || lang === 'csharp') {
    return typeNameForPin(raw as PinType, lang);
  }
  return raw;
}

export function resolveModifierSlots(
  lang: TargetLanguage,
  properties?: Record<string, unknown>,
  fallbackVisibility?: string
): {
  visibility: string;
  staticKw: string;
  abstractKw: string;
  virtualKw: string;
  overrideKw: string;
  constKw: string;
  asyncKw: string;
} {
  const binding = properties?.binding ?? 'instance';
  const isVirtual = Boolean(properties?.isVirtual);
  const isOverride = Boolean(properties?.isOverride);
  const isAbstract = Boolean(properties?.isAbstract);
  const isConst = Boolean(properties?.isConst);
  const isAsync = Boolean(properties?.isAsync);
  const rawVis = properties?.visibility ?? fallbackVisibility;
  const vis = rawVis != null && String(rawVis).trim() !== '' ? String(rawVis) : '';

  let visibility = '';
  let staticKw = '';
  let abstractKw = '';
  let virtualKw = '';
  let overrideKw = '';
  let constKw = '';
  let asyncKw = '';

  if (lang === 'csharp') {
    if (vis === 'public') visibility = 'public ';
    else if (vis === 'private') visibility = 'private ';
    else if (vis === 'protected') visibility = 'protected ';
    if (binding === 'static') staticKw = 'static ';
    if (isAbstract) abstractKw = 'abstract ';
    if (isVirtual && !isAbstract) virtualKw = 'virtual ';
    if (isOverride) overrideKw = 'override ';
    if (isConst) constKw = 'readonly ';
    if (isAsync) asyncKw = 'async ';
  } else if (lang === 'rust') {
    if (vis === 'public') visibility = 'pub ';
    if (isConst) constKw = 'const ';
    if (isAsync) asyncKw = 'async ';
  } else if (lang === 'cpp') {
    visibility = '';
    if (binding === 'static') staticKw = 'inline static ';
    if (isVirtual || isAbstract) virtualKw = 'virtual ';
    // C++ override is a postfix specifier (matches skill AdvancedClass / Coverage Lab).
    if (isOverride) overrideKw = ' override';
    if (isConst) constKw = 'const ';
  } else if (lang === 'javascript' || lang === 'python' || lang === 'gdscript') {
    if (isAsync && lang !== 'gdscript') asyncKw = 'async ';
    if (binding === 'static') {
      if (lang === 'python') staticKw = '@staticmethod\n    ';
      else if (lang === 'javascript') staticKw = 'static ';
      else if (lang === 'gdscript') staticKw = 'static ';
    }
    if (lang === 'javascript' && vis === 'private') visibility = '#';
  } else if (lang === 'verse') {
    if (isOverride) overrideKw = '<override>';
    if (vis === 'public') visibility = '<public>';
    else if (vis === 'private') visibility = '<private>';
  }

  return { visibility, staticKw, abstractKw, virtualKw, overrideKw, constKw, asyncKw };
}

export function renderFunctionDefHeader(
  func: FunctionSymbol,
  lang: TargetLanguage,
  isAsync = false,
  properties?: Record<string, unknown>
): string {
  const mods = resolveModifierSlots(lang, properties, func.visibility);
  // Async only when define-node / caller says so — never invent from body scan.
  const wantAsync = Boolean(properties?.isAsync) || isAsync;
  const actualAsyncKw = wantAsync
    ? lang === 'csharp' || lang === 'javascript' || lang === 'rust' || lang === 'python'
      ? 'async '
      : mods.asyncKw
    : '';

  return renderShell(lang, 'FunctionDefOpen', {
    visibility: mods.visibility,
    staticKw: mods.staticKw,
    abstractKw: mods.abstractKw,
    virtualKw: mods.virtualKw,
    overrideKw: mods.overrideKw,
    asyncKw: actualAsyncKw || (wantAsync ? mods.asyncKw : ''),
    staticDecorator: mods.staticKw,
    prefix: Object.values(mods).join(''),
    returnType: functionReturnTypeName(func, lang, properties),
    name: func.name,
    paramList: functionParamList(func, lang, properties),
  });
}

/** C++ out-of-line method definition header: `void Class::Name(...) {`
 *  Omits virtual/static/override — those belong on the in-class Declare prototype only.
 */
export function renderFunctionDefOutOfLineHeader(
  func: FunctionSymbol,
  className: string,
  lang: TargetLanguage,
  _isAsync = false,
  properties?: Record<string, unknown>
): string {
  return renderShell(lang, 'FunctionDefOutOfLineOpen', {
    visibility: '',
    staticKw: '',
    abstractKw: '',
    virtualKw: '',
    overrideKw: '',
    asyncKw: '',
    staticDecorator: '',
    prefix: '',
    className,
    returnType: functionReturnTypeName(func, lang, properties),
    name: func.name,
    paramList: functionParamList(func, lang, properties),
  });
}

export function renderFunctionDeclPrototype(
  func: FunctionSymbol,
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): string | null {
  if (lang !== 'cpp' && lang !== 'csharp') return null;
  const overloadParams = func.overloads[0]?.parameters ?? [];
  const params = overloadParamNames(func)
    .map((p, i) => typedParamFragment(p, overloadParams[i]?.type, lang))
    .join(', ');

  const mods = resolveModifierSlots(lang, properties, func.visibility);
  const isAbstract = Boolean(properties?.isAbstract ?? false);
  // overrideKw comes from resolveModifierSlots (C++ postfix); suffix is pure-virtual only.
  const pureSuffix = lang === 'cpp' && isAbstract ? ' = 0' : '';

  return renderShell(lang, 'FunctionDeclPrototype', {
    visibility: mods.visibility,
    staticKw: mods.staticKw,
    abstractKw: mods.abstractKw,
    virtualKw: mods.virtualKw,
    overrideKw: mods.overrideKw,
    asyncKw: '',
    prefix: Object.values(mods).join(''),
    returnType: functionReturnTypeName(func, lang, properties),
    name: func.name,
    paramList: params,
    suffix: pureSuffix,
  });
}

export function renderFunctionTabClose(lang: TargetLanguage): string | null {
  return optionalShell(lang, 'FunctionTabClose');
}

export function renderFunctionOutOfLineClose(lang: TargetLanguage): string {
  return optionalShell(lang, 'FunctionOutOfLineClose') ?? '}';
}
