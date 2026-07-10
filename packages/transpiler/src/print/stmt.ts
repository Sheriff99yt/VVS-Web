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
  IrPrint,
  IrSequence,
  IrStructuredStatement,
  IrStatement,
  IrSwitch,
  IrWhileLoop,
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

      if (s.crossClass && s.targetClassName) {
        const classRef = s.targetClassName;
        if (family === 'python') {
          const receiver = s.instanceCall ? `${classRef}()` : classRef;
          return printFromTemplate(ctx, 'CallCrossClass', {
            receiver,
            callee: s.calleeName,
          });
        }
        if (family === 'cpp') {
          const key = s.instanceCall ? 'CallCrossClass' : 'CallCrossClassStatic';
          const receiver = s.instanceCall ? `${classRef}()` : classRef;
          const slots = (
            key === 'CallCrossClassStatic'
              ? { class: classRef, callee: s.calleeName }
              : { receiver, callee: s.calleeName }
          ) as Record<string, string>;
          return printFromTemplate(ctx, key, slots);
        }
        if (family === 'javascript') {
          const receiver = s.instanceCall ? `new ${classRef}()` : classRef;
          const key = s.instanceCall ? 'CallCrossClass' : 'CallCrossClassStatic';
          const slots = (
            key === 'CallCrossClassStatic'
              ? { class: classRef, callee: s.calleeName }
              : { receiver, callee: s.calleeName }
          ) as Record<string, string>;
          return printFromTemplate(ctx, key, slots);
        }
        if (family === 'verse') {
          return printFromTemplate(ctx, 'CallCrossClass', {
            receiver: classRef,
            callee: s.calleeName,
          });
        }
        if (family === 'gdscript') {
          const receiver = s.instanceCall ? `${classRef}.new()` : classRef;
          return printFromTemplate(ctx, 'CallCrossClass', {
            receiver,
            callee: s.calleeName,
          });
        }
        if (family === 'rust') {
          if (s.instanceCall) {
            return printFromTemplate(ctx, 'CallCrossClass', {
              receiver: `${classRef}::new()`,
              callee: s.calleeName,
            });
          }
          return printFromTemplate(ctx, 'CallCrossClassStatic', {
            class: classRef,
            callee: s.calleeName,
          });
        }
        if (family === 'csharp') {
          const receiver = s.instanceCall ? `new ${classRef}()` : classRef;
          const key = s.instanceCall ? 'CallCrossClass' : 'CallCrossClassStatic';
          const slots = (
            key === 'CallCrossClassStatic'
              ? { class: classRef, callee: s.calleeName }
              : { receiver, callee: s.calleeName }
          ) as Record<string, string>;
          return printFromTemplate(ctx, key, slots);
        }
      }

      const key = s.instanceCall ? 'CallInstance' : 'CallFunction';
      return printFromTemplate(ctx, key, { callee: s.calleeName });
    },

    Print: (stmt, ctx) => {
      if (stmt.kind !== 'Print') return null;
      const s = stmt as IrPrint;
      const msg = printExpr(s.value, ctx);
      return printFromTemplate(ctx, 'Print', { value: { text: msg.text, spans: msg.spans } });
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
      if (family === 'python' || family === 'gdscript') {
        const key = s.async ? 'AwaitWaitAsync' : 'AwaitWaitSync';
        return printFromTemplate(ctx, key, { duration: String(s.seconds) });
      }
      if (family === 'javascript' || family === 'csharp') {
        const key = s.async ? 'AwaitWaitAsync' : 'AwaitWaitSync';
        return printFromTemplate(ctx, key, { duration: String(s.seconds) });
      }
      return printFromTemplate(ctx, 'AwaitWait', { duration: String(s.seconds) });
    },

    ModuleImport: (stmt, ctx) => {
      if (stmt.kind !== 'ModuleImport') return null;
      const s = stmt as IrModuleImport;
      return printFromTemplate(ctx, 'ModuleImport', { mod: s.moduleSlug }, { noIndent: true });
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
