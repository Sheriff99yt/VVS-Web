# Native local declarations: IR v13 amendment

## IR v17 explicit initializer absence

C# typed mutable `IrDeclareLocal` and `DeclarationGroup` children may have no `initializer`. Pack templates then render the type/name or the grouped declarator name alone. `var` and const remain initialized. Graph `hasInitializer`/input/edge ownership and transient definite-assignment facts prove whether reads and updates are valid; no symbol default, implicit assignment or folded value supplies missing source. See [the definite-assignment contract](csharp_definite_assignment_contract.md).

## IR v16 declaration group amendment

`DeclarationGroup` owns a shared predefined integral `nativeType`, `isConst`, ordered visible `IrDeclareLocal` children in `body`, and `sourceGraphNodeId`. The C# pack renders a single type/keyword and comma-separated declarators. Declarator name/initializer contributions receive distinct column ranges; nested expression spans survive composition. Grouping establishes no new scope and never splits into independent printed statements. See [the group contract](csharp_declaration_group_contract.md).

## IR v15 lexical block amendment

`ScopeBlock` owns one authored ordinary, checked or unchecked C# block through `body`, `overflowContext` and `sourceGraphNodeId`. The visible `csharp_scope` node owns execution input, nested body and continuation pins. Syntax packs print its braces and optional keyword; the sink recursively tags child statements and expression spans rather than embedding pre-rendered text. Empty blocks remain empty. Other language mappings require their own contracts before admission.

Native local index `scopedNodeId` and declaration `scopeOwnerId` must match the actual enclosing execution region. Graph analysis pre-reserves each declaration space, isolates child bindings, propagates terminal nested return environments/context and rejects escaped references, sibling identity confusion, shadowing later ancestors, invalid contexts and continuation after return. Existing IR v14 mutations remain unchanged.

This extends IrDeclareLocal's existing native Go metadata with C# predefined-integral local declarations. It does not introduce a generic cross-language declaration evaluator or complete the C# adapter.

| Field | Added C# values | Meaning |
|---|---|---|
| nativeLocalStyle | csharp-typed, csharp-var, csharp-const | Authored initialized typed, inferred or constant local declaration |
| nativeType | Nine predefined C# integral types, or var | Explicit type spelling or authored inference keyword |
| declarationKind | Existing const/var | Constant keyword identity; must agree with local style and readonly index |
| initializer | Existing IrExpr | Visible graph-owned exact expression, never a folded/default/source cache |

IR_VERSION advances from 12 to 13. C# pack templates own typed/inferred assignment spelling and the const keyword. Other targets reject C# local styles; C# does not render Go local styles. Current statements require an explicit visible initializer. Existing Go styles/types and generic declaration paths retain their semantics.

Native C# method body validation derives ordered declaration facts from the execution graph before return checking. Local indexes must match graph names, owning class/body and Number pins; readonly identity must agree with const style. Self/forward references, shadowing, malformed values, hidden inputs, bad types, orphan expressions, disconnected declarations and additional execution edges block generation independently of import provenance. Const reads retain native converted constants; mutable reads retain only type. Straight-line initialized source declarations now connect to sealed review/acceptance and reimport; native type inspector invalid/recovery/reload workflows pass in production and Pages. Style transactions are verified; void fallthrough now ends the visible local chain without inventing a return, using the existing IR v13 sequence.

Plain local assignments now use visible Set nodes with a Number value pin, the preceding declaration's binding and one execution successor. The same native implicit-assignment contract checks source and saved graphs; const writes, forward references, runtime implicit narrowing, stale names and hidden inline values fail. Reassignment retains the declared native type and never turns mutable reads into constants. The C# AssignLocal pack template prints an assignment, leaving declaration spelling to the visible Declare node. Original/regenerated native cases, a fixed saved graph and actual inspector invalid/recovery workflows cover the change. Parameter writes, effectful assignment/update expressions, grouped declarations, nested scopes and call ownership remain open contracts; the following IR v14 amendment covers standalone compound/update statements.

## IR v14: predefined C# local mutations

IR_VERSION advances from 13 to 14 to include the authored `>>>=` assignment operator. Existing saved graphs need no rewrite: omitted operators still mean `=`, and prefix defaults to false. Registry Set nodes and the structured AssignVariable IR retain each compound/update occurrence rather than expanding it into a hidden read, operation and cast. C# pack rows print compound, prefix and postfix statements. Update nodes have execution pins only; compound nodes have one visible typed RHS. Native source/graph validation derives target type from the preceding declaration, checks readonly identity and never propagates mutable constants.

The [C# specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#12245-compound-assignment) requires native binary applicability and either implicit result assignment or explicit integral result conversion with RHS implicit assignment (except shifts). The compiler cross-product covers nine integral targets, eleven compound operators, nine runtime RHS types and three constant RHS values, plus mutable/readonly prefix/postfix updates. Source mappings cover standalone local mutation statements; effectful nested assignment/update expressions, parameter writes, members/indexers, checked statement scopes and user-defined operators remain open. Inspector choices preserve existing arity; switching between binary and unary mutation needs an explicit graph rewiring transaction, still planned.

The fixed/composed graph corpus is packages/transpiler/test/csharpLocalGraphs.ts, csharp-assignment.fixture.json and csharp-mutation.fixture.json. Compiler evidence, exact class/function-tab output, persistence and graph mutation results are recorded in current_state. Independent original/regenerated native compilation and actual production/Pages source workflows prove the covered local subsets; they do not prove the remaining scope.

## Parameter write ownership (IR v14)

The `parameter_set` node stores a `parameter_ref` binding to function, overload and parameter IDs; it never creates a duplicate variable index or declaration. Its target name/type is checked against the visible native signature and entry in its own method graph. Existing AssignVariable IR uses local targeting and the authored operator, so no new IR shape or version is needed. Entry parameter output pins denote reads of the named mutable parameter at each consuming statement, not a captured value or hidden temporary. Parameter writes and local declarations preserve execution order. Signature renames rebind Set names by slot ID; removed/moved slots remain invalid. Native checks reject crossed functions/overloads, stale names, hidden RHSs and malformed prefix options independently of provenance. Ordinary by-value integral parameters are mapped; ref/out/in modes, effectful expressions, grouped/nested/checked scopes and broader types remain open contracts.
