'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder, type SelectionRange } from '@codemirror/state';
import type { SourceRange } from '@/types/transpile';
import type { CodeHighlightRange, GeneratedCodeViewProps } from './types';
import { getCodeMirrorExtensions } from '@/lib/codeEditorLanguages';
import { vvsCodeMirrorTheme } from './codeMirrorTheme';

const setHighlightEffect = StateEffect.define<DecorationSet>();

type ScrollStrategy = 'nearest' | 'start' | 'end' | 'center';

/**
 * Replace CodeMirror's instant scrollIntoView jump with smooth scrolling.
 * Returns true so the default jump path is skipped.
 */
function smoothScrollIntoView(
  view: EditorView,
  range: SelectionRange,
  options: { x: ScrollStrategy; y: ScrollStrategy; xMargin: number; yMargin: number }
): boolean {
  const scroller = view.scrollDOM;
  const block = view.lineBlockAt(range.head);
  const viewHeight = scroller.clientHeight;
  const maxTop = Math.max(0, scroller.scrollHeight - viewHeight);
  let targetTop = scroller.scrollTop;

  if (options.y === 'center') {
    targetTop = block.top + block.height / 2 - viewHeight / 2;
  } else if (options.y === 'start') {
    targetTop = block.top - options.yMargin;
  } else if (options.y === 'end') {
    targetTop = block.bottom - viewHeight + options.yMargin;
  } else {
    const visibleTop = scroller.scrollTop;
    const visibleBottom = visibleTop + viewHeight;
    if (block.top < visibleTop + options.yMargin) {
      targetTop = block.top - options.yMargin;
    } else if (block.bottom > visibleBottom - options.yMargin) {
      targetTop = block.bottom - viewHeight + options.yMargin;
    } else {
      return true;
    }
  }

  targetTop = Math.max(0, Math.min(targetTop, maxTop));
  if (Math.abs(targetTop - scroller.scrollTop) < 1) return true;

  const preferReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  scroller.scrollTo({
    top: targetTop,
    behavior: preferReducedMotion ? 'auto' : 'smooth',
  });
  return true;
}

const smoothScrollHandler = EditorView.scrollHandler.of(smoothScrollIntoView);

function selectionFromView(
  view: EditorView
): { startLine: number; startCol: number; endLine: number; endCol: number } | null {
  const { main } = view.state.selection;
  if (main.empty) return null;
  const start = main.from < main.to ? main.from : main.to;
  const end = main.from < main.to ? main.to : main.from;
  const startLine = view.state.doc.lineAt(start);
  const endLine = view.state.doc.lineAt(end);
  return {
    startLine: startLine.number,
    startCol: start - startLine.from + 1,
    endLine: endLine.number,
    endCol: end - endLine.from + 1,
  };
}

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
  ranges: CodeHighlightRange[] | undefined
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
      if (range.colors) {
        entries.push({
          from: line.from,
          to: line.from,
          deco: Decoration.line({
            attributes: {
              style: `background-color: ${range.colors.lineBg}; box-shadow: inset 2px 0 0 ${range.colors.accent};`,
            },
          }),
        });
      } else {
        entries.push({
          from: line.from,
          to: line.from,
          deco: Decoration.line({ class: 'cm-vvs-node-highlight' }),
        });
      }
    } else if (range.colors) {
      entries.push({
        from: extents.from,
        to: extents.to,
        deco: Decoration.mark({
          attributes: {
            style: `background-color: ${range.colors.markBg}; border-radius: 2px; box-shadow: inset 0 -1px 0 ${range.colors.accent};`,
          },
        }),
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
  ranges: CodeHighlightRange[] | undefined
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
  onReverseSelectLine,
  onHoverSourceLocation,
  onHoverSourceLeave,
  onSelectionRangeChange,
}: GeneratedCodeViewProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const highlightRangesRef = useRef(highlightRanges);
  const onReverseSelectLineRef = useRef(onReverseSelectLine);
  const onHoverSourceLocationRef = useRef(onHoverSourceLocation);
  const onHoverSourceLeaveRef = useRef(onHoverSourceLeave);
  const onSelectionRangeChangeRef = useRef(onSelectionRangeChange);
  const hoverRafRef = useRef<number | null>(null);
  // True while an active text selection exists — used to suspend hover ringing so a
  // drag through the code panel doesn't ring every node the cursor passes over.
  const hasSelectionRef = useRef(false);
  React.useLayoutEffect(() => {
    highlightRangesRef.current = highlightRanges;
    onReverseSelectLineRef.current = onReverseSelectLine;
    onHoverSourceLocationRef.current = onHoverSourceLocation;
    onHoverSourceLeaveRef.current = onHoverSourceLeave;
    onSelectionRangeChangeRef.current = onSelectionRangeChange;
  });

  useEffect(() => {
    return () => {
      if (hoverRafRef.current != null) cancelAnimationFrame(hoverRafRef.current);
      onHoverSourceLeaveRef.current?.();
    };
  }, []);

  const extensions = useMemo(
    () => [
      ...getCodeMirrorExtensions(language, readOnly),
      ...vvsCodeMirrorTheme(),
      highlightField,
      smoothScrollHandler,
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet) return;
        hasSelectionRef.current = Boolean(selectionFromView(update.view));
      }),
      EditorView.domEventHandlers({
        dblclick(event, view) {
          const handler = onReverseSelectLineRef.current;
          if (!handler) return false;
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos == null) return false;
          const line = view.state.doc.lineAt(pos);
          const col = pos - line.from + 1;
          handler(line.number, col);
          return true;
        },
        mouseup(_event, view) {
          // Fire selection callback once on drag end, not on every intermediate
          // cursor position. This gives the parent the final drag extent.
          const sel = selectionFromView(view);
          hasSelectionRef.current = Boolean(sel);
          onSelectionRangeChangeRef.current?.(sel);
          return false;
        },
        mousemove(event, view) {
          const handler = onHoverSourceLocationRef.current;
          if (!handler) return false;
          // Suspend hover while a drag selection is active so the yellow ring
          // follows the user's selection (canvas multi-select) instead of the
          // cursor passing through every line of generated text.
          if (hasSelectionRef.current) {
            if (hoverRafRef.current != null) {
              cancelAnimationFrame(hoverRafRef.current);
              hoverRafRef.current = null;
            }
            return false;
          }
          if (hoverRafRef.current != null) cancelAnimationFrame(hoverRafRef.current);
          const { clientX, clientY } = event;
          hoverRafRef.current = requestAnimationFrame(() => {
            hoverRafRef.current = null;
            const pos = view.posAtCoords({ x: clientX, y: clientY });
            if (pos == null) {
              onHoverSourceLeaveRef.current?.();
              return;
            }
            const line = view.state.doc.lineAt(pos);
            const col = pos - line.from + 1;
            handler(line.number, col);
          });
          return false;
        },
        mouseleave() {
          if (hoverRafRef.current != null) {
            cancelAnimationFrame(hoverRafRef.current);
            hoverRafRef.current = null;
          }
          onHoverSourceLeaveRef.current?.();
          return false;
        },
      }),
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
