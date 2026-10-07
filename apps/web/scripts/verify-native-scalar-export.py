"""Focused native lifecycle acceptance against the /VVS-Web static artifact."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import sys
from playwright.sync_api import sync_playwright
from source_import_native_scalar_checks import verify_native_scalar_imports
from source_import_native_runtime_checks import verify_native_runtime_imports
from source_import_native_local_checks import verify_native_local_imports
from source_import_native_group_checks import verify_native_group_imports
from source_import_native_inference_checks import verify_native_inference_edits

root = Path(__file__).resolve().parents[1] / 'out'
class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass
    def do_GET(self):
        if not self.path.startswith('/VVS-Web/'):
            self.send_error(404)
            return
        self.path = self.path[len('/VVS-Web'):]
        parts = urlsplit(self.path)
        if (root / (parts.path.lstrip('/') + '.html')).is_file():
            self.path = parts.path + '.html' + ('?' + parts.query if parts.query else '')
        super().do_GET()

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(root)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        verify = verify_native_inference_edits if '--inference-only' in sys.argv else verify_native_group_imports if '--groups-only' in sys.argv else verify_native_local_imports if '--locals-only' in sys.argv else verify_native_runtime_imports if '--runtime-only' in sys.argv else verify_native_scalar_imports
        verify(browser, 'http://127.0.0.1:' + str(server.server_port) + '/VVS-Web')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
