// The fundamental building block of VVS transpilation
export type SyntaxPartType = 'static' | 'slot' | 'indent' | 'dedent' | 'newline';

export interface SyntaxPart {
  type: SyntaxPartType;
  // If static/indent/newline: the exact string or whitespace token
  // If slot: the ID of the pin (e.g. 'in_val_1') that provides the code string
  val: string; 
}

// How a specific logic node maps to a specific language
export interface LanguageSyntaxDefinition {
  nodeCategory: string; // The type of node this maps to
  language: string;     // e.g., 'python', 'cpp', 'typescript'
  parts: SyntaxPart[];  // The ordered array of syntax parts
}
