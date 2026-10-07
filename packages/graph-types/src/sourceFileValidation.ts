import type { AnalyzeProjectInput } from './analyze';
import type { Diagnostic } from './diagnostic';

const extensions: Readonly<Record<string, readonly string[]>> = { javascript: ['js', 'mjs', 'cjs'], python: ['py'], go: ['go'], csharp: ['cs'], cpp: ['cpp'], rust: ['rs'], gdscript: ['gd'] };

/** Explicit imported paths must match their target and remain unique on Windows. */
export function validateSourceFilePaths(input: AnalyzeProjectInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [], seen = new Map<string, string>();
  for (const [tabId, doc] of Object.entries(input.documents)) {
    const path = doc.metadata?.sourceFileName;
    if (path === undefined) continue;
    const language = doc.metadata?.targetLanguage ?? input.targetLanguage ?? 'javascript';
    const match = typeof path === 'string' && path.match(/^[A-Za-z_][A-Za-z0-9_.-]*\.([A-Za-z0-9]+)$/);
    if (!match || !Object.hasOwn(extensions, language) || !extensions[language].includes(match[1])) {
      diagnostics.push({ level: 'error', source: 'semantic', code: 'SOURCE_FILE_PATH', message: 'Explicit source filenames must be flat paths with an extension matching the target language.', tabId });
      continue;
    }
    const previous = seen.get(path.toLowerCase());
    if (previous) diagnostics.push({ level: 'error', source: 'semantic', code: 'SOURCE_FILE_COLLISION', message: `Source filename ${path} conflicts with graph ${previous} on a case-insensitive filesystem.`, tabId });
    else seen.set(path.toLowerCase(), tabId);
  }
  return diagnostics;
}
