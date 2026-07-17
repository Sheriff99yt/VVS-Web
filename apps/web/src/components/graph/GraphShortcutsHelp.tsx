'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Focus,
  GitBranch,
  LayoutTemplate,
  Map,
  MessageSquare,
  MousePointerClick,
  Save,
  Search,
  Terminal,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  getShortcutDef,
  isMacPlatform,
  shortcutKeys,
  shortcutTitle,
  type GraphShortcutId,
} from '@/lib/graphShortcuts';
import { useUiPreference } from '@/hooks/useUiPreference';
import { Tooltip } from '@/components/ui/Tooltip';

interface GraphShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VisualAction = {
  id: GraphShortcutId;
  icon: LucideIcon;
  label: string;
};

const PAGE_COUNT = 3;
const EXIT_MS = 200;

const ESSENTIALS: VisualAction[] = [
  { id: 'spawn-menu', icon: MousePointerClick, label: 'Spawn' },
  { id: 'node-search', icon: Search, label: 'Search' },
  { id: 'focus-selection', icon: Focus, label: 'Frame' },
  { id: 'select-chain-downstream', icon: GitBranch, label: 'Chain' },
  { id: 'layout-selected-chains', icon: LayoutTemplate, label: 'Layout' },
  { id: 'toggle-minimap', icon: Map, label: 'Cycle map' },
  { id: 'undo', icon: Undo2, label: 'Undo' },
  { id: 'delete', icon: Trash2, label: 'Delete' },
  { id: 'group-comment', icon: MessageSquare, label: 'Comment' },
  { id: 'compile', icon: Code2, label: 'Generate' },
  { id: 'save-project', icon: Save, label: 'Save' },
  { id: 'toggle-log-pin', icon: Terminal, label: 'Log' },
];

const PAGE_META = [
  { title: 'Welcome', subtitle: 'Graph → code' },
  { title: 'Tidy chains', subtitle: 'Double-tap S' },
  { title: 'Shortcuts', subtitle: 'Essentials' },
] as const;

function keysFor(id: GraphShortcutId): string {
  const def = getShortcutDef(id);
  if (!def?.keysWin) return '';
  return isMacPlatform() ? (def.keysMac ?? def.keysWin.replace(/Ctrl\+/g, '⌘')) : def.keysWin;
}

function ShortcutRow({ action }: { action: VisualAction }) {
  const Icon = action.icon;
  const keys = keysFor(action.id);
  if (!keys) return null;
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
      <Icon size={15} className="text-zinc-500 shrink-0" strokeWidth={1.75} />
      <span className="text-sm text-zinc-300 flex-1 min-w-0">{action.label}</span>
      <kbd className="shrink-0 font-mono text-xs text-zinc-200 bg-zinc-950 border border-zinc-700 rounded px-2 py-1">
        {keys}
      </kbd>
    </div>
  );
}

