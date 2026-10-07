"""Actual Rust/C++/GDScript worker, inspector, persistence and reimport flows."""
from pathlib import Path
import json
from playwright.sync_api import expect


def verify_native_scalar_imports(browser, base_url):
    fixtures = json.loads((Path(__file__).resolve().parents[3] / 'packages/source-import/test/native-scalar-browser.fixture.json').read_text(encoding='utf-8'))
    for language, fixture in fixtures.items():
        context = browser.new_context()
        page = context.new_page()
        paths, errors = [], []
        context.on('request', lambda request: paths.append(request.url))
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base_url + '/', wait_until='networkidle')
        page.get_by_role('button', name='Import source…').first.click()
        dialog = page.locator('dialog')
        dialog.get_by_label('Language', exact=False).select_option(language)
        invalid = {'cpp': 'int main() { return 0; }', 'rust': 'fn sample(value:i32)->i32 { let local = value; local }', 'gdscript': 'func _init() -> void:\n    pass\n'}[language]
        dialog.get_by_label('Original source').fill(invalid)
        dialog.get_by_role('button', name='Analyze source').click()
        expect(dialog.get_by_role('button', name='Preserved outside graph', exact=False)).to_be_visible(timeout=30000)
        expect(dialog.get_by_label('Original source')).to_have_value(invalid)
        expect(dialog.get_by_role('button', name='Accept as new project')).not_to_be_visible()
        source = fixture['source']
        dialog.locator('input[type=file]').set_input_files({'name': fixture['fileName'], 'mimeType': 'text/plain', 'buffer': source.encode('utf-8')})
        dialog.get_by_role('button', name='Analyze source').click()
        candidate = dialog.get_by_role('button', name='Mapping candidate', exact=False)
        expect(candidate).to_be_visible(timeout=30000)
        candidate.click()
        expect(dialog.get_by_label('Compilation unit')).to_have_value('library')
        dialog.get_by_role('button', name='Build and validate preview').click()
        accept = dialog.get_by_role('button', name='Accept as new project')
        expect(accept).to_be_enabled(timeout=30000)
        expect(dialog.locator('pre').last).to_contain_text('-(-5)')
        accept.click()
        page.wait_for_url('**/editor?**', wait_until='networkidle')
        welcome = page.get_by_role('dialog').filter(has=page.locator('#graph-help-title'))
        expect(welcome).to_be_visible(timeout=30000)
        welcome.get_by_role('button', name='Close', exact=True).click()
        code = page.locator('.cm-content').first
        expect(code).to_contain_text('-(-5)', timeout=30000)
        read_project = "Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).find(p => p.targetLanguage === '" + language + "')"
        saved = page.evaluate(read_project)
        assert saved and len(saved['functions']) == 4
        project_id = saved['projectId']
        assert saved['documents']['main-graph']['metadata']['sourceFileName'] == fixture['fileName']
        assert all(node['data']['properties'].get('sourceOrigin') for doc in saved['documents'].values() for node in doc['nodes'])
        identity = next(fn for fn in saved['functions'] if fn['name'] == 'Value')
        definition = next(node for node in saved['documents']['main-graph']['nodes'] if node['data']['graphBinding']['symbolId'] == identity['id'])
        page.get_by_role('button', name='View', exact=True).click()
        page.get_by_role('button', name='Zoom to fit all', exact=True).click()
        page.locator('.react-flow__node[data-id="' + definition['id'] + '"]').click()
        page.locator('summary').filter(has_text='Native signature').click()
        parameter = page.get_by_label('Native type for value', exact=True)
        parameter.select_option({'cpp': 'short', 'rust': 'i8', 'gdscript': 'bool'}[language])
        blocked = page.get_by_role('alert').filter(has_text='Code generation blocked')
        expect(blocked).to_be_visible(timeout=30000)
        expect(page.get_by_role('button', name='Copy code', exact=True)).to_be_disabled()
        parameter.select_option('i32' if language == 'rust' else 'int')
        expect(blocked).not_to_be_visible(timeout=30000)
        parameter.select_option('bool')
        expect(blocked).to_be_visible(timeout=30000)
        page.get_by_label('Native return type', exact=True).select_option('bool')
        expect(blocked).not_to_be_visible(timeout=30000)
        bool_header = {'cpp': 'bool Value(const bool value)', 'rust': 'fn Value(value: bool) -> bool', 'gdscript': 'func Value(value: bool) -> bool'}[language]
        expect(code).to_contain_text(bool_header, timeout=30000)
        function = next(fn for fn in saved['functions'] if fn['name'] == 'value')
        constant_definition = next(node for node in saved['documents']['main-graph']['nodes'] if node['data']['graphBinding']['symbolId'] == function['id'])
        page.locator('.react-flow__node[data-id="' + constant_definition['id'] + '"]').dblclick()
        body = saved['documents'][function['id']]
        literal = next(node for node in body['nodes'] if node['data']['properties'].get('payload') == '5')
        page.get_by_role('button', name='View', exact=True).click()
        page.get_by_role('button', name='Zoom to fit all', exact=True).click()
        page.locator('.react-flow__node[data-id="' + literal['id'] + '"]').click()
        value = page.get_by_label('Value', exact=True)
        value.fill('6')
        expect(code).to_contain_text('-(-6)', timeout=30000)
        value.fill('not_a_literal')
        expect(blocked).to_be_visible(timeout=30000)
        value.fill('6')
        expect(code).to_contain_text('-(-6)', timeout=30000)
        expect(blocked).not_to_be_visible(timeout=30000)
        page.keyboard.press('Control+s')
        page.wait_for_function("args => JSON.parse(localStorage.getItem('vvs_project_' + args[0])).documents[args[1]].nodes.some(n => n.id === args[2] && n.data.properties.payload === '6')", arg=[project_id, function['id'], literal['id']])
        page.reload(wait_until='networkidle')
        expect(code).to_contain_text('-(-6)', timeout=30000)
        page.wait_for_function("""id => {
            const p = JSON.parse(localStorage.getItem('vvs_project_' + id));
            const f = p.functions.find(f => f.name === 'Value');
            if (!f) return false;
            const def = p.documents['main-graph'].nodes.find(n => n.data.graphBinding?.symbolId === f.id);
            const body = p.documents[f.overloads[0].graphTabId || f.id];
            return def.data.properties.nativeReturnType === 'bool'
                && def.data.properties.nativeParameters[0].nativeType === 'bool'
                && f.overloads[0].parameters[0].type === 'data_boolean'
                && f.overloads[0].returnType === 'data_boolean'
                && body.nodes.find(n => n.data.kindId === 'function_entry').data.outputs[1].type === 'data_boolean'
                && body.nodes.find(n => n.data.kindId === 'flow_return').data.inputs[1].type === 'data_boolean';
        }""", arg=project_id)

        def compare(text):
            page.get_by_role('button', name='File', exact=True).click()
            page.get_by_role('button', name='Re-import source…', exact=True).click()
            review = page.locator('dialog')
            review.get_by_label('Imported file', exact=True).fill(fixture['fileName'])
            review.get_by_label('Updated source', exact=True).fill(text)
            review.get_by_role('button', name='Compare source and graph').click()
            expect(review.get_by_role('button', name='Apply reviewed re-import')).to_be_enabled(timeout=30000)
            return review

        review = compare(source)
        expect(review.get_by_label('Resolve this file')).not_to_be_visible()
        review.get_by_role('button', name='Apply reviewed re-import').click()
        expect(review).not_to_be_visible()
        expect(code).to_contain_text('-(-6)', timeout=30000)
        incoming = source.replace('-(-5)', '-(-7)')
        # Conflict selection must be explicit; keep both choices usable.
        page.get_by_role('button', name='File', exact=True).click()
        page.get_by_role('button', name='Re-import source…', exact=True).click()
        review = page.locator('dialog')
        review.get_by_label('Imported file', exact=True).fill(fixture['fileName'])
        review.get_by_label('Updated source', exact=True).fill(incoming)
        review.get_by_role('button', name='Compare source and graph').click()
        expect(review.get_by_label('Resolve this file')).to_be_visible(timeout=30000)
        expect(review.get_by_role('button', name='Apply reviewed re-import')).to_be_disabled()
        review.get_by_label('Resolve this file').select_option('keep-graph')
        review.get_by_role('button', name='Apply reviewed re-import').click()
        expect(review).not_to_be_visible()
        expect(code).to_contain_text('-(-6)', timeout=30000)
        page.get_by_role('button', name='File', exact=True).click()
        page.get_by_role('button', name='Re-import source…', exact=True).click()
        review = page.locator('dialog')
        review.get_by_label('Imported file', exact=True).fill(fixture['fileName'])
        review.get_by_label('Updated source', exact=True).fill(incoming)
        review.get_by_role('button', name='Compare source and graph').click()
        expect(review.get_by_label('Resolve this file')).to_be_visible(timeout=30000)
        review.get_by_label('Resolve this file').select_option('use-source')
        review.get_by_role('button', name='Apply reviewed re-import').click()
        expect(review).not_to_be_visible()
        expect(code).to_contain_text('-(-7)', timeout=30000)
        page.keyboard.press('Control+s')
        page.wait_for_function("id => Object.values(JSON.parse(localStorage.getItem('vvs_project_' + id)).documents).some(d => d.nodes.some(n => n.data.properties?.sourceImport?.source.includes('-(-7)')))", arg=project_id)
        page.reload(wait_until='networkidle')
        expect(code).to_contain_text('-(-7)', timeout=30000)
        for asset in ['web-tree-sitter.js', 'web-tree-sitter.wasm', 'tree-sitter-' + language + '.wasm']:
            assert base_url.rstrip('/') + '/source-parsers/' + asset in paths, asset
        assert not errors, errors
        print(language + ': source retention/upload, worker review/acceptance, coordinated Boolean signature/ports with invalid-edit recovery, Code panel/save/reload and both reimport conflict choices passed', flush=True)
        context.close()
    from source_import_native_runtime_checks import verify_native_runtime_imports
    verify_native_runtime_imports(browser, base_url)
