# C# integral declarations and definite assignment

Typed mutable locals may explicitly omit their initializer, including declarators in mixed or wholly uninitialized groups. Visible Variable Define nodes retain `hasInitializer: false` and omit the value input/edge. IR v17 and pack templates print only the authored declaration; symbol defaults never supply an implicit initializer. Inferred var and const still require initializers.

Source and graph binding environments track declaration separately from initialization. Plain assignment introduces definitely-assigned state only after checking the RHS and native assignment conversion. Reads, self-referential assignments, compound assignments and updates require prior initialization. Groups introduce bindings in authored order; ordinary lexical blocks propagate initialization of existing ancestor bindings while discarding child locals. Parameters start initialized; mutable assignments do not introduce constant facts.

This batch covers straight-line execution and ordinary/checked/unchecked blocks, with mixed groups, ancestor assignments, natural void completion and unused declarations. Conditional merges, loop fixed points, ref/out effects, exception paths and unreachable source regions require the forthcoming control-flow contracts; they remain in the full objective.

The subsequent [branch-flow contract](csharp_branch_flow_contract.md) now has independent native source-analysis evidence for alternative merges, early returns and dead statements. Visible Boolean/branch/unreachable mappings and their editor/lifecycle proof remain open; this does not extend the preceding graph admission boundary.

The typed-local initializer editor is a pure document projection and one lifecycle transaction. Enabling creates an empty required input and intentionally blocks generation until a visible value is wired. Disabling removes that input/edge and prunes its unshared native-expression/getter ancestry, preserving shared values and parameter owners. The editor creates no default expression or hidden cache. Changing var/const to typed remains an explicit style operation first.

Complex parameter-dependent style edits revealed that a Function Entry does not carry the full native signature. Inspector inference now reads the matching visible method/overload definition, preserving the canvas as the typing authority.

Native probes compare assigned and unassigned reads, mixed groups, ancestor assignments, compounds/updates, self-reads and initializer requirements independently against pinned Roslyn. Original/regenerated sources, fixed saved-graph mutations, exact declaration output/spans, provenance removal, reimport and production/Pages initializer/style/reload workflows supply separate graph and editor evidence; current_state records the final affected batch results.
