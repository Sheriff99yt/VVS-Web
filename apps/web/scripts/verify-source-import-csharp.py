"""Focused retry for the C# production workflows; not full import-suite evidence."""
import os
from playwright.sync_api import sync_playwright
from source_import_csharp_checks import verify_csharp_analysis
from native_grammar_asset_checks import verify_native_grammar_assets

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    verify_csharp_analysis(browser, os.environ.get('VVS_TEST_URL', 'http://localhost:3137'))
    verify_native_grammar_assets(browser, os.environ.get('VVS_TEST_URL', 'http://localhost:3137'))
    browser.close()
