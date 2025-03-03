export interface Parameter {
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
}

export interface SyntaxPattern {
  pattern: string;
  type: 'expression' | 'statement' | 'block';
  imports: string[];
  description?: string;
}

export interface FunctionDefinition {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  parameters: Parameter[];
  returnType: string;
  syntaxPatterns: Record<string, SyntaxPattern>;
} 