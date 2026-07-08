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
import { offsetSpans } from '../codeExpr';
import type { ExprPrinter } from './types';
import { createDefaultExprPrinter, mergeArgs } from './expr';
import type { PrintContext, PrintedStmt } from './types';

function emitIfElse(
  cond: string,
  trueStmts: string[],
  falseStmts: string[],
  family: PrintContext['family'],
  indent: string
): string {
  const inner = indent + '    ';
  if (family === 'python') {
    const elseClause =
      falseStmts.length > 0 ? `\n${indent}else:\n${falseStmts.join('\n')}` : '';
    return `${indent}if ${cond}:\n${trueStmts.join('\n') || inner + 'pass'}${elseClause}`;
  }
  if (family === 'javascript') {
    const elseClause =
      falseStmts.length > 0 ? ` else {\n${falseStmts.join('\n')}\n${indent}}` : '';
    return `${indent}if (${cond}) {\n${trueStmts.join('\n') || inner + '// empty'}\n${indent}}${elseClause};`;
  }
  if (family === 'cpp') {
    const elseClause =
      falseStmts.length > 0 ? ` else {\n${falseStmts.join('\n')}\n${indent}}` : '';
    return `${indent}if (${cond}) {\n${trueStmts.join('\n') || inner + '// empty'}\n${indent}}${elseClause}`;
  }
  if (family === 'verse') {
    const elseClause =
      falseStmts.length > 0 ? `\n${indent}else:\n${falseStmts.join('\n')}` : '';
    return `${indent}if (${cond}):\n${trueStmts.join('\n') || inner + '# empty'}${elseClause}`;
  }
  return `${indent}// if (${cond})`;
}

function emitForLoop(
  indexVar: string,
  first: string,
  last: string,
  bodyStmts: string[],
  family: PrintContext['family'],
  indent: string
): string {
  const inner = indent + '    ';
  if (family === 'python') {
    return `${indent}for ${indexVar} in range(${first}, ${last} + 1):\n${bodyStmts.join('\n') || inner + 'pass'}`;
  }
  if (family === 'javascript') {
    const body = bodyStmts.join('\n') || inner + '// empty';
    return `${indent}for (let ${indexVar} = ${first}; ${indexVar} <= ${last}; ${indexVar}++) {\n${body}\n${indent}};`;
  }
  if (family === 'cpp') {
    const body = bodyStmts.join('\n') || inner + '// empty';
    return `${indent}for (int ${indexVar} = ${first}; ${indexVar} <= ${last}; ${indexVar}++) {\n${body}\n${indent}}`;
  }
  if (family === 'verse') {
    return `${indent}loop:\n${bodyStmts.join('\n') || inner + '# empty'}  # for ${indexVar} in ${first}..${last}`;
  }
  return `${indent}// for ${indexVar} = ${first}..${last}`;
}

function emitWhileLoop(
  cond: string,
  bodyStmts: string[],
  family: PrintContext['family'],
  indent: string
): string {
  const inner = indent + '    ';
  if (family === 'python') {
    return `${indent}while ${cond}:\n${bodyStmts.join('\n') || inner + 'pass'}`;
  }
  if (family === 'javascript') {
    const body = bodyStmts.join('\n') || inner + '// empty';
    return `${indent}while (${cond}) {\n${body}\n${indent}};`;
  }
  if (family === 'cpp') {
    const body = bodyStmts.join('\n') || inner + '// empty';
    return `${indent}while (${cond}) {\n${body}\n${indent}}`;
  }
  if (family === 'verse') {
    return `${indent}loop:\n${bodyStmts.join('\n') || inner + '# empty'}  # while ${cond}`;
  }
  return `${indent}// while (${cond})`;
}

function caseLabelLiteral(label: string): string {
  if (/^-?\d+(\.\d+)?$/.test(label)) return label;
  return JSON.stringify(label);
}

