import { describe, expect, test } from 'bun:test';
import type { IrAssignVariable } from './ir/types';
import { createPrintContext, printStatement } from './print';
import { GET_INPUT_LINE_TEMP, getInputLineTempName } from './print/printers/getInputLineTemp';

const numberGetInput: IrAssignVariable = {
  kind: 'AssignVariable',
  sourceGraphNodeId: 'input-1',
  targetName: '_vvs_input_input_1',
  assignKind: 'get_input',
  inputKind: 'number',
  prompt: { kind: 'Literal', sourceGraphNodeId: 'input-1', value: 'n?', literalType: 'string' },
};

describe('GetInput line temps (U64b)', () => {
  test('rust number path uses pack GetInputLine* and _vvs_line', () => {
    const printed = printStatement(numberGetInput, createPrintContext('rust', [], '        '));
    expect(printed.text).toContain(`let mut ${GET_INPUT_LINE_TEMP} = String::new();`);
    expect(printed.text).toContain(`read_line(&mut ${GET_INPUT_LINE_TEMP})`);
    expect(printed.text).toContain(
      `let _vvs_input_input_1 = ${GET_INPUT_LINE_TEMP}.trim().parse::<f32>().unwrap_or(0.0);`
    );
    expect(printed.expressionSpans.some((s) => s.nodeId === 'input-1')).toBe(true);
  });

  test('csharp number path uses scoped line temp from pack', () => {
    const line = getInputLineTempName(numberGetInput, 'csharp');
    const printed = printStatement(numberGetInput, createPrintContext('csharp', [], '        '));
    expect(line).toBe('_vvs_line_input-1');
    expect(printed.text).toContain(`var ${line} = Console.ReadLine();`);
    expect(printed.text).toContain(`float.TryParse(${line} ?? "0", out var _vvs_input_input_1);`);
  });

  test('cpp prompt spans map into cout line', () => {
    const printed = printStatement(numberGetInput, createPrintContext('cpp', [], '        '));
    const span = printed.expressionSpans.find((s) => s.nodeId === 'input-1');
    expect(span).toBeDefined();
    expect(printed.text.slice(span!.start, span!.end)).toContain('n?');
  });
});
