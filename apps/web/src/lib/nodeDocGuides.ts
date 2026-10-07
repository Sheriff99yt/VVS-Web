/** Human explanations; ports and options remain owned by the syntax registry. */
export const NODE_DOC_GUIDES: Record<string, { summary: string; use: string; example: string; note: string }> = {
  source_package: {
    summary: 'Package Clause owns the first line of a Go source file.',
    use: 'Place one package clause at the beginning of the file member chain and set its package name.',
    example: 'A clause named sample followed by Function Define generates package sample and the declared functions.',
    note: 'The clause is visible source. Missing, duplicate or misplaced clauses block imported Go generation. Package imports, build constraints and project dependency context require separate mappings.',
  },
  function_implement: {
    summary: 'Function Define places a function body in the source owned by its container graph.',
    use: 'Select a function and overload, then edit its body graph. Binding and role options affect the selected language’s signature.',
    example: 'A file-level Library function uses module binding and generates a plain JavaScript function or Python def without an invented class or entry.',
    note: 'Constructor, destructor, async and override options depend on the target and owning class. Disabled or ineffective options do not imply generated behavior. Declare and Define remain separate nodes.',
  },
  action_get_input: {
    summary: 'Get User Input requests a text or number value where the selected target supports a real input read.',
    use: 'Choose Input type, supply the prompt and connect Value to a compatible consumer.',
    example: 'Text uses a string output; Number changes the Value pin and target parsing behavior.',
    note: 'Verse emits the prompt and an unsupported typed placeholder (empty string or zero). It does not read player input. The node is dimmed and diagnostics identify the limitation.',
  },
  event_bind: {
    summary: 'Bind emits an event registration against a receiver supplied by the host environment.',
    use: 'Verify the receiver API and callback signature before connecting an event and handler. Own teardown explicitly in the host project.',
    example: 'JavaScript .on requires an EventEmitter-compatible receiver. A plain class does not acquire .on from placing Bind.',
    note: 'C#, JavaScript and GDScript have registration printers; their receiver and lifetime contracts differ. Dispatch directly invokes a handler and does not broadcast the host event.',
  },
  flow_branch: {
    summary: 'Branch chooses one of two execution paths from a boolean condition.',
    use: 'Connect the condition to a boolean value, then wire the True and False execution outputs to the actions for each case.',
    example: 'A boolean value supplies the condition. The True output connects to Print String with “Ready”; the False output connects to Print String with “Wait”. Generate produces a conditional with the two actions in separate branches.',
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
  expr_native_literal: {
    summary: 'An exact scalar belongs to its selected JavaScript or Python domain.',
    use: 'Select the native language and domain, then edit the value. Decimal integer text keeps every digit; numeric text preserves negative zero and overflow.',
    example: 'A JavaScript BigInt value of 9007199254740993 prints with the n suffix. A Python integer keeps those same decimal digits in Python.',
    note: 'Null and None require an empty value. Changing output targets requires a reviewed mapping.',
  },
  expr_native_collection: {
    summary: 'Construct a native collection from ordered visible operands.',
    use: 'Choose the language and form, set the operand count, and wire values in evaluation order. Objects and dicts receive visible entry or spread nodes.',
    example: 'An object uses a named entry, computed entry or spread. An array hole owns its comma; it is distinct from null.',
    note: 'Entry, spread and hole forms need a compatible direct collection owner. The current budget is 32 operands.',
  },
  expr_native_access: {
    summary: 'Read a native index, member or Python slice with its native error behavior.',
    use: 'Wire the receiver and index, or set a member name. Slice masks mark present start, stop and step bounds and expose only their value pins.',
    example: 'The Python slice mask 101 exposes start and step, preserving the absent stop in values[start::step].',
    note: 'This form preserves target access semantics, including bounds errors and getter behavior.',
  },
  expr_native_operator: {
    summary: 'Apply a native operator without an implicit numeric conversion.',
    use: 'Choose the language and operator, then connect operands in order. Unknown evidence preserves native dispatch; Number requires numeric operand evidence.',
    example: 'JavaScript == retains abstract equality. Python + retains overload dispatch, and is remains separate from ==.',
    note: 'Calls used as operands need distinct visible execution ownership in operand order. Short-circuit forms require their own future mapping.',
  },
};