function emitSwitch(
  selector: string,
  cases: { label: string; body: string[] }[],
  defaultBody: string[],
  family: PrintContext['family'],
  indent: string
): string {
  const inner = indent + '    ';
  const selTemp = `_vvs_sel`;
  if (family === 'python') {
    const lines = [`${indent}${selTemp} = ${selector}`];
    cases.forEach((c, i) => {
      const kw = i === 0 ? 'if' : 'elif';
      lines.push(`${indent}${kw} ${selTemp} == ${caseLabelLiteral(c.label)}:`);
      lines.push(c.body.length > 0 ? c.body.join('\n') : `${inner}pass`);
    });
    if (defaultBody.length > 0) {
      lines.push(`${indent}else:`);
      lines.push(defaultBody.join('\n'));
    }
    return lines.join('\n');
  }
  if (family === 'javascript') {
    const caseLines = cases.map((c) => {
      const body = c.body.length > 0 ? c.body : [`${inner}    // empty`];
      return `${indent}  case ${caseLabelLiteral(c.label)}:\n${body.join('\n')}\n${inner}    break;`;
    });
    const defaultClause =
      defaultBody.length > 0
        ? `\n${indent}  default:\n${defaultBody.join('\n')}\n${inner}    break;`
        : '';
    return `${indent}switch (${selector}) {\n${caseLines.join('\n')}${defaultClause}\n${indent}};`;
  }
  if (family === 'cpp') {
    const caseLines = cases.map((c) => {
      const body = c.body.length > 0 ? c.body : [`${inner}    // empty`];
      return `${indent}  case ${caseLabelLiteral(c.label)}:\n${body.join('\n')}\n${inner}    break;`;
    });
    const defaultClause =
      defaultBody.length > 0
        ? `\n${indent}  default:\n${defaultBody.join('\n')}\n${inner}    break;`
        : '';
    return `${indent}switch (${selector}) {\n${caseLines.join('\n')}${defaultClause}\n${indent}}`;
  }
  if (family === 'verse') {
    const lines = [`${indent}# switch (${selector})`];
    cases.forEach((c) => {
      lines.push(`${indent}if (${selector} = ${JSON.stringify(c.label)}):`);
      lines.push(c.body.length > 0 ? c.body.join('\n') : `${inner}# empty`);
    });
    if (defaultBody.length > 0) {
      lines.push(`${indent}else:`);
      lines.push(defaultBody.join('\n'));
    }
    return lines.join('\n');
  }
  return `${indent}// switch (${selector})`;
}

function emitSequence(
  stepBodies: string[][],
  family: PrintContext['family'],
  indent: string
): string {
  const flat = stepBodies.flat();
  if (family === 'python') {
    const lines = [`${indent}# sequence`];
    lines.push(...flat);
    return lines.join('\n');
  }
  if (family === 'javascript') {
    const body = flat.length > 0 ? flat.join('\n') : `${indent}    // empty`;
    return `${indent}{\n${indent}  // sequence\n${body}\n${indent}};`;
  }
  if (family === 'cpp') {
    const body = flat.length > 0 ? flat.join('\n') : `${indent}    // empty`;
    return `${indent}{\n${indent}  // sequence\n${body}\n${indent}}`;
  }
  if (family === 'verse') {
    const lines = [`${indent}# sequence`];
    lines.push(...flat);
    return lines.join('\n');
  }
  return `${indent}// sequence`;
}

function importTextForSlug(mod: string, family: PrintContext['family']): string {
  if (family === 'python') return `from ${mod} import *`;
  if (family === 'javascript') return `import * as ${mod} from './${mod}';`;
  if (family === 'cpp') return `#include "${mod}.h"`;
  if (family === 'verse') return `using { ${mod} }`;
  return `// import ${mod}`;
}

function commentPrefix(family: PrintContext['family']): string {
  if (family === 'python') return '# ';
  if (family === 'verse') return '# ';
  return '// ';
}

