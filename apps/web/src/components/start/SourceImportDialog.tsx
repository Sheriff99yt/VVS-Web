'use client';

import { useEffect, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ProjectSnapshot } from '@vvs/graph-types';
import type { SourceImportPreview } from '@/lib/sourceImportPreview';
import { MAX_SOURCE_IMPORT_BYTES } from '@/lib/sourceImportGraph';
import { SourceImportWorkerClient, type ImportWorkerPort } from '@/lib/sourceImportWorkerClient';
import type { WorkerGraphReview } from '@/lib/sourceImportWorkerProtocol';

const EXAMPLE = `class Calculator {
    on_start() { return 0; }
    calculate() { return (2 + 3) * 4; }
    choose(a, b) {
        if (true) { return a; } else { return b; }
    }
}`;
const BUTTON = 'rounded border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed';

export default function SourceImportDialog({ onClose, onAccept }: {
  onClose: () => void;
  onAccept: (snapshot: ProjectSnapshot) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('pasted.js');
  const [preview, setPreview] = useState<SourceImportPreview | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [mapStart, setMapStart] = useState(false);
  const [entryPolicy, setEntryPolicy] = useState<'program' | 'library'>('program');
  const [review, setReview] = useState<WorkerGraphReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [graphId, setGraphId] = useState('');
  const client = useRef<SourceImportWorkerClient | null>(null);
  const getClient = () => {
    if (!client.current) client.current = new SourceImportWorkerClient(() => new Worker(new URL('../../lib/sourceImportWorker.ts', import.meta.url), { type: 'module' }) as unknown as ImportWorkerPort);
    return client.current;
  };
  useEffect(() => { dialog.current?.showModal(); return () => client.current?.cancel(); }, []);
  const reset = (text: string, name: string) => {
    client.current?.cancel();
    setSource(text); setFileName(name); setPreview(null); setSelected(null); setReview(null); setMapStart(false); setEntryPolicy('program'); setError('');
  };
  const analyze = async () => {
    setBusy(true); setReview(null); setError('');
    try {
      if (new TextEncoder().encode(source).length > MAX_SOURCE_IMPORT_BYTES) throw new Error('Choose a source file of at most 128 KiB.');
      const next = await getClient().preview(source);
      setPreview(next);
      setSelected(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const convert = async () => {
    if (!preview || selected === null) return;
    setBusy(true); setReview(null); setError('');
    try {
      const next = await getClient().review(source, selected, fileName, mapStart, entryPolicy);
      setReview(next); setGraphId(next.snapshot?.activeGraphTab ?? '');
    } catch (err) { setError(err instanceof Error ? err.message : 'Import review failed.'); }
    finally { setBusy(false); }
  };
  const chosen = selected !== null ? preview?.regions[selected] : undefined;
  const doc = review?.snapshot?.documents[graphId];
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="source-import-title"
      className="m-auto w-[min(1100px,95vw)] max-h-[92vh] overflow-y-auto rounded border border-zinc-700 bg-zinc-950 p-5 text-zinc-200 backdrop:bg-black/70">
      <div className="flex items-center justify-between gap-4">
        <h2 id="source-import-title" className="text-lg font-semibold">Import JavaScript source</h2>
        <button type="button" onClick={onClose} className={BUTTON}>Close</button>
      </div>
      <p className="my-3 text-sm text-zinc-400">Create a new project from one supported class or standalone function. Review the source, graph and generated code before accepting. Parsing stays in your browser.</p>
      <details className="mb-3 text-sm text-zinc-400">
        <summary className="cursor-pointer">Supported subset and source preservation</summary>
        <p className="mt-2">Named synchronous standalone functions in Library mode, or plain named classes with ordinary or static methods, named parameters, literals, arithmetic with provably numeric literal operands, and terminal return or if/else with Boolean literal conditions. Program units require explicit mapping of an existing on_start method; library units retain ordinary methods without requiring an entry. Dynamic arithmetic and truthiness need explicit JavaScript semantics and are blocked. Calls, locals, receiver access, inheritance, exports and embedded comments are blocked. Standalone functions require Library mode and retain file scope without a class or entry. The full original file and its hash are retained on the imported class or function declaration. Source outside the selected declaration is preserved there and is excluded from generated output.</p>
        <p className="mt-2">Formatting, quote style, parentheses and empty semicolons may be normalized. All other syntax structure must match. Limits: 128 KiB, 32 methods, 512 nodes and bounded AST depth/analysis time. This is a one-time import; later source edits are not synchronized.</p>
      </details>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <label className={BUTTON}>Choose .js file
          <input className="sr-only" type="file" accept=".js,.mjs,.cjs" disabled={busy} onChange={async e => {
            const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
            if (file.size > MAX_SOURCE_IMPORT_BYTES) { setError('Choose a source file of at most 128 KiB.'); return; }
            setBusy(true);
            try { reset(await file.text(), file.name); }
            catch (err) { setError(err instanceof Error ? err.message : 'Could not read file.'); }
            finally { setBusy(false); }
          }} />
        </label>
        <button type="button" disabled={busy} className={BUTTON} onClick={() => reset(EXAMPLE, 'example.js')}>Use example</button>
        <span className="text-xs text-zinc-500">{fileName}</span>
      </div>
      <label className="text-sm" htmlFor="import-source">Original source</label>
      <textarea id="import-source" value={source} disabled={busy} onChange={e => reset(e.target.value, 'pasted.js')}
        spellCheck={false} className="mt-1 w-full h-44 rounded border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs" />
      <button type="button" onClick={() => void analyze()} disabled={busy || !source.trim()} className={`${BUTTON} mt-2`}>{busy ? 'Reading source…' : 'Analyze source'}</button>
      {busy && <button type="button" className={`${BUTTON} ml-2`} onClick={() => { client.current?.cancel(); setBusy(false); setReview(null); setError('Import cancelled.'); }}>Cancel import</button>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {preview && <div className="mt-4 space-y-3">
        {preview.diagnostics.map((message, i) => <p role="alert" className="text-sm text-red-300" key={i}>{message}</p>)}
        <h3 className="text-sm font-semibold">Source ranges</h3>
        <div className="max-h-44 overflow-y-auto space-y-1">
          {preview.regions.map((region, i) => <button type="button" key={i} disabled={busy} onClick={() => { setSelected(i); setReview(null); setMapStart(false); }}
            className={`w-full rounded border px-3 py-2 text-left text-xs ${selected === i ? 'border-blue-400' : 'border-zinc-800'} hover:bg-zinc-900`}>
            <span className="font-semibold">{region.kind === 'candidate' ? 'Mapping candidate' : region.kind === 'trivia' ? 'Whitespace' : 'Preserved outside graph'}</span>
            {' · '}line {preview.source.slice(0, region.start).split('\n').length} · offsets {region.start}–{region.end}
            <span className="block text-zinc-400">{region.reason ?? region.proposedKind ?? ''}</span>
          </button>)}
        </div>
        {chosen && <>
          <details><summary className="cursor-pointer text-sm">Selected original region</summary><pre className="mt-2 max-h-48 overflow-auto bg-zinc-900 p-3 text-xs">{chosen.text}</pre></details>
          {chosen.kind === 'candidate' && <>
            <label className="block text-sm">Compilation unit
              <select className="ml-2 bg-zinc-900 border border-zinc-700 p-1" disabled={busy} value={entryPolicy} onChange={e => { setEntryPolicy(e.target.value as 'program' | 'library'); setMapStart(false); setReview(null); }}>
                <option value="program">Program — explicit existing entry</option><option value="library">Library — functions or methods, no required entry</option>
              </select>
            </label>
            {chosen.proposedKind === 'standalone-function' && <p className="text-xs text-zinc-400">Choose Library to preserve this standalone function at file scope.</p>}
            {entryPolicy === 'program' && <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy} checked={mapStart} onChange={e => { setMapStart(e.target.checked); setReview(null); }} />Map the existing on_start method to the VVS program entry event</label>}
            <button type="button" className={BUTTON} disabled={busy} onClick={() => void convert()}>Build and validate preview</button>
          </>}
        </>}
        {review && <>
          {review.diagnostics.map((message, i) => <p key={i} role="alert" className="whitespace-pre-wrap text-sm text-red-300">{message}</p>)}
          {review.snapshot && <>
            <h3 className="text-sm font-semibold">Graph preview · {review.nodeCount} nodes</h3>
            <label className="text-sm">Graph <select className="ml-2 bg-zinc-900 border border-zinc-700 p-1" value={graphId} onChange={e => setGraphId(e.target.value)}>
              {review.snapshot.openTabs.map(tab => <option key={tab.id} value={tab.id}>{tab.name}</option>)}
            </select></label>
            <div className="h-72 border border-zinc-700 rounded" aria-label="Read-only imported graph">
              <ReactFlowProvider key={graphId}><ReactFlow fitView nodesDraggable={false} nodesConnectable={false} colorMode="dark"
                nodes={(doc?.nodes ?? []).map(node => ({ id: node.id, position: node.position, data: { label: node.data.label }, style: { background: '#18181b', color: '#e4e4e7', border: `1px solid ${node.data.category === 'Math' ? '#eab308' : '#60a5fa'}` } }))}
                edges={(doc?.edges ?? []).map(edge => ({ id: edge.id, source: edge.source, target: edge.target, style: { stroke: edge.data?.pinType === 'execution' ? '#60a5fa' : '#eab308', strokeDasharray: edge.data?.pinType === 'execution' ? undefined : '4 3' } }))}>
                <Background /><Controls showInteractive={false} />
              </ReactFlow></ReactFlowProvider>
            </div>
          </>}
          {review.generated && <div className="grid md:grid-cols-2 gap-3">
            <div><h3 className="text-sm mb-1">Selected source</h3><pre className="max-h-72 overflow-auto bg-zinc-900 p-3 text-xs">{chosen?.text}</pre></div>
            <div><h3 className="text-sm mb-1">Generated code</h3><pre className="max-h-72 overflow-auto bg-zinc-900 p-3 text-xs">{review.generated}</pre></div>
          </div>}
          {review.snapshot && <button type="button" className={`${BUTTON} border-blue-500`} disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              const accepted = await getClient().accept(review, source, fileName, mapStart, entryPolicy);
              if (dialog.current?.open) onAccept(accepted);
            } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the imported project.'); }
            finally { setBusy(false); }
          }}>Accept as new project</button>}
        </>}
      </div>}
    </dialog>
  );
}
