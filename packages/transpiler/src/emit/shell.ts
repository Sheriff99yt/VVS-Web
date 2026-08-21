import type { FunctionSymbol, PinType, TargetLanguage } from '@vvs/graph-types';
import {
  defaultCodegenTarget,
  eventCodegenHandlerName,
  normalizeClassForm,
  syncClassExtendsFields,
  syncClassImplementsFields,
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
import { isFunctionRoleEffective, isModifierEffective } from '@vvs/language-profiles';
import { emptyHandlerBodyLine } from './layout';
import { appendIrStatements } from './sinkStatements';
import { typedParamFragment, typeNameForPin } from './emitTypes';

export function overloadParamNames(func: FunctionSymbol, properties?: Record<string, unknown>): string[] {
  const overloadId = properties?.overloadId;
  const overload = func.overloads.find((o) => o.id === overloadId) ?? func.overloads[0];
  return overload?.parameters.map((p) => parameterCodegenName(p)) ?? [];
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

function cppBaseAccess(index: number, properties?: Record<string, unknown>): string {
  const raw = properties?.extendsAccess;
  if (Array.isArray(raw) && typeof raw[index] === 'string') {
    const access = raw[index].trim();
    if (access === 'public' || access === 'protected' || access === 'private') return access;
  }
  return 'public';
}

/** Names to print: python/cpp use every stored Extends row; others stay first-parent only. */
function printedExtendsNames(
  lang: TargetLanguage,
  extendsType?: string,
  extendsTypes?: unknown
): string[] {
  const names = syncClassExtendsFields(extendsType, extendsTypes).extendsTypes ?? [];
  if (lang === 'python' || lang === 'cpp') return names;
  return names.slice(0, 1);
}

export function classImplementsNamesFromProps(properties?: Record<string, unknown>): string[] {
  return syncClassImplementsFields(properties?.implementsTypes).implementsTypes ?? [];
}

export function classFormFromProps(properties?: Record<string, unknown>) {
  return normalizeClassForm(properties?.form) ?? 'class';
}

export function classExtendsSuffix(
  lang: TargetLanguage,
  extendsType?: string,
  extendsTypes?: unknown,
  properties?: Record<string, unknown>
): string {
  const names = printedExtendsNames(lang, extendsType, extendsTypes);
  const implementsNames = lang === 'csharp' ? classImplementsNamesFromProps(properties) : [];
  if (lang === 'csharp') {
    const heritage = [...names.slice(0, 1), ...implementsNames];
    return heritage.length > 0 ? ` : ${heritage.join(', ')}` : '';
  }
  if (names.length === 0) return '';
  switch (lang) {
    case 'python':
      return `(${names.join(', ')})`;
    case 'javascript':
      return ` extends ${names[0]}`;
    case 'cpp':
      return ` : ${names
        .map((name, i) => `${cppBaseAccess(i, properties)} ${name}`)
        .join(', ')}`;
    case 'verse':
      return `(${names[0]})`;
    case 'gdscript':
      return `\nextends ${names[0]}`;
    case 'rust':
      return '';
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
  // Unset visibility omits keyword -- do not invent `public`.
  const form = classFormFromProps(properties);
  const mods = resolveModifierSlots(
    lang,
    form === 'interface' || form === 'trait' ? { ...properties, isAbstract: false } : properties
  );
  const extendsField =
    lang === 'rust' && form !== 'trait' && extendsType?.trim()
      ? `    base: ${extendsType.trim()},\n`
      : '';
  const templateKey =
    lang === 'csharp' && form === 'interface'
      ? 'InterfaceModuleOpen'
      : lang === 'rust' && form === 'trait'
        ? 'TraitModuleOpen'
        : 'ClassModuleOpen';
  return renderShell(lang, templateKey, {
    visibility: mods.visibility,
    abstractKw: form === 'interface' || form === 'trait' ? '' : mods.abstractKw,
    prefix: mods.visibility + (form === 'interface' || form === 'trait' ? '' : mods.abstractKw),
    name,
    extendsSuffix: classExtendsSuffix(lang, extendsType, properties?.extendsTypes, properties),
    extendsField,
  });
}

export function renderImplTraitFor(lang: TargetLanguage, typeName: string, traitName: string): string | null {
  if (lang !== 'rust') return null;
  return optionalShell(lang, 'ImplTraitFor', { name: typeName, trait: traitName });
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
    lang === 'verse' ||
    lang === 'go'
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

function eventHandlerReturnType(
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): string {
  // Generated on_* methods are ordinary methods, not C# EventHandler delegates.
  if (lang === 'csharp' && Boolean(properties?.isAsync)) return 'Task';
  return 'void';
}

function eventHandlerTagAnchor(
  lang: TargetLanguage,
  handler: IrEventHandler,
  properties?: Record<string, unknown>
): string {
  if (lang === 'python') return `def on_${handler.handlerName}(`;
  if (lang === 'gdscript') return `func on_${handler.handlerName}(`;
  if (lang === 'rust') return `fn on_${handler.handlerName}(`;
  if (lang === 'csharp') {
    const ret = eventHandlerReturnType(lang, properties);
    return `${ret} on_${handler.handlerName}(`;
  }
  if (lang === 'go') return `on_${handler.handlerName}(`;
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

  const memberProps = {
    ...handler.properties,
    ...options?.memberProperties,
  };
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
    returnType: eventHandlerReturnType(lang, memberProps),
    ...mods,
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

  const anchor = eventHandlerTagAnchor(lang, handler, memberProps);
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
    eventHandlerTagAnchor(lang, handler, memberProps)
  );
}

function functionParamList(
  func: FunctionSymbol,
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): string {
  const params = overloadParamNames(func, properties);
  const overloadId = properties?.overloadId;
  const overload = func.overloads.find((o) => o.id === overloadId) ?? func.overloads[0];
  const overloadParams = overload?.parameters ?? [];
  const binding = properties?.binding ?? func.binding ?? 'instance';
  if (lang === 'python' && binding === 'instance') {
    return ['self', ...params].join(', ');
  }
  if (lang === 'gdscript' || lang === 'javascript' || lang === 'cpp') {
    // C++ FunctionDefOpen embeds types only when paramList supplies them -- use typed fragments.
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

/** Return type token for C++ / C# prototypes and defs -- from Declare props or overload. */
export function functionReturnTypeName(
  func: FunctionSymbol,
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): string {
  const overloadId = properties?.overloadId;
  const overload = func.overloads.find((o) => o.id === overloadId) ?? func.overloads[0];
  const fromProps = properties?.returnType;
  const raw =
    (typeof fromProps === 'string' && fromProps.trim() ? fromProps.trim() : undefined) ||
    overload?.returnType ||
    'void';

  const isAsync = Boolean(functionModifierProperties(func, properties).isAsync);
  if (lang === 'csharp' && isAsync) {
    const baseType = raw === 'void' ? '' : typeNameForPin(raw as PinType, 'csharp');
    return baseType ? `Task<${baseType}>` : 'Task';
  }

  if (raw === 'void') return 'void';
  if (lang === 'cpp' || lang === 'csharp') {
    return typeNameForPin(raw as PinType, lang);
  }
  return raw;
}


/** Merge canvas properties with symbol flags so override/virtual/abstract emit even when only one side is set. */
export function functionModifierProperties(
  func: FunctionSymbol | undefined,
  properties?: Record<string, unknown>
): Record<string, unknown> {
  const flags = func?.flags;
  return {
    ...properties,
    visibility: properties?.visibility ?? func?.visibility,
    binding: properties?.binding ?? func?.binding,
    isVirtual: Boolean(properties?.isVirtual || flags?.virtual),
    isOverride: Boolean(properties?.isOverride || flags?.override),
    isAbstract: Boolean(properties?.isAbstract || flags?.abstract),
    isAsync: properties?.isAsync != null ? Boolean(properties.isAsync) : Boolean(flags?.async),
  };
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
    // C# forbids `virtual override` -- override already implies a virtual slot.
    if (isVirtual && !isAbstract && !isOverride) virtualKw = 'virtual ';
    if (isOverride) overrideKw = 'override ';
    if (isConst) constKw = 'readonly ';
    if (isAsync) asyncKw = 'async ';
  } else if (lang === 'rust') {
    if (vis === 'public') visibility = 'pub ';
    if (binding === 'static') staticKw = 'static ';
    if (isConst) constKw = 'const ';
    // isAsync is ineffective (no Tokio) — never emit async fn.
  } else if (lang === 'cpp') {
    visibility = '';
    if (binding === 'static') staticKw = 'inline static ';
    if (isVirtual || isAbstract) virtualKw = 'virtual ';
    // C++ override is a postfix specifier (matches skill AdvancedClass / Advanced example).
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

export function functionRoleOf(
  properties?: Record<string, unknown>
): 'function' | 'constructor' | 'destructor' {
  const role = properties?.role;
  if (role === 'constructor' || role === 'destructor') return role;
  return 'function';
}

function emitClassName(
  func: FunctionSymbol,
  properties?: Record<string, unknown>,
  className?: string
): string {
  if (className && className.trim()) return className.trim();
  const fromProps = properties?.className;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  return func.name;
}

function constructorParamSlots(
  func: FunctionSymbol,
  lang: TargetLanguage,
  properties?: Record<string, unknown>
): { paramList: string; comma_params: string } {
  const params = overloadParamNames(func, properties);
  const overloadId = properties?.overloadId;
  const overload = func.overloads.find((o) => o.id === overloadId) ?? func.overloads[0];
  const overloadParams = overload?.parameters ?? [];
  const typed =
    lang === 'cpp' || lang === 'csharp' || lang === 'verse' || lang === 'rust'
      ? params.map((p, i) => typedParamFragment(p, overloadParams[i]?.type, lang))
      : params;
  const paramList = typed.join(', ');
  return { paramList, comma_params: paramList ? `, ${paramList}` : '' };
}

export function renderFunctionDefHeader(
  func: FunctionSymbol,
  lang: TargetLanguage,
  isAsync = false,
  properties?: Record<string, unknown>,
  className?: string
): string {
  const merged = functionModifierProperties(func, properties);
  const mods = resolveModifierSlots(lang, merged, func.visibility);
  const role = functionRoleOf(merged);
  const ctorClass = emitClassName(func, properties, className);
  if (role === 'constructor' && isFunctionRoleEffective(lang, 'constructor')) {
    const { paramList, comma_params } = constructorParamSlots(func, lang, properties);
    return renderShell(lang, 'ConstructorOpen', {
      ...mods,
      linePrefix: '    ',
      visibility: mods.visibility.trim(),
      class: ctorClass,
      paramList,
      comma_params,
    });
  }
  if (role === 'destructor' && isFunctionRoleEffective(lang, 'destructor')) {
    const { paramList } = constructorParamSlots(func, lang, properties);
    return renderShell(lang, 'DestructorOpen', {
      linePrefix: '    ',
      class: ctorClass,
      paramList,
      virtualKw: mods.virtualKw,
    });
  }
  // Async only when the modifier is effective for this language (single dim table).
  const wantAsync =
    (Boolean(merged.isAsync) || isAsync) && isModifierEffective(lang, 'isAsync');
  const actualAsyncKw = wantAsync
    ? lang === 'csharp' || lang === 'javascript' || lang === 'python'
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
    returnType: functionReturnTypeName(func, lang, { ...merged, isAsync: wantAsync }),
    name: func.name,
    paramList: functionParamList(func, lang, properties),
  });
}

/** C++ out-of-line method definition header: `void Class::Name(...) {`
 *  Omits virtual/static/override -- those belong on the in-class Declare prototype only.
 */
export function renderFunctionDefOutOfLineHeader(
  func: FunctionSymbol,
  className: string,
  lang: TargetLanguage,
  _isAsync = false,
  properties?: Record<string, unknown>
): string {
  const role = functionRoleOf(properties);
  if (lang === 'cpp' && (role === 'constructor' || role === 'destructor')) {
    const { paramList } = constructorParamSlots(func, lang, properties);
    const template =
      role === 'destructor' ? 'DestructorOutOfLineOpen' : 'ConstructorOutOfLineOpen';
    return renderShell(lang, template, { class: className, paramList });
  }
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
  properties?: Record<string, unknown>,
  className?: string
): string | null {
  if (lang !== 'cpp' && lang !== 'csharp') return null;
  const overloadId = properties?.overloadId;
  const overload = func.overloads.find((o) => o.id === overloadId) ?? func.overloads[0];
  const overloadParams = overload?.parameters ?? [];
  const params = overloadParamNames(func, properties)
    .map((p, i) => typedParamFragment(p, overloadParams[i]?.type, lang))
    .join(', ');

  const merged = functionModifierProperties(func, properties);
  const mods = resolveModifierSlots(lang, merged, func.visibility);
  const isAbstract = Boolean(merged.isAbstract);
  // overrideKw comes from resolveModifierSlots (C++ postfix); suffix is pure-virtual only.
  const pureSuffix = lang === 'cpp' && isAbstract ? ' = 0' : '';
  const role = functionRoleOf(merged);
  if (lang === 'cpp' && role === 'constructor') {
    return renderShell(lang, 'ConstructorDeclPrototype', {
      class: emitClassName(func, properties, className),
      paramList: params,
    });
  }
  if (lang === 'cpp' && role === 'destructor') {
    return renderShell(lang, 'DestructorDeclPrototype', {
      class: emitClassName(func, properties, className),
      paramList: params,
      virtualKw: Boolean(merged.isVirtual) ? 'virtual ' : '',
    });
  }

  return renderShell(lang, 'FunctionDeclPrototype', {
    visibility: mods.visibility,
    staticKw: mods.staticKw,
    abstractKw: mods.abstractKw,
    virtualKw: mods.virtualKw,
    overrideKw: mods.overrideKw,
    asyncKw: '',
    prefix: Object.values(mods).join(''),
    returnType: functionReturnTypeName(func, lang, merged),
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
