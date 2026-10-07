"""Browser syntax asset evidence, distinct from native facts or import acceptance."""
import json
from pathlib import Path

CASES = json.loads((Path(__file__).resolve().parents[3] / 'tools/native_readiness_cases.json').read_text(encoding='utf-8'))
PINS = {
    'rust': ('0.24.0', 'f65f354215611fd94ad34134b3427eb3d58cbb745df7b6509ba722184db73d57'),
    'cpp': ('0.23.4', '174eb0deb75b2ec7881bcacda9f995648d8e683956e5c2267e69ab6dc503fcbf'),
    'gdscript': ('6.1.0', '24e7a0d164b8c4d3068b7ff9cf665a977c16b3cca6cb13125f4a036d9e72dc90'),
}


def verify_native_grammar_assets(browser, base):
    context = browser.new_context()
    try:
        page = context.new_page()
        paths, errors = [], []
        page.on('request', lambda request: paths.append(request.url))
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/source-parsers/manifest.json', wait_until='load')
        evidence = page.evaluate("""async ({base, cases, pins}) => {
          const manifest = await (await fetch(base + '/source-parsers/manifest.json')).json();
          const {Parser, Language} = await import(base + '/source-parsers/web-tree-sitter.js');
          await Parser.init({locateFile: () => base + '/source-parsers/web-tree-sitter.wasm'});
          const result = [];
          for (const kind of ['rust', 'cpp', 'gdscript']) {
            const file = `tree-sitter-${kind}.wasm`;
            const bytes = new Uint8Array(await (await fetch(base + '/source-parsers/' + file)).arrayBuffer());
            const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2,'0')).join('');
            if (manifest.versions[kind] !== pins[kind][0] || manifest.abis[kind] !== 14 || hash !== pins[kind][1]) throw Error('Grammar identity drift: ' + kind);
            const language = await Language.load(bytes);
            const parser = new Parser();
            try {
              parser.setLanguage(language);
              for (const fixture of cases[kind]) {
                const tree = parser.parse(fixture.source);
                try {
                  if (tree.rootNode.hasError || tree.rootNode.text !== fixture.source.slice(tree.rootNode.startIndex, tree.rootNode.endIndex)) throw Error('Syntax/source drift: ' + kind + '/' + fixture.id);
                  let position = 0, retained = '';
                  for (const node of tree.rootNode.namedChildren) {
                    retained += fixture.source.slice(position, node.startIndex) + node.text;
                    position = node.endIndex;
                  }
                  retained += fixture.source.slice(position);
                  if (retained !== fixture.source) throw Error('Trivia/Unicode retention drift: ' + kind + '/' + fixture.id);
                  result.push({kind, id: fixture.id, abi: language.abiVersion});
                } finally { tree.delete(); }
              }
            } finally { parser.delete(); }
          }
          return result;
        }""", {'base': base, 'cases': CASES, 'pins': PINS})
        assert len(evidence) == 36 and all(item['abi'] == 14 for item in evidence), evidence
        for kind in PINS:
            assert base + '/source-parsers/tree-sitter-' + kind + '.wasm' in paths
        assert not errors, errors
        print('Browser Rust/C++/GDScript: 36 syntax/source fixtures, pinned hashes/ABI and base-path assets passed; native semantics and visual acceptance remain unvalidated')
    finally:
        context.close()