function SsIntroDemo() {
  return (
    <div className="relative w-full h-[220px] rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden">
      <style>{`
        @keyframes vvs-ss-n1 {
          0%, 16% { transform: translate(28px, 100px); }
          42%, 100% { transform: translate(36px, 88px); }
        }
        @keyframes vvs-ss-n2 {
          0%, 16% { transform: translate(180px, 44px); }
          42%, 100% { transform: translate(156px, 88px); }
        }
        @keyframes vvs-ss-n3 {
          0%, 16% { transform: translate(100px, 140px); }
          42%, 100% { transform: translate(276px, 88px); }
        }
        @keyframes vvs-ss-n4 {
          0%, 16% { transform: translate(300px, 64px); }
          42%, 100% { transform: translate(396px, 88px); }
        }
        @keyframes vvs-ss-a1 {
          0%, 40% { opacity: 0.25; transform: translate(176px, 128px) scale(0.9); }
          58%, 100% { opacity: 1; transform: translate(168px, 36px) scale(1); }
        }
        @keyframes vvs-ss-a2 {
          0%, 40% { opacity: 0.25; transform: translate(300px, 148px) scale(0.9); }
          58%, 100% { opacity: 1; transform: translate(288px, 36px) scale(1); }
        }
        @keyframes vvs-ss-sel {
          0%, 10% { border-color: rgb(63 63 70); box-shadow: none; }
          18%, 100% { border-color: rgb(129 140 248); box-shadow: 0 0 0 1px rgba(129,140,248,0.25); }
        }
        @keyframes vvs-ss-key1 {
          0%, 8% { border-color: rgb(63 63 70); color: rgb(113 113 122); background: rgb(24 24 27); }
          10%, 20% { border-color: rgb(129 140 248); color: rgb(228 228 231); background: rgb(39 39 42); }
          26%, 100% { border-color: rgb(63 63 70); color: rgb(113 113 122); background: rgb(24 24 27); }
        }
        @keyframes vvs-ss-key2 {
          0%, 30% { border-color: rgb(63 63 70); color: rgb(113 113 122); background: rgb(24 24 27); }
          32%, 48% { border-color: rgb(129 140 248); color: rgb(228 228 231); background: rgb(39 39 42); }
          54%, 100% { border-color: rgb(63 63 70); color: rgb(113 113 122); background: rgb(24 24 27); }
        }
        @keyframes vvs-ss-step {
          0%, 9% { opacity: 1; }
          10%, 100% { opacity: 0; }
        }
        @keyframes vvs-ss-step2 {
          0%, 9% { opacity: 0; }
          10%, 31% { opacity: 1; }
          32%, 100% { opacity: 0; }
        }
        @keyframes vvs-ss-step3 {
          0%, 31% { opacity: 0; }
          32%, 100% { opacity: 1; }
        }
        .vvs-ss-node {
          position: absolute;
          width: 88px;
          height: 34px;
          border-radius: 6px;
          background: rgb(24 24 27);
          border: 1px solid rgb(63 63 70);
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-size: 11px;
          color: rgb(212 212 216);
          animation: vvs-ss-n1 5.5s ease-in-out infinite, vvs-ss-sel 5.5s ease-in-out infinite;
        }
        .vvs-ss-node::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 1px;
          background: rgb(251 191 36);
          margin-right: 8px;
          flex-shrink: 0;
        }
        .vvs-ss-node-2 { animation-name: vvs-ss-n2, vvs-ss-sel; }
        .vvs-ss-node-3 { animation-name: vvs-ss-n3, vvs-ss-sel; }
        .vvs-ss-node-4 { animation-name: vvs-ss-n4, vvs-ss-sel; }
        .vvs-ss-attr {
          position: absolute;
          width: 56px;
          height: 24px;
          border-radius: 4px;
          background: rgb(39 39 42);
          border: 1px solid rgb(82 82 91);
          font-size: 10px;
          color: rgb(161 161 170);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: vvs-ss-a1 5.5s ease-in-out infinite;
        }
        .vvs-ss-attr-2 { animation-name: vvs-ss-a2; }
        .vvs-ss-key {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.6rem;
          height: 1.5rem;
          padding: 0 0.45rem;
          border-radius: 0.25rem;
          border: 1px solid rgb(63 63 70);
          background: rgb(24 24 27);
          font-family: ui-monospace, monospace;
          font-size: 12px;
        }
        .vvs-ss-key-1 { animation: vvs-ss-key1 5.5s ease-in-out infinite; }
        .vvs-ss-key-2 { animation: vvs-ss-key2 5.5s ease-in-out infinite; }
        .vvs-ss-step-a { animation: vvs-ss-step 5.5s ease-in-out infinite; }
        .vvs-ss-step-b { animation: vvs-ss-step2 5.5s ease-in-out infinite; }
        .vvs-ss-step-c { animation: vvs-ss-step3 5.5s ease-in-out infinite; }
      `}</style>

      <div className="vvs-ss-node">Boot</div>
      <div className="vvs-ss-node vvs-ss-node-2">Check</div>
      <div className="vvs-ss-node vvs-ss-node-3">Set</div>
      <div className="vvs-ss-node vvs-ss-node-4">Done</div>
      <div className="vvs-ss-attr">Get</div>
      <div className="vvs-ss-attr vvs-ss-attr-2">Lit</div>

      <div className="absolute top-3 left-3 right-3 h-5 text-xs text-zinc-500">
        <span className="absolute vvs-ss-step-a">Messy chain</span>
        <span className="absolute vvs-ss-step-b">S · select downstream</span>
        <span className="absolute vvs-ss-step-c">S S · layout</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs text-zinc-500">
        <span className="vvs-ss-key vvs-ss-key-1">S</span>
        <span className="text-zinc-700">→</span>
        <span className="vvs-ss-key vvs-ss-key-2">S</span>
        <span className="ml-1 text-zinc-500">again to tidy</span>
      </div>
    </div>
  );
}

function PageWelcome() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-300 leading-relaxed">
        Build on the graph. Generate writes real source — what you wire is what you get.
      </p>
      <ul className="space-y-2.5 text-sm text-zinc-400">
        <li className="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 px-3.5 py-3">
          <MousePointerClick size={16} className="mt-0.5 text-zinc-500 shrink-0" />
          <span>Right-click the canvas to spawn nodes</span>
        </li>
        <li className="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 px-3.5 py-3">
          <GitBranch size={16} className="mt-0.5 text-zinc-500 shrink-0" />
          <span>Drag symbols from the project tree onto the graph</span>
        </li>
        <li className="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 px-3.5 py-3">
          <Code2 size={16} className="mt-0.5 text-zinc-500 shrink-0" />
          <span>Use the Code panel to verify Generate output</span>
        </li>
      </ul>
    </div>
  );
}

