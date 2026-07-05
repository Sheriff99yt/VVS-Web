import type { IrConvertToNumber, IrConvertToString, IrExpr } from './ir/types';

/** Build language-neutral ConvertToString IrExpr node. */
export function toStringIrExpr(nodeId: string, value: IrExpr): IrConvertToString {
  return { kind: 'ConvertToString', sourceGraphNodeId: nodeId, value };
}

/** Build language-neutral ConvertToNumber IrExpr node. */
export function toNumberIrExpr(nodeId: string, value: IrExpr): IrConvertToNumber {
  return { kind: 'ConvertToNumber', sourceGraphNodeId: nodeId, value };
}

export function isConvertKindId(kindId: string): boolean {
  return kindId === 'convert_to_string' || kindId === 'convert_to_number';
}

export function literalIr(
  nodeId: string,
  value: string | number | boolean,
  literalType: 'string' | 'number' | 'boolean' | 'null' | 'raw'
): IrExpr {
  return { kind: 'Literal', sourceGraphNodeId: nodeId, value, literalType };
}

export function nullIr(nodeId: string): IrExpr {
  return { kind: 'Literal', sourceGraphNodeId: nodeId, value: '', literalType: 'null' };
}

export function instanceRefIr(nodeId: string, name: string): IrExpr {
  return { kind: 'InstanceRef', sourceGraphNodeId: nodeId, name };
}

export function getInputTempIr(nodeId: string, tempName: string): IrExpr {
  return { kind: 'GetInputTemp', sourceGraphNodeId: nodeId, tempName };
}

export function binaryOpIr(
  nodeId: string,
  op: '+' | '-' | '*' | '/',
  left: IrExpr,
  right: IrExpr
): IrExpr {
  return { kind: 'BinaryOp', sourceGraphNodeId: nodeId, op, left, right };
}
