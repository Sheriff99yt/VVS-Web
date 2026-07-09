import type { FunctionSymbol, TargetLanguage } from '@vvs/graph-types';
import { defaultCodegenTarget } from '@vvs/graph-types';
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

export function overloadParamNames(func: FunctionSymbol): string[] {
  return func.overloads[0]?.parameters.map((p) => parameterCodegenName(p)) ?? [];
}

function printContextForIr(
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
  return resolvePrintProfile(lang);
}

function renderShell(
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
  extendsType?: string
): string {
  return renderShell(lang, 'ClassModuleOpen', {
    name,
    extendsSuffix: classExtendsSuffix(lang, extendsType),
  });
}

export function renderClassModuleClose(lang: TargetLanguage): string | null {
  return optionalShell(lang, 'ClassModuleClose');
}

export function renderClassPublicSection(lang: TargetLanguage): string | null {
  return optionalShell(lang, 'ClassPublicSection');
}

function eventHandlerParamList(lang: TargetLanguage, handler: IrEventHandler): string {
  if (lang === 'python') {
    return handler.paramNames.length > 0
      ? `self, ${handler.paramNames.join(', ')}`
      : 'self';
  }
  if (lang === 'gdscript') {
    return handler.paramNames.join(', ');
  }
  if (lang === 'rust') {
    const extras = handler.paramNames.map((p) => `${p}: f64`).join(', ');
    return extras ? `&mut self, ${extras}` : '&mut self';
  }
  if (lang === 'csharp') {
    return handler.paramNames.map((p) => `double ${p}`).join(', ');
  }
  if (lang === 'cpp') {
    return handler.paramNames.map((p) => `float ${p}`).join(', ');
  }
  if (lang === 'verse') {
    return handler.paramNames.map((p) => `${p} : float`).join(', ');
  }
  return handler.paramNames.join(', ');
}

function eventHandlerSignature(lang: TargetLanguage, handler: IrEventHandler): string {
  if (lang === 'cpp') {
    const params = eventHandlerParamList(lang, handler);
    return params
      ? `void on_${handler.handlerName}(${params})`
      : `void on_${handler.handlerName}()`;
  }
  if (lang === 'verse') {
    const params = eventHandlerParamList(lang, handler);
    return params
      ? `on_${handler.handlerName}<override>(${params}) : void =`
      : `on_${handler.handlerName}<override>() : void =`;
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
  options?: { leadingBlankLine?: boolean; leadingNewline?: boolean }
): void {
  const lang = ir.targetLanguage;
  if (options?.leadingBlankLine && sink.lineCount > 0) sink.appendRaw('');

  const slots: Record<string, string> = {
    linePrefix: options?.leadingNewline && sink.lineCount > 0 ? '\n' : '',
    handler: handler.handlerName,
    paramList: eventHandlerParamList(lang, handler),
  };
  if (lang === 'cpp' || lang === 'verse') {
    slots.signature = eventHandlerSignature(lang, handler);
  }

  const startLine = sink.lineCount + 1;
  sink.appendRaw(renderShell(lang, 'EventHandlerOpen', slots));

  const ctx = printContextForIr(ir, handlerBodyIndent(lang), ir.environmentManifest);
  if (handler.body.length === 0) sink.appendRaw(emptyHandlerBodyLine(lang));
  else appendIrStatements(sink, handler.body, ctx);

  const close = optionalShell(lang, 'EventHandlerClose');
  if (close) sink.appendRaw(close);

  sink.tagRange(
    handlerSourceGraphNodeId,
    startLine,
    sink.lineCount,
    eventHandlerTagAnchor(lang, handler)
  );
}

function functionParamList(func: FunctionSymbol, lang: TargetLanguage): string {
  const params = overloadParamNames(func);
  const binding = func.binding ?? 'instance';
  if (lang === 'python' && binding === 'instance') {
    return ['self', ...params].join(', ');
  }
  if (lang === 'gdscript') {
    return params.join(', ');
  }
  if (lang === 'rust') {
    if (binding === 'static') {
      return params.map((p) => `${p}: f64`).join(', ');
    }
    const typed = params.map((p) => `${p}: f64`).join(', ');
    return typed ? `&mut self, ${typed}` : '&mut self';
  }
  if (lang === 'csharp') {
    return params.map((p) => `double ${p}`).join(', ');
  }
  if (lang === 'verse') {
    return params
      .map((p, i) => {
        const param = func.overloads[0]!.parameters[i]!;
        const t =
          param.type === 'data_number'
            ? 'float'
            : param.type === 'data_string'
              ? 'string'
              : 'logic';
        return `${p} : ${t}`;
      })
      .join(', ');
  }
  if (lang === 'cpp') {
    return params.join(', ');
  }
  return params.join(', ');
}

function functionDefPrefix(
  func: FunctionSymbol,
  lang: TargetLanguage,
  isVirtual: boolean
): string {
  const binding = func.binding ?? 'instance';
  if (lang === 'python') {
    return binding === 'static' ? '    @staticmethod\n    ' : '    ';
  }
  if (lang === 'gdscript') {
    return binding === 'static' ? '    static ' : '    ';
  }
  if (lang === 'rust') {
    return binding === 'static' ? '    ' : '    pub ';
  }
  if (lang === 'csharp') {
    return binding === 'static' ? '    public static ' : '    public ';
  }
  if (lang === 'javascript') {
    return binding === 'static' ? '  static ' : '  ';
  }
  if (lang === 'cpp') {
    if (binding === 'static') return '    static ';
    if (isVirtual) return '    virtual ';
    return '    ';
  }
  return '    ';
}

export function renderFunctionDefHeader(
  func: FunctionSymbol,
  lang: TargetLanguage,
  isAsync = false,
  isVirtual = false
): string {
  return renderShell(lang, 'FunctionDefOpen', {
    staticDecorator: functionDefPrefix(func, lang, isVirtual),
    prefix: functionDefPrefix(func, lang, isVirtual),
    asyncKw: isAsync ? 'async ' : '',
    name: func.name,
    paramList: functionParamList(func, lang),
  });
}

export function renderFunctionDeclPrototype(
  func: FunctionSymbol,
  lang: TargetLanguage,
  isVirtual = false
): string | null {
  if (lang !== 'cpp') return null;
  const params = overloadParamNames(func)
    .map((p) => `float ${p}`)
    .join(', ');
  return renderShell(lang, 'FunctionDeclPrototype', {
    prefix: functionDefPrefix(func, lang, isVirtual),
    name: func.name,
    paramList: params,
  });
}

export function renderFunctionTabClose(lang: TargetLanguage): string | null {
  return optionalShell(lang, 'FunctionTabClose');
}