export function createStmtPrinters(
  printExpr: ExprPrinter,
  printStatements: (stmts: IrStatement[], ctx: PrintContext) => PrintedStmt[]
): Record<string, (stmt: IrStructuredStatement, ctx: PrintContext) => PrintedStmt | null> {
  return {
    CallFunction: (stmt, ctx) => {
      if (stmt.kind !== 'CallFunction') return null;
      const s = stmt as IrCallFunction;
      const { indent, family } = ctx;
      if (s.crossClass && s.targetClassName) {
        const classRef = s.targetClassName;
        if (family === 'python') {
          const receiver = s.instanceCall ? `${classRef}()` : classRef;
          const call = s.instanceCall ? `${receiver}.${s.calleeName}()` : `${classRef}.${s.calleeName}()`;
          return { text: `${indent}${call}`, expressionSpans: [] };
        }
        if (family === 'javascript') {
          const receiver = s.instanceCall ? `new ${classRef}()` : classRef;
          const call = s.instanceCall ? `${receiver}.${s.calleeName}();` : `${classRef}.${s.calleeName}();`;
          return { text: `${indent}${call}`, expressionSpans: [] };
        }
        if (family === 'cpp') {
          const receiver = s.instanceCall ? `${classRef}()` : classRef;
          const call = s.instanceCall ? `${receiver}.${s.calleeName}();` : `${classRef}::${s.calleeName}();`;
          return { text: `${indent}${call}`, expressionSpans: [] };
        }
        if (family === 'verse') {
          return { text: `${indent}${classRef}.${s.calleeName}()`, expressionSpans: [] };
        }
      }
      if (family === 'python') {
        const text = s.instanceCall ? `${indent}self.${s.calleeName}()` : `${indent}${s.calleeName}()`;
        return { text, expressionSpans: [] };
      }
      if (family === 'javascript') {
        const text = s.instanceCall ? `${indent}this.${s.calleeName}();` : `${indent}${s.calleeName}();`;
        return { text, expressionSpans: [] };
      }
      if (family === 'cpp') {
        const text = `${indent}${s.calleeName}();`;
        return { text, expressionSpans: [] };
      }
      if (family === 'verse') {
        return { text: `${indent}${s.calleeName}()`, expressionSpans: [] };
      }
      return { text: `${indent}// call ${s.calleeName}()`, expressionSpans: [] };
    },

    Print: (stmt, ctx) => {
      if (stmt.kind !== 'Print') return null;
      const s = stmt as IrPrint;
      const msg = printExpr(s.value, ctx);
      const { indent, family } = ctx;
      const template = ctx.profile?.templates?.Print;
      if (template?.quasi?.includes('{value}')) {
        const parts = template.quasi.split('{value}');
        const prefix = parts[0] ?? '';
        const suffix = parts[1] ?? '';
        const text = `${indent}${prefix}${msg.text}${suffix}`;
        return { text, expressionSpans: offsetSpans(msg.spans, indent.length + prefix.length) };
      }
      if (family === 'python') {
        const prefix = `${indent}print(`;
        return { text: `${prefix}${msg.text})`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
      }
      if (family === 'javascript') {
        const prefix = `${indent}console.log(`;
        return { text: `${prefix}${msg.text});`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
      }
      if (family === 'cpp') {
        const prefix = `${indent}std::cout << `;
        const suffix = ' << std::endl;';
        return { text: `${prefix}${msg.text}${suffix}`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
      }
      if (family === 'verse') {
        const prefix = `${indent}Print(`;
        return { text: `${prefix}${msg.text})`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
      }
      return { text: `${indent}// print(${msg.text})`, expressionSpans: offsetSpans(msg.spans, 0) };
    },

    AssignVariable: (stmt, ctx) => {
      if (stmt.kind !== 'AssignVariable') return null;
      const s = stmt as IrAssignVariable;
      const { indent, family } = ctx;

      if (s.assignKind === 'get_input') {
        const prompt = s.prompt ? printExpr(s.prompt, ctx) : { text: '""', spans: [] };
        const varName = s.targetName;
        const inputKind = s.inputKind ?? 'text';

        if (family === 'python') {
          const rhs =
            inputKind === 'number'
              ? `float(input(${prompt.text}))`
              : `input(${prompt.text})`;
          const prefix = `${indent}${varName} = `;
          return {
            text: `${prefix}${rhs}`,
            expressionSpans: offsetSpans(prompt.spans, prefix.length + (inputKind === 'number' ? 12 : 6)),
          };
        }
        if (family === 'javascript') {
          const read =
            inputKind === 'number'
              ? `parseFloat(prompt(${prompt.text}) ?? "0")`
              : `(prompt(${prompt.text}) ?? "")`;
          const prefix = `${indent}const ${varName} = `;
          return {
            text: `${prefix}${read};`,
            expressionSpans: offsetSpans(prompt.spans, prefix.length + (inputKind === 'number' ? 15 : 8)),
          };
        }
        if (family === 'cpp') {
          if (inputKind === 'number') {
            const lines = [
              `${indent}std::cout << ${prompt.text};`,
              `${indent}float ${varName};`,
              `${indent}std::cin >> ${varName};`,
            ];
            return { text: lines.join('\n'), expressionSpans: [] };
          }
          const lines = [
            `${indent}std::cout << ${prompt.text};`,
            `${indent}std::string ${varName};`,
            `${indent}std::getline(std::cin, ${varName});`,
          ];
          return { text: lines.join('\n'), expressionSpans: [] };
        }
        if (family === 'verse') {
          const type = inputKind === 'number' ? 'float' : 'string';
          const empty = inputKind === 'number' ? '0.0' : '""';
          return {
            text: `${indent}var ${varName} : ${type} = ${empty}  # prompt: ${prompt.text}`,
            expressionSpans: [],
          };
        }
        return { text: `${indent}// input(${prompt.text})`, expressionSpans: offsetSpans(prompt.spans, 0) };
      }

      const val = s.value ? printExpr(s.value, ctx) : { text: 'null', spans: [] };
      if (family === 'python') {
        const prefix = s.targetBinding === 'instance' ? `${indent}self.${s.targetName} = ` : `${indent}${s.targetName} = `;
        return { text: `${prefix}${val.text}`, expressionSpans: offsetSpans(val.spans, prefix.length) };
      }
      if (family === 'javascript') {
        const prefix = s.targetBinding === 'instance' ? `${indent}this.${s.targetName} = ` : `${indent}${s.targetName} = `;
        return { text: `${prefix}${val.text};`, expressionSpans: offsetSpans(val.spans, prefix.length) };
      }
      if (family === 'cpp') {
        const prefix = `${indent}${s.targetName} = `;
        return { text: `${prefix}${val.text};`, expressionSpans: offsetSpans(val.spans, prefix.length) };
      }
      if (family === 'verse') {
        const prefix = `${indent}set ${s.targetName} = `;
        return { text: `${prefix}${val.text}`, expressionSpans: offsetSpans(val.spans, prefix.length) };
      }
      return { text: `${indent}// set ${s.targetName}`, expressionSpans: [] };
    },

    IfBranch: (stmt, ctx) => {
      if (stmt.kind !== 'IfBranch') return null;
      const s = stmt as IrIfBranch;
      const cond = printExpr(s.condition, ctx).text;
      const innerCtx = { ...ctx, indent: ctx.indent + '    ' };
      const trueStmts = printStatements(s.trueBody, innerCtx).map((p) => p.text);
      const falseStmts = printStatements(s.falseBody, innerCtx).map((p) => p.text);
      return {
        text: emitIfElse(cond, trueStmts, falseStmts, ctx.family, ctx.indent),
        expressionSpans: [],
      };
    },

    ForLoop: (stmt, ctx) => {
      if (stmt.kind !== 'ForLoop') return null;
      const s = stmt as IrForLoop;
      const first = printExpr(s.first, ctx).text;
      const last = printExpr(s.last, ctx).text;
      const innerCtx = { ...ctx, indent: ctx.indent + '    ' };
      const bodyStmts = printStatements(s.body, innerCtx).map((p) => p.text);
      return {
        text: emitForLoop(s.indexVar, first, last, bodyStmts, ctx.family, ctx.indent),
        expressionSpans: [],
      };
    },

    WhileLoop: (stmt, ctx) => {
      if (stmt.kind !== 'WhileLoop') return null;
      const s = stmt as IrWhileLoop;
      const cond = printExpr(s.condition, ctx).text;
      const innerCtx = { ...ctx, indent: ctx.indent + '    ' };
      const bodyStmts = printStatements(s.body, innerCtx).map((p) => p.text);
      return {
        text: emitWhileLoop(cond, bodyStmts, ctx.family, ctx.indent),
        expressionSpans: [],
      };
    },

    Switch: (stmt, ctx) => {
      if (stmt.kind !== 'Switch') return null;
      const s = stmt as IrSwitch;
      const selector = printExpr(s.selector, ctx).text;
      const innerCtx = { ...ctx, indent: ctx.indent + '    ' };
      const cases = s.cases.map((c) => ({
        label: c.label,
        body: printStatements(c.body, innerCtx).map((p) => p.text),
      }));
      const defaultBody = printStatements(s.defaultBody, innerCtx).map((p) => p.text);
      return {
        text: emitSwitch(selector, cases, defaultBody, ctx.family, ctx.indent),
        expressionSpans: [],
      };
    },

    Sequence: (stmt, ctx) => {
      if (stmt.kind !== 'Sequence') return null;
      const s = stmt as IrSequence;
      const innerCtx = { ...ctx, indent: ctx.indent + '    ' };
      const steps = s.steps.map((step) => printStatements(step, innerCtx).map((p) => p.text));
      return {
        text: emitSequence(steps, ctx.family, ctx.indent),
        expressionSpans: [],
      };
    },

    DispatchEvent: (stmt, ctx) => {
      if (stmt.kind !== 'DispatchEvent') return null;
      const s = stmt as IrDispatchEvent;
      const argExprs = s.args.map((a) => printExpr(a, ctx));
      const merged = mergeArgs(argExprs);
      const { indent, family } = ctx;
      if (family === 'python') {
        const prefix = `${indent}self.on_${s.handlerName}(`;
        return { text: `${prefix}${merged.text})`, expressionSpans: offsetSpans(merged.spans, prefix.length) };
      }
      if (family === 'javascript') {
        const prefix = `${indent}this.on_${s.handlerName}(`;
        return { text: `${prefix}${merged.text});`, expressionSpans: offsetSpans(merged.spans, prefix.length) };
      }
      if (family === 'cpp') {
        const prefix = `${indent}on_${s.handlerName}(`;
        return { text: `${prefix}${merged.text});`, expressionSpans: offsetSpans(merged.spans, prefix.length) };
      }
      if (family === 'verse') {
        const prefix = `${indent}on_${s.handlerName}(`;
        return { text: `${prefix}${merged.text})`, expressionSpans: offsetSpans(merged.spans, prefix.length) };
      }
      return { text: `${indent}// dispatch ${s.handlerName}`, expressionSpans: [] };
    },

    AwaitWait: (stmt, ctx) => {
      if (stmt.kind !== 'AwaitWait') return null;
      const s = stmt as IrAwaitWait;
      const { indent, family } = ctx;
      if (family === 'python') {
        const text = s.async
          ? `${indent}await asyncio.sleep(${s.seconds})`
          : `${indent}time.sleep(${s.seconds})`;
        return { text, expressionSpans: [] };
      }
      if (family === 'javascript') {
        const text = s.async
          ? `${indent}await new Promise((resolve) => setTimeout(resolve, ${s.seconds} * 1000));`
          : `${indent}/* blocking wait ${s.seconds}s — use await wait in async context */`;
        return { text, expressionSpans: [] };
      }
      if (family === 'cpp') {
        return {
          text: `${indent}std::this_thread::sleep_for(std::chrono::milliseconds(static_cast<int>(${s.seconds} * 1000)));`,
          expressionSpans: [],
        };
      }
      if (family === 'verse') {
        return { text: `${indent}# wait ${s.seconds}s`, expressionSpans: [] };
      }
      return { text: `${indent}// wait ${s.seconds}s`, expressionSpans: [] };
    },

    ModuleImport: (stmt, ctx) => {
      if (stmt.kind !== 'ModuleImport') return null;
      const s = stmt as IrModuleImport;
      return { text: importTextForSlug(s.moduleSlug, ctx.family), expressionSpans: [] };
    },

    ImportClass: (stmt, ctx) => {
      if (stmt.kind !== 'ImportClass') return null;
      const s = stmt as IrImportClass;
      const classRef = s.alias ?? s.className;
      const { family } = ctx;
      if (family === 'python') {
        const text = s.alias
          ? `from ${s.moduleName} import ${s.className} as ${s.alias}`
          : `from ${s.moduleName} import ${s.className}`;
        return { text, expressionSpans: [] };
      }
      if (family === 'javascript') {
        const text = s.alias
          ? `import { ${s.className} as ${s.alias} } from './${s.moduleName}.js';`
          : `import { ${s.className} } from './${s.moduleName}.js';`;
        return { text, expressionSpans: [] };
      }
      if (family === 'cpp') {
        return { text: `#include "${s.moduleName}.h"`, expressionSpans: [] };
      }
      if (family === 'verse') {
        return { text: `using { ${classRef} }`, expressionSpans: [] };
      }
      return { text: `// import class ${s.className} from ${s.moduleName}`, expressionSpans: [] };
    },

    CallNative: (stmt, ctx) => {
      if (stmt.kind !== 'CallNative') return null;
      const s = stmt as IrCallNative;
      const { indent, family, environmentManifest } = ctx;
      if (!environmentManifest) {
        return { text: `${indent}// env native (no manifest)`, expressionSpans: [] };
      }
      const binding = resolveMethodBinding(environmentManifest, s.manifestMethodId, family);
      if (!binding?.callExpr) {
        return {
          text: `${indent}// env native unsupported for ${s.manifestMethodId}`,
          expressionSpans: [],
        };
      }
      const args: Record<string, string> = {};
      for (const [paramId, expr] of Object.entries(s.argExprs)) {
        args[paramId] = printExpr(expr, ctx).text;
      }
      const callText = substituteCallExpr(binding.callExpr, args);
      const suffix = family === 'javascript' ? ';' : '';
      return { text: `${indent}${callText}${suffix}`, expressionSpans: [] };
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
      text: `${ctx.indent}${commentPrefix(ctx.family)}${stmt.comment}`,
      expressionSpans: [],
    };
  }
  const printer = printers[stmt.kind];
  if (printer) {
    const result = printer(stmt, ctx);
    if (result) return result;
  }
  return { text: `${ctx.indent}${commentPrefix(ctx.family)}${stmt.kind}`, expressionSpans: [] };
}

export function printStructuredStatements(
  stmts: IrStatement[],
  ctx: PrintContext
): PrintedStmt[] {
  const printExpr = createDefaultExprPrinter();
  const printers = createStmtPrinters(printExpr, (body, c) =>
    printStructuredStatements(body, c)
  );
  return stmts.map((s) => printStructuredStatement(s, ctx, printers));
}
