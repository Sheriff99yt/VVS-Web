from playwright.sync_api import sync_playwright, expect
import os, json
from source_import_csharp_checks import verify_csharp_analysis
from source_import_native_scalar_checks import verify_native_scalar_imports
base_url = os.environ.get('VVS_TEST_URL', 'http://localhost:3100')

def seed_reimport_context(page, snapshot):
    # Trusted persisted-project fixture, then exercise the real editor/worker/apply path.
    snapshot['autoCompile'] = False
    snapshot['autoSave'] = True
    snapshot['workspaceFiles'] = ['docs/README.md', 'assets/icon.svg']
    language = snapshot['targetLanguage']
    snapshot['syntaxPackLock'] = {language: {'base': language+'.base@1', 'overlays': ['javascript.es2022@1'] if language == 'javascript' else []}}
    snapshot['codegenCapabilities'] = {language: ['es2022'] if language == 'javascript' else []}
    snapshot['graphContainers'][0]['name'] = 'Retained file folder'
    page.evaluate("snapshot => { const key = Object.keys(localStorage).find(k => k.startsWith('vvs_project_') && JSON.parse(localStorage.getItem(k)).projectId === snapshot.projectId); if (!key) throw Error('Project fixture missing'); localStorage.setItem(key, JSON.stringify(snapshot)); }", snapshot)
    page.reload(wait_until='networkidle')

