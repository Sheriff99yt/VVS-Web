"""Actual worker/runtime graph edits, persistence and conflict-aware source reimport."""
import json
import re
from pathlib import Path
from playwright.sync_api import expect

def verify_native_runtime_imports(browser, base_url):
    fixtures = json.loads((Path(__file__).resolve().parents[3] / 'packages/source-import/test/native-runtime-browser.fixture.json').read_text(encoding='utf-8'))
    for language, fixture in fixtures.items():
        context = browser.new_context()
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base_url + '/', wait_until='networkidle')
        page.get_by_role('button', name='Import source…').first.click()
        dialog = page.locator('dialog')
        dialog.get_by_label('Language', exact=False).select_option(language)
        source = fixture['source']
        dialog.locator('input[type=file]').set_input_files({'name': fixture['fileName'], 'mimeType': 'text/plain', 'buffer': source.encode('utf-8')})
        dialog.get_by_role('button', name='Analyze source').click()
        dialog.get_by_role('button', name='Mapping candidate', exact=False).click()
        dialog.get_by_role('button', name='Build and validate preview').click()
        accept = dialog.get_by_role('button', name='Accept as new project')
        expect(accept).to_be_enabled(timeout=30000)
        accept.click()
        page.wait_for_url('**/editor?**', wait_until='networkidle')
        welcome = page.get_by_role('dialog').filter(has=page.locator('#graph-help-title'))
        expect(welcome).to_be_visible(timeout=30000)
        welcome.get_by_role('button', name='Close', exact=True).click()
        code = page.locator('.cm-content').first
        expect(code).to_contain_text('* 2', timeout=30000)
        saved = page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).find(p => p.targetLanguage === '" + language + "')")
        assert len(saved['functions']) == 3
        project_id = saved['projectId']
        fn = next(fn for fn in saved['functions'] if fn['name'] == 'arithmetic')
        definition = next(node for node in saved['documents']['main-graph']['nodes'] if node['data']['graphBinding']['symbolId'] == fn['id'])
        page.get_by_role('button', name='View', exact=True).click()
        page.get_by_role('button', name='Zoom to fit all', exact=True).click()
        page.locator('.react-flow__node[data-id="' + definition['id'] + '"]').click()
        page.locator('summary').filter(has_text='Native signature').click()
        return_type = page.get_by_label('Native return type', exact=True)
        return_type.select_option('bool')
        blocked = page.get_by_role('alert').filter(has_text='Code generation blocked')
        expect(blocked).to_be_visible(timeout=30000)
        return_type.select_option('i8' if language == 'rust' else 'int')
        expect(blocked).not_to_be_visible(timeout=30000)
        page.locator('.react-flow__node[data-id="' + definition['id'] + '"]').dblclick()
        body = saved['documents'][fn['id']]
        literal = next(node for node in body['nodes'] if node['data']['properties'].get('payload') == '2')
        operator = next(node for node in body['nodes'] if node['data']['properties'].get('operator') == '*')
        page.get_by_role('button', name='View', exact=True).click()
        page.get_by_role('button', name='Zoom to fit all', exact=True).click()
        page.locator('.react-flow__node[data-id="' + literal['id'] + '"]').click()
        value = page.get_by_label('Value', exact=True)
        value.fill('invalid')
        expect(blocked).to_be_visible(timeout=30000)
        expect(page.get_by_role('button', name='Copy code', exact=True)).to_be_disabled()
        value.fill('3')
        expect(code).to_contain_text('* 3', timeout=30000)
        literal_panel = page.locator('div[class~="z-[45]"]').filter(has=page.get_by_label('Value', exact=True))
        literal_panel.get_by_role('button', name=re.compile(r'^Close ')).click()
        page.locator('.react-flow__node[data-id="' + operator['id'] + '"]').click()
        page.get_by_label('Operator', exact=True).click()
        page.get_by_role('option', name='+', exact=True).click()
        expect(code).to_contain_text('+ 3', timeout=30000)
        page.keyboard.press('Control+s')
        page.wait_for_function("args => JSON.parse(localStorage.getItem('vvs_project_' + args[0])).documents[args[1]].nodes.some(n => n.id === args[2] && n.data.properties.operator === '+')", arg=[project_id, fn['id'], operator['id']])
        page.reload(wait_until='networkidle')
        expect(code).to_contain_text('+ 3', timeout=30000)

        def compare(text):
            page.get_by_role('button', name='File', exact=True).click()
            page.get_by_role('button', name='Re-import source…', exact=True).click()
            review = page.locator('dialog')
            review.get_by_label('Imported file', exact=True).fill(fixture['fileName'])
            review.get_by_label('Updated source', exact=True).fill(text)
            review.get_by_role('button', name='Compare source and graph').click()
            return review
        review = compare(source)
        expect(review.get_by_role('button', name='Apply reviewed re-import')).to_be_enabled(timeout=30000)
        expect(review.get_by_label('Resolve this file')).not_to_be_visible()
        review.get_by_role('button', name='Apply reviewed re-import').click()
        expect(code).to_contain_text('+ 3', timeout=30000)
        incoming = source.replace('* 2', '* 4')
        for choice, expected in [('keep-graph', '+ 3'), ('use-source', '* 4')]:
            review = compare(incoming)
            expect(review.get_by_label('Resolve this file')).to_be_visible(timeout=30000)
            expect(review.get_by_role('button', name='Apply reviewed re-import')).to_be_disabled()
            review.get_by_label('Resolve this file').select_option(choice)
            review.get_by_role('button', name='Apply reviewed re-import').click()
            expect(code).to_contain_text(expected, timeout=30000)
        page.keyboard.press('Control+s')
        page.wait_for_function("args => Object.values(JSON.parse(localStorage.getItem('vvs_project_' + args[0])).documents).some(d => d.nodes.some(n => n.data.properties?.sourceImport?.source === args[1]))", arg=[project_id, incoming])
        page.reload(wait_until='networkidle')
        expect(code).to_contain_text('* 4', timeout=30000)
        assert not errors, errors
        print(language + ': runtime worker acceptance, signature/literal recovery, operator edits, save/reload and both reimport choices passed', flush=True)
        context.close()
