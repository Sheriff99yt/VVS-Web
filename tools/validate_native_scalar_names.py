"""Pinned ordinary function/parameter keyword contrasts; never execute fixtures."""
from validate_native_scalars import main
from validate_native_readiness import ROOT
import sys
import json


def label_name_report():
    path = ROOT / 'scratch/native-scalar-names/results.json'
    report = json.loads(path.read_text(encoding='utf-8'))
    report['scope'] = 'Pinned ordinary scalar function/parameter ASCII keyword contrasts and Godot scalar type-name shadowing/builtin conversion contexts. Not Unicode/raw/implementation-reserved names or reverse-import lifecycle certification.'
    report['profiles'] = {'cpp': 'Clang19.1.5 C++17 Windows MSVC syntax/type checks', 'rust': 'rustc1.99 edition2021 library metadata-only checks', 'gdscript': 'Godot4.5.2 headless check-only name/type contexts'}
    path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')

if __name__ == '__main__':
    retry = next((arg.split('=', 1)[1].split(',') for arg in sys.argv if arg.startswith('--retry-native=')), None)
    main(str(ROOT / 'scratch/native-scalar-names/fixtures.json'), 'native-scalar-names', retry)
    label_name_report()
