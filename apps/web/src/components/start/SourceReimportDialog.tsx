'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProjectSnapshot } from '@vvs/graph-types';
import { SourceImportWorkerClient, type ImportWorkerPort } from '@/lib/sourceImportWorkerClient';
import type { WorkerReimportReview } from '@/lib/sourceImportWorkerProtocol';

const BUTTON = 'rounded border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-40';

export default function SourceReimportDialog({ getSnapshot, onAccept, onClose }: {
  getSnapshot: () => ProjectSnapshot | null; onAccept: (snapshot: ProjectSnapshot) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const client = useRef<SourceImportWorkerClient | null>(null);
  const [original] = useState(() => {
    const snapshot = getSnapshot();
    return snapshot && Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.sourceImport)?.data.properties?.sourceImport as { source?: string; fileName?: string } | undefined;
  });
  const [source, setSource] = useState(original?.source ?? '');
  const [fileName, setFileName] = useState(original?.fileName ?? '');
  const [review, setReview] = useState<WorkerReimportReview | null>(null);
  const [resolution, setResolution] = useState<'keep-graph' | 'use-source' | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
    return () => client.current?.cancel();
  }, []);
  const getClient = () => client.current ??= new SourceImportWorkerClient(() => new Worker(new URL('../../lib/sourceImportWorker.ts', import.meta.url), { type: 'module' }) as unknown as ImportWorkerPort);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="source-reimport-title" className="m-auto w-[min(1200px,95vw)] max-h-[92vh] overflow-y-auto rounded border border-zinc-700 bg-zinc-950 p-5 text-zinc-200 backdrop:bg-black/70">
    <div className="flex justify-between"><h2 id="source-reimport-title" className="text-lg">Review source re-import</h2><button className={BUTTON} onClick={onClose}>Close</button></div>
    <p className="my-3 text-sm text-zinc-400">Compare one imported file with its original source and current graph. Source and graph edits are reviewed before replacement.</p>
    <label className="block text-sm">Imported file <input className="ml-2 bg-zinc-900 border border-zinc-700 p-1" value={fileName} disabled={busy} onChange={event => { setFileName(event.target.value); setReview(null); }} /></label>
    <label className={`${BUTTON} inline-block my-2`}>Choose updated source<input type="file" accept=".js,.mjs,.py,.go,.cs" className="sr-only" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      if (file.size > 128 * 1024) { setError('Choose a source file of at most 128 KiB.'); return; }
      setBusy(true); setReview(null);
      try { setSource(await file.text()); setFileName(file.name); setError(''); } catch (error) { setError(String(error)); } finally { setBusy(false); }
    }} /></label>
    <label className="block text-sm" htmlFor="reimport-source">Updated source</label>
    <textarea id="reimport-source" className="w-full h-40 bg-zinc-900 border border-zinc-700 p-2 font-mono text-xs" value={source} disabled={busy} spellCheck={false} onChange={event => { client.current?.cancel(); setSource(event.target.value); setReview(null); setResolution(''); }} />
    <button className={`${BUTTON} mt-2`} disabled={busy || !source || !fileName} onClick={async () => {
      const snapshot = getSnapshot(); if (!snapshot) return;
      setBusy(true); setError(''); setResolution('');
      try { setReview(await getClient().reviewReimport(snapshot, source, fileName)); } catch (error) { setError(String(error)); } finally { setBusy(false); }
    }}>{busy ? 'Comparing…' : 'Compare source and graph'}</button>
    {error && <p role="alert" className="text-red-300 text-sm my-2">{error}</p>}
    {review && <>
      {review.diagnostics.map(message => <p role="alert" key={message} className="text-red-300 text-sm my-2">{message}</p>)}
      {!review.diagnostics.length && <>
        <div className="grid md:grid-cols-3 gap-3 my-3">{[['Imported baseline', review.baseline], ['Current graph', review.current], ['Updated source', review.incoming]].map(([title, code]) => <div key={title}><h3 className="text-sm mb-1">{title}</h3><pre className="max-h-64 overflow-auto bg-zinc-900 p-2 text-xs">{code}</pre></div>)}</div>
        {review.conflicts.length > 0 && <div className="text-sm border border-amber-700 p-3 my-2">{review.conflicts.map(conflict => <p key={conflict}>{conflict}</p>)}<label className="block mt-2">Resolve this file <select value={resolution} className="ml-2 bg-zinc-900 border border-zinc-700 p-1" onChange={event => setResolution(event.target.value as typeof resolution)}><option value="">Choose a reviewed version</option><option value="keep-graph">Keep current graph edits</option><option value="use-source">Replace with updated source</option></select></label></div>}
        <button className={`${BUTTON} border-blue-500`} disabled={busy || (review.conflicts.length > 0 && !resolution)} onClick={async () => {
          const snapshot = getSnapshot(); if (!snapshot) return;
          setBusy(true); setError('');
          try { onAccept(await getClient().acceptReimport(review, snapshot, source, resolution || undefined)); } catch (error) { setError(String(error)); } finally { setBusy(false); }
        }}>Apply reviewed re-import</button>
      </>}
    </>}
  </dialog>;
}
