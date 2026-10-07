import { CSHARP_ASSIGNMENT_OPERATORS } from './csharpLocalSemantics';
import { validateCSharpSignatureBodies } from './csharpSignatureValidation';
import { validateGoScalarBindings } from './goScalarValidation';
import { validateExpressionCallOwnership } from './expressionCallValidation';
import { validateNativeScalarSignatureBodies } from './nativeScalarSignatureValidation';
import { validateSourceFilePaths } from './sourceFileValidation';
import { GO_ASSIGN_OPERATORS, GO_SCALAR_PINS, CSHARP_INTEGRAL_PINS, CSHARP_RETURN_PINS, validCSharpBindingName, GO_RESERVED_NAMES, nativeSignature, nativeSignatureProblem, nativeCallBindingProblem } from './nativeSignatures';
import type { AnalyzeProjectInput } from './analyze';
import type { Diagnostic } from './diagnostic';
import { NATIVE_EXPRESSION_KINDS, nativeExpressionProblem, nativeExpressionSettings } from './nativeExpressions';
import { nativeScalarLocalBinding } from './nativeScalarLocalBindings';
import { nativeScalarDeclarationGroup } from './nativeScalarDeclarationGroups';

/** Native comparison/update variants and structured counted-header ownership. */
export function validateControlFlowSemantics(input: AnalyzeProjectInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [...validateSourceFilePaths(input), ...validateCSharpSignatureBodies(input), ...validateGoScalarBindings(input), ...validateExpressionCallOwnership(input), ...validateNativeScalarSignatureBodies(input)];
  const loopScopes = new Map<string, Set<string>>();
  for (const [tabId, doc] of Object.entries(input.documents)) for (const node of doc.nodes) {
    const language = doc.metadata?.targetLanguage ?? input.targetLanguage ?? 'javascript';
    const error = (code: string, message: string) => diagnostics.push({ level: 'error', source: 'semantic', code, message, tabId, nodeId: node.id });
    const properties = node.data.properties ?? {};
    const signatureProblem = nativeSignatureProblem(node.data, language);
    if (signatureProblem) { error('NATIVE_SIGNATURE_INVALID', signatureProblem); continue; }
    const signature = nativeSignature(node.data);
    if (node.data.kindId === 'source_package') {
      const clauses = doc.nodes.filter(candidate => candidate.data.kindId === 'source_package');
      if (input.functions.some(fn => fn.overloads.some(overload => overload.graphTabId === tabId))) error('NATIVE_PACKAGE_SCOPE', 'Go package clauses and word context belong to the file member graph.');
      if (language !== 'go' || typeof properties.packageName !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(properties.packageName) || GO_RESERVED_NAMES.has(properties.packageName)) error('NATIVE_PACKAGE_INVALID', 'Go requires an explicit valid package name.');
      if (properties.goWordBits !== undefined && !['32', '64'].includes(properties.goWordBits as string)) error('NATIVE_GO_WORD_SIZE', 'Go package target word size must be 32 or 64.');
      if (clauses.length !== 1 || doc.edges.some(edge => edge.target === node.id && (edge.data?.pinType === 'execution' || node.data.inputs.some(pin => pin.type === 'execution' && pin.id === edge.targetHandle)))) error('NATIVE_PACKAGE_POSITION', 'The single package clause must begin the file member chain.');
    }
    if (signature) {
      const symbol = input.functions.find(fn => fn.id === (node.data.graphBinding?.symbolId ?? properties.symbolId));
      const overload = symbol?.overloads.find(overload => overload.id === (node.data.graphBinding?.overloadId ?? properties.overloadId)) ?? symbol?.overloads[0];
      const ownerValid = language === 'csharp' ? symbol?.binding === 'static' && (properties.binding === undefined || properties.binding === 'static') && input.classes?.some(owner => owner.id === symbol.classId && !owner.isGlobalScope && (!owner.form || owner.form === 'class')) : symbol?.binding === 'module';
      if (!symbol || !ownerValid || JSON.stringify(signature.map(parameter => [parameter.id, parameter.name])) !== JSON.stringify(overload?.parameters.map(parameter => [parameter.id, parameter.label]))) error('NATIVE_SIGNATURE_BINDING', 'Native signature must match its declared function binding.');
      if (language === 'go') {
        const types = GO_SCALAR_PINS;
        if (signature.some((parameter, index) => !parameter.nativeType || symbol?.overloads[0]?.parameters[index]?.type !== types[parameter.nativeType as keyof typeof types])) error('NATIVE_SIGNATURE_TYPE', 'Go parameter type must match its visible declaration binding.');
        const result = properties.nativeReturnType;
        if (!(result === 'void' || Object.hasOwn(types, String(result))) || symbol?.overloads[0]?.returnType !== (result === 'void' ? 'void' : types[result as keyof typeof types])) error('NATIVE_SIGNATURE_TYPE', 'Go result type must match its visible declaration binding.');
        const home = doc;
        if (!home.nodes.some(candidate => candidate.data.kindId === 'source_package')) error('NATIVE_PACKAGE_MISSING', 'A Go function file needs a visible package clause.');
      }
      if (language === 'csharp') {
        const types = CSHARP_INTEGRAL_PINS;
        if (!symbol || !validCSharpBindingName(symbol.name) || (properties.role !== undefined && properties.role !== 'function')) error('NATIVE_CSHARP_SIGNATURE_CONTEXT', 'Native C# method requires a supported name and ordinary function role.');
        if (signature.some((parameter, index) => !parameter.nativeType || overload?.parameters[index]?.type !== types[parameter.nativeType as keyof typeof types])) error('NATIVE_SIGNATURE_TYPE', 'C# integral parameter type must match its visible declaration binding.');
        const result = properties.nativeReturnType;
        if (!(result === 'void' || Object.hasOwn(CSHARP_RETURN_PINS, String(result))) || overload?.returnType !== (result === 'void' ? 'void' : CSHARP_RETURN_PINS[result as keyof typeof CSHARP_RETURN_PINS])) error('NATIVE_SIGNATURE_TYPE', 'C# result type must match its visible declaration binding.');
        if (symbol?.flags?.async || symbol?.flags?.virtual || symbol?.flags?.abstract || symbol?.flags?.override || properties.isAsync || properties.isVirtual || properties.isAbstract || properties.isOverride || properties.isConst) error('NATIVE_CSHARP_SIGNATURE_CONTEXT', 'These C# method modifiers need their own native signature contract.');
      }
      for (const parameter of signature) if (parameter.defaultPin && !doc.edges.some(edge => edge.target === node.id && edge.targetHandle === parameter.defaultPin) && node.data.inlineValues?.[parameter.defaultPin] === undefined) error('NATIVE_DEFAULT_MISSING', 'Native default requires an explicit visible value.');
    }
    if (properties.nativeArgumentCount !== undefined) {
      const count = Number(properties.nativeArgumentCount);
      const symbol = input.functions.find(fn => fn.id === node.data.graphBinding?.symbolId);
      const definition = Object.values(input.documents).flatMap(document => document.nodes).find(candidate => candidate.data.kindId === 'function_implement' && candidate.data.graphBinding?.symbolId === symbol?.id);
      const parameters = definition && !nativeSignatureProblem(definition.data, language) ? nativeSignature(definition.data) : undefined;
      if (typeof properties.nativeArgumentCount !== 'number' || properties.nativeCallLanguage !== language || !parameters || nativeCallBindingProblem(parameters, count, properties.nativeArgumentNames, language)) error('NATIVE_CALL_ARITY', 'Supplied native arguments must match the visible default/rest signature.');
      for (const pin of node.data.inputs.filter(pin => pin.type !== 'execution')) if (!doc.edges.some(edge => edge.target === node.id && edge.targetHandle === pin.id) && node.data.inlineValues?.[pin.id] === undefined) error('NATIVE_ARGUMENT_MISSING', 'Supplied argument requires a visible value.');
      if (JSON.stringify(node.data.inputs.filter(pin => pin.type !== 'execution').map(pin => pin.id)) !== JSON.stringify(Array.from({ length: Math.max(0, Math.min(32, count || 0)) }, (_, index) => `arg-${index}`))) error('NATIVE_CALL_ARGUMENTS', 'Supplied native arguments need ordered explicit pins.');
    }

    if (['cpp-scalar', 'rust-scalar', 'gdscript-scalar'].includes(String(properties.nativeLocalStyle))) {
      const entry = doc.nodes.find(candidate => candidate.data.kindId === 'function_entry');
      if (!['cpp', 'rust', 'gdscript'].includes(language) || properties.nativeLocalStyle !== `${language}-scalar`
        || entry?.data.properties?.nativeSignatureLanguage !== language || !entry.data.graphBinding?.symbolId) {
        error('NATIVE_SCALAR_LOCAL_INVALID', 'Native local declarations require their actual function entry and target profile.');
      } else {
        try { nativeScalarLocalBinding(node, language as 'cpp' | 'rust' | 'gdscript', entry.data.graphBinding.symbolId); }
        catch { error('NATIVE_SCALAR_LOCAL_INVALID', 'Native local declaration settings and ports must retain their visible type and owner.'); }
      }
    } else if (String(properties.nativeLocalStyle).startsWith('csharp-')) {
      const variable = input.variables?.find(variable => variable.id === properties.symbolId && variable.graphTabId === tabId);
      const owner = input.functions.find(fn => fn.overloads.some(overload => overload.graphTabId === tabId) && Object.values(input.documents).some(document => document.nodes.some(node => node.data.properties?.nativeSignatureLanguage === 'csharp' && node.data.graphBinding?.symbolId === fn.id)));
      if (language !== 'csharp' || !owner || node.data.kindId !== 'var_define' || !variable || variable.type !== 'data_number' || variable.classId !== owner.classId || variable.scopedNodeId !== properties.scopeOwnerId || variable.scopedNodeId && !doc.nodes.some(node => node.id === variable.scopedNodeId && node.data.kindId === 'csharp_scope') || typeof properties.hasInitializer !== 'boolean' || (properties.hasInitializer ? node.data.inputs.find(pin => pin.id === 'value')?.type !== 'data_number' : node.data.inputs.some(pin => pin.id === 'value'))) error('NATIVE_CSHARP_LOCAL_BINDING', 'C# local declarations require a native method owner and matching visible local index/pins.');
      if (variable && (properties.name !== variable.name || !validCSharpBindingName(variable.name) || (properties.nativeLocalStyle === 'csharp-const') !== (variable.flags?.readonly === true))) error('NATIVE_CSHARP_LOCAL_BINDING', 'C# local name and readonly index must match its visible declaration.');
    } else if (properties.nativeLocalStyle) {
      const types = GO_SCALAR_PINS;
      const variable = input.variables?.find(variable => variable.id === properties.symbolId && variable.graphTabId === tabId);
      if (language !== 'go' || node.data.kindId !== 'var_define' || !['go-short', 'go-var', 'go-const'].includes(String(properties.nativeLocalStyle)) || !variable || (!(properties.nativeLocalStyle === 'go-const' && properties.nativeType === 'untyped') && variable.type !== types[properties.nativeType as keyof typeof types]) || properties.hasInitializer !== true || node.data.inputs.find(pin => pin.id === 'value')?.type !== variable.type) error('NATIVE_GO_LOCAL_INVALID', 'Go local style, scalar type and initializer pins must match their visible scoped declaration.');
      if ((properties.nativeLocalStyle === 'go-const') !== (properties.declarationKind === 'const') || (properties.nativeLocalStyle === 'go-const') !== (variable?.flags?.readonly === true)) error('NATIVE_GO_CONSTANT_BINDING', 'Go declaration style, constant keyword and readonly binding must agree.');
      if (variable && (properties.name !== variable.name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable.name) || GO_RESERVED_NAMES.has(variable.name) || Object.hasOwn(GO_SCALAR_PINS, variable.name))) error('NATIVE_GO_LOCAL_BINDING', 'Go local names must match their visible declaration and be usable native identifiers.');
      const reachable = new Set(doc.nodes.filter(candidate => candidate.data.kindId === 'function_entry').map(candidate => candidate.id));
      const pending = [...reachable];
      while (pending.length) { const id = pending.shift()!; for (const edge of doc.edges.filter(edge => edge.source === id && edge.data?.pinType === 'execution')) if (!reachable.has(edge.target)) { reachable.add(edge.target); pending.push(edge.target); } }
      const consumed = (id: string, seen = new Set<string>()): boolean => {
        if (seen.has(id)) return false; seen.add(id);
        return doc.edges.some(edge => edge.source === id && edge.data?.pinType !== 'execution' && (reachable.has(edge.target) || consumed(edge.target, new Set(seen))));
      };
      if (variable && properties.nativeLocalStyle !== 'go-const' && !doc.nodes.some(candidate => candidate.data.graphBinding?.symbolId === variable.id && ((candidate.data.kindId === 'variable_get' && consumed(candidate.id)) || (candidate.data.kindId === 'variable_set' && candidate.data.properties?.assignmentOperator && candidate.data.properties.assignmentOperator !== '=' && reachable.has(candidate.id))))) error('NATIVE_GO_UNUSED_LOCAL', 'Go local declarations need a source use on the generated execution graph.');
      // Default inference is checked by validateGoScalarBindings using exact
      // native facts. A numeric pin cannot prove float64 identity.

    }
    const nativeGoBody = language === 'go' && input.functions.some(fn => fn.overloads.some(overload => overload.graphTabId === tabId) && Object.values(input.documents).some(document => document.nodes.some(owner => owner.data.kindId === 'function_implement' && owner.data.graphBinding?.symbolId === fn.id && owner.data.properties?.nativeSignatureLanguage === 'go')));
    if (nativeGoBody) {
      if (node.data.kindId === 'var_define' && !properties.nativeLocalStyle) error('NATIVE_GO_LOCAL_INVALID', 'A native Go local needs its visible declaration style and type.');
      const scalarKinds = { data_number: 'number', data_string: 'string', data_boolean: 'boolean' } as const;
      for (const pin of node.data.inputs.filter(pin => pin.type in scalarKinds)) {
        const incoming = doc.edges.filter(edge => edge.target === node.id && edge.targetHandle === pin.id);
        const source = incoming[0] && doc.nodes.find(candidate => candidate.id === incoming[0].source);
        const type = source?.data.outputs.find(output => output.id === incoming[0]?.sourceHandle)?.type;
        const value = node.data.inlineValues?.[pin.id];
        if (incoming.length ? incoming.length !== 1 || type !== pin.type : value === undefined || typeof value !== scalarKinds[pin.type as keyof typeof scalarKinds] || (typeof value === 'number' && !Number.isFinite(value))) error('NATIVE_GO_OPERAND_TYPE', 'Go scalar inputs require their declared visible type and exactly one value.');
      }
      if (node.data.kindId === 'flow_return') {
        const result = input.functions.find(fn => fn.overloads.some(overload => overload.graphTabId === tabId))?.overloads.find(overload => overload.graphTabId === tabId)?.returnType;
        const pins = node.data.inputs.filter(pin => pin.type !== 'execution');
        if (result === 'void' ? pins.length !== 0 : pins.length !== 1 || pins[0].type !== result) error('NATIVE_GO_RETURN_TYPE', 'Go return pins must match the visible native function result.');
      }
    }

    if (properties.nativeReturnStyle !== undefined && properties.nativeReturnStyle !== 'explicit') {
      const owner = input.functions.find(fn => fn.overloads.some(overload => (overload.graphTabId ?? fn.id) === tabId));
      const definition = owner && Object.values(input.documents).flatMap(document => document.nodes).find(candidate => candidate.data.kindId === 'function_implement' && candidate.data.properties?.nativeSignatureLanguage === 'rust' && candidate.data.graphBinding?.symbolId === owner.id);
      if (language !== 'rust' || node.data.kindId !== 'flow_return' || properties.nativeReturnStyle !== 'rust-tail' || !definition) error('NATIVE_RETURN_STYLE', 'Rust tail expressions require their reviewed visible function and final value return.');
    }
    if (NATIVE_EXPRESSION_KINDS.includes(node.data.kindId as typeof NATIVE_EXPRESSION_KINDS[number])) {
      const problem = nativeExpressionProblem(node.data, language);
      if (problem) error('NATIVE_EXPRESSION_INVALID', problem);
      for (const pin of node.data.inputs) if (!doc.edges.some(edge => edge.target === node.id && edge.targetHandle === pin.id)) {
        const value = node.data.inlineValues?.[pin.id];
        if (!['string', 'number', 'boolean'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) error('NATIVE_OPERAND_MISSING', `Native operand ${pin.id} needs a visible persistable value.`);
      }
      const settings = nativeExpressionSettings(node.data);
      if (['cpp', 'rust', 'gdscript'].includes(settings.language)) {
        const owner = input.functions.find(fn => fn.overloads.some(overload => (overload.graphTabId ?? fn.id) === tabId));
        const definition = owner && Object.values(input.documents).flatMap(document => document.nodes).find(candidate => candidate.data.kindId === 'function_implement' && candidate.data.properties?.nativeSignatureLanguage === settings.language && candidate.data.graphBinding?.symbolId === owner.id);
        if (!definition) error('NATIVE_SCALAR_EXPRESSION_OWNER', 'Native constant expressions require a reviewed visible function definition/body.');
      }
      if (settings.language === 'csharp') {
        const owner = input.functions.find(fn => fn.overloads.some(overload => (overload.graphTabId ?? fn.id) === tabId));
        const definition = owner && Object.values(input.documents).flatMap(document => document.nodes).find(candidate => candidate.data.kindId === 'function_implement' && candidate.data.properties?.nativeSignatureLanguage === 'csharp' && (candidate.data.graphBinding?.symbolId ?? candidate.data.properties?.symbolId) === owner.id);
        if (!definition) error('NATIVE_CSHARP_EXPRESSION_OWNER', 'C# integral expressions require a visible method with reviewed native signature and body semantics.');
      }
      for (const edge of doc.edges.filter(edge => edge.target === node.id)) {
        const source = doc.nodes.find(source => source.id === edge.source);
        if (!node.data.inputs.some(pin => pin.id === edge.targetHandle) || !source?.data.outputs.some(pin => pin.id === edge.sourceHandle)) error('NATIVE_OPERAND_EDGE', 'Native operands require valid visible source and target pins.');
      }
      for (const pin of node.data.inputs) if (doc.edges.filter(edge => edge.target === node.id && edge.targetHandle === pin.id).length > 1) error('NATIVE_OPERAND_EDGE', 'Each native operand requires exactly one incoming value.');

      if (['binary', 'unary'].includes(settings.form) && settings.domain === 'number') for (const pin of node.data.inputs) {
        const edge = doc.edges.find(edge => edge.target === node.id && edge.targetHandle === pin.id);
        const source = edge && doc.nodes.find(source => source.id === edge.source);
        if (edge ? source?.data.outputs.find(output => output.id === edge.sourceHandle)?.type !== 'data_number' : typeof node.data.inlineValues?.[pin.id] !== 'number') error('NATIVE_NUMERIC_EVIDENCE', 'A numeric native result requires proven numeric operands; select the unknown domain for native dynamic dispatch.');
      }
      const special = ['named-entry', 'quoted-entry', 'computed-entry', 'dict-entry', 'shorthand-entry', 'spread', 'dict-spread', 'hole'];
      if (special.includes(settings.form)) {
        const consumers = doc.edges.filter(edge => edge.source === node.id && edge.data?.pinType !== 'execution');
        const allowed = settings.form === 'hole' ? ['array'] : settings.form === 'spread' ? (language === 'javascript' ? ['array', 'object'] : ['list', 'tuple', 'set']) : settings.form === 'dict-spread' || settings.form === 'dict-entry' ? ['dict'] : ['object'];
        if (!consumers.length || consumers.some(edge => !allowed.includes(String(doc.nodes.find(parent => parent.id === edge.target)?.data.properties?.nativeForm)))) error('NATIVE_CONTAINER_CONTEXT', 'Entry, spread and hole forms require a direct compatible collection owner.');
      }
      if (['object', 'dict'].includes(settings.form)) for (const pin of node.data.inputs) {
        const edge = doc.edges.find(edge => edge.target === node.id && edge.targetHandle === pin.id);
        const child = edge && doc.nodes.find(child => child.id === edge.source);
        const allowed = settings.form === 'object' ? ['named-entry', 'quoted-entry', 'computed-entry', 'shorthand-entry', 'spread'] : ['dict-entry', 'dict-spread'];
        if (!child || !allowed.includes(String(child.data.properties?.nativeForm))) error('NATIVE_CONTAINER_CONTEXT', 'Object/dict operands must be visible entry or spread nodes.');
      }
      const visit = (id: string, path: Set<string>, depth: number): void => {
        if (path.has(id) || depth > 64) { error('NATIVE_EXPRESSION_CYCLE', 'Native expressions require an acyclic graph within the 64-level expression budget.'); return; }
        const child = doc.nodes.find(child => child.id === id);
        if (!child || ['function_entry', 'variable_get', 'flow_for'].includes(child.data.kindId ?? '')) return;
        const next = new Set([...path, id]);
        for (const pin of child.data.inputs.filter(pin => pin.type !== 'execution')) for (const edge of doc.edges.filter(edge => edge.target === id && edge.targetHandle === pin.id)) visit(edge.source, next, depth + 1);
      };
      visit(node.id, new Set(), 0);

    }
      const integerSource = (id: string, seen = new Set<string>()): boolean => {
        if (seen.has(id)) return false; seen.add(id);
        const source = doc.nodes.find(source => source.id === id); if (!source) return false;
        if (source.data.kindId === 'expr_native_literal') return source.data.properties?.nativeLanguage === 'python' && source.data.properties?.nativeDomain === 'python-integer';
        if (source.data.kindId === 'expr_native_operator' && source.data.properties?.nativeLanguage === 'python' && source.data.properties?.nativeForm === 'unary' && ['+', '-'].includes(String(source.data.properties?.operator))) {
          const edge = doc.edges.find(edge => edge.target === id && edge.targetHandle === 'operand-0');
          return edge ? integerSource(edge.source, new Set(seen)) : typeof source.data.inlineValues?.['operand-0'] === 'number' && Number.isSafeInteger(source.data.inlineValues['operand-0']);
        }
        if (source.data.kindId === 'variable_get') {
          const symbolId = source.data.graphBinding?.symbolId ?? source.data.properties?.symbolId;
          return doc.nodes.some(declaration => declaration.data.kindId === 'var_define' && declaration.data.properties?.symbolId === symbolId && declaration.data.properties?.numberDomain === 'python-integer');
        }
        if (!['math_add', 'math_subtract', 'math_multiply'].includes(source.data.kindId ?? '') || source.data.properties?.numberDomain !== 'python-integer') return false;
        return ['a', 'b'].every(pin => {
          const edge = doc.edges.find(edge => edge.target === id && edge.targetHandle === pin);
          return edge ? integerSource(edge.source, new Set(seen)) : typeof source.data.inlineValues?.[pin] === 'number' && Number.isSafeInteger(source.data.inlineValues[pin]);
        });
      };
    if (node.data.kindId === 'source_directive') {
      if (language !== 'javascript' || typeof properties.directive !== 'string' || !properties.directive) error('DIRECTIVE_TARGET_UNSUPPORTED', 'A language directive requires an explicit JavaScript string value.');
      const incoming = doc.edges.filter(edge => edge.target === node.id && edge.data?.pinType === 'execution');
      if (incoming.some(edge => !['function_entry', 'source_directive'].includes(doc.nodes.find(parent => parent.id === edge.source)?.data.kindId ?? ''))) error('DIRECTIVE_POSITION', 'Directives must appear in the function/file directive prologue.');
    }
    if (properties.isExported === true && (language !== 'javascript' || input.functions.find(fn => fn.id === (node.data.graphBinding?.symbolId ?? properties.symbolId))?.binding !== 'module')) error('EXPORT_TARGET_UNSUPPORTED', 'Named function exports require a JavaScript module-owned Define.');
    if (properties.declarationOnly === true && language !== 'python') error('FIELD_DECLARATION_TARGET', 'Constructor-owned field declarations currently require Python.');
    if (node.data.kindId === 'flow_for' && properties.headerMode === 'python-range') {
      if (language !== 'python' || ![1, 2, 3].includes(Number(properties.rangeArgumentCount))) error('RANGE_TARGET_UNSUPPORTED', 'Native range requires Python and one to three explicit arguments.');
      const declarations = doc.edges.filter(edge => edge.source === node.id && edge.sourceHandle === 'init_exec').map(edge => doc.nodes.find(node => node.id === edge.target));
      if (declarations.length !== 1 || declarations[0]?.data.kindId !== 'var_define' || declarations[0].data.properties?.declarationKind !== 'loop-index') error('RANGE_INDEX_DECLARATION', 'Range needs one visible index Declare node.');
      if (Number(properties.rangeArgumentCount) === 3 && node.data.inlineValues?.step === 0) error('RANGE_STEP_ZERO', 'Range step must be nonzero.');
    }
    if ((node.data.kindId === 'flow_for' || node.data.kindId === 'flow_while') && doc.edges.some(edge => edge.target === node.id && edge.targetHandle === 'condition')) {
      const calls = new Set<string>(), seen = new Set<string>();
      const visit = (id: string): void => {
        if (seen.has(id)) return; seen.add(id);
        const source = doc.nodes.find(source => source.id === id);
        if (source?.data.kindId === 'vvs.project.call_function' && source.data.properties?.callPlacement !== 'expression') calls.add(id);
        for (const edge of doc.edges.filter(edge => edge.target === id && edge.data?.pinType !== 'execution')) visit(edge.source);
      };
      for (const edge of doc.edges.filter(edge => edge.target === node.id && edge.targetHandle === 'condition')) visit(edge.source);
      const owned = new Set<string>(), pending = doc.edges.filter(edge => edge.source === node.id && edge.sourceHandle === 'condition_exec').map(edge => edge.target);
      while (pending.length) {
        const id = pending.shift()!; if (owned.has(id)) continue; owned.add(id);
        const child = doc.nodes.find(child => child.id === id);
        if (child?.data.kindId !== 'vvs.project.call_function') error('LOOP_CONDITION_EFFECT', 'Condition evaluation may contain only its visible expression call nodes.');
        for (const edge of doc.edges.filter(edge => edge.source === id && edge.data?.pinType === 'execution')) pending.push(edge.target);
      }
      if ([...calls].some(id => !owned.has(id)) || [...owned].some(id => !calls.has(id))) error('LOOP_CONDITION_EFFECT', 'Repeated condition calls must belong to this loop Condition evaluation output.');
    }
    if (properties.isSuperConstructor === true) {
      const fn = input.functions.find(fn => fn.id === node.data.graphBinding?.symbolId);
      const declaration = Object.values(input.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === fn?.id);
      if (language !== 'javascript' || properties.isSuper !== true || declaration?.data.properties?.role !== 'constructor') error('SUPER_CONSTRUCTOR_BINDING', 'Super constructor must bind an explicit parent constructor.');
    }

    if (properties.numberDomain === 'python-integer') {
      if (language !== 'python') error('INTEGER_DOMAIN_TARGET', 'Native Python integer semantics require Python; changing targets requires a reviewed conversion.');
      if (node.data.kindId?.startsWith('math_') && !integerSource(node.id)) error('INTEGER_DOMAIN_OPERANDS', 'Python integer arithmetic requires integer literal/local/expression evidence on each input.');
    }
    const integerInput = (pin: string): boolean => {
      const edge = doc.edges.find(edge => edge.target === node.id && edge.targetHandle === pin);
      return edge ? integerSource(edge.source) : typeof node.data.inlineValues?.[pin] === 'number' && Number.isSafeInteger(node.data.inlineValues[pin]);
    };
    if (node.data.kindId === 'var_define' && properties.numberDomain === 'python-integer' && properties.declarationKind !== 'loop-index' && !integerInput('value')) error('INTEGER_DOMAIN_INITIALIZER', 'Integer locals require a proven integer initializer.');
    if (node.data.kindId === 'variable_set') {
      const symbolId = node.data.graphBinding?.symbolId ?? properties.symbolId;
      if (doc.nodes.some(declaration => declaration.data.kindId === 'var_define' && declaration.data.properties?.symbolId === symbolId && declaration.data.properties?.numberDomain === 'python-integer') && !integerInput('val')) error('INTEGER_DOMAIN_ASSIGNMENT', 'Integer local updates require a proven integer expression.');
    }
    if (node.data.kindId === 'flow_for' && properties.headerMode === 'python-range' && !['first', 'last', 'step'].slice(0, Number(properties.rangeArgumentCount)).every(integerInput)) error('RANGE_INTEGER_ARGUMENT', 'Native range requires proven integer arguments.');
    if (node.data.kindId === 'expr_compare') {
      const mode = properties.comparisonMode ?? 'number', operator = properties.operator ?? '<';
      const strict = mode === 'js-strict';
      if (!['javascript', 'python', 'go'].includes(language) || (strict && language !== 'javascript')) error('COMPARISON_TARGET_UNSUPPORTED', 'This comparison mode is supported only by its reviewed JS/Python target.');
      if (strict ? !['===', '!=='].includes(String(operator)) : !['number', 'string', 'boolean'].includes(String(mode)) || !['==', '!=', '<', '<=', '>', '>='].includes(String(operator)) || (mode === 'boolean' && !['==', '!='].includes(String(operator)))) error('COMPARISON_VARIANT_INVALID', 'Operator does not match the selected comparison semantics.');
      if (!strict) for (const pin of ['a', 'b']) {
        const edge = doc.edges.find(edge => edge.target === node.id && edge.targetHandle === pin);
        const source = edge && doc.nodes.find(source => source.id === edge.source);
        const type = source?.data.outputs.find(output => output.id === edge?.sourceHandle)?.type;
        const expected = ({ number: 'data_number', string: 'data_string', boolean: 'data_boolean' } as Record<string, string>)[String(mode)];
        if (edge ? type !== expected : typeof node.data.inlineValues?.[pin] !== mode) error('COMPARISON_OPERANDS', 'Typed comparisons need matching proven scalar operands; add an explicit conversion when required.');
      }
    }
    if (node.data.kindId === 'flow_for' && properties.headerMode === 'structured') {
      if (!['javascript', 'go', 'csharp'].includes(language)) error('FOR_HEADER_TARGET_UNSUPPORTED', 'Structured counted For headers currently require JavaScript.');
      for (const [handle, kind] of [['init_exec', 'var_define'], ['update_exec', 'variable_set']]) {
        const edges = doc.edges.filter(edge => edge.source === node.id && edge.sourceHandle === handle && edge.data?.pinType === 'execution');
        const child = doc.nodes.find(child => child.id === edges[0]?.target);
        if (language === 'go' && handle === 'init_exec' && child?.data.properties?.nativeLocalStyle !== 'go-short') error('NATIVE_GO_FOR_INIT', 'A Go counted header requires its visible short declaration, not a typed var statement.');
        if (edges.length !== 1 || child?.data.kindId !== kind || doc.edges.some(edge => edge.source === child?.id && edge.data?.pinType === 'execution')) error('FOR_HEADER_INVALID', 'Each header connection must contain exactly one visible local Declare or Set node.');
      }
    }
    if (node.data.kindId === 'native_declaration_group') {
      try { nativeScalarDeclarationGroup(doc, node.id, language as 'cpp', String(node.data.properties?.nativeOwnerId)); }
      catch { error('NATIVE_CPP_GROUP_OWNER', 'A C++ declaration group needs its actual ordered declaration children and native owner.'); }
    }
    if (node.data.kindId === 'csharp_scope' || node.data.kindId === 'csharp_declaration_group') {
      const owner = input.functions.find(fn => fn.overloads.some(overload => (overload.graphTabId ?? fn.id) === tabId) && Object.values(input.documents).some(document => document.nodes.some(node => node.data.kindId === 'function_implement' && node.data.properties?.nativeSignatureLanguage === 'csharp' && node.data.graphBinding?.symbolId === fn.id)));
      if (language !== 'csharp' || !owner) error('NATIVE_CSHARP_SCOPE_OWNER', 'Lexical blocks require their visible native C# method body.');
    }
    if (node.data.kindId === 'parameter_set') {
      const fn = input.functions.find(fn => fn.id === node.data.graphBinding?.symbolId);
      const overload = fn?.overloads.find(overload => overload.id === node.data.graphBinding?.overloadId);
      const owner = Object.values(input.documents).flatMap(doc => doc.nodes).find(owner => owner.data.properties?.nativeSignatureLanguage === 'csharp' && owner.data.graphBinding?.symbolId === fn?.id && owner.data.kindId === 'function_implement');
      if (language !== 'csharp' || !fn || !overload || (overload.graphTabId ?? fn.id) !== tabId || !owner || !overload.parameters.some(parameter => parameter.id === node.data.graphBinding?.parameterId)) error('NATIVE_CSHARP_PARAMETER_OWNER', 'Parameter writes require their own native method, overload and parameter slot.');
    }
    if (node.data.kindId === 'variable_set' && properties.assignmentOperator && properties.assignmentOperator !== '=') {
      if (!['javascript', 'go', 'csharp'].includes(language) || (language === 'go' && properties.prefix === true)) error('ASSIGN_OPERATOR_UNSUPPORTED', 'Explicit compound/update operators currently require JavaScript.');
      const variable = input.variables?.find(variable => variable.id === (node.data.graphBinding?.symbolId ?? properties.symbolId));
      const stringAppend = language === 'go' && properties.assignmentOperator === '+=' && variable?.type === 'data_string';
      if (!variable || (variable.type !== 'data_number' && !stringAppend)) error('UPDATE_OPERANDS', 'Compound/update operators require an initialized numeric local or a Go string append.');
      if (!((language === 'go' ? GO_ASSIGN_OPERATORS : language === 'csharp' ? CSHARP_ASSIGNMENT_OPERATORS : ['+=', '-=', '*=', '/=', '++', '--']) as readonly string[]).includes(String(properties.assignmentOperator))) error('UPDATE_OPERATOR', 'Unsupported assignment operator.');
      if (!['++', '--'].includes(String(properties.assignmentOperator))) {
        const edge = doc.edges.find(edge => edge.target === node.id && edge.targetHandle === 'val');
        const source = edge && doc.nodes.find(source => source.id === edge.source);
        if (edge ? source?.data.outputs.find(pin => pin.id === edge.sourceHandle)?.type !== (stringAppend ? 'data_string' : 'data_number') : typeof node.data.inlineValues?.val !== (stringAppend ? 'string' : 'number')) error('UPDATE_OPERANDS', 'Compound assignment requires a value matching its native operand type.');
      }
    }
    const variable = input.variables?.find(variable => variable.id === (node.data.graphBinding?.symbolId ?? properties.symbolId));
    const owner = (variable?.scopedNodeId && doc.nodes.find(owner => owner.id === variable.scopedNodeId && owner.data.kindId === 'flow_for' && ['structured', 'python-range'].includes(String(owner.data.properties?.headerMode)))) || (node.data.kindId === 'flow_for' && ['structured', 'python-range'].includes(String(properties.headerMode)) ? node : undefined);
    if (owner) {
      const scopeKey = JSON.stringify([tabId, owner.id]);
      let allowed = loopScopes.get(scopeKey);
      if (!allowed) {
        allowed = new Set([owner.id]);
        const queue = [owner.id];
        while (queue.length) {
          const id = queue.shift()!;
          for (const edge of doc.edges.filter(edge => edge.source === id && edge.data?.pinType === 'execution' && !(id === owner.id && edge.sourceHandle === 'exec_out'))) if (!allowed.has(edge.target)) { allowed.add(edge.target); queue.push(edge.target); }
        }
        loopScopes.set(scopeKey, allowed);
      }
      if (node.data.kindId === 'variable_get' || node === owner) {
        const pending = [node.id], seen = new Set<string>();
        while (pending.length) {
          const id = pending.shift()!;
          if (seen.has(id)) continue;
          seen.add(id);
          for (const edge of doc.edges.filter(edge => edge.source === id && edge.data?.pinType !== 'execution' && !(id === owner.id && edge.sourceHandle !== 'index'))) {
            const target = doc.nodes.find(target => target.id === edge.target);
            if (target?.data.inputs.some(pin => pin.type === 'execution')) {
              if (!allowed.has(edge.target)) error('LOCAL_SCOPE_ESCAPE', 'A counted-loop local cannot be consumed outside its loop.');
            } else pending.push(edge.target);
          }
        }
      } else if (!allowed.has(node.id)) error('LOCAL_SCOPE_ESCAPE', 'A counted-loop local cannot be assigned outside its loop.');
    }
  }
  for (const [tabId, doc] of Object.entries(input.documents)) {
    const language = doc.metadata?.targetLanguage ?? input.targetLanguage;
    const byId = new Map(doc.nodes.map(node => [node.id, node]));
    // Reviewed C# bodies have a native expression/statement walker which checks
    // assignment with short-circuit reachability. The generic recursive read scan
    // treats every operand as eager and must not contradict that native gate.
    const nativeCSharpBody = language === 'csharp' && doc.nodes.some(node => node.data.kindId === 'function_entry' && node.data.properties?.nativeSignatureLanguage === 'csharp') && input.functions.some(fn => fn.overloads.some(overload => (overload.graphTabId ?? fn.id) === tabId) && Object.values(input.documents).some(document => document.nodes.some(node => node.data.kindId === 'function_implement' && node.data.properties?.nativeSignatureLanguage === 'csharp' && (node.data.graphBinding?.symbolId ?? node.data.properties?.symbolId) === fn.id)));
    const exec = (id: string, handle: string) => doc.edges.filter(edge => edge.source === id && edge.sourceHandle === handle && edge.data?.pinType === 'execution').map(edge => edge.target);
    const report = (id: string, code: string, message: string) => diagnostics.push({ level: 'error', source: 'semantic', code, message, tabId, nodeId: id });
    const visited = new Set<string>();
    function walk(id: string, initialized: Set<string>, loop?: string, declared = new Set<string>()): Set<string> | undefined {
      const key = JSON.stringify([id, loop, [...initialized].sort()]);
      if (visited.has(key)) return initialized;
      visited.add(key);
      const node = byId.get(id); if (!node) return initialized;
      const kind = node.data.kindId;
      const symbolId = String(node.data.graphBinding?.symbolId ?? node.data.properties?.symbolId ?? '');
      const reads = (consumer: string, seen = new Set<string>()): void => {
        if (seen.has(consumer)) return; seen.add(consumer);
        for (const edge of doc.edges.filter(edge => edge.target === consumer && edge.data?.pinType !== 'execution')) {
          const source = byId.get(edge.source);
          const variableId = String(source?.data.graphBinding?.symbolId ?? source?.data.properties?.symbolId ?? '');
          const variable = input.variables?.find(variable => variable.id === variableId);
          if (!nativeCSharpBody && source?.data.kindId === 'variable_get' && variable?.graphTabId && (language === 'go' || language === 'csharp' || source.data.properties?.sourceOrigin) && !initialized.has(variableId)) report(source.id, 'LOCAL_NOT_INITIALIZED', 'Local declaration must dominate every read on this execution path.');
          reads(edge.source, seen);
        }
      };
      if (kind !== 'flow_for' || node.data.properties?.headerMode !== 'structured') reads(id);
      if (kind === 'var_define' && input.variables?.some(variable => variable.id === symbolId && variable.graphTabId)) {
        declared.add(symbolId);
        if (language !== 'csharp' || node.data.properties?.hasInitializer !== false) initialized = new Set([...initialized, symbolId]);
      }
      if (language === 'python' && kind === 'variable_set' && input.variables?.some(variable => variable.id === symbolId && variable.graphTabId)) initialized = new Set([...initialized, symbolId]);
      if (language !== 'python' && kind === 'variable_set' && input.variables?.some(variable => variable.id === symbolId && variable.graphTabId) && (language === 'go' || language === 'csharp' || node.data.properties?.sourceOrigin) && !(language === 'csharp' && (node.data.properties?.assignmentOperator ?? '=') === '=') && !initialized.has(symbolId)) report(id, 'LOCAL_NOT_INITIALIZED', 'Local declaration must dominate assignment.');
      if (language === 'csharp' && kind === 'variable_set' && (node.data.properties?.assignmentOperator ?? '=') === '=') {
        if (!declared.has(symbolId)) report(id, 'LOCAL_NOT_INITIALIZED', 'Assignment requires a preceding visible declaration.');
        initialized = new Set([...initialized, symbolId]);
      }
      if (kind === 'flow_break' || kind === 'flow_continue') {
        if (!loop || (node.data.properties?.loopTargetId && node.data.properties.loopTargetId !== loop)) report(id, 'LOOP_TARGET_INVALID', 'Break/Continue must target the nearest enclosing loop body.');
        return undefined;
      }
      if (kind === 'flow_return') return undefined;
      if (kind === 'csharp_declaration_group' || kind === 'native_declaration_group') {
        for (const child of exec(id, 'declarations_exec')) {
          const result = walk(child, initialized, loop, declared);
          if (!result) return undefined;
          initialized = result;
        }
      }
      if (kind === 'csharp_scope') {
        for (const child of exec(id, 'body_exec')) {
          const result = walk(child, new Set(initialized), loop, new Set(declared));
          if (!result) return undefined;
          initialized = new Set([...result].filter(symbolId => declared.has(symbolId)));
        }
      }
      if (kind === 'flow_branch') {
        const arms = ['true_exec', 'false_exec'].map(handle => {
          let result: Set<string> | undefined = new Set(initialized);
          for (const child of exec(id, handle)) if (result) result = walk(child, result, loop);
          return result;
        }).filter((arm): arm is Set<string> => !!arm);
        if (!arms.length) return undefined;
        // Branch declarations never extend the enclosing lexical scope.
        initialized = new Set([...(language === 'python' ? arms[0] : initialized)].filter(value => arms.every(arm => arm.has(value))));
      }
      if (kind === 'flow_for' || kind === 'flow_while') {
        let nested = new Set(initialized);
        for (const child of exec(id, 'init_exec')) nested = walk(child, nested, id) ?? nested;
        const previous = initialized; initialized = nested; reads(id); initialized = previous;
        for (const child of exec(id, 'condition_exec')) walk(child, new Set(nested), id);
        for (const child of exec(id, 'body_exec')) walk(child, new Set(nested), id);
        for (const child of exec(id, 'update_exec')) walk(child, new Set(nested), id);
      }
      for (const child of exec(id, 'exec_out')) { const next = walk(child, initialized, loop, declared); if (!next) return undefined; initialized = next; }
      return initialized;
    }
    for (const node of doc.nodes.filter(node => ['function_entry', 'event_define'].includes(node.data.kindId ?? ''))) walk(node.id, new Set());
  }
  // Native operands may inline resolved calls; the visible execution chain must
  // establish that exact evaluation order, rather than silently moving effects.
  for (const [tabId, doc] of Object.entries(input.documents)) for (const owner of doc.nodes.filter(node => node.data.inputs.some(pin => pin.type === 'execution'))) {
    const calls: string[] = []; let native = false;
    const collect = (id: string, path = new Set<string>()): void => {
      if (path.has(id)) return;
      const node = doc.nodes.find(node => node.id === id); if (!node) return;
      native ||= NATIVE_EXPRESSION_KINDS.includes(node.data.kindId as typeof NATIVE_EXPRESSION_KINDS[number]);
      if (['variable_get', 'function_entry', 'flow_for'].includes(node.data.kindId ?? '')) return;
      for (const pin of node.data.inputs.filter(pin => pin.type !== 'execution')) for (const edge of doc.edges.filter(edge => edge.target === id && edge.targetHandle === pin.id)) collect(edge.source, new Set([...path, id]));
      if (node.data.kindId === 'vvs.project.call_function' && node.data.properties?.callPlacement !== 'expression') calls.push(id);
    };
    for (const pin of owner.data.inputs.filter(pin => pin.type !== 'execution')) for (const edge of doc.edges.filter(edge => edge.target === owner.id && edge.targetHandle === pin.id)) collect(edge.source);
    if (!native || !calls.length) continue;
    const chain: string[] = []; const seen = new Set<string>(); let cursor = owner.id;
    while (!seen.has(cursor)) {
      seen.add(cursor);
      const incoming = doc.edges.filter(edge => edge.target === cursor && edge.data?.pinType === 'execution');
      if (incoming.length !== 1) break;
      const previous = doc.nodes.find(node => node.id === incoming[0].source);
      if (previous?.data.kindId !== 'vvs.project.call_function') break;
      chain.unshift(previous.id); cursor = previous.id;
    }
    if (['flow_for', 'flow_while'].includes(owner.data.kindId ?? '')) {
      chain.length = 0;
      let next = doc.edges.find(edge => edge.source === owner.id && edge.sourceHandle === 'condition_exec');
      const visited = new Set<string>();
      while (next && !visited.has(next.target)) {
        visited.add(next.target); chain.push(next.target);
        next = doc.edges.find(edge => edge.source === next!.target && edge.data?.pinType === 'execution');
      }
    }
    const missingOwnership = calls.some(id => doc.edges.filter(edge => edge.target === id && edge.data?.pinType === 'execution').length !== 1);
    if (missingOwnership || calls.length !== new Set(calls).size || JSON.stringify(chain.slice(-calls.length)) !== JSON.stringify(calls)) diagnostics.push({ level: 'error', source: 'semantic', code: 'NATIVE_EFFECT_ORDER', message: 'Native expression calls must have distinct visible evaluations in operand order immediately before their owning statement.', tabId, nodeId: owner.id });
  }
  return diagnostics;
}
