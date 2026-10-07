"""Compile canonical Code-panel output from persisted graphs; never execute fixtures."""
from validate_native_scalars import main
from validate_native_readiness import ROOT
import json


def label_graph_report():
    path = ROOT / 'scratch/native-scalar-graphs/results.json'
    report = json.loads(path.read_text(encoding='utf-8'))
    report['scope'] = 'Three persisted scalar identity/unit graph modules through canonical Code-panel emission; native compile/check-only acceptance and undeclared-reference rejection. No runtime execution or reverse-import lifecycle certification.'
    report['profiles'] = {
        'cpp': 'Clang19.1.5 C++17 Windows MSVC LLP64, isolated syntax/type checking',
        'rust': 'rustc1.99 edition2021 Windows MSVC pointer64, library metadata-only compilation',
        'gdscript': 'Godot4.5.2 isolated headless script check-only',
    }
    path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')

if __name__ == '__main__':
    main(str(ROOT / 'scratch/native-scalar-graphs/fixtures.json'), 'native-scalar-graphs')
    label_graph_report()
