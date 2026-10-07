/** Composed source cases for visible lexical graph mapping, not only parsing. */
export const CSHARP_SCOPE_GRAPH_CASES = [
  { id: 'sibling-local-identity', body: 'byte First = 1; { byte Value = First; Value += First; } { byte Value = First; Value++; } return First;' },
  { id: 'nested-return', body: 'const byte First = 1; { byte Second = First; { var Last = Second; return Last; } }' },
  { id: 'checked-unchecked-inheritance', body: 'checked { unchecked { byte First = (byte)256; { const byte Limit = (byte)257; First += Limit; Input = First; } } } return Input;' },
  { id: 'checked-return-context', body: 'unchecked { return (byte)256; }' },
  { id: 'empty-blocks-and-void', body: '{} checked {} unchecked { byte Value = 1; Value++; }', void: true },
].map(spec => ({ id: spec.id, source: `class Scopes { public static ${spec.void ? 'void' : 'int'} Test(int Input) { ${spec.body} } }` }));
