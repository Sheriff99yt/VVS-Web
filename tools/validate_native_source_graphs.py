"""Native syntax/type checks of original and actual saved-graph Code-panel bytes."""
from validate_native_scalars import main
from validate_native_readiness import ROOT
import json
import sys

if __name__ == '__main__':
    retry = next((arg.split('=', 1)[1].split(',') if arg.split('=', 1)[1] else [] for arg in sys.argv if arg.startswith('--retry-native=')), None)
    main(str(ROOT / 'scratch/native-source-graphs/fixtures.json'), 'native-source-graphs', retry)
    path = ROOT / 'scratch/native-source-graphs/results.json'
    report = json.loads(path.read_text(encoding='utf-8'))
    report['scope'] = 'Established sealed modules and opt-in local/group/inferred graphs through normalized disk-loaded Code-panel output, literal/operator/name/incoming edits and native rejection calibrations. Syntax/type evidence only: not runtime values/effects, inspector reconciliation or inferred worker/browser admission.'
    report['profiles'] = {'cpp': 'Clang19.1.5 C++17 Windows MSVC LLP64 isolated syntax/type checks', 'rust': 'rustc1.99 edition2021 Windows MSVC library metadata-only', 'gdscript': 'Godot4.5.2 isolated headless script check-only'}
    path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8', newline='\n')
