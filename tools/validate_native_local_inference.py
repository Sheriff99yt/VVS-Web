"""Pinned inferred-local applicability/type contrasts; never execute fixtures."""
import json
import sys
from validate_native_scalars import main
from validate_native_readiness import ROOT

if __name__ == '__main__':
    retry = next((arg.split('=', 1)[1].split(',') if arg.split('=', 1)[1] else [] for arg in sys.argv if arg.startswith('--retry-native=')), None)
    main(str(ROOT / 'scratch/native-local-inference/fixtures.json'), 'native-local-inference', retry)
    path = ROOT / 'scratch/native-local-inference/results.json'
    report = json.loads(path.read_text(encoding='utf-8'))
    report['scope'] = 'Handwritten inferred-local originals and C++ decltype/Rust fixed-type positive and false-type calibrations. Godot check-only validity/applicability only, not independent exact-type or runtime-default observation. Analysis-only; no graph/worker/browser admission.'
    path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8', newline='\n')
