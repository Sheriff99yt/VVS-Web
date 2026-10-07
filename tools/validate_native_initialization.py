"""Pinned compiler contrasts for curated scalar-local initialization, not user code."""
import json
import os
import sys
from pathlib import Path
from validate_native_readiness import ROOT, TOOLS, digest, invoke, require, verify_portable_tools

OUTPUT = ROOT / 'scratch/native-initialization'
OUTPUT.mkdir(parents=True, exist_ok=True)


def main(reuse=False):
    fixtures = json.loads(Path(__file__).with_name('native_initialization_cases.json').read_text(encoding='utf-8'))
    clang = Path(os.environ.get('VVS_CLANGXX', r'X:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\Llvm\x64\bin\clang++.exe'))
    require(digest(clang.read_bytes()) == '20a8e84f2bd6a9b771f05caf764a67054e917177d132d119986e7c7936e148b8', 'Clang pin mismatch')
    hashes = verify_portable_tools()
    previous = json.loads((OUTPUT / 'results.json').read_text(encoding='utf-8')) if reuse else None
    if reuse:
        require(previous['toolchainHashes'] == hashes and not previous['failures'], 'Retained initialization toolchain/failure drift')
        require(len(previous['cases']) == sum(len(cases) for cases in fixtures.values()), 'Retained initialization case count drift')
    project = OUTPUT / 'godot'
    project.mkdir(exist_ok=True)
    (project / 'project.godot').write_text('config_version=5\n[application]\nconfig/name="VVS trusted initialization checks"\n', encoding='utf-8', newline='\n')
    results, failures = [], []
    for language, cases in fixtures.items():
        for case in cases:
            path = OUTPUT / (language + '-' + case['id'] + {'cpp': '.cpp', 'rust': '.rs', 'gdscript': '.gd'}[language])
            if not reuse:
                path.write_text(case['source'], encoding='utf-8', newline='\n')
            require(path.read_bytes() == case['source'].encode('utf-8'), 'Native input byte drift')
            if language == 'cpp':
                command = [clang, '--target=x86_64-pc-windows-msvc', '-std=c++17', '-nostdinc', '-nostdinc++', '-fsyntax-only',
                           '-fno-color-diagnostics', '-Werror=uninitialized', '-Werror=sometimes-uninitialized', path]
            elif language == 'rust':
                command = [TOOLS / 'rust/bin/rustc.exe', '--sysroot', TOOLS / 'rust', '--edition=2021', '--target=x86_64-pc-windows-msvc',
                           '--crate-type=lib', '--crate-name=trusted_initialization', '--emit=metadata', '--error-format=json', '-o', OUTPUT / 'trusted.rmeta', path]
            else:
                command = [TOOLS / 'godot/Godot_v4.5.2-stable_win64_console.exe', '--headless', '--path', project, '--check-only', '--script', path]
            if reuse:
                matches = [item for item in previous['cases'] if item['language'] == language and item['id'] == case['id']]
                require(len(matches) == 1, 'Retained initialization identity drift')
                cached = matches[0]
                require(cached['sourceSha256'] == digest(path.read_bytes()) and cached['expectedValid'] == case['valid']
                        and cached['command'] == [str(arg) for arg in command] and not cached['errors'], 'Retained initialization input/command drift')
                code = cached['exitCode']
                stdout = (OUTPUT / (language + '-' + case['id'] + '.stdout')).read_text(encoding='utf-8')
                stderr = (OUTPUT / (language + '-' + case['id'] + '.stderr')).read_text(encoding='utf-8')
            else:
                code, stdout, stderr = invoke(command)
            errors = []
            if (code == 0) != case['valid']:
                errors.append('native acceptance differs')
            if not case['valid'] and case['diagnostic'].lower() not in (stdout + stderr).lower():
                errors.append('native diagnostic absent')
            if not reuse:
                for kind, text in [('stdout', stdout), ('stderr', stderr)]:
                    (OUTPUT / (language + '-' + case['id'] + '.' + kind)).write_text(text, encoding='utf-8', newline='\n')
            results.append({'language': language, 'id': case['id'], 'sourceSha256': digest(path.read_bytes()), 'expectedValid': case['valid'],
                            'exitCode': code, 'command': [str(arg) for arg in command], 'errors': errors})
            failures.extend(language + '/' + case['id'] + ': ' + error for error in errors)
    report = {'scope': 'ordinary scalar local initialization; no values/effects/graph admission', 'toolchainHashes': hashes,
              'profiles': {'cpp': 'Clang19.1.5 C++17 MSVC with uninitialized/sometimes-uninitialized warnings as errors; unsafe-read policy, not compiler validity',
                           'rust': 'rustc1.99 edition2021 MSVC definite-initialization and immutable-assignment checks',
                           'gdscript': 'Godot4.5.2 isolated check-only native defaults; no observed runtime default values'}, 'cases': results, 'failures': failures}
    if reuse:
        require(previous['profiles'] == report['profiles'], 'Retained initialization profile drift')
    else:
        (OUTPUT / 'results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Native initialization: {len(results)} curated compiler contrasts, {len(failures)} failures; {"exact retained inputs/commands/pins" if reuse else "fresh compiler inputs"}; no programs executed')
    require(not failures, '\n'.join(failures))


if __name__ == '__main__':
    main('--reuse-native' in sys.argv)