def assert_reimport_context(page, snapshot, marker='String(value)'):
    page.keyboard.press('Control+s')
    page.wait_for_function("({id, marker}) => Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).some(k => { const p = JSON.parse(localStorage.getItem(k)); return p.projectId === id && Object.values(p.documents).some(d => d.nodes.some(n => n.data.properties?.sourceImport?.source.includes(marker))); })", arg={'id': snapshot['projectId'], 'marker': marker}, timeout=30000)
    page.reload(wait_until='networkidle')
    saved = page.evaluate("id => Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).find(p => p.projectId === id)", snapshot['projectId'])
    for key in ['autoCompile', 'autoSave', 'workspaceFiles', 'syntaxPackLock', 'codegenCapabilities', 'graphContainers']:
        assert saved[key] == snapshot[key], key + ' changed during re-import/save/reload'

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    examples = [('javascript','function identity(value) { return value; }','function identity'), ('python','def identity(value):\n    return value\n','def identity'),
        ('javascript','function identity(value) { return value; } function pipeline(value) { const copy = identity(value); identity(copy); return identity(copy); }','identity(copy)'),
        ('python','def identity(value):\n    return value\n\ndef pipeline(value):\n    copy = identity(value)\n    identity(copy)\n    return identity(copy)\n','identity(copy)'),
        ('javascript','function identity(value) { return value; } function scan(input) { const limit = Number(input); let total = 0; for (let index = 0; index < limit; index++) { let cursor = 0; while (cursor < 2) { if (index === 1) { identity(total); } total += index; cursor++; } } return identity(total); }','for (let index'),
        ('python','def stop():\n    value = 1\n    while value < 3:\n        if value == 1:\n            value = 3\n        else:\n            return value\n    return value\n','while (value < 3)')]
    examples.extend([
        ('javascript','class Counter { count = 0; constructor(value) { this.count = Number(value); } increment() { this.count++; return this.count; } }','constructor(value)'),
        ('python','class Counter:\n    def __init__(self, value):\n        self.value = value\n    def read(self):\n        return self.value\n','self.value'),
        ('python','def sum():\n    total = 0\n    for index in range(4):\n        total = total + index\n    return total\n','range(4)'),
        ('javascript','function identity(value) { return value; } function repeat(value) { while (identity(value) === true) { break; } return value; }','while')])
    examples.extend([
        ('javascript','function build(value) { const items = [value, , ...value]; return { value, "key": items[0], ...value }; }','...value'),
        ('python','def build(value):\n    items = [0xff, *value]\n    return {"key": items[1::2], **value}\n','**value')])
    examples.extend([
        ('javascript', 'function collect(first = 1, ...rest) { return [first, rest]; } function use() { return collect(2, 3, 4); }', '...rest'),
        ('python', 'def choose(first, second=[2]):\n    return [first, second]\ndef use():\n    return choose(second=[3], first=1)\n', 'choose(second=[3], first=1)'),
        ('python', 'def collect(first=1, *rest):\n    return [first, rest]\ndef use():\n    return collect(2, 3, 4)\n', '*rest'),
    ])
    examples.extend([
        ('go', 'package sample\nfunc identity(value float64) float64 { return value }', 'func identity(value float64) float64'),
        ('go', 'package sample\nfunc choose(flag bool, left string, right string) string { if flag { return left } else { return right } }', 'func choose(flag bool'),
        ('go', 'package sample\nfunc scale(value float64) float64 { return value * 2 }\nfunc pipeline(value float64) float64 { return scale(scale(value)) }', 'scale(scale(value))'),
    ])
    examples.extend([
        ('go', 'package sample\nfunc maximum() uint64 { return 0xffff_ffff_ffff_ffff }', '0xffff_ffff_ffff_ffff'),
        ('go', 'package sample\nfunc counted(limit int) int { total := 0; for index := 0; index < limit; index++ { total += index }; return total }', 'index++'),
        ('go', 'package sample\nfunc boundary() int { copy := 2147483647; return copy }', '2147483647'),
        ('go', 'package sample\nfunc divide(left int64, right int64) int64 { return left / right }', 'left / right'),
        ('go', 'package sample\nfunc identity(value uint64) uint64 { copy := value; copy++; return copy }\nfunc pipeline(value uint64) uint64 { return identity(value) }', 'value uint64'),
        ('go', 'package sample\nfunc typed(value float64) float64 { var copy float64 = 0; copy = value; return copy }', 'copy = value'),
        ('go', 'package sample\nfunc flow(start float64, limit float64) float64 { var total float64 = 0; for index := start; index < limit; index++ { if index == 2 { continue }; if index > 4 { break }; total += index }; return total }', 'index++'),
        ('go', 'package sample\nfunc scale(value float64) float64 { return value * 2 }\nfunc pipeline(value float64) float64 { copy := scale(value); for copy < 10 { copy = scale(copy) }; return copy }', 'copy := scale(value)'),
        ('go', 'package sample\nfunc shadow(flag bool, value float64) float64 { copy := value; if flag { copy := value * 2; return copy } else { return copy } }', 'copy := (value * 2)'),
    ])
    examples.extend([
        ('go', 'package sample\nfunc shifted(count uint8) uint64 { return 1 << count }', '1 << count'),
        ('go', 'package sample\nfunc complement(count uint8) uint8 { return ^(1 << count) }', '^(1 << count)'),
        ('go', 'package sample\nfunc compound(value uint64, count uint8) uint64 { copy := value; copy %= 7; copy &^= 4; copy <<= count; return copy }', 'copy <<= count'),
        ('go', 'package sample\nfunc large(value uint8) uint8 { return value << 18446744073709551615 }', '18446744073709551615'),
        ('go', 'package sample\nfunc signedCount(left uint64, count uint8) uint64 { return left << (-1 << count) }', '(-1) << count'),
    ])
    examples.extend([
        ('go', 'package sample\nfunc sum() float64 { return 1.5 + 2.5 }', '1.5 + 2.5'),
        ('go', 'package sample\nfunc fraction() float64 { value := 0.1 + 0.2; return value }', '0.1 + 0.2'),
        ('go', 'package sample\nfunc hex() float64 { return 0x_1.fp+2 }', '0x_1.fp+2'),
        ('go', 'package sample\nfunc exact() uint64 { return 18446744073709551615.0 }', '18446744073709551615.0'),
    ])
    examples.extend([
        ('go', 'package sample\nfunc identity(value float32) float32 { copy := value; copy += .1; return copy }', 'value float32'),
        ('go', 'package sample\nfunc convert(value float64) int32 { return int32(value) }', 'int32(value)'),
        ('go', 'package sample\nfunc constant() float64 { return float64(float32(.1)) }', 'float64(float32(.1))'),
        ('go', 'package sample\nfunc mixed(limit int) float32 { var total float32 = 0; for index := 0; index < limit; index++ { total += float32(index) / 10; if total > 2 { break } }; return total }', 'float32(index)'),
    ])
    examples.extend([
        ('go', 'package sample\nfunc exact() uint64 { const maximum = 18446744073709551615; return maximum }', 'const maximum = 18446744073709551615'),
        ('go', 'package sample\nfunc exact() float64 { const tenth float32 = .1; return float64(tenth) }', 'const tenth float32 = .1'),
        ('go', 'package sample\nfunc enabled() bool { const threshold = 1.0 / 3.0 < .5; return !false && threshold }', 'const threshold ='),
        ('go', 'package sample\nfunc composed(limit int) float64 { const step = 1.0 / 10.0; total := 0.0; for index := 0; index < limit; index++ { const ceiling = .5; total += step; if total > ceiling { break } }; return total }', 'const ceiling = .5'),
    ])
    examples.extend([
        ('go','package sample\nfunc check() bool { return true }\nfunc conditional(flag bool) bool { return flag && check() }','flag && check()'),
        ('go','package sample\nfunc check(flag bool) bool { return flag }\nfunc nested(first bool, second bool, third bool) bool { return check(first) || (check(second) && check(third)) }','check(first) ||'),
        ('go','package sample\nfunc check() bool { return true }\nfunc repeated(flag bool) bool { return flag && (check() && check()) }','check() && check()'),
        ('go','package sample\nfunc positive(value int) bool { return value >= 0 }\nfunc count(limit int) int { count := 0; for count < limit && positive(count) { count++ }; return count }','positive(count)'),
    ])
    for language, source, expected in examples:
        context=browser.new_context()
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(base_url,wait_until='networkidle')
        page.get_by_role('button',name='Import source…').first.click()
        dialog=page.locator('dialog')
        dialog.get_by_label('Language',exact=False).select_option(language)
        if language == 'go':
            dialog.get_by_label('Go target word size',exact=True).select_option('32' if '2147483647' in source else '64')
        dialog.get_by_label('Original source').fill(source)
        dialog.get_by_role('button',name='Analyze source').click()
        dialog.get_by_role('button',name='Mapping candidate',exact=False).first.click()
        dialog.get_by_label('Compilation unit').select_option('library')
        dialog.get_by_role('button',name='Build and validate preview').click()
        expect(dialog.get_by_role('button',name='Accept as new project')).to_be_visible(timeout=30000)
        expect(dialog.locator('pre').last).to_contain_text(expected)
        dialog.get_by_role('button',name='Accept as new project').click()
        expect(dialog).not_to_be_visible(timeout=30000)
        page.wait_for_url('**/editor?**', wait_until='networkidle')
        expect(page.locator('.react-flow__node').first).to_be_visible(timeout=30000)
        welcome = page.get_by_role('dialog').filter(has=page.locator('#graph-help-title'))
        expect(welcome).to_be_visible(timeout=30000)
        welcome.get_by_role('button', name='Close', exact=True).click()
        expect(welcome).not_to_be_visible()
        page.reload(wait_until='networkidle')
        expect(page.locator('.react-flow__node').first).to_be_visible(timeout=30000)
        stored = page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => localStorage.getItem(k))")
        imported = [json.loads(value) for value in stored if json.loads(value).get('projectId', '').startswith('proj-')]
        assert len(imported) == 1, 'Expected one imported project alongside built-in examples'
        snapshot = imported[0]
        expect(page.locator('.cm-content').filter(has_text=expected).first).to_be_visible(timeout=30000)
        expect(page.get_by_role('alert').filter(has_text='Code generation blocked')).not_to_be_visible()
        assert snapshot['targetLanguage'] == language
        if language == 'go':
            package = next(node for doc in snapshot['documents'].values() for node in doc['nodes'] if node['data'].get('kindId') == 'source_package')
            assert package['data']['properties']['goWordBits'] == ('32' if '2147483647' in source else '64')
        if 'func conditional(flag bool)' in source:
            call = next(node for doc in snapshot['documents'].values() for node in doc['nodes'] if node['data'].get('kindId') == 'vvs.project.call_function')
            assert call['data']['properties']['callPlacement'] == 'expression'
            assert all(pin['type'] != 'execution' for pin in call['data']['inputs'] + call['data']['outputs'])
            page.get_by_text('Function: conditional', exact=True).click()
            page.locator('.react-flow__node[data-id="' + call['id'] + '"]').click()
            expect(page.get_by_label('Call placement', exact=True)).to_be_visible()
            page.get_by_label('Call placement', exact=True).click()
            page.get_by_role('option', name='statement', exact=True).click()
            expect(page.get_by_role('alert').filter(has_text='Code generation blocked')).to_be_visible(timeout=30000)
            expect(page.get_by_role('button', name='Copy code', exact=True)).to_be_disabled()
            page.get_by_label('Call placement', exact=True).click()
            page.get_by_role('option', name='expression', exact=True).click()
            expect(page.get_by_role('alert').filter(has_text='Code generation blocked')).not_to_be_visible(timeout=30000)
            expect(page.locator('.cm-content').filter(has_text='flag && check()').first).to_be_visible(timeout=30000)
            page.wait_for_function("({projectId, nodeId}) => Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).filter(p => p.projectId === projectId).some(p => Object.values(p.documents).some(d => d.nodes.some(n => n.id === nodeId && n.data.properties.callPlacement === 'expression')))", arg={'projectId': snapshot['projectId'], 'nodeId': call['id']})
            page.reload(wait_until='networkidle')
            expect(page.locator('.cm-content').filter(has_text='flag && check()').first).to_be_visible(timeout=30000)
            print('go expression-call inspector: ownership invalid edit, recovery and reload passed')
        if '0xffff_ffff_ffff_ffff' in source:
            assert any(node['data'].get('properties', {}).get('payload') == '0xffff_ffff_ffff_ffff' for doc in snapshot['documents'].values() for node in doc['nodes'])
        assert any(node['data'].get('kindId') == 'function_implement' for doc in snapshot['documents'].values() for node in doc['nodes'])
        if '...value' in source or '**value' in source:
            assert any(node['data'].get('kindId') == 'expr_native_collection' for doc in snapshot['documents'].values() for node in doc['nodes'])
        if source == 'package sample\nfunc exact() float64 { const tenth float32 = .1; return float64(tenth) }':
            page.get_by_text('Function: exact', exact=True).click()
            constant = next(node for doc in snapshot['documents'].values() for node in doc['nodes'] if node['data'].get('properties', {}).get('nativeLocalStyle') == 'go-const')
            page.locator('.react-flow__node[data-id="' + constant['id'] + '"]').click()
            page.get_by_label('Native scalar type', exact=True).click()
            page.get_by_role('option', name='int8', exact=True).click()
            expect(page.get_by_role('alert').filter(has_text='Code generation blocked')).to_be_visible(timeout=30000)
            expect(page.get_by_role('button', name='Copy code', exact=True)).to_be_disabled()
            page.get_by_label('Native scalar type', exact=True).click()
            page.get_by_role('option', name='float64', exact=True).click()
            expect(page.locator('.cm-content').filter(has_text='const tenth float64 = .1').first).to_be_visible(timeout=30000)
            expect(page.get_by_role('alert').filter(has_text='Code generation blocked')).not_to_be_visible()
            page.wait_for_function("({projectId, nodeId}) => Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).filter(p => p.projectId === projectId).some(p => Object.values(p.documents).some(d => d.nodes.some(n => n.id === nodeId && n.data.properties.nativeType === 'float64')))", arg={'projectId': snapshot['projectId'], 'nodeId': constant['id']})
            page.reload(wait_until='networkidle')
            expect(page.locator('.cm-content').filter(has_text='const tenth float64 = .1').first).to_be_visible(timeout=30000)
            print('go constant inspector: declaration type edit, native Code output and reload passed')
        if source == 'package sample\nfunc convert(value float64) int32 { return int32(value) }':
            page.get_by_text('Function: convert', exact=True).click()
            cast = next(node for doc in snapshot['documents'].values() for node in doc['nodes'] if node['data'].get('properties', {}).get('nativeForm') == 'conversion')
            page.locator('.react-flow__node[data-id="' + cast['id'] + '"]').click()
            expect(page.get_by_label('Convert to', exact=True)).to_be_visible()
            page.get_by_label('Convert to', exact=True).click()
            page.get_by_role('option', name='rune', exact=True).click()
            expect(page.locator('.react-flow__node[data-id="' + cast['id'] + '"]')).to_contain_text('Convert to rune')
            expect(page.get_by_label('Operator', exact=True)).not_to_be_visible()
            expect(page.locator('.cm-content').filter(has_text='rune(value)').first).to_be_visible(timeout=30000)
            expect(page.locator('.cm-content').filter(has_text='func convert(value float64) int32').first).to_be_visible(timeout=30000)
            page.wait_for_function("({projectId, nodeId}) => Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => JSON.parse(localStorage.getItem(k))).filter(p => p.projectId === projectId).some(p => Object.values(p.documents).some(d => d.nodes.some(n => n.id === nodeId && n.data.properties.nativeTargetType === 'rune')))", arg={'projectId': snapshot['projectId'], 'nodeId': cast['id']})
            page.reload(wait_until='networkidle')
            stored_after = page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => localStorage.getItem(k))")
            edited = next(json.loads(value) for value in stored_after if json.loads(value).get('projectId') == snapshot['projectId'])
            assert next(node for doc in edited['documents'].values() for node in doc['nodes'] if node['id'] == cast['id'])['data']['properties']['nativeTargetType'] == 'rune'
            print('go conversion inspector: native target edit, alias identity and reload passed')
        assert not errors, errors
        print(language+': production preview, graph, generated code, accept, persistence, reload passed')
        if (language == 'javascript' and source == 'function identity(value) { return value; }') or (language == 'go' and source == 'package sample\nfunc identity(value float64) float64 { return value }'):
            replacement = 'package sample\nfunc identity(value float64) float64 { return value * 3 }' if language == 'go' else 'function identity(value) { return String(value); }'
            marker = 'value * 3' if language == 'go' else 'String(value)'
            seed_reimport_context(page, snapshot)
            page.get_by_role('button', name='File', exact=True).click()
            page.get_by_role('button', name='Re-import source…', exact=True).click()
            reimport = page.locator('dialog')
            reimport.get_by_label('Updated source', exact=True).fill(replacement)
            reimport.get_by_role('button', name='Compare source and graph').click()
            expect(reimport.get_by_role('button', name='Apply reviewed re-import')).to_be_enabled(timeout=30000)
            expect(reimport.locator('pre').last).to_contain_text(marker)
            reimport.get_by_role('button', name='Apply reviewed re-import').click()
            expect(reimport).not_to_be_visible()
            assert_reimport_context(page, snapshot, marker)
            print('re-import: retained context, worker review, apply, save and reload passed')
        context.close()
    for source, marker in [
        ('package sample\nfunc boundary() int { copy := 2147483648; return copy }', 'NATIVE_GO_INTEGER_OVERFLOW'),
        ('package sample\nfunc ratio() float64 { return 1e1400 / 1e1400 }', 'NATIVE_GO_RATIONAL_BIG_FLOAT_PREREQUISITE'),
    ]:
        context=browser.new_context()
        page=context.new_page()
        page.goto(base_url,wait_until='networkidle')
        page.get_by_role('button',name='Import source…').first.click()
        dialog=page.locator('dialog')
        dialog.get_by_label('Language',exact=False).select_option('go')
        dialog.get_by_label('Go target word size',exact=True).select_option('32')
        dialog.get_by_label('Original source').fill(source)
        dialog.get_by_role('button',name='Analyze source').click()
        dialog.get_by_role('button',name='Mapping candidate',exact=False).first.click()
        dialog.get_by_role('button',name='Build and validate preview').click()
        expect(dialog.get_by_role('alert')).to_contain_text(marker,timeout=30000)
        expect(dialog.get_by_role('button',name='Accept as new project')).not_to_be_visible()
        expect(dialog.get_by_label('Original source')).to_have_value(source)
        context.close()
    print('go: 32-bit overflow and big.Float prerequisites blocked without losing source')
    context=browser.new_context()
    page=context.new_page()
    page.goto(base_url,wait_until='networkidle')
    page.get_by_role('button',name='Import source…').first.click()
    dialog=page.locator('dialog')
    files=[{'name':'main.js','mimeType':'text/javascript','buffer':b'import { identity as copy } from "./math.js"; export function pipeline(value) { return copy(value); }'}, {'name':'math.js','mimeType':'text/javascript','buffer':b'export function identity(value) { return value; }'}]
    dialog.locator('input[type=file][multiple]').set_input_files(files)
    expect(dialog.get_by_role('button',name='Accept as new project')).to_be_enabled(timeout=30000)
    expect(dialog.locator('pre').last).to_contain_text('export function')
    dialog.get_by_role('button',name='Accept as new project').click()
    expect(dialog).not_to_be_visible(timeout=30000)
    page.wait_for_url('**/editor?**', wait_until='networkidle')
    expect(page.locator('.react-flow__node').first).to_be_visible(timeout=30000)
    welcome = page.get_by_role('dialog').filter(has=page.locator('#graph-help-title'))
    expect(welcome).to_be_visible(timeout=30000)
    welcome.get_by_role('button', name='Close', exact=True).click()
    expect(welcome).not_to_be_visible()
    page.reload(wait_until='networkidle')
    stored=page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('vvs_project_')).map(k => localStorage.getItem(k))")
    imported=[json.loads(value) for value in stored if json.loads(value).get('projectId','').startswith('proj-')]
    assert len(imported)==1 and len(imported[0]['classes'])==2
    assert sorted(doc['metadata']['sourceFileName'] for doc in imported[0]['documents'].values() if doc.get('metadata',{}).get('sourceFileName'))==['main.js','math.js']
    snapshot = imported[0]
    seed_reimport_context(page, snapshot)
    page.get_by_role('button', name='File', exact=True).click()
    page.get_by_role('button', name='Re-import source…', exact=True).click()
    reimport = page.locator('dialog')
    reimport.get_by_label('Imported file', exact=True).fill('math.js')
    reimport.get_by_label('Updated source', exact=True).fill('export function identity(value) { return String(value); }')
    reimport.get_by_role('button', name='Compare source and graph').click()
    expect(reimport.get_by_role('button', name='Apply reviewed re-import')).to_be_enabled(timeout=30000)
    expect(reimport.locator('pre').last).to_contain_text('String(value)')
    reimport.get_by_role('button', name='Apply reviewed re-import').click()
    expect(reimport).not_to_be_visible()
    assert_reimport_context(page, snapshot)
    print('modules: atomic multi-file review, accept and reload passed')
    context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page()
    page.goto(base_url+'/docs/nodes/flow_branch',wait_until='load')
    expect(page.get_by_role('heading',level=1)).to_be_visible()
    assert 'flow_branch' in page.content()
    print('docs: no-JavaScript facts rendered')
    verify_csharp_analysis(browser, base_url)
    verify_native_scalar_imports(browser, base_url)
    browser.close()
