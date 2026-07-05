'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import type { SourceRange } from '@/types/transpile';
import type { GeneratedCodeViewProps } from './types';
import { getCodeMirrorExtensions } from '@/lib/codeEditorLanguages';
import { vvsCodeMirrorTheme } from './codeMirrorTheme';

const setHighlightEffect = StateEffect.define<DecorationSet>();

const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightEffect)) return effect.value;
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function sourceRangeToExtents(
  doc: EditorView['state']['doc'],
  range: SourceRange
): { from: number; to: number } | null {
  if (range.startLine < 1 || range.endLine > doc.lines) return null;
  const startLine = doc.line(range.startLine);
  const endLine = doc.line(range.endLine);
  const from = startLine.from + Math.max(0, range.startCol - 1);
  const to = endLine.from + Math.max(0, range.endCol - 1);
  if (to <= from) return null;
  return { from, to };
}

function isFullLineRange(doc: EditorView['state']['doc'], range: SourceRange): boolean {
  if (range.startLine !== range.endLine) return false;
  const line = doc.line(range.startLine);
  return range.startCol <= 1 && range.endCol >= line.length + 1;
}

/** Line + inline mark decorations from transpiler source ranges. */
function buildHighlightDecorations(
  view: EditorView,
  ranges: GeneratedCodeViewProps['highlightRanges']
): DecorationSet {
  if (!ranges?.length) return Decoration.none;

  const doc = view.state.doc;
  if (doc.length === 0) return Decoration.none;

  const entries: { from: number; to: number; deco: Decoration }[] = [];

  for (const range of ranges) {
    const extents = sourceRangeToExtents(doc, range);
    if (!extents) continue;

    if (isFullLineRange(doc, range)) {
      const line = doc.line(range.startLine);
      entries.push({
        from: line.from,
        to: line.from,
        deco: Decoration.line({ class: 'cm-vvs-node-highlight' }),
      });
    } else {
      entries.push({
        from: extents.from,
        to: extents.to,
        deco: Decoration.mark({ class: 'cm-vvs-node-highlight-mark' }),
      });
    }
  }

  entries.sort((a, b) => a.from - b.from || a.to - b.to);

  const builder = new RangeSetBuilder<Decoration>();
  for (const entry of entries) {
    builder.add(entry.from, entry.to, entry.deco);
  }
  return builder.finish();
}

function applyHighlightEffects(
  view: EditorView,
  ranges: GeneratedCodeViewProps['highlightRanges']
): void {
  const deco = buildHighlightDecorations(view, ranges);
  const effects: StateEffect<unknown>[] = [setHighlightEffect.of(deco)];

  if (ranges?.length) {
    const first = ranges.reduce((a, b) => (a.startLine < b.startLine ? a : b));
    const lineNum = Math.min(Math.max(1, first.startLine), view.state.doc.lines);
    const line = view.state.doc.line(lineNum);
    const from =
      first.startCol > 1
        ? line.from + first.startCol - 1
        : line.from;
    effects.push(EditorView.scrollIntoView(from, { y: 'center' }));
  }

  view.dispatch({ effects });
}

export function CodeMirrorGeneratedCodeView({
  value,
  language,
  highlightRanges,
  readOnly = true,
  className,
}: GeneratedCodeViewProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const highlightRangesRef = useRef(highlightRanges);
  highlightRangesRef.current = highlightRanges;

  const extensions = useMemo(
    () => [
      ...getCodeMirrorExtensions(language, readOnly),
      ...vvsCodeMirrorTheme(),
      highlightField,
    ],
    [language, readOnly]
  );

  const syncHighlights = useCallback((view: EditorView) => {
    applyHighlightEffects(view, highlightRangesRef.current);
  }, []);

  useEffect(() => {
    const view = editorRef.current?.view;
    if (view) syncHighlights(view);
  }, [highlightRanges, value, syncHighlights]);

  return (
    <CodeMirror
      ref={editorRef}
      className={className ?? 'h-full vvs-code-mirror'}
      theme="none"
      value={value}
      height="100%"
      extensions={extensions}
      onCreateEditor={(view) => syncHighlights(view)}
      onUpdate={(update) => {
        if (update.docChanged) syncHighlights(update.view);
      }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        bracketMatching: true,
        syntaxHighlighting: true,
      }}
    />
  );
}
