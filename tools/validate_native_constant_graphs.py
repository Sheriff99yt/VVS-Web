"""Compile exact saved-graph modules and independent generated-expression assertions."""
import json
import sys
from validate_native_scalars import main
from validate_native_readiness import ROOT

if __name__ == '__main__':
    retry = next((arg.split('=', 1)[1].split(',') for arg in sys.argv if arg.startswith('--retry-native=')), None)
    main(str(ROOT / 'scratch/native-constant-graphs/fixtures.json'), 'native-constant-graphs', retry)
    path = ROOT / 'scratch/native-constant-graphs/results.json'
    report = json.loads(path.read_text(encoding='utf-8'))
    report['scope'] = 'Canonical saved-graph native scalar constant function modules and independent assertions of actual emitted root expression type/value. C++/Rust const function assertions; Godot check-only function bodies with separate constant expression assertions. No fixture execution or reverse-import lifecycle certification.'
    path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
