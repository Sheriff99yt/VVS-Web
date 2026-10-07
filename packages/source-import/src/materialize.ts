import {
  createClassSymbol, createEmptyProjectSnapshot, MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID,
  applyFunctionDefineBinding, applyFunctionEntryBinding, applyFunctionImplementBinding, applyFunctionReturnBinding, applyEventDefineBinding, applyFunctionCallBinding,
  type FunctionSymbol, type GraphDocument, type GraphNode, type PinType, type ProjectSnapshot,
  nativeExpressionPins, nativeExpressionOutputType, nativeExpressionSettings, applyParameterSetBinding,
} from '@vvs/graph-types';
import { resolve } from '@vvs/syntax-registry';
import { ImportFailure, IMPORT_LIMITS, type ClassImportPlan, type ExpressionPlan, type MappingEvidence, type StatementPlan } from './contracts';
import { assertEagerExpressionCalls } from './expressionEvaluation';

/** Transactional deterministic builder. Only typed plans, never parser AST or editor state. */
export function materializeImportPlan(plan: ClassImportPlan, options: { containerId?: string; classId?: string; functions?: FunctionSymbol[]; variables?: ProjectSnapshot['variables'] } = {}): ProjectSnapshot {
  const snapshot = createEmptyProjectSnapshot();
  const containerId = options.containerId ?? MAIN_GRAPH_CONTAINER_ID;
  const classId = options.classId ?? MAIN_CLASS_ID;
  snapshot.activeGraphTab = containerId;
  snapshot.graphContainers = [{ id: containerId, name: plan.name }];
  snapshot.openTabs = [{ id: containerId, type: 'container', name: plan.name }];
  // An isolated candidate is unsaved. The existing project save boundary assigns its timestamp.
  snapshot.savedAt = '';
  const fileFunction = plan.unitKind === 'standalone-function';
  const cls = createClassSymbol(fileFunction ? 'Global' : plan.name, { id: fileFunction ? `global-${containerId}` : classId, containerId, ...(fileFunction ? { isGlobalScope: true } : { extendsType: plan.extendsType }) });
  if (plan.classVisibility === '') cls.visibility = undefined;
  snapshot.classes = [cls]; snapshot.activeClassId = cls.id;
  snapshot.projectDetails = { moduleName: plan.name, extendsType: '', description: `Imported from ${plan.fileName}` };
  snapshot.targetLanguage = plan.context.language; snapshot.events = []; snapshot.variables = []; snapshot.functions = []; snapshot.documents = {};
  const home: GraphDocument = { nodes: [], edges: [], metadata: { moduleName: plan.name, extendsType: '', description: '', targetLanguage: plan.context.language } };
  if (plan.entryPolicy === 'library') home.metadata!.compilationUnit = { version: 1, entryPolicy: 'library' };
  snapshot.documents[containerId] = home;
  let serial = 0;
  function spawn(doc: GraphDocument, kindId: string, x: number, y: number, evidence: MappingEvidence): GraphNode {
    const definition = resolve(kindId);
    if (!definition) throw new ImportFailure('REGISTRY_KIND_MISSING', `Missing registry kind ${kindId}.`, evidence);
    if (++serial > IMPORT_LIMITS.nodes) throw new ImportFailure('NODE_BUDGET', 'Import at most 512 nodes in one class.', evidence);
    const node: GraphNode = { id: `${options.containerId ? containerId + '-' : ''}import-node-${serial}`, type: 'vvs_standard_node', position: { x, y }, data: {
      kindId, kindVersion: definition.kindVersion, label: definition.title, category: definition.category,
      inputs: structuredClone(definition.inputs), outputs: structuredClone(definition.outputs), inlineValues: {},
      properties: { sourceOrigin: { start: evidence.start, end: evidence.end, mappingId: evidence.mappingId, mappingVersion: evidence.mappingVersion, sourceSha256: plan.sourceSha256 } },
    } };
    doc.nodes.push(node); return node;
  }
  function wire(doc: GraphDocument, from: GraphNode, output: string, to: GraphNode, input: string, pinType: PinType) {
    doc.edges.push({ id: `import-edge-${doc.edges.length}-${from.id}-${to.id}`, source: from.id, target: to.id,
      sourceHandle: output, targetHandle: input, type: 'vvs_standard_edge', data: { pinType } });
  }
  const provenance = { version: 1, language: plan.context.language, languageVersion: plan.context.version, sourceMode: plan.context.sourceMode, environment: 'none', fileName: plan.fileName,
    source: plan.source, sourceSha256: plan.sourceSha256, start: plan.start, end: plan.end, mappingId: plan.mappingId, mappingVersion: plan.mappingVersion };
  let previousMember: GraphNode | undefined;
  snapshot.functions = plan.methods.filter(method => method.role !== 'entry').map(method => ({ kind: 'function', id: method.id, name: method.name, classId: cls.id, binding: fileFunction ? 'module' : method.isStatic ? 'static' : 'instance', visibility: 'public', overloads: [{ id: 'o1', parameters: method.parameters.map(parameter => ({ id: parameter.id, label: parameter.name, type: parameter.type ?? 'data_any' as PinType })), returnType: method.returnType ?? 'data_any', graphTabId: method.id }] }));
  if (!fileFunction) {
    const classNode = spawn(home, 'class_define', 0, 0, plan);
    classNode.data.label = `Declare ${cls.name}`;
    classNode.data.properties = { ...classNode.data.properties, symbolId: cls.id, classId: cls.id, name: cls.name, extendsType: plan.extendsType ?? '', visibility: plan.classVisibility ?? 'public', sourceImport: provenance };
    previousMember = classNode;
  }
  if (plan.packageClause) {
    const node = spawn(home, 'source_package', 0, 0, plan.packageClause);
    node.data.properties = { ...node.data.properties, packageName: plan.packageClause.name, ...(plan.packageClause.wordBits ? { goWordBits: String(plan.packageClause.wordBits) } : {}), sourceImport: provenance };
    previousMember = node;
  }
  for (const directive of plan.directives ?? []) {
    const node = spawn(home, 'source_directive', serial * 240, 0, directive);
    node.data.properties = { ...node.data.properties, directive: directive.value, sourceImport: provenance };
    if (previousMember) wire(home, previousMember, 'exec_out', node, 'exec_in', 'execution'); previousMember = node;
  }
  for (const imported of plan.imports ?? []) {
    const node = spawn(home, 'vvs.project.import_module', serial * 240, 0, imported);
    node.data.properties = { ...node.data.properties, modulePath: imported.modulePath, importStyle: imported.names.length ? 'from' : 'module', importNames: imported.names.join(', '), importBindings: imported.bindings, targetLanguages: 'javascript', sourceImport: provenance };
    if (previousMember) wire(home, previousMember, 'exec_out', node, 'exec_in', 'execution'); previousMember = node;
  }
  for (const field of plan.fields ?? []) {
    if (field.value && field.value.kind !== 'literal') throw new ImportFailure('FIELD_INITIALIZER', 'Only explicit literal field initializers are certified.', field);
    const types = { number: 'data_number', string: 'data_string', boolean: 'data_boolean', unknown: 'data_any' } as const;
    const variable = { kind: 'variable' as const, id: field.id, name: field.name, type: types[field.valueType], classId: cls.id, binding: field.isStatic ? 'static' as const : 'instance' as const, visibility: 'public' as const, defaultValue: field.value?.kind === 'literal' ? field.value.value : undefined };
    snapshot.variables.push(variable);
    const declaration = spawn(home, 'var_define', serial * 240, 0, field);
    declaration.data.label = `Declare ${field.name}`;
    declaration.data.properties = { ...declaration.data.properties, symbolId: field.id, name: field.name, type: variable.type, hasInitializer: !!field.value, declarationOnly: !field.value, isStatic: field.isStatic };
    if (field.value?.kind === 'literal') declaration.data.inlineValues.value = field.value.value;
    if (previousMember) wire(home, previousMember, 'exec_out', declaration, 'exec_in', 'execution'); previousMember = declaration;
  }
  for (const [methodIndex, method] of plan.methods.entries()) {
    const parameters = method.parameters.map(p => ({ id: p.id, label: p.name, type: p.type ?? 'data_any' as PinType }));
    const func: FunctionSymbol = { kind: 'function', id: method.id, name: method.name, classId: cls.id, binding: fileFunction ? 'module' : method.isStatic ? 'static' : 'instance', visibility: 'public',
      overloads: [{ id: 'o1', parameters, returnType: method.returnType ?? 'data_any', graphTabId: method.id }] };
    const isEntry = method.role === 'entry';
    let body: GraphDocument = isEntry ? home : { nodes: [], edges: [], metadata: { moduleName: method.name, extendsType: '', description: '' } };
    let entry: GraphNode;
    let signatureOwner: GraphNode | undefined;
    if (isEntry) {
      const event = { id: 'import-entry', name: 'start', role: 'entry' as const, parameters, classId: cls.id };
      snapshot.events.push(event);
      const declarationNode = spawn(home, 'event_member_define', (methodIndex + 1) * 520, 0, method);
      declarationNode.data.properties = { ...declarationNode.data.properties, symbolId: event.id, eventId: event.id, name: event.name, role: 'entry' };
      declarationNode.data.label = 'Declare start';
      if (previousMember) wire(home, previousMember, 'exec_out', declarationNode, 'exec_in', 'execution'); previousMember = declarationNode;
      entry = spawn(home, 'event_define', 0, 400, method); entry.data = applyEventDefineBinding(entry.data, event);
    } else {
      const declarationNode = spawn(home, 'function_define', (methodIndex + 1) * 520, 0, method);
      declarationNode.data = applyFunctionDefineBinding(declarationNode.data, func, 'o1');
      if (fileFunction) declarationNode.data.properties = { ...declarationNode.data.properties, sourceImport: provenance };
      const define = spawn(home, 'function_implement', (methodIndex + 1) * 520 + 240, 0, method);
      signatureOwner = define;
      define.data = applyFunctionImplementBinding(define.data, func, 'o1'); define.data.properties = { ...define.data.properties, isStatic: method.isStatic, isExported: method.isExported ?? false, role: method.role === 'constructor' ? 'constructor' : 'function' };
      if (previousMember) wire(home, previousMember, 'exec_out', declarationNode, 'exec_in', 'execution'); wire(home, declarationNode, 'exec_out', define, 'exec_in', 'execution'); previousMember = define;
      snapshot.documents[func.id] = body; snapshot.openTabs.push({ id: func.id, type: 'function', name: `Function: ${method.name}` });
      entry = spawn(body, 'function_entry', 0, 0, method); entry.data = applyFunctionEntryBinding(entry.data, func, 'o1');
    }
    let column = 0;
    const pendingCalls: GraphNode[] = [];
    const loops = new Map<number, GraphNode>();
    function connectExecution(from: GraphNode, output: string, target: GraphNode): void {
      let previous = from, handle = output;
      for (const call of pendingCalls.splice(0)) {
        wire(body, previous, handle, call, 'exec_in', 'execution'); previous = call; handle = 'exec_out';
      }
      if (previous !== target) wire(body, previous, handle, target, 'exec_in', 'execution');
    }
    function callNode(value: ExpressionPlan & { kind: 'call' }, row: number, expressionOwned = false): GraphNode {
      const called = [...snapshot.functions, ...(options.functions ?? [])].find(fn => fn.id === value.functionId);
      if (!called || (!value.nativeArguments && called.overloads[0].parameters.length !== value.args.length)) throw new ImportFailure('CALL_CLOSURE', 'Calls need an exact same-file function signature.', value);
      const call = spawn(body, 'vvs.project.call_function', (++column) * 240, row + 160, value);
      if (expressionOwned) call.data.properties = { ...call.data.properties, callPlacement: 'expression' };
      call.data = applyFunctionCallBinding(call.data, called, 'o1');
      call.data.properties = { ...call.data.properties, isSuper: value.isSuper ?? false, isSuperConstructor: value.isSuperConstructor ?? false };
      const imported = plan.imports?.flatMap(item => item.bindings).find(binding => binding.functionId === called.id);
      if (imported) call.data.properties = { ...call.data.properties, importedName: imported.local };
      if (value.nativeArguments) {
        call.data.properties = { ...call.data.properties, nativeCallLanguage: plan.context.language, nativeArgumentCount: value.args.length, ...(value.nativeArgumentNames ? { nativeArgumentNames: value.nativeArgumentNames } : {}) };
        call.data.inputs = [call.data.inputs.find(pin => pin.type === 'execution')!, ...value.args.map((_, index) => ({ id: `arg-${index}`, label: value.nativeArgumentNames?.[index] || `Argument ${index + 1}`, type: value.args[index].kind === 'literal' ? ({ number: 'data_number', string: 'data_string', boolean: 'data_boolean', unknown: 'data_any' } as const)[value.args[index].valueType] : 'data_any' as const, required: true }))];
      }
      value.args.forEach((argument, index) => expression(argument, call, value.nativeArguments ? `arg-${index}` : called.overloads[0].parameters[index].id, row + 160));
      if (!expressionOwned) pendingCalls.push(call);
      return call;
    }
    function expression(value: ExpressionPlan, target: GraphNode, pin: string, row: number): void {
      if (value.kind === 'literal') { target.data.inlineValues[pin] = value.value; return; }
      if (value.kind === 'native') {
        if (plan.context.language !== 'go') assertEagerExpressionCalls(value);
        const kind = value.form === 'scalar' ? 'expr_native_literal' : ['binary', 'unary', 'conversion', 'parentheses', 'overflow'].includes(value.form) ? 'expr_native_operator' : ['index', 'member', 'slice'].includes(value.form) ? 'expr_native_access' : 'expr_native_collection';
        const native = spawn(body, kind, (++column) * 240, row + 160, value);
        native.data.properties = { ...native.data.properties, nativeLanguage: value.language, nativeForm: value.form, nativeDomain: value.domain ?? (value.valueType === 'number' && ['binary', 'unary', 'conversion'].includes(value.form) ? 'number' : 'unknown'), payload: value.payload ?? '', memberName: value.name ?? '', operator: value.operator ?? '', ...(value.targetType ? { nativeTargetType: value.targetType } : {}), operandCount: value.operands.length };
        if (value.form === 'conversion') native.data.label = `Convert to ${value.targetType}`;
        native.data.inputs = nativeExpressionPins(nativeExpressionSettings(native.data));
        native.data.outputs[0].type = nativeExpressionOutputType(nativeExpressionSettings(native.data));
        value.operands.forEach((operand, index) => expression(operand, native, `operand-${index}`, row + 160));
        wire(body, native, 'result', target, pin, native.data.outputs[0].type); return;
      }
      if (value.kind === 'convert') {
        const conversion = spawn(body, value.nodeKind, (++column) * 240, row + 160, value);
        if (value.strategy) conversion.data.properties = { ...conversion.data.properties, numberMode: value.strategy };
        expression(value.value, conversion, 'value', row + 160);
        wire(body, conversion, 'result', target, pin, value.valueType === 'string' ? 'data_string' : 'data_number'); return;
      }
      if (value.kind === 'call') {
        const call = callNode(value, row, plan.context.language === 'go');
        const output = call.data.outputs.find(pin => pin.type !== 'execution');
        if (!output) throw new ImportFailure('CALL_RETURN_MISSING', 'The function has no return pin.', value);
        wire(body, call, output.id, target, pin, output.type); return;
      }
      if (value.kind === 'field') {
        const variable = [...snapshot.variables, ...(options.variables ?? [])].find(variable => variable.id === value.fieldId && !variable.graphTabId);
        if (!variable) throw new ImportFailure('FIELD_CLOSURE', 'Receiver read requires a declared field.', value);
        const get = spawn(body, 'variable_get', (++column) * 240, row + 160, value);
        get.data.properties = { ...get.data.properties, symbolId: variable.id, name: variable.name, variableName: variable.name };
        get.data.graphBinding = { kind: 'variable_ref', symbolId: variable.id }; get.data.outputs[0].type = variable.type;
        wire(body, get, 'val', target, pin, variable.type); return;
      }
      if (value.kind === 'local') {
        const variable = snapshot.variables.find(variable => variable.id === value.localId && variable.graphTabId === (isEntry ? containerId : method.id));
        if (!variable || value.scopeId !== method.scopeId) throw new ImportFailure('LOCAL_CLOSURE', 'Local read is outside its declaration scope.', value);
        const get = spawn(body, 'variable_get', (++column) * 240, row + 160, value);
        get.data.properties = { ...get.data.properties, symbolId: variable.id, name: variable.name, variableName: variable.name };
        get.data.label = `Get ${variable.name}`;
        get.data.graphBinding = { kind: 'variable_ref', symbolId: variable.id };
        get.data.outputs[0].type = variable.type;
        wire(body, get, 'val', target, pin, variable.type); return;
      }
      if (value.kind === 'parameter') {
        if (value.scopeId !== method.scopeId || !method.parameters.some(p => p.id === value.parameterId)) throw new ImportFailure('SEMANTIC_CLOSURE', 'Parameter read must resolve in its own method scope.', value);
        wire(body, entry, value.parameterId, target, pin, 'data_any'); return;
      }
      const math = spawn(body, value.kind === 'compare' ? 'expr_compare' : value.nodeKind, (++column) * 240, row + 160, value);
      if (value.kind === 'binary' && value.numberDomain) math.data.properties = { ...math.data.properties, numberDomain: value.numberDomain };
      if (value.kind === 'compare') {
        math.data.properties = { ...math.data.properties, operator: value.operator, comparisonMode: value.mode };
      }
      expression(value.left, math, 'a', row + 160); expression(value.right, math, 'b', row + 160);
      wire(body, math, 'result', target, pin, value.kind === 'compare' ? 'data_boolean' : 'data_number');
    }
    let csharpScopeOwner: string | undefined;
    let csharpGroupOwner: string | undefined;
    function statement(value: StatementPlan, from: GraphNode, output: string, row: number): GraphNode {
      if (value.kind === 'declaration-group') {
        if (plan.context.language !== 'csharp') throw new ImportFailure('GROUP_LANGUAGE', 'This declaration group requires its native C# contract.', value);
        const group = spawn(body, 'csharp_declaration_group', (++column) * 240, row, value);
        group.data.properties = { ...group.data.properties, nativeType: value.nativeType, groupStyle: value.groupStyle };
        connectExecution(from, output, group);
        csharpGroupOwner = group.id;
        let previous = group, handle = 'declarations_exec';
        for (const item of value.declarations) { previous = statement(item, previous, handle, row + 240); handle = 'exec_out'; }
        csharpGroupOwner = undefined;
        return group;
      }
      if (value.kind === 'scope') {
        if (plan.context.language !== 'csharp') throw new ImportFailure('SCOPE_LANGUAGE', 'This lexical scope requires its C# mapping.', value);
        const scope = spawn(body, 'csharp_scope', (++column) * 240, row, value);
        scope.data.properties = { ...scope.data.properties, overflowContext: value.overflowContext };
        connectExecution(from, output, scope);
        const previousOwner = csharpScopeOwner;
        csharpScopeOwner = scope.id;
        statement(value.body, scope, 'body_exec', row + 240);
        csharpScopeOwner = previousOwner;
        return scope;
      }
      if (value.kind === 'directive') {
        const directive = spawn(body, 'source_directive', (++column) * 240, row, value);
        directive.data.properties = { ...directive.data.properties, directive: value.value };
        connectExecution(from, output, directive); return directive;
      }
      if (value.kind === 'sequence') {
        let previous = from, handle = output;
        for (const item of value.statements) { previous = statement(item, previous, handle, row); handle = 'exec_out'; }
        return previous;
      }
      if (value.kind === 'break' || value.kind === 'continue') {
        const loop = loops.get(value.loopStart);
        if (!loop) throw new ImportFailure('LOOP_TARGET_REQUIRED', 'Missing enclosing loop.', value);
        const control = spawn(body, value.kind === 'break' ? 'flow_break' : 'flow_continue', (++column) * 240, row, value);
        control.data.properties = { ...control.data.properties, loopTargetId: loop.id };
        connectExecution(from, output, control); return control;
      }
      if (value.kind === 'call') {
        const call = callNode(value.call, row);
        connectExecution(from, output, call); return call;
      }
      if (value.kind === 'declare' || value.kind === 'declare-uninitialized') {
        const initializer = value.kind === 'declare' ? value.value : undefined;
        if (!initializer && plan.context.language !== 'csharp') throw new ImportFailure('LOCAL_INITIALIZER_LANGUAGE', 'Uninitialized declarations require their C# mapping.', value);
        const types = { number: 'data_number', string: 'data_string', boolean: 'data_boolean', unknown: 'data_any' } as const;
        const variable = { kind: 'variable' as const, id: value.local.id, name: value.local.name, type: types[value.local.valueType], classId: cls.id, binding: 'instance' as const, visibility: 'private' as const, graphTabId: isEntry ? containerId : method.id, flags: { readonly: value.local.declarationKind === 'const' } };
        snapshot.variables.push(variable);
        const declaration = spawn(body, 'var_define', (++column) * 240, row, value);
        declaration.data.label = `Declare ${variable.name}`;
        if (value.local.nestedScope) Object.assign(variable, { scopedNodeId: csharpScopeOwner ?? declaration.id });
        if (csharpScopeOwner) declaration.data.properties = { ...declaration.data.properties, scopeOwnerId: csharpScopeOwner };
        if (csharpGroupOwner) declaration.data.properties = { ...declaration.data.properties, groupOwnerId: csharpGroupOwner };
        declaration.data.properties = { ...declaration.data.properties, symbolId: variable.id, name: variable.name, type: variable.type, hasInitializer: !!initializer, declarationKind: value.local.declarationKind, isConst: value.local.declarationKind === 'const', numberDomain: value.local.numberDomain, ...(value.local.nativeLocalStyle ? { nativeLocalStyle: value.local.nativeLocalStyle, nativeType: value.local.nativeType } : {}) };
        if (value.local.nativeLocalStyle) declaration.data.inputs = declaration.data.inputs.map(pin => pin.id === 'value' ? { ...pin, type: variable.type, required: true } : pin);
        if (!initializer) declaration.data.inputs = declaration.data.inputs.filter(pin => pin.id !== 'value');
        if (initializer) expression(initializer, declaration, 'value', row);
        connectExecution(from, output, declaration); return declaration;
      }
      if (value.kind === 'assign-parameter') {
        if (plan.context.language !== 'csharp' || value.scopeId !== method.scopeId || !method.parameters.some(parameter => parameter.id === value.parameterId)) throw new ImportFailure('PARAMETER_WRITE_SCOPE', 'Parameter write requires its own visible method signature.', value);
        const assign = spawn(body, 'parameter_set', (++column) * 240, row, value);
        assign.data.graphBinding = { kind: 'parameter_ref', symbolId: func.id, overloadId: 'o1', parameterId: value.parameterId };
        assign.data.properties = { ...assign.data.properties, assignmentOperator: value.operator, prefix: value.prefix ?? false };
        assign.data = applyParameterSetBinding(assign.data, func, 'o1');
        if (value.value) expression(value.value, assign, 'val', row);
        connectExecution(from, output, assign); return assign;
      }
      if (value.kind === 'assign') {
        const variable = [...snapshot.variables, ...(options.variables ?? [])].find(variable => variable.id === value.localId);
        if (!variable) throw new ImportFailure('LOCAL_CLOSURE', 'Assignment needs its local declaration.', value);
        const assign = spawn(body, 'variable_set', (++column) * 240, row, value);
        assign.data.label = `Set ${variable.name}`;
        assign.data.graphBinding = { kind: 'variable_ref', symbolId: variable.id };
        assign.data.properties = { ...assign.data.properties, symbolId: variable.id, name: variable.name, variableName: variable.name, assignmentOperator: value.operator ?? '=', prefix: value.prefix ?? false };
        if (plan.context.language === 'go' || plan.context.language === 'csharp') assign.data.inputs = assign.data.inputs.map(pin => pin.id === 'val' ? { ...pin, type: variable.type, required: !!value.value } : pin);
        if (!value.value && ['go', 'csharp'].includes(plan.context.language)) assign.data.inputs = assign.data.inputs.filter(pin => pin.type === 'execution');
        if (value.value) expression(value.value, assign, 'val', row);
        connectExecution(from, output, assign); return assign;
      }
      if (value.kind === 'return') {
        const ret = spawn(body, 'flow_return', (++column) * 240, row, value);
        if (!isEntry) ret.data = applyFunctionReturnBinding(ret.data, func, 'o1');
        if (value.value) expression(value.value, ret, ret.data.inputs.find(p => p.type !== 'execution')!.id, row); connectExecution(from, output, ret); return ret;
      }
      if (value.kind === 'range') {
        const loop = spawn(body, 'flow_for', (++column) * 240, row, value);
        loop.data.properties = { ...loop.data.properties, headerMode: 'python-range', rangeArgumentCount: value.args.length };
        connectExecution(from, output, loop); loops.set(value.start, loop);
        const variable = { kind: 'variable' as const, id: value.local.id, name: value.local.name, type: 'data_number' as const, classId: cls.id, binding: 'instance' as const, visibility: 'private' as const, graphTabId: isEntry ? containerId : method.id, scopedNodeId: loop.id };
        snapshot.variables.push(variable);
        const declaration = spawn(body, 'var_define', (++column) * 240, row + 120, value.local);
        declaration.data.properties = { ...declaration.data.properties, symbolId: variable.id, name: variable.name, type: variable.type, numberDomain: 'python-integer', declarationKind: 'loop-index' };
        wire(body, loop, 'init_exec', declaration, 'exec_in', 'execution');
        value.args.forEach((argument, index) => expression(argument, loop, ['first', 'last', 'step'][index], row));
        statement(value.body, loop, 'body_exec', row + 480); return loop;
      }
      if (value.kind === 'while' || value.kind === 'for') {
        const loop = spawn(body, value.kind === 'while' ? 'flow_while' : 'flow_for', (++column) * 240, row, value);
        connectExecution(from, output, loop);
        loops.set(value.start, loop);
        if (value.kind === 'for') {
          loop.data.properties = { ...loop.data.properties, headerMode: 'structured' };
          if (plan.context.language === 'go') loop.data.inputs = loop.data.inputs.filter(pin => pin.type === 'execution' || pin.id === 'condition');
          statement(value.initializer, loop, 'init_exec', row + 160);
          snapshot.variables.find(variable => variable.id === value.initializer.local.id)!.scopedNodeId = loop.id;
          statement(value.update, loop, 'update_exec', row + 320);
        }
        expression(value.condition, loop, 'condition', row);
        if (pendingCalls.length) {
          const last = pendingCalls[pendingCalls.length - 1];
          connectExecution(loop, 'condition_exec', last);
        }
        statement(value.body, loop, 'body_exec', row + 480);
        return loop;
      }
      const branch = spawn(body, 'flow_branch', (++column) * 240, row, value);
      expression(value.condition, branch, 'condition', row); connectExecution(from, output, branch);
      statement(value.consequent, branch, 'true_exec', row);
      if (value.alternate) statement(value.alternate, branch, 'false_exec', row + 340);
      return branch;
    }
    if (signatureOwner && (plan.context.language === 'csharp' || ['javascript', 'python', 'go'].includes(plan.context.language) && plan.unitKind === 'standalone-function' || method.parameters.some(parameter => parameter.default || parameter.mode === 'rest'))) {
      signatureOwner.data.properties = { ...signatureOwner.data.properties, nativeSignatureLanguage: plan.context.language, ...(method.nativeReturnType ? { nativeReturnType: method.nativeReturnType } : {}), nativeParameters: method.parameters.map(parameter => ({ id: parameter.id, name: parameter.name, mode: parameter.mode ?? 'positional', ...(parameter.nativeType ? { nativeType: parameter.nativeType } : {}), ...(parameter.default ? { defaultPin: `default-${parameter.id}` } : {}) })) };
      if (plan.context.language === 'csharp') entry.data.properties = { ...entry.data.properties, nativeSignatureLanguage: 'csharp' };
      const methodBody = body; body = home;
      for (const parameter of method.parameters) if (parameter.default) {
        const pin = `default-${parameter.id}`;
        signatureOwner.data.inputs.push({ id: pin, label: `Default ${parameter.name}`, type: parameter.default.kind === 'literal' ? ({ number: 'data_number', string: 'data_string', boolean: 'data_boolean', unknown: 'data_any' } as const)[parameter.default.valueType] : 'data_any', required: true });
        expression(parameter.default, signatureOwner, pin, 200);
      }
      body = methodBody;
    }
    statement(method.body, entry, 'exec_out', isEntry ? 400 : 0);
  }
  const memberKinds = new Set(['class_define', 'function_define', 'function_implement', 'event_member_define', 'source_directive', 'source_package', 'vvs.project.import_module']);
  const members = home.nodes.filter(node => memberKinds.has(node.data.kindId ?? '') || (node.data.kindId === 'var_define' && !snapshot.variables.find(variable => variable.id === node.data.properties?.symbolId)?.graphTabId));
  members.sort((a, b) => Number((a.data.properties?.sourceOrigin as { start?: number })?.start ?? 0) - Number((b.data.properties?.sourceOrigin as { start?: number })?.start ?? 0));
  const memberIds = new Set(members.map(node => node.id));
  home.edges = home.edges.filter(edge => !(memberIds.has(edge.source) && memberIds.has(edge.target) && edge.data?.pinType === 'execution'));
  for (let i = 1; i < members.length; i++) wire(home, members[i - 1], 'exec_out', members[i], 'exec_in', 'execution');
  for (const comment of plan.comments ?? []) {
    if (serial >= IMPORT_LIMITS.nodes) throw new ImportFailure('NODE_BUDGET', 'Imported comments exceed the graph node budget.', comment);
    const candidates = Object.values(snapshot.documents).flatMap(doc => doc.nodes.map(node => ({ node, doc }))).filter(({ node }) => !['function_entry', 'function_define'].includes(node.data.kindId ?? '') && Number((node.data.properties?.sourceOrigin as { start?: number })?.start ?? -1) >= comment.end);
    candidates.sort((a, b) => Number((a.node.data.properties?.sourceOrigin as { start: number }).start) - Number((b.node.data.properties?.sourceOrigin as { start: number }).start));
    const target = candidates[0];
    if (!target) throw new ImportFailure('COMMENT_PLACEMENT', 'Trailing comments need an explicit after-construct placement mapping.', comment);
    // Comments inside expressions cannot be attached to a different statement.
    if (target.node.data.inputs.every(pin => pin.type !== 'execution')) throw new ImportFailure('COMMENT_PLACEMENT', 'Expression comments require expression-level trivia ownership.', comment);
    const node: GraphNode = { id: `${options.containerId ? containerId + '-' : ''}import-node-${++serial}`, type: 'vvs_comment_node', position: { x: target.node.position.x, y: target.node.position.y - 80 }, data: { label: 'Comment', category: 'Comment', inputs: [], outputs: [], inlineValues: {}, properties: { commentText: comment.text, commentMemberIds: [target.node.id], sourceOrigin: { ...comment, sourceSha256: plan.sourceSha256 } } } };
    target.doc.nodes.push(node);
  }
  return snapshot;
}
