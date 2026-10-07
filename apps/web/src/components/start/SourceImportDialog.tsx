'use client';

import { useEffect, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ProjectSnapshot } from '@vvs/graph-types';
import type { SourceImportPreview } from '@/lib/sourceImportPreview';
import { MAX_SOURCE_IMPORT_BYTES } from '@/lib/sourceImportGraph';
import { SourceImportWorkerClient, type ImportWorkerPort } from '@/lib/sourceImportWorkerClient';
import type { WorkerGraphReview, SourceAnalysisLanguage } from '@/lib/sourceImportWorkerProtocol';
import type { CSharpSourceInventory } from '@vvs/source-import';
import type { SourceFileInput } from '@vvs/source-import/validation';

const EXAMPLE = `class Calculator {
    on_start() { return 0; }
    calculate() { return (2 + 3) * 4; }
    choose(a, b) {
        if (true) { return a; } else { return b; }
    }
}`;
const PIPELINE_EXAMPLE = `function identity(value) { return value; }
function pipeline(value) {
    const copy = identity(value);
    identity(copy);
    return identity(copy);
}`;
const PYTHON_PIPELINE_EXAMPLE = `def identity(value):
    return value

def pipeline(value):
    copy = identity(value)
    identity(copy)
    return identity(copy)
`;
const BUTTON = 'rounded border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed';
const CSHARP_EXAMPLE = `public class Calculator {
    public static int Add(byte Left, byte Right) => checked(Left + Right);
    public static byte Narrow(long Value) => unchecked((byte)Value);
    public static int Minimum() => -2147483648;
    public static void Done() { return; }
}`;
const CSHARP_PIPELINE = `namespace Samples;
public static class Pipeline {
    public static int Scale(byte value) => value * 2;
    public static int Run(byte value) { var copy = Scale(value); return copy; }
}`;
const CSHARP_CONTROL_FLOW = `namespace Samples;
public static class Scanner {
    public static int Sum(int limit) {
        var total = 0;
        for (var index = 0; index < limit; index++) {
            if (index == 2) continue;
            total += index;
        }
        return total;
    }
}`;
const extension = (language: SourceAnalysisLanguage) => ({ javascript: 'js', python: 'py', go: 'go', csharp: 'cs', cpp: 'cpp', rust: 'rs', gdscript: 'gd' })[language];
const NATIVE_EXAMPLES = { cpp: 'int Value(const int value) { return value; }\nconstexpr int value() { return -(-5); }\nbool comparison() { return (2 < 3); }\nvoid empty() { return; }\n', rust: 'fn Value(value: i32) -> i32 { value }\nconst fn value() -> i32 { -(-5) }\nfn comparison() -> bool { return 2 < 3; }\nfn empty() -> () { return; }\n', gdscript: 'func Value(value: int) -> int:\n    return value\nfunc value() -> int:\n    return -(-5)\nfunc comparison() -> bool:\n    return not false\nfunc empty() -> void:\n    return\n' };
const CONTROL_FLOW_EXAMPLE = `function identity(value) { return value; }
function sum(input) {
    const limit = Number(input);
    let total = 0;
    for (let index = 0; index < limit; index++) {
        if (index === 2) { return identity(total); }
        total += index;
    }
    return identity(total);
}`;
const PYTHON_CONTROL_FLOW_EXAMPLE = `def stop():
    value = 1
    while value < 3:
        if value == 1:
            value = 3
        else:
            return value
    return value
`;

