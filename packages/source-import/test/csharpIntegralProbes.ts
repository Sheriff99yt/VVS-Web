import { csharpIntegerLiteral, csharpIntegerUnary, csharpIntegerNegatedLiteral, csharpIntegerBinary, csharpIntegerAssignable, csharpIntegerConvert, type CSharpIntegerFact, type CSharpIntegerType, type CSharpIntegerOperator, type CSharpOverflowContext } from '@vvs/graph-types';
export interface CSharpIntegralProbe {
  kind: 'literal' | 'negated-literal' | 'unary' | 'binary' | 'assignment' | 'conversion';
  token?: string;
  left?: CSharpIntegerFact;
  right?: CSharpIntegerFact;
  operator?: string;
  target?: CSharpIntegerType;
  context?: CSharpOverflowContext;
}
/** Trusted test descriptor; not an interpreter or browser source mapping. */
export function evaluateCSharpIntegralProbe(probe: CSharpIntegralProbe): CSharpIntegerFact {
  switch (probe.kind) {
    case 'literal': return csharpIntegerLiteral(probe.token!);
    case 'negated-literal': return csharpIntegerNegatedLiteral(probe.token!, probe.context);
    case 'unary': return csharpIntegerUnary(probe.operator as '+' | '-' | '~', probe.left!, probe.context);
    case 'binary': return csharpIntegerBinary(probe.operator as CSharpIntegerOperator, probe.left!, probe.right!, probe.context);
    case 'assignment': return csharpIntegerAssignable(probe.left!, probe.target!);
    case 'conversion': return csharpIntegerConvert(probe.left!, probe.target!, probe.context);
  }
}
