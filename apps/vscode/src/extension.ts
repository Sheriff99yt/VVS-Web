import * as vscode from 'vscode';
import { createHash } from 'node:crypto';
import { transpileProject } from '@vvs/transpiler';
import { applyWireConnection, edgesWithoutTargetHandle, analyzeProject, type GraphDocument, type SourceRange } from '@vvs/graph-types';
import { resolve as resolveKind } from '@vvs/syntax-registry';
import { loadWorkspaceProject, projectUri } from './workspaceProject';

const DOCS = 'https://sheriff99yt.github.io/VVS-Web/docs/nodes/';
let lastMap: Record<string, SourceRange[]> = {};
let lastRoot: vscode.Uri | undefined;
let lastVersions = new Map<string, number>();
let lastOutputs = new Map<string, string>();
let lastInputs = new Map<string, string>();
async function inputsCurrent(inputs: ReadonlyMap<string, string>): Promise<boolean> {
  for (const [value, text] of inputs) {
    const uri = vscode.Uri.parse(value);
    const open = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === value);
    if ((open ? open.getText() : new TextDecoder().decode(await vscode.workspace.fs.readFile(uri))) !== text) return false;
  }
  return true;
}
const generating = new Set<string>();
const hashText = (text: string) => createHash('sha256').update(text).digest('hex');
async function readOptional(uri: vscode.Uri): Promise<string | null> {
  try { return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)); }
  catch (error) { if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') return null; throw error; }
}

function versionsCurrent(versions: ReadonlyMap<string, number>): boolean {
  return [...versions].every(([uri, version]) => vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri)?.version === version);
}

function rootFor(uri?: vscode.Uri): vscode.Uri | undefined {
  if (uri) return vscode.workspace.getWorkspaceFolder(uri)?.uri;
  const folders = vscode.workspace.workspaceFolders;
  return folders?.length === 1 ? folders[0].uri : undefined;
}

