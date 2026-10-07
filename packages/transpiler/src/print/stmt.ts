import { GO_SCALAR_PINS, CSHARP_INTEGRAL_PINS, canonicalNativeScalarSignatureType, nativeScalarInferenceSpelling } from '@vvs/graph-types';
import type {
  IrAssignVariable,
  IrAwaitWait,
  IrCallFunction,
  IrCallNative,
  IrDispatchEvent,
  IrBindEvent,
  IrForLoop,
  IrIfBranch,
  IrModuleImport,
  IrImportClass,
  IrSequence,
  IrStructuredStatement,
  IrStatement,
  IrDeclareLocal,
  IrSwitch,
  IrWhileLoop,
  IrTry,
  IrPrint,
  IrReturn,
  IrBreak,
  IrContinue,
  IrYield,
} from '../ir/types';
import { resolveMethodBinding, substituteCallExpr } from '@vvs/environment-templates';
import { PackTemplateMissingError } from '@vvs/syntax-packs';
import { offsetSpans } from '../codeExpr';
import type { ExprPrinter } from './types';
import { createDefaultExprPrinter, mergeArgs, printCallInvocation, rustInheritedBasePath } from './expr';
import { builtBlockToText, buildForLoop, buildIfBranch, buildSequence, buildTry, buildWhileLoop, innerIndentCtx } from './blocks';
import {
  commentPrefixFromPack,
  instanceReceiver,
  isPackDrivenFamily,
  printFromTemplate,
} from './template';
import type { PrintContext, PrintedStmt } from './types';


function awaitWaitTemplateKey(ctx: PrintContext, isAsync: boolean): string {
  const templates = ctx.profile?.templates ?? {};
  if (isAsync && templates.AwaitWaitAsync) return 'AwaitWaitAsync';
  if (!isAsync && templates.AwaitWaitSync) return 'AwaitWaitSync';
  if (templates.AwaitWait) return 'AwaitWait';
  return isAsync ? 'AwaitWaitAsync' : 'AwaitWaitSync';
}

