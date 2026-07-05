import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

/** Zinc shell + indigo accent syntax — matches VVS editor chrome. */
const vvsHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#a5b4fc', fontWeight: '500' },
  { tag: [t.definitionKeyword, t.modifier], color: '#a5b4fc' },
  { tag: [t.string, t.special(t.string)], color: '#6ee7b7' },
  { tag: t.comment, color: '#52525b', fontStyle: 'italic' },
  {
    tag: [t.function(t.variableName), t.definition(t.function(t.variableName))],
    color: '#7dd3fc',
  },
  { tag: t.number, color: '#fbbf24' },
  { tag: [t.operator, t.punctuation, t.bracket], color: '#71717a' },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: '#d4d4d8' },
  { tag: [t.variableName, t.definition(t.variableName)], color: '#e4e4e7' },
  { tag: t.className, color: '#c4b5fd' },
  { tag: t.bool, color: '#f9a8d4' },
  { tag: t.meta, color: '#71717a' },
]);

const vvsEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      fontSize: '11.5px',
      lineHeight: '1.55',
      backgroundColor: '#09090b',
      color: '#e4e4e7',
    },
    '.cm-scroller': {
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      overflow: 'auto',
      backgroundColor: '#09090b',
    },
    '.cm-content': {
      padding: '10px 0',
      caretColor: 'transparent',
    },
    '.cm-line': {
      padding: '0 14px 0 6px',
    },
    '.cm-gutters': {
      backgroundColor: '#0c0c0e',
      color: '#3f3f46',
      borderRight: '1px solid #27272a',
      minWidth: '2.75rem',
    },
    '.cm-gutterElement': {
      padding: '0 8px 0 10px',
      fontSize: '10px',
      lineHeight: '1.55',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#818cf8',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-vvs-node-highlight': {
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
      boxShadow: 'inset 2px 0 0 #818cf8',
    },
    '.cm-vvs-node-highlight-mark': {
      backgroundColor: 'rgba(99, 102, 241, 0.28)',
      borderRadius: '2px',
      boxShadow: 'inset 0 -1px 0 rgba(129, 140, 248, 0.55)',
    },
    '.cm-vvs-node-highlight .cm-gutterElement': {
      color: '#a5b4fc',
      fontWeight: '600',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(99, 102, 241, 0.22) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#818cf8',
    },
  },
  { dark: true }
);

/** VVS code panel — zinc shell, indigo selection link. */
export function vvsCodeMirrorTheme(): Extension[] {
  return [syntaxHighlighting(vvsHighlight), vvsEditorTheme];
}
