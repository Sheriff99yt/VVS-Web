"""Focused repair check; retain unchanged existing-adapter/browser evidence."""
import os
import sys
from playwright.sync_api import sync_playwright
from source_import_native_scalar_checks import verify_native_scalar_imports
from source_import_native_runtime_checks import verify_native_runtime_imports
from source_import_native_local_checks import verify_native_local_imports
from source_import_native_group_checks import verify_native_group_imports
from source_import_native_inference_checks import verify_native_inference_edits

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    verify = verify_native_inference_edits if '--inference-only' in sys.argv else verify_native_group_imports if '--groups-only' in sys.argv else verify_native_local_imports if '--locals-only' in sys.argv else verify_native_runtime_imports if '--runtime-only' in sys.argv else verify_native_scalar_imports
    verify(browser, os.environ.get('VVS_TEST_URL', 'http://localhost:3137'))
    browser.close()
