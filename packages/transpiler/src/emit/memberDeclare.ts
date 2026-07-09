import type { TargetLanguage } from '@vvs/graph-types';
import { CodeSink } from '../codeSink';

/** Member-chain slot kinds that may map to a native declaration line per target language. */
export type MemberDeclareSlot = 'event' | 'function';

export function supportsNativeMemberDeclare(
  slot: MemberDeclareSlot,
  targetLanguage: TargetLanguage
): boolean {
  if (slot === 'event' || slot === 'function') {
    return targetLanguage === 'cpp';
  }
  return false;
}

export function memberChainIndent(targetLanguage: TargetLanguage): string {
  if (targetLanguage === 'python' || targetLanguage === 'verse' || targetLanguage === 'gdscript') return '    ';
  if (targetLanguage === 'javascript') return '  ';
  return '    ';
}

export function commentLine(targetLanguage: TargetLanguage, indent: string, label: string): string {
  const prefix = targetLanguage === 'python' || targetLanguage === 'verse' || targetLanguage === 'gdscript' ? '# ' : '// ';
  return `${indent}${prefix}${label}`;
}

/** Canvas node has no native declaration form in this language — emit a commented node label. */
export function appendGraphNodePlaceholder(
  sink: CodeSink,
  targetLanguage: TargetLanguage,
  nodeId: string,
  label: string
): void {
  const indent = memberChainIndent(targetLanguage);
  const line = commentLine(targetLanguage, indent, label);
  const startLine = sink.lineCount + 1;
  sink.appendRaw(line);
  sink.tagRange(nodeId, startLine, startLine, label);
}

export function declareLabel(name: string): string {
  return `Declare ${name}`;
}