export default function SourceImportDialog({ onClose, onAccept }: {
  onClose: () => void;
  onAccept: (snapshot: ProjectSnapshot) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [language, setLanguage] = useState<SourceAnalysisLanguage>('javascript');
  const nativeLanguage = language === 'cpp' || language === 'rust' || language === 'gdscript' ? language : undefined;
  const [goWordBits, setGoWordBits] = useState<32 | 64>(64);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('pasted.js');
  const [preview, setPreview] = useState<(Omit<SourceImportPreview, 'language'> & { language: SourceAnalysisLanguage }) | null>(null);
  const [inventory, setInventory] = useState<CSharpSourceInventory | null>(null);
  const analysisGeneration = useRef(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [mapStart, setMapStart] = useState(false);
  const [entryPolicy, setEntryPolicy] = useState<'program' | 'library'>('program');
  const [review, setReview] = useState<WorkerGraphReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [graphId, setGraphId] = useState('');
  const [files, setFiles] = useState<SourceFileInput[]>([]);
  const client = useRef<SourceImportWorkerClient | null>(null);
  const getClient = () => {
    if (!client.current) client.current = new SourceImportWorkerClient(() => new Worker(new URL('../../lib/sourceImportWorker.ts', import.meta.url), { type: 'module' }) as unknown as ImportWorkerPort);
    return client.current;
  };
  useEffect(() => { dialog.current?.showModal(); return () => { analysisGeneration.current += 1; client.current?.cancel(); }; }, []);
  const reset = (text: string, name: string) => {
    analysisGeneration.current += 1;
    client.current?.cancel();
    setInventory(null);
    setFiles([]);
    setSource(text); setFileName(name); setPreview(null); setSelected(null); setReview(null); setMapStart(false); setEntryPolicy(language !== 'javascript' ? 'library' : 'program'); setError('');
  };
  const analyze = async () => {
    const generation = (analysisGeneration.current += 1);
    setPreview(null); setInventory(null); setSelected(null);
    setBusy(true); setReview(null); setError('');
    try {
      if (new TextEncoder().encode(source).length > MAX_SOURCE_IMPORT_BYTES) throw new Error('Choose a source file of at most 128 KiB.');
      const next = await getClient().preview(source, language, goWordBits);
      if (generation !== analysisGeneration.current) return;
      if (next.language === 'csharp') {
        setInventory(next);
        if (next.mappingRegion) setPreview({ language: 'csharp', source: next.source, sourceSha256: next.sourceSha256, regions: [next.mappingRegion], diagnostics: [] });
        else if (next.mappingDiagnostics.length) setPreview({ language: 'csharp', source: next.source, sourceSha256: next.sourceSha256, regions: [{ kind: 'unresolved', start: 0, end: next.source.length, text: next.source, reason: next.mappingDiagnostics.join('\n') }], diagnostics: [] });
      } else setPreview(next);
      setSelected(null);
    } catch (e) { if (generation === analysisGeneration.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (generation === analysisGeneration.current) setBusy(false); }
  };
  const convert = async () => {
    if (!preview || selected === null) return;
    const generation = (analysisGeneration.current += 1);
    setBusy(true); setReview(null); setError('');
    try {
      const next = await getClient().review(source, selected, fileName, mapStart, entryPolicy, language, goWordBits);
      if (generation !== analysisGeneration.current) return;
      setReview(next); setGraphId(next.snapshot?.activeGraphTab ?? '');
    } catch (err) { if (generation === analysisGeneration.current) setError(err instanceof Error ? err.message : 'Import review failed.'); }
    finally { if (generation === analysisGeneration.current) setBusy(false); }
  };
  const chosen = selected !== null ? preview?.regions[selected] : undefined;
  const doc = review?.snapshot?.documents[graphId];
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="source-import-title"
      className="m-auto w-[min(1100px,95vw)] max-h-[92vh] overflow-y-auto rounded border border-zinc-700 bg-zinc-950 p-5 text-zinc-200 backdrop:bg-black/70">
      <div className="flex items-center justify-between gap-4">
        <h2 id="source-import-title" className="text-lg font-semibold">Import source</h2>
        <button type="button" onClick={onClose} className={BUTTON}>Close</button>
      </div>
      <p className="my-3 text-sm text-zinc-400">Create a new project from a supported class, function or complete function file. Review the source, graph and generated code before accepting. Parsing stays in your browser.</p>
      <label className="block mb-3 text-sm">Language <select disabled={busy} value={language} className="ml-2 bg-zinc-900 border border-zinc-700 p-1" onChange={event => {
        const next = event.target.value as SourceAnalysisLanguage; setLanguage(next); reset('', `pasted.${extension(next)}`); setEntryPolicy(next !== 'javascript' ? 'library' : 'program');
      }}><option value="javascript">JavaScript ES2022</option><option value="python">Python 3.11 — Library pilot</option><option value="go">Go 1.26 — Library functions</option><option value="csharp">C# 12 — integral class subset</option><option value="cpp">C++17 — scalar Library functions</option><option value="rust">Rust 2021 — scalar Library functions</option><option value="gdscript">GDScript 4.5 — scalar Library functions</option></select></label>
      {nativeLanguage && <p className="mb-3 text-sm text-zinc-400">Ordinary typed integer/Boolean Library functions with parameter expressions, arithmetic/comparisons, logical conditions, explicit conversions, checked constants and unit returns. Rust final value expressions retain their spelling. Comments, locals, calls, statement control flow and project dependencies need further mappings. Source is retained when a complete module cannot map.</p>}
      {language === 'csharp' && <p className="mb-3 text-sm text-zinc-400">Import ordinary classes with public static integral/void methods and return expressions. Other constructs remain available for source analysis. Full native compilation is not performed in the browser.</p>}
      {language === 'go' && <p className="mb-3 text-sm text-zinc-400">Package clauses, scalar float64/string/bool signatures, initialized typed or inferred locals, assignments, postfix updates, scalar comparisons, Boolean branches, counted/condition loops, nearest-loop Break/Continue and resolved same-file calls. Imports, integer domains, multi-bindings, range iteration, methods, multiple results, interfaces, defer and concurrency need further mappings.</p>}
      {language === 'python' && <p className="mb-3 text-sm text-zinc-400">Library functions with positional parameters, initialized locals, assignments, same-file calls, explicit str/float conversions and proven-scalar comparisons, Boolean if/else, early returns and While loops. Native integer locals and arithmetic, range loops and constructor-owned instance fields are supported. Annotations, external calls, comments, decorators and async require further mappings. Independent CPython checks cover the checked-in subset.</p>}
      {language === 'go' && <label className="block mb-3 text-sm">Go target word size <select aria-label="Go target word size" disabled={busy} value={goWordBits} className="ml-2 bg-zinc-900 border border-zinc-700 p-1" onChange={event => { setGoWordBits(Number(event.target.value) as 32 | 64); client.current?.cancel(); setPreview(null); setSelected(null); setReview(null); setError(''); }}><option value={64}>64-bit (amd64)</option><option value={32}>32-bit (386)</option></select></label>}
      {language !== 'csharp' && !nativeLanguage && <details className="mb-3 text-sm text-zinc-400">
        <summary className="cursor-pointer">Supported subset and source preservation</summary>
        <p className="mt-2">JavaScript supports synchronous named Library functions, complete same-file function sets, or plain classes with ordinary/static methods. Initialized let/const locals, type-stable assignments, numeric operations on proven Number values, strict equality, typed comparisons, proven-Boolean if/else, early returns, While and counted For loops are supported. Counted For keeps its visible initializer, condition and update. Explicit String, Number and parseFloat conversions preserve their native modes in closed units. Same-file calls resolve exact positional signatures in Library function files. Program units require explicit mapping of an existing on_start method. Nested lexical shadowing, Break/Continue, repeated condition calls, literal-initialized fields, constructors, receiver calls and resolved same-file parents are supported. Named module exports and leading comments/directives have visible graph ownership. Choose module files to resolve named imports together. Unknown-value arithmetic/truthiness, external signatures, effectful field initializers and trailing/expression comments remain blocked. Original source, hashes and spans persist; source outside a selected declaration is retained as provenance and excluded from generated output.</p>
        <p className="mt-2">Formatting, quote style, parentheses and empty semicolons may be normalized. All other syntax structure must match. Limits: 128 KiB, 32 methods, 512 nodes and bounded AST depth/analysis time. Later source edits can be compared with the imported baseline and current graph through File → Re-import source. Conflicts require choosing the reviewed source or graph version.</p>
      </details>}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {language === 'javascript' && <label className={BUTTON}>Choose module files
          <input className="sr-only" type="file" multiple accept=".js,.mjs" disabled={busy} onChange={async event => {
            const selectedFiles = Array.from(event.target.files ?? []); event.target.value = ''; if (!selectedFiles.length) return;
            client.current?.cancel(); setBusy(true); setPreview(null); setReview(null); setError('');
            try {
              if (selectedFiles.length > 16 || selectedFiles.some(file => file.size > MAX_SOURCE_IMPORT_BYTES)) throw new Error('Choose at most 16 files, each at most 128 KiB.');
              const inputs = await Promise.all(selectedFiles.map(async file => ({ fileName: file.name, source: await file.text() })));
              setFiles(inputs); setSource(inputs[0].source); setFileName(inputs[0].fileName); setEntryPolicy('library'); setMapStart(false);
              const result = await getClient().reviewFiles(inputs); setReview(result); setGraphId(result.snapshot?.activeGraphTab ?? '');
            } catch (error) { setError(error instanceof Error ? error.message : 'Module review failed.'); }
            finally { setBusy(false); }
          }} />
        </label>}
        <label className={BUTTON}>Choose source file
          <input className="sr-only" type="file" accept={nativeLanguage ? `.${extension(nativeLanguage)}` : language === 'csharp' ? '.cs' : language === 'go' ? '.go' : language === 'python' ? '.py' : '.js,.mjs,.cjs'} disabled={busy} onChange={async e => {
            const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
            if (file.size > MAX_SOURCE_IMPORT_BYTES) { setError('Choose a source file of at most 128 KiB.'); return; }
            setBusy(true);
            try { reset(await file.text(), file.name); }
            catch (err) { setError(err instanceof Error ? err.message : 'Could not read file.'); }
            finally { setBusy(false); }
          }} />
        </label>
          <button type="button" disabled={busy} className={BUTTON} onClick={() => reset(nativeLanguage ? NATIVE_EXAMPLES[nativeLanguage] : language === 'csharp' ? CSHARP_EXAMPLE : language === 'go' ? 'package sample\nfunc identity(value float64) float64 { return value }' : language === 'python' ? 'def identity(value):\n    return value\n' : EXAMPLE, `example.${extension(language)}`)}>Use example</button>
          {!nativeLanguage && <button type="button" disabled={busy} className={BUTTON} onClick={() => { reset(language === 'csharp' ? CSHARP_PIPELINE : language === 'go' ? 'package sample\nfunc scale(value float64) float64 { return value * 2 }\nfunc pipeline(value float64) float64 { copy := scale(value); return copy }' : language === 'python' ? PYTHON_PIPELINE_EXAMPLE : PIPELINE_EXAMPLE, `pipeline.${extension(language)}`); setEntryPolicy('library'); }}>Use pipeline example</button>}
          {!nativeLanguage && <button type="button" disabled={busy} className={BUTTON} onClick={() => { reset(language === 'csharp' ? CSHARP_CONTROL_FLOW : language === 'go' ? 'package sample\nfunc sum(start float64, limit float64) float64 { var total float64 = 0; for index := start; index < limit; index++ { if index == 2 { continue }; total += index }; return total }' : language === 'python' ? PYTHON_CONTROL_FLOW_EXAMPLE : CONTROL_FLOW_EXAMPLE, `control-flow.${extension(language)}`); setEntryPolicy('library'); }}>Use control-flow example</button>}
        <span className="text-xs text-zinc-500">{fileName}</span>
      </div>
      <label className="text-sm" htmlFor="import-source">Original source</label>
      <textarea id="import-source" value={source} disabled={busy} onChange={e => reset(e.target.value, `pasted.${extension(language)}`)}
        spellCheck={false} className="mt-1 w-full h-44 rounded border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs" />
      <button type="button" onClick={() => void analyze()} disabled={busy || !source.trim() || files.length > 0} className={`${BUTTON} mt-2`}>{busy ? 'Reading source…' : 'Analyze source'}</button>
      {busy && <button type="button" className={`${BUTTON} ml-2`} onClick={() => { analysisGeneration.current += 1; client.current?.cancel(); setBusy(false); setReview(null); setInventory(null); setPreview(null); setError('Import cancelled.'); }}>Cancel import</button>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {inventory && <section aria-label="C# source analysis" className="mt-4 space-y-3 text-sm">
        <p>{inventory.syntaxComplete ? 'Source syntax read.' : 'Source syntax could not be read completely.'} {preview?.regions.some(region => region.kind === 'candidate') ? 'A graph mapping candidate is available below.' : 'No graph mapping for this source.'}</p>
        {inventory.diagnostics.map((message, index) => <p key={index} role="alert" className="text-red-300">{message}</p>)}
        {inventory.integralBindings && <details><summary className="cursor-pointer">Fixed-integral binding checks · {inventory.integralBindings.bindings.length}</summary>
          <p className="mt-2 text-zinc-400">These checks cover a subset of native bindings. Other value types, control flow and project references need further contracts.</p>
          {inventory.integralBindings.diagnostics.map((diagnostic, index) => <p key={index} role={diagnostic.status === 'invalid' ? 'alert' : undefined} className={diagnostic.status === 'invalid' ? 'mt-2 text-red-300' : 'mt-2 text-zinc-400'}>{diagnostic.message}</p>)}
          {inventory.integralBindings.observations.map(observation => <p key={observation.start} className="mt-2 font-mono text-xs">{observation.name}: {observation.declaredType}</p>)}
        </details>}
        <details><summary className="cursor-pointer">Source declarations · {inventory.declarations.length}</summary>
          {inventory.declarations.map(item => <details key={`${item.kind}:${item.start}`} className="ml-3 mt-2">
            <summary className="cursor-pointer">{item.kind.replaceAll('_', ' ')}{item.name ? ` · ${item.name}` : ''}</summary>
            <pre className="mt-2 max-h-48 overflow-auto bg-zinc-900 p-3 text-xs">{inventory.source.slice(item.start, item.end)}</pre>
          </details>)}
        </details>
        <details><summary className="cursor-pointer">Retained original source</summary><pre className="mt-2 max-h-48 overflow-auto bg-zinc-900 p-3 text-xs">{inventory.source}</pre></details>
      </section>}
      {(preview || files.length > 0) && <div className="mt-4 space-y-3">
        {files.length > 0 && <details open><summary className="text-sm cursor-pointer">Reviewed module files · {files.length}</summary>{files.map(file => <details key={file.fileName}><summary className="text-xs cursor-pointer mt-2">{file.fileName}</summary><pre className="text-xs max-h-40 overflow-auto bg-zinc-900 p-2">{file.source}</pre></details>)}</details>}
        {preview?.diagnostics.map((message, i) => <p role="alert" className="text-sm text-red-300" key={i}>{message}</p>)}
        <h3 className="text-sm font-semibold">Source ranges</h3>
        <div className="max-h-44 overflow-y-auto space-y-1">
          {preview?.regions.map((region, i) => <button type="button" key={i} disabled={busy} onClick={() => { setSelected(i); setReview(null); setMapStart(false); }}
            className={`w-full rounded border px-3 py-2 text-left text-xs ${selected === i ? 'border-blue-400' : 'border-zinc-800'} hover:bg-zinc-900`}>
            <span className="font-semibold">{region.kind === 'candidate' ? 'Mapping candidate' : region.kind === 'trivia' ? 'Whitespace' : 'Preserved outside graph'}</span>
            {' · '}line {preview!.source.slice(0, region.start).split('\n').length} · offsets {region.start}–{region.end}
            <span className="block text-zinc-400">{region.reason ?? region.proposedKind ?? ''}</span>
          </button>)}
        </div>
        {chosen && <>
          <details><summary className="cursor-pointer text-sm">Selected original region</summary><pre className="mt-2 max-h-48 overflow-auto bg-zinc-900 p-3 text-xs">{chosen.text}</pre></details>
          {chosen.kind === 'candidate' && <>
            <label className="block text-sm">Compilation unit
              <select className="ml-2 bg-zinc-900 border border-zinc-700 p-1" disabled={busy} value={entryPolicy} onChange={e => { setEntryPolicy(e.target.value as 'program' | 'library'); setMapStart(false); setReview(null); }}>
                <option value="program" disabled={language !== 'javascript'}>Program — explicit existing entry</option><option value="library">Library — functions or methods, no required entry</option>
              </select>
            </label>
            {(chosen.proposedKind === 'standalone-function' || chosen.proposedKind === 'function-file') && <p className="text-xs text-zinc-400">Choose Library to preserve these functions at file scope.</p>}
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
              const accepted = files.length ? await getClient().acceptFiles(review, files) : await getClient().accept(review, source, fileName, mapStart, entryPolicy, language, goWordBits);
              if (dialog.current?.open) onAccept(accepted);
            } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the imported project.'); }
            finally { setBusy(false); }
          }}>Accept as new project</button>}
        </>}
      </div>}
    </dialog>
  );
}
