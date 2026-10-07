# MP-02 native value contracts and visual mappings

MP-02a transient inventory remains distinct from acceptance evidence. Versioned Babel/Lezer facts retain exact scalar domains, syntax and spans in `nativeValues.ts`; inventory alone cannot enable an adapter. MP-02b now implements all four planned scope items for the bounded JS ES2022/Python 3.11 profiles. The canvas remains the sole editable authority.

## Visible scalar contract

JS Number and Python float use validated numeric text preserving negative zero, subnormals and overflow; inventory evidence retains their binary64 bits. JS BigInt and Python arbitrary integers use canonical signed decimal text without Number conversion. Null and None have distinct target tags. Ordinary and raw decoded strings use safe escaping. Existing Boolean and simple literal pins keep their mappings. Payloads are bounded to 128 KiB.

## Implemented MP-02b scope

1. Four visible registry families (`expr_native_literal`, `expr_native_collection`, `expr_native_access`, `expr_native_operator`) lower to structured `NativeExpression` in IR v4. [IR RFC](native_expression_ir_rfc.md) records the amendment. Saved graphs regenerate IR without migration. Target tags block unreviewed cross-language emission; source text is never a hidden editable fallback.
2. Arrays/objects and lists/tuples/sets/dicts preserve ordered operands, named/quoted/computed/shorthand keys, spreads and JS holes. Index/member nodes preserve native access, bounds and exceptions. Python slice masks expose absent/present start/stop/step bounds. Containers are bounded to 32 operands and graphs to 64 expression levels. Hole provenance owns its exact comma.
3. Native operator modes preserve language dispatch, coercion, overloads and errors without implicit Math conversion. Resolved calls remain distinct visible evaluations in operand order; malformed ports, incompatible entry contexts, cycles and disconnected/reordered execution ownership block analysis. This preserves behavior, including exceptions, rather than proving uploaded values safe.
4. Seventeen trusted probes cover source to graph to normal emitter/Code panel, source maps, JSON persistence, independent Acorn/CPython AST comparison, mutations and nested effects. Fixed canvas-first Rosetta graphs certify both targets. Production browser examples cover collection imports, acceptance and reload. Uploaded target code is never executed.

## Feedback and remaining breadth

Complex examples retain explicit rejections for JS optional chains, logical short-circuit operators and object methods; and Python comprehensions, interpolated/bytes strings, named Unicode escapes and multidimensional slices. Follow-ups also include empty-set builtin binding, arbitrary expression-call receivers, collection mutation, richer member signatures and larger collection budgets. These are roadmap extensions, not silently accepted source. Callable default/rest/keyword signatures and project closures continue in MP-03. Additional adapters and UE6/Verse engine implementation remain outside this patch.
