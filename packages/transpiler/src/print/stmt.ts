import type {
  IrAssignVariable,
  IrAwaitWait,
  IrCallFunction,
  IrCallNative,
  IrDispatchEvent,
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
  IrPrint,
  IrReturn,
  IrBreak,
  IrContinue,
} from '../ir/types';
import { resolveMethodBinding, substituteCallExpr } from '@vvs/environment-templates';
import { PackTemplateMissingError } from '@vvs/syntax-packs';
import { offsetSpans } from '../codeExpr';
import type { ExprPrinter } from './types';
import { createDefaultExprPrinter, mergeArgs } from './expr';
import { builtBlockToText, buildForLoop, buildIfBranch, buildSequence, buildWhileLoop } from './blocks';
import {
  commentPrefixFromPack,
  isPackDrivenFamily,
  printFromTemplate,
} from './template';
import type { PrintContext, PrintedStmt } from './types';

export function createStmtPrinters(
  printExpr: ExprPrinter,
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): Record<string, (stmt: IrStructuredStatement, ctx: PrintContext) => PrintedStmt | null> {
  return {
    CallFunction: (stmt, ctx) => {
      if (stmt.kind !== 'CallFunction') return null;
      const s = stmt as IrCallFunction;
      const { family } = ctx;

      const argsArray = (s.args ?? []).map((expr) => printExpr(expr, ctx));
      const argsStr = argsArray.map((a) => a.text).join(', ');

      if (s.crossClass && s.targetClassName) {
        const classRef = s.targetClassName;
        if (family === 'python') {
          const receiver = s.instanceCall ? `${classRef}()` : classRef;
          return printFromTemplate(ctx, 'CallCrossClass', {
            receiver,
            callee: s.calleeName,
            args: argsStr,
          });
        }
        if (family === 'cpp') {
          const key = s.instanceCall ? 'CallCrossClass' : 'CallCrossClassStatic';
          const receiver = s.instanceCall ? `${classRef}()` : classRef;
          const slots = (
            key === 'CallCrossClassStatic'
              ? { class: classRef, callee: s.calleeName, args: argsStr }
              : { receiver, callee: s.calleeName, args: argsStr }
          ) as Record<string, string>;
          return printFromTemplate(ctx, key, slots);
        }
        if (family === 'javascript') {
          const receiver = s.instanceCall ? `new ${classRef}()` : classRef;
          const key = s.instanceCall ? 'CallCrossClass' : 'CallCrossClassStatic';
          const slots = (
            key === 'CallCrossClassStatic'
              ? { class: classRef, callee: s.calleeName, args: argsStr }
              : { receiver, callee: s.calleeName, args: argsStr }
          ) as Record<string, string>;
          return printFromTemplate(ctx, key, slots);
        }
        if (family === 'verse') {
          return printFromTemplate(ctx, 'CallCrossClass', {
            receiver: classRef,
            callee: s.calleeName,
            args: argsStr,
          });
        }
        if (family === 'gdscript') {
          const receiver = s.instanceCall ? `${classRef}.new()` : classRef;
          return printFromTemplate(ctx, 'CallCrossClass', {
            receiver,
            callee: s.calleeName,
            args: argsStr,
          });
        }
        if (family === 'rust') {
          if (s.instanceCall) {
            return printFromTemplate(ctx, 'CallCrossClass', {
              receiver: `${classRef}::new()`,
              callee: s.calleeName,
              args: argsStr,
            });
          }
          return printFromTemplate(ctx, 'CallCrossClassStatic', {
            class: classRef,
            callee: s.calleeName,
            args: argsStr,
          });
        }
        if (family === 'csharp') {
          const receiver = s.instanceCall ? `new ${classRef}()` : classRef;
          const key = s.instanceCall ? 'CallCrossClass' : 'CallCrossClassStatic';
          const slots = (
            key === 'CallCrossClassStatic'
              ? { class: classRef, callee: s.calleeName, args: argsStr }
              : { receiver, callee: s.calleeName, args: argsStr }
          ) as Record<string, string>;
          return printFromTemplate(ctx, key, slots);
        }
      }

      const key = s.instanceCall ? 'CallInstance' : 'CallFunction';
      return printFromTemplate(ctx, key, { callee: s.calleeName, args: argsStr });
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

    Break: (stmt, ctx) => {
      if (stmt.kind !== 'Break') return null;
      return printFromTemplate(ctx, 'Break', {});
    },

    Continue: (stmt, ctx) => {
      if (stmt.kind !== 'Continue') return null;
      return printFromTemplate(ctx, 'Continue', {});
    },

    AssignVariable: (stmt, ctx) => {
      if (stmt.kind !== 'AssignVariable') return null;
      const s = stmt as IrAssignVariable;
      if (s.assignKind === 'get_input') return null;

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
      return printFromTemplate(ctx, key, {
        target: s.targetName,
        value: { text: val.text, spans: val.spans },
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

    Sequence: (stmt, ctx) => {
      if (stmt.kind !== 'Sequence') return null;
      const block = buildSequence(stmt as IrSequence, ctx, (body, c) =>
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

    AwaitWait: (stmt, ctx) => {
      if (stmt.kind !== 'AwaitWait') return null;
      const s = stmt as IrAwaitWait;
      const { family } = ctx;
      const duration = printExpr(s.seconds, ctx);
      const slot = { text: duration.text, spans: duration.spans };
      const key =
        family === 'python' || family === 'gdscript' || family === 'javascript' || family === 'csharp'
          ? s.async
            ? 'AwaitWaitAsync'
            : 'AwaitWaitSync'
          : 'AwaitWait';
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