function PageSs() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-300 leading-relaxed">
        Select a node, press{' '}
        <kbd className="font-mono text-xs text-zinc-100 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5">
          S
        </kbd>{' '}
        to grab the chain, then tap{' '}
        <kbd className="font-mono text-xs text-zinc-100 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5">
          S
        </kbd>{' '}
        again to lay it out.
      </p>
      <SsIntroDemo />
      <p className="text-xs text-zinc-500">
        Tip: <kbd className="font-mono text-zinc-400">A</kbd> selects the full chain both ways.
      </p>
    </div>
  );
}

function PageShortcuts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {ESSENTIALS.map((action) => (
        <ShortcutRow key={action.id} action={action} />
      ))}
    </div>
  );
}

/**
 * Canvas help button + padded rounded intro (3 pages).
 * Enter/exit + page transitions; details-panel chrome.
 */
export function GraphShortcutsHelp({ open, onOpenChange }: GraphShortcutsHelpProps) {
  const [welcomeDismissed, setWelcomeDismissed] = useUiPreference('canvasWelcomeDismissed');
  const autoOpenedRef = useRef(false);
  const wasOpenRef = useRef(open);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (autoOpenedRef.current || welcomeDismissed) return;
    autoOpenedRef.current = true;
    onOpenChange(true);
  }, [welcomeDismissed, onOpenChange]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      setWelcomeDismissed(true);
    }
    wasOpenRef.current = open;
  }, [open, setWelcomeDismissed]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setPage(0);
      setPageKey(0);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    const t = window.setTimeout(() => setVisible(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const close = () => onOpenChange(false);
  const toggle = () => (open ? close() : onOpenChange(true));

  const goPage = (next: number) => {
    setPage(next);
    setPageKey((k) => k + 1);
  };

  const isLast = page >= PAGE_COUNT - 1;
  const meta = PAGE_META[page] ?? PAGE_META[0];

  const overlay =
    visible && mounted
      ? createPortal(
          <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8 transition-opacity duration-200 ease-out ${
              entered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundColor: entered ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)' }}
            role="presentation"
            onClick={close}
          >
            <style>{`
              @keyframes vvs-help-panel-in {
                from { opacity: 0; transform: translateY(10px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes vvs-help-page-in {
                from { opacity: 0; transform: translateX(12px); }
                to { opacity: 1; transform: translateX(0); }
              }
              .vvs-help-panel-enter {
                animation: vvs-help-panel-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
              }
              .vvs-help-page-enter {
                animation: vvs-help-page-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
              }
            `}</style>
            <div
              className={`w-full max-w-2xl max-h-[min(42rem,calc(100vh-3rem))] flex flex-col bg-zinc-950/96 border border-zinc-800 rounded-md overflow-hidden shadow-lg shadow-black/30 transition-[opacity,transform] duration-200 ease-out ${
                entered
                  ? 'opacity-100 translate-y-0 scale-100 vvs-help-panel-enter'
                  : 'opacity-0 translate-y-2 scale-[0.97]'
              }`}
              role="dialog"
              aria-labelledby="graph-help-title"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-zinc-800/80 shrink-0">
                <span className="text-zinc-500 shrink-0">
                  <CircleHelp size={14} />
                </span>
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span
                    id="graph-help-title"
                    className="text-sm font-medium text-zinc-200 truncate leading-tight"
                  >
                    {meta.title}
                  </span>
                  <span className="text-xs text-zinc-500 truncate leading-tight">{meta.subtitle}</span>
                </div>
                <span className="text-xs font-mono text-zinc-600 tabular-nums shrink-0">
                  {page + 1}/{PAGE_COUNT}
                </span>
                <Tooltip content={`Close (${shortcutKeys('help')} or Esc)`} placement="bottom">
                  <button
                    type="button"
                    onClick={close}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </Tooltip>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
                <div key={pageKey} className="vvs-help-page-enter">
                  {page === 0 ? <PageWelcome /> : null}
                  {page === 1 ? <PageSs /> : null}
                  {page === 2 ? <PageShortcuts /> : null}
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-800/80 px-3 py-2.5 flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  {Array.from({ length: PAGE_COUNT }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goPage(i)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === page ? 'w-5 bg-zinc-300' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      aria-label={`Page ${i + 1}`}
                      aria-current={i === page ? 'step' : undefined}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-zinc-400 border border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
                {isLast ? (
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-zinc-100 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goPage(Math.min(PAGE_COUNT - 1, page + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-zinc-100 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="absolute top-3 left-3 z-30">
        <Tooltip content={shortcutTitle('help')} placement="bottom">
          <button
            type="button"
            onClick={toggle}
            className={`w-8 h-8 inline-flex items-center justify-center border rounded-md transition-colors ${
              open
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-zinc-950/90 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            aria-label="Canvas help"
            aria-expanded={open}
          >
            <CircleHelp size={14} />
          </button>
        </Tooltip>
      </div>
      {overlay}
    </>
  );
}
