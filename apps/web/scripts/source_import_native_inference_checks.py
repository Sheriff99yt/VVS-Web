"""Actual inferred deduction editing, invalid persistence/recovery and reimport."""
import json
from pathlib import Path
from playwright.sync_api import expect


def verify_native_inference_edits(browser, base_url):
    cases = json.loads((Path(__file__).resolve().parents[3] / 'packages/source-import/test/native-inference-edit-cases.json').read_text(encoding='utf-8'))
    for language, fixture in cases.items():
        for kind in ['chain', 'expression', 'literal']:
            source = fixture[kind + 'Typed']
            file_name = 'inference-' + kind + '.' + fixture['extension']
            context = browser.new_context()
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            try:
                page.goto(base_url + '/', wait_until='networkidle')
                page.get_by_role('button', name='Import source…').first.click()
                dialog = page.locator('dialog')
                dialog.get_by_label('Language', exact=False).select_option(language)
                dialog.locator('input[type=file]').set_input_files({'name': file_name, 'mimeType': 'text/plain', 'buffer': source.encode('utf-8')})
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
                saved = page.evaluate("language => Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).find(p => p.targetLanguage === language)", language)
                project_id = saved['projectId']
                fn = saved['functions'][0]
                definition = next(node for node in saved['documents']['main-graph']['nodes'] if node['data'].get('graphBinding', {}).get('symbolId') == fn['id'])
                body = saved['documents'][fn['id']]
                declarations = [node for node in body['nodes'] if node['data']['kindId'] == 'var_define']

                def fit():
                    page.get_by_role('button', name='View', exact=True).click()
                    page.get_by_role('button', name='Zoom to fit all', exact=True).click()

                def home():
                    page.get_by_role('button', name=saved['projectDetails']['moduleName'], exact=True).first.click()
                    fit()

                def open_body():
                    home()
                    page.locator('.react-flow__node[data-id="' + definition['id'] + '"]').dblclick()
                    fit()

                def signature():
                    home()
                    page.locator('.react-flow__node[data-id="' + definition['id'] + '"]').click()
                    if not page.get_by_label('Native return type', exact=True).is_visible():
                        page.locator('summary').filter(has_text='Native signature').click()

                open_body()
                for declaration in declarations:
                    page.locator('.react-flow__node[data-id="' + declaration['id'] + '"]').click()
                    mode = page.get_by_label('Native local mode', exact=True)
                    if not mode.is_visible():
                        page.locator('summary').filter(has_text='Native local declaration').click()
                    mode.select_option('inferred')
                    expect(mode).to_have_value('inferred')
                blocked = page.get_by_role('alert').filter(has_text='Code generation blocked')
                if kind == 'chain':
                    signature()
                    page.get_by_label('Native type for a', exact=True).select_option(fixture['changed'])
                    result_type = fixture['changed']
                else:
                    expression = next(node for node in body['nodes'] if node['data']['kindId'] == ('expr_native_literal' if kind == 'literal' else 'expr_native_operator'))
                    page.locator('.react-flow__node[data-id="' + expression['id'] + '"]').click()
                    if kind == 'literal':
                        page.get_by_label('Value', exact=True).fill('true')
                    else:
                        page.get_by_label('Operator', exact=True).click()
                        page.get_by_role('option', name='+', exact=True).click()
                    result_type = 'bool' if kind == 'literal' else fixture['integer']
                expect(blocked).to_be_visible(timeout=30000)
                expect(page.get_by_role('button', name='Copy code', exact=True)).to_be_disabled()
                page.keyboard.press('Control+s')
                page.wait_for_function("args => { const p = JSON.parse(localStorage.getItem('vvs_project_' + args[0])); const d = p.documents[args[1]]; return d.nodes.filter(n => n.data.kindId === 'var_define').every(n => n.data.properties.nativeInferenceMode && n.data.properties.nativeType === args[2]); }", arg=[project_id, fn['id'], result_type])
                page.reload(wait_until='networkidle')
                expect(blocked).to_be_visible(timeout=30000)
                signature()
                page.get_by_label('Native return type', exact=True).select_option(result_type)
                expect(blocked).not_to_be_visible(timeout=30000)
                expect(code).to_contain_text(result_type, timeout=30000)
                page.keyboard.press('Control+s')
                page.wait_for_function("args => JSON.parse(localStorage.getItem('vvs_project_' + args[0])).documents['main-graph'].nodes.some(n => n.id === args[1] && n.data.properties.nativeReturnType === args[2])", arg=[project_id, definition['id'], result_type])
                page.reload(wait_until='networkidle')
                expect(blocked).not_to_be_visible(timeout=30000)
                edited_code = code.inner_text()

                def compare(text):
                    page.get_by_role('button', name='File', exact=True).click()
                    page.get_by_role('button', name='Re-import source…', exact=True).click()
                    review = page.locator('dialog')
                    review.get_by_label('Imported file', exact=True).fill(file_name)
                    review.get_by_label('Updated source', exact=True).fill(text)
                    review.get_by_role('button', name='Compare source and graph').click()
                    return review

                review = compare(source)
                expect(review.get_by_role('button', name='Apply reviewed re-import')).to_be_enabled(timeout=30000)
                expect(review.get_by_label('Resolve this file')).not_to_be_visible()
                review.get_by_role('button', name='Apply reviewed re-import').click()
                expect(code).to_have_text(edited_code, timeout=30000)
                incoming = source.replace('first', 'incomingFirst') if kind == 'chain' else source.replace('< b', '<= b') if kind == 'expression' else source.replace('1i32', '2i32') if language == 'rust' else source.replace('= 1', '= 2')
                assert incoming != source
                for choice in ['keep-graph', 'use-source']:
                    review = compare(incoming)
                    expect(review.get_by_label('Resolve this file')).to_be_visible(timeout=30000)
                    expect(review.get_by_role('button', name='Apply reviewed re-import')).to_be_disabled()
                    review.get_by_label('Resolve this file').select_option(choice)
                    review.get_by_role('button', name='Apply reviewed re-import').click()
                    if choice == 'keep-graph':
                        expect(code).to_have_text(edited_code, timeout=30000)
                    else:
                        expect(code).to_contain_text('incomingFirst' if kind == 'chain' else '<=' if kind == 'expression' else '2i32' if language == 'rust' else '2', timeout=30000)
                page.keyboard.press('Control+s')
                page.wait_for_function("args => Object.values(JSON.parse(localStorage.getItem('vvs_project_' + args[0])).documents).some(d => d.nodes.some(n => n.data.properties?.sourceImport?.source === args[1]))", arg=[project_id, incoming])
                page.reload(wait_until='networkidle')
                expect(blocked).not_to_be_visible(timeout=30000)
                assert not errors, errors
                print(language + '/' + kind + ': inferred deduction edit, invalid reload, return recovery, valid persistence and both reimport choices passed', flush=True)
            except Exception:
                print(language + '/' + kind + ': ' + page.url, flush=True)
                print(page.locator('body').inner_text(), flush=True)
                raise
            finally:
                context.close()
