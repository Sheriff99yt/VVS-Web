/** Human explanations; ports and options remain owned by the syntax registry. */
export const NODE_DOC_GUIDES: Record<string, { summary: string; use: string; example: string; note: string }> = {
  flow_branch: {
    summary: 'Branch chooses one of two execution paths from a boolean condition.',
    use: 'Connect the condition to a boolean value, then wire the True and False execution outputs to the actions for each case.',
    example: 'A comparison supplies the condition. The True output connects to Print String with “Ready”; the False output connects to Print String with “Wait”. Generate produces a conditional with the two actions in separate branches.',
    note: 'Both paths require visible connections. An unwired path has no action to generate.',
  },
  action_print: {
    summary: 'Print String emits a text output action at this point in the execution path.',
    use: 'Connect an execution path to the input and a string value to the String pin. Connect the output to the next action if the path continues.',
    example: 'Connect the True output of Branch to Print String and supply “Ready” to its String input. Generate places the print action inside the true branch.',
    note: 'Convert a number to a string with a visible Conversion node before connecting it to the String input.',
  },
  math_add: {
    summary: 'Math Add computes the sum of two number inputs.',
    use: 'Connect number values to A and B, then connect Result to a node that consumes a number.',
    example: 'Supply two numbers to A and B. Connect Result to a numeric consumer; the generated expression adds the two inputs at that use site.',
    note: 'This value node has no execution pins. To print its result, convert the number to a string with a visible Conversion node.',
  },
};
