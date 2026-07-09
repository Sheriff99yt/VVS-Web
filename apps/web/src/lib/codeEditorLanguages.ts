import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { TargetLanguage } from '@/contexts/ProjectContext';

export function targetLanguageToCodeMirror(language: TargetLanguage): Extension[] {
  switch (language) {
    case 'python':
      return [python()];
    case 'javascript':
      return [javascript()];
    case 'cpp':
      return [cpp()];
    case 'json':
      return [json()];
    case 'verse':
      // No official Verse grammar — Python-like highlighting as interim.
      return [python()];
    case 'gdscript':
      return [python()];
    case 'rust':
      return [cpp()];
    case 'csharp':
      return [javascript()];
    default:
      return [];
  }
}

export function getCodeMirrorExtensions(language: TargetLanguage, readOnly: boolean): Extension[] {
  const extensions: Extension[] = [...targetLanguageToCodeMirror(language)];
  if (readOnly) {
    extensions.push(EditorView.editable.of(false));
  }
  return extensions;
}
