"""Pinned compile-only parameter/operator typing, without evaluating fixture values."""
import json
import sys
from validate_native_scalars import main
from validate_native_readiness import ROOT

if __name__ == '__main__':
    retry = next((arg.split('=', 1)[1].split(',') if arg.split('=', 1)[1] else [] for arg in sys.argv if arg.startswith('--retry-native=')), None)
    main(str(ROOT / 'scratch/native-runtime-types/fixtures.json'), 'native-runtime-types', retry)
    path = ROOT / 'scratch/native-runtime-types/results.json'
    report = json.loads(path.read_text(encoding='utf-8'))
    report['scope'] = 'Unknown parameter unary/binary/conversion applicability and result-type contrasts, C++/Rust false-result calibrations; Godot typed returns only. No fixture execution, value/effect safety, graph or browser admission claim.'
    path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8', newline='\n')