async function generate(initiatingUri?: vscode.Uri): Promise<void> {
  const root = rootFor(initiatingUri ?? vscode.window.activeTextEditor?.document.uri);
  if (!root) { vscode.window.showErrorMessage('Open a VVS project folder first.'); return; }
  if (generating.has(root.toString())) return;
  generating.add(root.toString());
  lastMap = {};
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'VVS: Generate source' }, async () => {
      const documents = vscode.workspace.textDocuments.filter(doc => doc.uri.toString().startsWith(root.toString() + '/.vvs/'));
      const versions = new Map(documents.map(doc => [doc.uri.toString(), doc.version]));
      const overlay = new Map(documents.map(doc => [doc.uri.toString(), doc.getText()]));
      const inputs = new Map<string, string>();
      const snapshot = await loadWorkspaceProject(root, overlay, inputs);
      if (!versionsCurrent(versions) || !await inputsCurrent(inputs)) throw new Error('Inputs changed during loading. Generate again.');
      const analysis = analyzeProject(snapshot);
      const errors = analysis.diagnostics.filter(diagnostic => diagnostic.level === 'error');
      if (errors.length) throw new Error(errors.map(error => error.message).join('\n'));
      const result = transpileProject({
        projectDetails: snapshot.projectDetails, targetLanguage: snapshot.targetLanguage,
        targetFileExtensions: snapshot.targetFileExtensions, variables: snapshot.variables,
        projectEvents: snapshot.events, functions: snapshot.functions, documents: snapshot.documents,
        classes: snapshot.classes, activeClassId: snapshot.activeClassId, openTabs: snapshot.openTabs,
        environmentId: snapshot.environmentId, integration: snapshot.integration,
      });
      if (result.files.length === 0) throw new Error('Generate produced no source files. Check the graph and target language.');
      const writes = result.files.map((file) => ({ path: file.path, uri: projectUri(root, file.path), content: file.content.endsWith('\n') ? file.content : file.content + '\n' }));
      const receiptUri = projectUri(root, '.vvs/generated-files.json');
      const receiptText = await readOptional(receiptUri);
      const hashes: Record<string, string> = receiptText ? JSON.parse(receiptText) : {};
      const previous = new Map<string, string | null>();
      // Verify every target before writing any output.
      for (const { uri, content, path } of writes) {
        if (uri.path.includes('/.vvs/')) throw new Error('Generate cannot overwrite the .vvs project.');
        if (vscode.workspace.textDocuments.some(doc => doc.uri.toString() === uri.toString() && doc.isDirty)) throw new Error(`Save or close the dirty output first: ${uri.path}`);
        const existing = await readOptional(uri);
        if (existing !== null && existing !== content && hashText(existing) !== hashes[path]) throw new Error(`Generated output was edited externally: ${path}. Preserve or move it before generating.`);
        previous.set(uri.toString(), existing);
        hashes[path] = hashText(content);
      }
      const written: vscode.Uri[] = [];
      try {
      for (const { uri, content } of writes) {
        if (!versionsCurrent(versions) || !await inputsCurrent(inputs)) throw new Error('Inputs changed during Generate. Output belongs to the previous revision; Generate again.');
        if (vscode.workspace.textDocuments.some(doc => doc.uri.toString() === uri.toString() && doc.isDirty)) throw new Error(`Output changed during Generate: ${uri.path}`);
        if (await readOptional(uri) !== previous.get(uri.toString())) throw new Error(`Output changed during Generate: ${uri.path}`);
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
        written.push(uri);
      }
      await vscode.workspace.fs.writeFile(receiptUri, new TextEncoder().encode(JSON.stringify(hashes)));
      } catch (error) {
        for (const uri of written.reverse()) {
          const before = previous.get(uri.toString());
          const expected = writes.find(write => write.uri.toString() === uri.toString())!.content;
          if (await readOptional(uri) !== expected) continue;
          if (before === null) await vscode.workspace.fs.delete(uri);
          else await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(before!));
        }
        throw error;
      }
      lastMap = result.sourceMap;
      lastRoot = root;
      lastVersions = versions;
      lastInputs = inputs;
      lastOutputs = new Map(writes.map(file => [file.uri.toString(), file.content]));
      const first = writes[0];
      await vscode.window.showTextDocument(first.uri, { preview: false });
      vscode.window.showInformationMessage(`VVS generated ${writes.length} source file${writes.length === 1 ? '' : 's'}.`);
    });
  } catch (error) {
    vscode.window.showErrorMessage(`VVS Generate did not complete; some outputs may have been written. ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    generating.delete(root.toString());
  }
}

function html(nonce: string): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <style>body{margin:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font:13px var(--vscode-font-family)}
  header{padding:10px 14px;border-bottom:1px solid var(--vscode-panel-border)}button{color:var(--vscode-textLink-foreground);background:none;border:0;cursor:pointer}
  #viewport{position:relative;min-height:100vh;overflow:auto}#canvas{position:relative;min-width:1200px;min-height:900px}
  .node{position:absolute;width:180px;background:var(--vscode-editorWidget-background);border:1px solid var(--vscode-panel-border);border-radius:5px;cursor:grab;user-select:none}
  .node strong{display:block;padding:9px;border-bottom:1px solid var(--vscode-panel-border)}.node small{display:block;padding:8px;color:var(--vscode-descriptionForeground)}
  svg{position:absolute;inset:0;pointer-events:none}path{fill:none;stroke:var(--vscode-textLink-foreground);stroke-width:2}</style></head>
  <body><header>VVS graph · Drag nodes to reposition · <button id="add">Add node</button> · <button id="source">Edit graph JSON</button> · <button id="generate">Generate</button></header>
  <div id="inspector" style="padding:10px 14px;border-bottom:1px solid var(--vscode-panel-border)">Select a node to edit its inline inputs.</div>
  <div id="viewport"><div id="canvas"><svg id="wires" width="2400" height="1600"></svg></div></div>
  <script nonce="${nonce}">const api=acquireVsCodeApi(),canvas=document.getElementById('canvas'),wires=document.getElementById('wires'),inspector=document.getElementById('inspector');let graph={nodes:[],edges:[]},selected=null;
  document.getElementById('source').onclick=()=>api.postMessage({type:'source'});
  document.getElementById('generate').onclick=()=>api.postMessage({type:'generate'});
  document.getElementById('add').onclick=()=>{const id=prompt('Node kind: flow_branch, action_print, math_add');if(id)api.postMessage({type:'add',kindId:id.trim()})};
  function showInspector(node){selected=node?.id||null;inspector.replaceChildren();if(!node){inspector.textContent='Select a node to edit its inline inputs.';return}
    const title=document.createElement('strong');title.textContent=String(node.data?.label||node.id);inspector.append(title);
    const source=document.createElement('button');source.textContent='Show generated source';source.onclick=()=>api.postMessage({type:'sourceForNode',id:node.id});inspector.append(source);
    if(node.data?.kindId){const docs=document.createElement('button');docs.textContent='Node docs';docs.onclick=()=>api.postMessage({type:'docs',id:node.data.kindId});inspector.append(docs)}
    for(const input of node.data?.inputs||[]){const label=document.createElement('label');label.style.marginLeft='12px';label.textContent=String(input.label||input.id)+' ← ';
      const select=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Unconnected';select.append(empty);
      for(const other of graph.nodes){if(other.id===node.id)continue;for(const output of other.data?.outputs||[]){if(output.type!==input.type)continue;
        const option=document.createElement('option');option.value=other.id+'|'+output.id;option.textContent=String(other.data?.label||other.id)+' · '+String(output.label||output.id);select.append(option)}}
      const current=graph.edges.find(e=>e.target===node.id&&e.targetHandle===input.id);if(current)select.value=current.source+'|'+current.sourceHandle;
      select.onchange=()=>api.postMessage({type:'connect',target:node.id,targetHandle:input.id,source:select.value});label.append(select);inspector.append(label);
      if(input.type==='execution')continue;
      const field=document.createElement('input');field.value=String(node.data?.inlineValues?.[input.id]??'');field.style.width='100px';
      field.onchange=()=>api.postMessage({type:'inline',id:node.id,key:input.id,value:field.value});label.append(field);inspector.append(label)}}
  function render(){canvas.querySelectorAll('.node').forEach(e=>e.remove());wires.replaceChildren();const nodes=new Map();
  for(const node of graph.nodes){const element=document.createElement('div');element.className='node';
    const x=Number(node.position?.x)||0,y=Number(node.position?.y)||0;element.style.left=x+'px';element.style.top=y+'px';
    const title=document.createElement('strong');title.textContent=String(node.data?.label||node.data?.kindId||node.id);
    const subtitle=document.createElement('small');subtitle.textContent=String(node.data?.category||'Node');element.append(title,subtitle);
    element.onclick=()=>showInspector(node);element.onpointerdown=e=>{if(e.button!==0)return;const sx=e.clientX,sy=e.clientY;element.setPointerCapture(e.pointerId);
      element.onpointermove=m=>{element.style.left=(x+m.clientX-sx)+'px';element.style.top=(y+m.clientY-sy)+'px'};
      element.onpointerup=m=>{element.onpointermove=null;api.postMessage({type:'move',id:node.id,x:x+m.clientX-sx,y:y+m.clientY-sy})};};
    canvas.append(element);nodes.set(node.id,node)}
  for(const edge of graph.edges){const a=nodes.get(edge.source),b=nodes.get(edge.target);if(!a||!b)continue;
    const ax=(Number(a.position?.x)||0)+180,ay=(Number(a.position?.y)||0)+35,bx=Number(b.position?.x)||0,by=(Number(b.position?.y)||0)+35;
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M'+ax+' '+ay+' C'+(ax+70)+' '+ay+','+(bx-70)+' '+by+','+bx+' '+by);wires.append(path)}
  if(selected)showInspector(nodes.get(selected))}
  window.addEventListener('message',e=>{if(e.data?.type==='graph'){graph=e.data.graph;render()}});</script></body></html>`;
}

class GraphEditor implements vscode.CustomTextEditorProvider {
  async resolveCustomTextEditor(document: vscode.TextDocument, panel: vscode.WebviewPanel): Promise<void> {
    const nonce = Math.random().toString(36).slice(2);
    panel.webview.options = { enableScripts: true, localResourceRoots: [] };
    panel.webview.html = html(nonce);
    const update = () => {
      try { panel.webview.postMessage({ type: 'graph', graph: JSON.parse(document.getText()) }); }
      catch { vscode.window.showWarningMessage('VVS graph JSON is invalid. Open the source to repair it.'); }
    };
    const listener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() === document.uri.toString()) update();
    });
    panel.onDidDispose(() => listener.dispose());
    panel.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      const data = message as Record<string, unknown>;
      try {
      if (data.type === 'source') await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
      if (data.type === 'generate') await generate(document.uri);
      if (data.type === 'sourceForNode' && typeof data.id === 'string') await vscode.commands.executeCommand('vvs.revealGeneratedNode', data.id, document.uri);
      if (data.type === 'docs' && typeof data.id === 'string') await vscode.commands.executeCommand('vvs.openNodeDocs', data.id);
      if (data.type === 'add' && typeof data.kindId === 'string' && ['flow_branch', 'action_print', 'math_add'].includes(data.kindId)) {
        const kind = resolveKind(data.kindId);
        if (!kind) return;
        const graph = JSON.parse(document.getText()) as { nodes: Array<Record<string, unknown>> };
        graph.nodes.push({ id: `vscode-${crypto.randomUUID()}`, type: 'vvs_standard_node', position: { x: 80 + graph.nodes.length * 30, y: 80 + graph.nodes.length * 30 }, data: {
          label: kind.title, category: kind.category, kindId: kind.kindId, kindVersion: kind.kindVersion,
          inputs: kind.inputs, outputs: kind.outputs, inlineValues: {}, properties: {},
        } });
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), JSON.stringify(graph, null, 2) + '\n');
        await vscode.workspace.applyEdit(edit);
      }
      if (data.type === 'connect' && typeof data.target === 'string' && typeof data.targetHandle === 'string' && typeof data.source === 'string') {
        const graph = JSON.parse(document.getText()) as GraphDocument;
        if (!data.source) graph.edges = edgesWithoutTargetHandle(graph.edges, data.target, data.targetHandle);
        else {
          const [source, sourceHandle] = data.source.split('|');
          const result = applyWireConnection({ source, sourceHandle, target: data.target, targetHandle: data.targetHandle }, graph.nodes, graph.edges, `vscode-${crypto.randomUUID()}`);
          if ('error' in result) { vscode.window.showWarningMessage(`Connection rejected: ${result.error}`); return; }
          graph.edges = result.edges;
        }
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), JSON.stringify(graph, null, 2) + '\n');
        await vscode.workspace.applyEdit(edit);
      }
      if ((data.type === 'move' || data.type === 'inline') && typeof data.id === 'string') {
        const graph = JSON.parse(document.getText()) as { nodes?: Array<{ id: string; position: { x: number; y: number }; data: { inputs?: Array<{ id: string }>; inlineValues?: Record<string, string> } }> };
        const node = graph.nodes?.find((n) => n.id === data.id);
        if (!node) return;
        if (data.type === 'move') {
          if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
          node.position = { x: data.x as number, y: data.y as number };
        } else {
          if (typeof data.key !== 'string' || typeof data.value !== 'string' || !node.data.inputs?.some((pin) => pin.id === data.key)) return;
          node.data.inlineValues = { ...node.data.inlineValues, [data.key]: data.value };
        }
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), JSON.stringify(graph, null, 2) + '\n');
        await vscode.workspace.applyEdit(edit);
      }
      } catch (error) { vscode.window.showWarningMessage(`VVS edit rejected: ${error instanceof Error ? error.message : String(error)}`); }
    });
    update();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.window.registerCustomEditorProvider('vvs.graph', new GraphEditor(), { webviewOptions: { retainContextWhenHidden: true } }));
  context.subscriptions.push(vscode.commands.registerCommand('vvs.generate', generate));
  context.subscriptions.push(vscode.commands.registerCommand('vvs.openGraph', async () => {
    if (!vscode.workspace.workspaceFolders?.length) return;
    const matches = await vscode.workspace.findFiles('**/.vvs/graphs/**/*.graph.json', '**/node_modules/**', 100);
    const selected = await vscode.window.showQuickPick(matches.map((uri) => ({ label: vscode.workspace.asRelativePath(uri), uri })));
    if (selected) await vscode.commands.executeCommand('vscode.openWith', selected.uri, 'vvs.graph');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('vvs.openNodeDocs', async (kindId?: string) => {
    const id = kindId ?? await vscode.window.showInputBox({ prompt: 'VVS node kind id' });
    if (id && /^[a-z0-9_.-]+$/.test(id)) await vscode.env.openExternal(vscode.Uri.parse(DOCS + id));
  }));
  context.subscriptions.push(vscode.commands.registerCommand('vvs.revealGeneratedNode', async (nodeId: string, initiatingUri?: vscode.Uri) => {
    const root = rootFor(initiatingUri ?? vscode.window.activeTextEditor?.document.uri);
    if (!root || root.toString() !== lastRoot?.toString() || !versionsCurrent(lastVersions) || !await inputsCurrent(lastInputs)) { vscode.window.showInformationMessage('Generate this project revision first.'); return; }
    const range = lastMap[nodeId]?.[0];
    if (!range || !lastRoot) { vscode.window.showInformationMessage('Generate this project first to navigate to its source.'); return; }
    const uri = projectUri(lastRoot, range.filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    if (doc.getText() !== lastOutputs.get(uri.toString())) { vscode.window.showInformationMessage('Output changed. Generate again before navigating.'); return; }
    const editor = await vscode.window.showTextDocument(doc);
    const selection = new vscode.Range(range.startLine - 1, range.startCol - 1, range.endLine - 1, range.endCol - 1);
    editor.selection = new vscode.Selection(selection.start, selection.end);
    editor.revealRange(selection);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('vvs.revealFile', async (uri?: vscode.Uri) => {
    const file = uri ?? vscode.window.activeTextEditor?.document.uri;
    if (!file || !rootFor(file)) return;
    await vscode.workspace.fs.stat(file);
    await vscode.commands.executeCommand('revealInExplorer', file);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('vvs.revealFileInOS', async (uri?: vscode.Uri) => {
    const file = uri ?? vscode.window.activeTextEditor?.document.uri;
    if (!file || !rootFor(file)) return;
    await vscode.workspace.fs.stat(file);
    await vscode.commands.executeCommand(file.scheme === 'file' ? 'revealFileInOS' : 'revealInExplorer', file);
  }));
}

export function deactivate(): void {}
