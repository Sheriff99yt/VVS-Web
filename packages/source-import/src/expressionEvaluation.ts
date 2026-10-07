import { IMPORT_LIMITS, ImportFailure, type ExpressionPlan } from './contracts';

type CallPlan = ExpressionPlan & { kind: 'call' };
type NativePlan = ExpressionPlan & { kind: 'native' };

/** Transient source ownership, never an execution trace or saved folded value. */
export interface ConditionalOperand {
  owner: NativePlan;
  operand: 1;
  when: 'truthy' | 'falsy' | 'nullish';
}
export interface ExpressionCallSite {
  call: CallPlan;
  /** Distinct occurrences stay distinct even when their function IDs agree. */
  path: readonly number[];
  conditions: readonly ConditionalOperand[];
}

function conditionalOperand(value: NativePlan): ConditionalOperand | undefined {
  if (value.form !== 'binary') return;
  const operators: Record<string, ConditionalOperand['when']> = value.language === 'python'
    ? { and: 'truthy', or: 'falsy' } as const
    : { '&&': 'truthy', '||': 'falsy', ...(value.language === 'javascript' ? { '??': 'nullish' as const } : {}) };
  const when = operators[value.operator ?? ''];
  if (when) return { owner: value, operand: 1, when };
}

/** Call-site dependency order and conditional ownership for typed source plans.
 * This does not claim purity: reads/operators can have language-native effects.
 * Neither a parser feature nor a native language is enabled by this analysis.
 */
export function expressionCallSites(root: ExpressionPlan): ExpressionCallSite[] {
  const sites: ExpressionCallSite[] = [];
  let visited = 0;
  function visit(value: ExpressionPlan, path: number[], conditions: ConditionalOperand[]): void {
    if (++visited > IMPORT_LIMITS.nodes || path.length > IMPORT_LIMITS.depth)
      throw new ImportFailure('EVALUATION_BUDGET', 'Expression call ownership exceeds the import budget.', value);
    const child = (operand: ExpressionPlan, index: number, guards = conditions) => visit(operand, [...path, index], guards);
    switch (value.kind) {
      case 'call':
        value.args.forEach((argument, index) => child(argument, index));
        sites.push({ call: value, path, conditions });
        return;
      case 'native': {
        const conditional = conditionalOperand(value);
        if (conditional && value.operands.length !== 2)
          throw new ImportFailure('EVALUATION_ARITY', 'A conditional binary expression requires two operands.', value);
        value.operands.forEach((operand, index) => child(operand, index, conditional && index === 1 ? [...conditions, conditional] : conditions));
        return;
      }
      case 'convert': child(value.value, 0); return;
      case 'compare':
      case 'binary': child(value.left, 0); child(value.right, 1); return;
      case 'literal':
      case 'parameter':
      case 'field':
      case 'local': return;
      default: {
        const exhaustive: never = value;
        throw new Error(`Unreviewed expression ownership: ${String(exhaustive)}`);
      }
    }
  }
  visit(root, [], []);
  return sites;
}

/** Until conditional regions have graph/IR ownership, eager queues cannot own them. */
export function assertEagerExpressionCalls(root: ExpressionPlan): void {
  const conditional = expressionCallSites(root).find(site => site.conditions.length);
  if (conditional) throw new ImportFailure('CONDITIONAL_CALL_REGION', 'Conditional calls require a visible evaluation region; eager call placement does not establish conditional ownership.', conditional.call);
}