export function createStmtPrinters(
  printExpr: ExprPrinter,
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): Record<string, (stmt: IrStructuredStatement, ctx: PrintContext) => PrintedStmt | null> {
  return {
    CallFunction: (stmt, ctx) => {
      if (stmt.kind !== 'CallFunction') return null;
      const s = stmt as IrCallFunction;
      const printed = printCallInvocation(s, ctx, printExpr);
      const suffix = printed.text.endsWith(';') || !['javascript', 'cpp', 'csharp', 'rust'].includes(ctx.family)
        ? ''
        : ';';
      return {
        text: `${ctx.indent}${printed.text}${suffix}`,
        expressionSpans: offsetSpans(printed.spans, ctx.indent.length),
      };
    },

    Print: (stmt, ctx) => {
      if (stmt.kind !== 'Print') return null;
      const s = stmt as IrPrint;
      const msg = printExpr(s.value, ctx);
      return printFromTemplate(ctx, 'Print', { value: { text: msg.text, spans: msg.spans } });
    },

    Return: (stmt, ctx) => {
      if (stmt.kind !== 'Return') return null;
      const s = stmt as IrReturn;
      if (s.nativeStyle === 'rust-tail') {
        if (ctx.family !== 'rust' || !s.value || s.values?.length) throw new Error('NATIVE_RETURN_STYLE');
        return printFromTemplate(ctx, 'NativeTailReturn', { value: printExpr(s.value, ctx) });
      }
      if (s.values && s.values.length > 0) {
        const valTexts = s.values.map((v) => printExpr(v, ctx).text);
        let tupleStr = valTexts.join(', ');
        const lang = ctx.family;
        if (lang === 'cpp') tupleStr = `std::make_tuple(${valTexts.join(', ')})`;
        else if (lang === 'csharp' || lang === 'rust' || lang === 'verse') tupleStr = `(${valTexts.join(', ')})`;
        else if (lang === 'javascript') tupleStr = `[${valTexts.join(', ')}]`;
        return printFromTemplate(ctx, 'ReturnVal', { value: { text: tupleStr, spans: [] } });
      }
      if (s.value) {
        const val = printExpr(s.value, ctx);
        const printed = printFromTemplate(ctx, 'ReturnVal', { value: { text: val.text, spans: val.spans } });
        const valOffset = printed.text.indexOf(val.text);
        return {
          text: printed.text,
          expressionSpans: offsetSpans(val.spans, valOffset >= 0 ? valOffset : printed.text.length),
        };
      }
      return printFromTemplate(ctx, 'ReturnVoid', {});
    },

    LanguageDirective: (stmt, ctx) => {
      if (stmt.kind !== 'LanguageDirective') return null;
      if (ctx.family !== 'javascript') throw new Error('DIRECTIVE_TARGET_UNSUPPORTED');
      return printFromTemplate(ctx, 'LanguageDirective', { value: JSON.stringify(stmt.value) });
    },

    Break: (stmt, ctx) => {
      if (stmt.kind !== 'Break') return null;
      return printFromTemplate(ctx, 'Break', {});
    },

    Continue: (stmt, ctx) => {
      if (stmt.kind !== 'Continue') return null;
      return printFromTemplate(ctx, 'Continue', {});
    },

    Yield: (stmt, ctx) => {
      if (stmt.kind !== 'Yield') return null;
      const s = stmt as IrYield;
      if (ctx.family !== 'python' && ctx.family !== 'gdscript') {
        const prefix = commentPrefixFromPack(ctx);
        return { text: `${ctx.indent}${prefix}(x) Yield`, expressionSpans: [] };
      }
      if (s.value) {
        const val = printExpr(s.value, ctx);
        const printed = printFromTemplate(ctx, 'YieldVal', { value: { text: val.text, spans: val.spans } });
        const valOffset = printed.text.indexOf(val.text);
        return {
          text: printed.text,
          expressionSpans: offsetSpans(val.spans, valOffset >= 0 ? valOffset : printed.text.length),
        };
      }
      return printFromTemplate(ctx, 'YieldVoid', {});
    },

    AssignVariable: (stmt, ctx) => {
      if (stmt.kind !== 'AssignVariable') return null;
      const s = stmt as IrAssignVariable;
      if (s.assignKind === 'get_input') return null;
      if (s.nativeLocalLanguage) {
        if (s.nativeLocalLanguage !== ctx.family || s.targetBinding !== 'local' || s.operator !== '=' || !s.value) throw new Error('NATIVE_SCALAR_ASSIGNMENT_INVALID');
        return printFromTemplate(ctx, 'AssignNativeScalarLocal', { target: s.targetName, value: printExpr(s.value, ctx) });
      }

      if (s.operator && s.operator !== '=') {
        if (!['javascript', 'go', 'csharp'].includes(ctx.family) || (ctx.family === 'go' && s.prefix)) throw new Error('ASSIGN_OPERATOR_UNSUPPORTED: Explicit update operators require a supported target.');
        const target = s.targetBinding === 'instance' ? `this.${s.targetName}` : s.targetName;
        if (s.operator === '++' || s.operator === '--') return printFromTemplate(ctx, s.prefix ? 'UpdatePrefix' : 'UpdatePostfix', { target, operator: s.operator });
        return printFromTemplate(ctx, 'AssignCompound', { target, operator: s.operator, value: printExpr(s.value!, ctx) });
      }

      const val = s.value ? printExpr(s.value, ctx) : { text: 'null', spans: [] };
      const { family } = ctx;
      const key =
        family === 'cpp'
          ? 'Assign'
          : s.targetBinding === 'instance'
            ? 'AssignInstance'
            : 'AssignLocal';
      if (!ctx.profile?.templates[key]) {
        throw new PackTemplateMissingError(key, family);
      }
      const basePath = family === 'rust' ? rustInheritedBasePath(s.inheritedDepth) : '';
      return printFromTemplate(ctx, key, {
        target: s.targetName,
        value: { text: val.text, spans: val.spans },
        basePath,
      });
    },

    IfBranch: (stmt, ctx) => {
      if (stmt.kind !== 'IfBranch') return null;
      const block = buildIfBranch(stmt as IrIfBranch, ctx, (body, c) =>
        printStatements(body, c).map((p) => p.text)
      );
      return { text: builtBlockToText(block), expressionSpans: [] };
    },

    ForLoop: (stmt, ctx) => {
      if (stmt.kind !== 'ForLoop') return null;
      if (stmt.range) {
        if (ctx.family !== 'python') throw new Error('RANGE_TARGET_UNSUPPORTED');
        const args = stmt.range.args.map(argument => printExpr(argument, ctx));
        const header = printFromTemplate(ctx, 'ForNativeRangeHeader', { index: stmt.indexVar, args: args.map(argument => argument.text).join(', ') });
        const body = printStatements(stmt.body, { ...ctx, indent: ctx.indent + '    ' });
        return { text: [header.text, ...body.map(statement => statement.text)].join('\n'), expressionSpans: header.expressionSpans };
      }
      if (stmt.header) {
        if (ctx.family !== 'javascript') throw new Error('FOR_HEADER_TARGET_UNSUPPORTED: Structured counted headers are JavaScript-only.');
        const headerContext = { ...ctx, indent: '' };
        const initializer = printStatements([stmt.header.initializer], headerContext)[0];
        const update = printStatements([stmt.header.update], headerContext)[0];
        const slot = (printed: PrintedStmt, nodeId: string) => {
          const text = printed.text.trim().replace(/;$/, '');
          return { text, spans: [{ nodeId, start: 0, end: text.length }, ...(printed.expressionSpans ?? [])] };
        };
        const header = printFromTemplate(ctx, 'ForStructuredHeader', { initializer: slot(initializer, stmt.header.initializer.sourceGraphNodeId), condition: printExpr(stmt.header.condition, ctx), update: slot(update, stmt.header.update.sourceGraphNodeId) });
        const body = printStatements(stmt.body, { ...ctx, indent: `${ctx.indent}${ctx.profile?.layout?.indentUnit ?? '    '}` });
        const text = [header.text, ...body.map(item => item.text), `${ctx.indent}}`].join('\n');
        return { text, expressionSpans: header.expressionSpans };
      }
      const block = buildForLoop(stmt as IrForLoop, ctx, (body, c) =>
        printStatements(body, c).map((p) => p.text)
      );
      return { text: builtBlockToText(block), expressionSpans: [] };
    },

    WhileLoop: (stmt, ctx) => {
      if (stmt.kind !== 'WhileLoop') return null;
      const block = buildWhileLoop(stmt as IrWhileLoop, ctx, (body, c) =>
        printStatements(body, c).map((p) => p.text)
      );
      return { text: builtBlockToText(block), expressionSpans: [] };
    },

    Switch: (stmt, ctx) => {
      if (stmt.kind !== 'Switch') return null;
      if (isPackDrivenFamily(ctx.family)) return null;
      return { text: `${ctx.indent}// switch`, expressionSpans: [] };
    },

    DeclarationGroup: (stmt, ctx) => {
      if (stmt.kind !== 'DeclarationGroup') return null;
      if (stmt.nativeLanguage === 'cpp') {
        if (ctx.family !== 'cpp' || stmt.body.length < 2 || !stmt.nativeAuthoredType || (stmt.nativeInferenceMode !== undefined && (stmt.nativeInferenceMode !== 'cpp-auto' || stmt.nativeAuthoredType !== 'auto')) || stmt.body.some(declaration => !declaration.initializer || declaration.nativeLocalStyle !== 'cpp-scalar' || declaration.nativeType !== stmt.nativeType || declaration.nativeAuthoredType !== stmt.nativeAuthoredType || declaration.nativeInferenceMode !== stmt.nativeInferenceMode || declaration.nativeMutable !== !stmt.isConst)) throw new Error('NATIVE_CPP_GROUP_CONTEXT');
        const declarators = mergeArgs(stmt.body.map(declaration => {
          const rendered = printFromTemplate(ctx, 'NativeScalarDeclarator', { name: declaration.name, value: printExpr(declaration.initializer!, ctx) }, { noIndent: true });
          return { text: rendered.text, spans: [{ nodeId: declaration.sourceGraphNodeId, start: 0, end: rendered.text.length }, ...rendered.expressionSpans] };
        }));
        return printFromTemplate(ctx, 'DeclareNativeScalarGroup', { qualifier: stmt.isConst ? 'const ' : '', type: stmt.nativeAuthoredType, declarators });
      }
      if (ctx.family !== 'csharp' || stmt.body.length < 2) throw new Error('NATIVE_CSHARP_GROUP_LANGUAGE');
      const declarators = mergeArgs(stmt.body.map(declaration => {
        const rendered = declaration.initializer ? printFromTemplate(ctx, 'CSharpDeclarator', { name: declaration.name, value: printExpr(declaration.initializer, ctx) }, { noIndent: true }) : printFromTemplate(ctx, 'CSharpDeclaratorUninitialized', { name: declaration.name }, { noIndent: true });
        return { text: rendered.text, spans: [{ nodeId: declaration.sourceGraphNodeId, start: 0, end: rendered.text.length }, ...rendered.expressionSpans] };
      }));
      return printFromTemplate(ctx, 'DeclareCSharpGroup', { keyword: stmt.isConst ? 'const ' : '', type: stmt.nativeType, declarators });
    },

    ScopeBlock: (stmt, ctx) => {
      if (stmt.kind !== 'ScopeBlock') return null;
      if (ctx.family !== 'csharp') throw new Error('NATIVE_CSHARP_SCOPE_LANGUAGE');
      return { text: [printFromTemplate(ctx, 'ScopeOpen', { context: stmt.overflowContext === 'default' ? '' : `${stmt.overflowContext} ` }).text, ...printStatements(stmt.body, innerIndentCtx(ctx)).map(line => line.text), printFromTemplate(ctx, 'ScopeClose', {}).text].join('\n'), expressionSpans: [] };
    },

    Sequence: (stmt, ctx) => {
      if (stmt.kind !== 'Sequence') return null;
      const block = buildSequence(stmt as IrSequence, ctx, (body, c) =>
        printStatements(body, c).map((p) => p.text)
      );
      return { text: builtBlockToText(block), expressionSpans: [] };
    },

    Try: (stmt, ctx) => {
      if (stmt.kind !== 'Try') return null;
      const block = buildTry(stmt as IrTry, ctx, (body, c) =>
        printStatements(body, c).map((p) => p.text)
      );
      return { text: builtBlockToText(block), expressionSpans: [] };
    },

    DispatchEvent: (stmt, ctx) => {
      if (stmt.kind !== 'DispatchEvent') return null;
      const s = stmt as IrDispatchEvent;
      const argExprs = s.args.map((a) => printExpr(a, ctx));
      const merged = mergeArgs(argExprs);
      const { family } = ctx;

      if (s.isSuper) {
        const printed = printFromTemplate(ctx, 'DispatchEventSuper', {
          handler: s.handlerName,
          args: { text: merged.text, spans: merged.spans },
          parent: s.parentClassName ?? '',
        });
        const argsOffset = printed.text.indexOf(merged.text);
        return {
          text: printed.text,
          expressionSpans: offsetSpans(merged.spans, argsOffset >= 0 ? argsOffset : printed.text.length),
        };
      }

      if (s.crossClass && s.targetClassName) {
        const classRef = s.targetClassName;
        let receiver = classRef;
        if (family === 'python') receiver = `${classRef}()`;
        else if (family === 'javascript' || family === 'csharp') receiver = `new ${classRef}()`;
        else if (family === 'gdscript') receiver = `${classRef}.new()`;
        else if (family === 'rust') receiver = `${classRef}::new()`;
        else if (family === 'cpp') receiver = `${classRef}()`;
        // verse: class name as receiver (matches CallCrossClass)

        const printed = printFromTemplate(ctx, 'DispatchEventCrossClass', {
          receiver,
          handler: s.handlerName,
          args: { text: merged.text, spans: merged.spans },
        });
        const argsOffset = printed.text.indexOf(merged.text);
        return {
          text: printed.text,
          expressionSpans: offsetSpans(merged.spans, argsOffset >= 0 ? argsOffset : printed.text.length),
        };
      }

      const printed = printFromTemplate(ctx, 'DispatchEvent', {
        handler: s.handlerName,
        args: { text: merged.text, spans: merged.spans },
      });
      const argsOffset = printed.text.indexOf(merged.text);
      return {
        text: printed.text,
        expressionSpans: offsetSpans(merged.spans, argsOffset >= 0 ? argsOffset : printed.text.length),
      };
    },

    BindEvent: (stmt, ctx) => {
      if (stmt.kind !== 'BindEvent') return null;
      const s = stmt as IrBindEvent;
      const { family } = ctx;
      if (family !== 'csharp' && family !== 'javascript' && family !== 'gdscript') {
        return {
          text: `${ctx.indent}${commentPrefixFromPack(ctx)}(x) Bind`,
          expressionSpans: [],
        };
      }
      const receiver = s.target ? printExpr(s.target, ctx).text : instanceReceiver(ctx);
      const event = s.event
        ? printExpr(s.event, ctx).text
        : family === 'csharp'
          ? s.eventName
          : JSON.stringify(s.eventName);
      const handler = s.handler ? printExpr(s.handler, ctx).text : `${receiver}.on_${s.handlerName}`;
      return printFromTemplate(ctx, 'BindEvent', { target: receiver, event, handler });
    },

    AwaitWait: (stmt, ctx) => {
      if (stmt.kind !== 'AwaitWait') return null;
      const s = stmt as IrAwaitWait;
      const duration = printExpr(s.seconds, ctx);
      const slot = { text: duration.text, spans: duration.spans };
      const key = awaitWaitTemplateKey(ctx, s.async);
      const printed = printFromTemplate(ctx, key, { duration: slot });
      const durOffset = printed.text.indexOf(duration.text);
      return {
        text: printed.text,
        expressionSpans: offsetSpans(duration.spans, durOffset >= 0 ? durOffset : printed.text.length),
      };
    },

    ModuleImport: (stmt, ctx) => {
      if (stmt.kind !== 'ModuleImport') return null;
      const s = stmt as IrModuleImport;
      // Respect ctx.indent so file-top (indent '') and conditional/in-body imports both work.
      if (s.importStyle === 'include_system') {
        return printFromTemplate(ctx, 'ModuleImportIncludeSystem', { mod: s.moduleSlug });
      }
      if (s.importStyle === 'from') {
        return printFromTemplate(ctx, 'ModuleImportFrom', {
          mod: s.moduleSlug,
          names: (s.importNames ?? []).join(', ') || '*',
        });
      }
      return printFromTemplate(ctx, 'ModuleImport', { mod: s.moduleSlug });
    },

    ImportClass: (stmt, ctx) => {
      if (stmt.kind !== 'ImportClass') return null;
      const s = stmt as IrImportClass;
      const { family } = ctx;

      if (family === 'python' || family === 'javascript' || family === 'gdscript' || family === 'rust' || family === 'csharp') {
        const key = s.alias ? 'ImportClassAlias' : 'ImportClass';
        return printFromTemplate(
          ctx,
          key,
          {
            mod: s.moduleName,
            class: s.className,
            ...(s.alias ? { alias: s.alias } : {}),
          },
          { noIndent: true }
        );
      }
      if (family === 'verse') {
        const classRef = s.alias ?? s.className;
        const key = s.alias ? 'ImportClassAlias' : 'ImportClass';
        return printFromTemplate(
          ctx,
          key,
          { class: classRef, ...(s.alias ? { alias: s.alias } : {}) },
          { noIndent: true }
        );
      }
      return printFromTemplate(ctx, 'ImportClass', { mod: s.moduleName }, { noIndent: true });
    },

    CallNative: (stmt, ctx) => {
      if (stmt.kind !== 'CallNative') return null;
      const s = stmt as IrCallNative;
      const { indent, family, environmentManifest } = ctx;
      if (!environmentManifest) {
        return { text: `${indent}${commentPrefixFromPack(ctx)}env native (no manifest)`, expressionSpans: [] };
      }
      const binding = resolveMethodBinding(environmentManifest, s.manifestMethodId, family);
      if (!binding?.callExpr) {
        return {
          text: `${indent}${commentPrefixFromPack(ctx)}env native unsupported for ${s.manifestMethodId}`,
          expressionSpans: [],
        };
      }
      const args: Record<string, string> = {};
      for (const [paramId, expr] of Object.entries(s.argExprs)) {
        args[paramId] = printExpr(expr, ctx).text;
      }
      const callText = substituteCallExpr(binding.callExpr, args);
      return printFromTemplate(ctx, 'CallNative', { call: callText });
    },

    DeclareLocal: (stmt, ctx) => {
      if (stmt.kind !== 'DeclareLocal') return null;
      const s = stmt as IrDeclareLocal;
      const { family } = ctx;
      if (s.nativeLocalStyle) {
        if (['cpp-scalar', 'rust-scalar', 'gdscript-scalar'].includes(s.nativeLocalStyle)) {
          if (!['cpp', 'rust', 'gdscript'].includes(family) || s.nativeLocalStyle !== `${family}-scalar` || !s.initializer
            || typeof s.nativeAuthoredType !== 'string' || typeof s.nativeMutable !== 'boolean'
            || (s.nativeInferenceMode === undefined ? canonicalNativeScalarSignatureType(s.nativeAuthoredType, family as 'cpp' | 'rust' | 'gdscript') !== s.nativeType : nativeScalarInferenceSpelling(s.nativeInferenceMode, family as 'cpp' | 'rust' | 'gdscript') !== s.nativeAuthoredType || !canonicalNativeScalarSignatureType(String(s.nativeType), family as 'cpp' | 'rust' | 'gdscript') || family === 'gdscript' && !s.nativeMutable)) throw new Error('NATIVE_SCALAR_LOCAL_INVALID');
          return printFromTemplate(ctx, s.nativeInferenceMode ? 'DeclareNativeInferredLocal' : 'DeclareNativeScalarLocal', { name: s.name, type: s.nativeAuthoredType, qualifier: s.nativeMutable ? '' : 'const ', mutability: s.nativeMutable ? 'mut ' : '', keyword: s.nativeMutable ? 'var' : 'const', value: printExpr(s.initializer, ctx) });
        }
        if (s.nativeLocalStyle.startsWith('csharp-')) {
          if (family !== 'csharp' || !s.initializer && s.nativeLocalStyle !== 'csharp-typed' || !s.nativeType || (s.nativeLocalStyle === 'csharp-var' ? s.nativeType !== 'var' : !Object.hasOwn(CSHARP_INTEGRAL_PINS, s.nativeType)) || (s.nativeLocalStyle === 'csharp-const') !== (s.declarationKind === 'const')) throw new Error('NATIVE_CSHARP_LOCAL_INVALID');
          if (!s.initializer) return printFromTemplate(ctx, 'DeclareCSharpUninitialized', { name: s.name, type: s.nativeType });
          return printFromTemplate(ctx, s.nativeLocalStyle === 'csharp-const' ? 'DeclareCSharpConstant' : 'DeclareCSharpLocal', { name: s.name, type: s.nativeType, value: printExpr(s.initializer, ctx) });
        }
        if (family !== 'go' || !s.initializer || !s.nativeType || !(Object.hasOwn(GO_SCALAR_PINS, s.nativeType) || (s.nativeLocalStyle === 'go-const' && s.nativeType === 'untyped'))) throw new Error('NATIVE_GO_LOCAL_INVALID');
        return printFromTemplate(ctx, s.nativeLocalStyle === 'go-const' ? (s.nativeType === 'untyped' ? 'DeclareGoConstant' : 'DeclareGoTypedConstant') : s.nativeLocalStyle === 'go-short' ? 'DeclareGoShort' : 'DeclareGoTyped', { name: s.name, type: s.nativeType, value: printExpr(s.initializer, ctx) });
      }
      if (s.initializer && (family === 'javascript' || family === 'python')) {
        const value = printExpr(s.initializer, ctx);
        return printFromTemplate(ctx, 'DeclareLocalInitialized', { name: s.name, keyword: s.declarationKind ?? 'let', value: { text: value.text, spans: value.spans } });
      }
      if (family === 'javascript' || family === 'verse') {
        return printFromTemplate(ctx, 'DeclareLocal', { name: s.name, type: s.variableType });
      }
      if (family === 'python' || family === 'gdscript') {
        return printFromTemplate(ctx, 'DeclareLocal', { name: s.name });
      }
      if (family === 'cpp' || family === 'csharp' || family === 'rust') {
        return printFromTemplate(ctx, 'DeclareLocal', { name: s.name, type: s.variableType });
      }
      return { text: `${ctx.indent}var ${s.name};`, expressionSpans: [] };
    },
  };
}

export function printStructuredStatement(
  stmt: IrStructuredStatement,
  ctx: PrintContext,
  printers: ReturnType<typeof createStmtPrinters>
): PrintedStmt {
  if ('comment' in stmt) {
    return {
      text: `${ctx.indent}${commentPrefixFromPack(ctx)}${stmt.comment}`,
      expressionSpans: [],
    };
  }
  const printer = printers[stmt.kind];
  if (printer) {
    const result = printer(stmt, ctx);
    if (result) return result;
  }
  return {
    text: `${ctx.indent}${commentPrefixFromPack(ctx)}${stmt.kind}`,
    expressionSpans: [],
  };
}

export function printStructuredStatements(
  stmts: IrStructuredStatement[],
  ctx: PrintContext,
  printers: ReturnType<typeof createStmtPrinters>
): PrintedStmt[] {
  return stmts.map((s) => printStructuredStatement(s, ctx, printers));
}
