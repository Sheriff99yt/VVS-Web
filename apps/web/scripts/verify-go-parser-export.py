"""Verify Go worker acceptance and C# grammar assets through /VVS-Web."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
from source_import_csharp_checks import verify_csharp_analysis
from source_import_native_scalar_checks import verify_native_scalar_imports
from native_grammar_asset_checks import verify_native_grammar_assets


class ExportHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith('/VVS-Web/'):
            self.send_error(404)
            return
        self.path = self.path[len('/VVS-Web'):]
        # Exported clean HTML routes have sibling .html files; Next's RSC
        # directories are not index pages. Keep the browser URL unchanged.
        parts = urlsplit(self.path)
        if (output / (parts.path.lstrip('/') + '.html')).is_file():
            self.path = parts.path + '.html' + ('?' + parts.query if parts.query else '')
        super().do_GET()

    def log_message(self, *_):
        pass


output = Path(__file__).resolve().parent.parent / 'out'
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(ExportHandler, directory=str(output)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        paths, errors, failed = [], [], []
        context.on('request', lambda request: paths.append(request.url))
        context.on('requestfailed', lambda request: failed.append((request.url, request.failure)))
        context.on('response', lambda response: failed.append((response.url, response.status)) if response.status >= 400 else None)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        base = f'http://127.0.0.1:{server.server_port}/VVS-Web'
        page.goto(base + '/', wait_until='networkidle')
        page.get_by_role('button', name='Import source…').first.click()
        dialog = page.locator('dialog')
        dialog.get_by_label('Language', exact=False).select_option('go')
        dialog.get_by_role('button', name='Use pipeline example', exact=True).click()
        dialog.get_by_role('button', name='Analyze source').click()
        try:
            dialog.get_by_role('button', name='Mapping candidate', exact=False).first.click()
        except Exception:
            print('Exported Go analysis failure:', dialog.inner_text(), errors, failed, paths, flush=True)
            raise
        dialog.get_by_role('button', name='Build and validate preview').click()
        expect(dialog.get_by_role('button', name='Accept as new project')).to_be_enabled(timeout=30000)
        expect(dialog.locator('pre').last).to_contain_text('func scale(value float64) float64')
        for asset in ['web-tree-sitter.js', 'web-tree-sitter.wasm', 'tree-sitter-go.wasm']:
            assert base + '/source-parsers/' + asset in paths, f'Missing base-path asset request: {asset}'
        assert not errors, errors
        dialog.get_by_role('button', name='Accept as new project').click()
        expect(dialog).not_to_be_visible(timeout=30000)
        page.wait_for_url('**/editor?**', wait_until='networkidle')
        try:
            expect(page.locator('.react-flow__node').first).to_be_visible(timeout=30000)
        except Exception:
            print('Exported editor failure:', errors, failed, paths, flush=True)
            raise
        welcome = page.get_by_role('dialog').filter(has=page.locator('#graph-help-title'))
        expect(welcome).to_be_visible(timeout=30000)
        welcome.get_by_role('button', name='Close', exact=True).click()
        expect(welcome).not_to_be_visible()
        page.reload(wait_until='networkidle')
        expect(page.locator('.react-flow__node').first).to_be_visible(timeout=30000)
        assert page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).some(k => JSON.parse(localStorage.getItem(k)).targetLanguage === 'go')")
        print('Pages Go: exported worker, base-path JS/WASM assets, preview, accept and reload passed')
        assert not any(url.endswith('/tree-sitter-c_sharp.wasm') for url in paths), 'Go import eagerly loaded the C# grammar'
        # Independent browser runtime smoke only; this does not claim a C# worker/import flow.
        csharp_context = browser.new_context()
        csharp_errors, csharp_failed = [], []
        csharp_context.on('request', lambda request: paths.append(request.url))
        csharp_context.on('requestfailed', lambda request: csharp_failed.append((request.url, request.failure)))
        csharp_context.on('response', lambda response: csharp_failed.append((response.url, response.status)) if response.status >= 400 else None)
        csharp_page = csharp_context.new_page()
        csharp_page.on('pageerror', lambda error: csharp_errors.append(str(error)))
        csharp_page.goto(base + '/source-parsers/manifest.json', wait_until='load')
        csharp = csharp_page.evaluate("""async base => {
          const { Parser, Language } = await import(base + '/source-parsers/web-tree-sitter.js');
          await Parser.init({ locateFile: () => base + '/source-parsers/web-tree-sitter.wasm' });
          const language = await Language.load(base + '/source-parsers/tree-sitter-c_sharp.wasm');
          const parser = new Parser();
          try {
            parser.setLanguage(language);
            const source = '// 🧭 retained\\npublic class Sample { int[] Test() => [1, 2, 3]; }';
            const tree = parser.parse(source);
            try {
              return { abi: language.abiVersion, hasError: tree.rootNode.hasError,
                source: tree.rootNode.text, expected: source,
                kinds: tree.rootNode.namedChildren.map(node => node.type) };
            } finally { tree.delete(); }
          } finally { parser.delete(); }
        }""", base)
        assert csharp['abi'] == 15 and not csharp['hasError'], csharp
        assert csharp['source'] == csharp['expected'], csharp
        assert 'class_declaration' in csharp['kinds'], csharp
        assert base + '/source-parsers/tree-sitter-c_sharp.wasm' in paths
        assert not csharp_errors and not csharp_failed, (csharp_errors, csharp_failed)
        print('Pages C#: browser grammar ABI, C#12 collection syntax, source retention and base-path WASM passed; no import acceptance claimed')
        verify_csharp_analysis(browser, base)
        verify_native_scalar_imports(browser, base)
        verify_native_grammar_assets(browser, base)
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
