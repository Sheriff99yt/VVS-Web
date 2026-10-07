"""Independent compile-only evidence for curated XL-01 fixtures, never user code.

Portable Rust/Godot archives must already exist under scratch/native-toolchains.
This gate fails on unavailable or mismatched prerequisites; it never skips them.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'scratch/native-toolchains'
OUTPUT = ROOT / 'scratch/native-readiness'
OUTPUT.mkdir(parents=True, exist_ok=True)
CASES = json.loads(Path(__file__).with_name('native_readiness_cases.json').read_text(encoding='utf-8'))
for language, cases in json.loads(Path(__file__).with_name('native_binding_cases.json').read_text(encoding='utf-8')).items():
    CASES[language].extend(cases)
PINS = {
    'rustc-1.99.0-x86_64-pc-windows-msvc.tar.xz': '20fed82e629c1ed145f9e9bdee9aad65e790d4237a49bcfc61221eda69e35b14',
    'rust-std-1.99.0-x86_64-pc-windows-msvc.tar.xz': 'adadeafff137a7610884696912b853d4de259c4299ab035b66661e2e0f923ff0',
    'Godot_v4.5.2-stable_win64.exe.zip': '3766090865330ab2a0ed33594520394b711c620b1378f9223904faeef60f2f14',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def invoke(command):
    result = subprocess.run([str(arg) for arg in command], capture_output=True, timeout=90,
                            encoding='utf-8', errors='replace', cwd=OUTPUT)
    return result.returncode, result.stdout, result.stderr


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def verify_portable_tools():
    hashes = {}
    for name, expected in PINS.items():
        archive = TOOLS / name
        require(archive.exists(), f'Missing pinned archive: {archive}')
        require(digest(archive.read_bytes()) == expected, f'Archive pin mismatch: {name}')
        hashes[name] = expected
        if name.endswith('.zip'):
            with zipfile.ZipFile(archive) as bundle:
                for entry in bundle.infolist():
                    if entry.is_dir():
                        continue
                    installed = TOOLS / 'godot' / entry.filename
                    expected_file = digest(bundle.read(entry))
                    require(digest(installed.read_bytes()) == expected_file, f'Godot file drift: {entry.filename}')
                    hashes[entry.filename] = expected_file
        else:
            component = 'rustc' if name.startswith('rustc-') else 'rust-std-x86_64-pc-windows-msvc'
            prefix = name.removesuffix('.tar.xz') + '/' + component + '/'
            with tarfile.open(archive) as bundle:
                for entry in bundle.getmembers():
                    if not entry.isfile() or not entry.name.startswith(prefix):
                        continue
                    relative = entry.name[len(prefix):]
                    if not relative.startswith(('bin/', 'lib/')):
                        continue
                    expected_file = digest(bundle.extractfile(entry).read())
                    require(digest((TOOLS / 'rust' / relative).read_bytes()) == expected_file,
                            f'Rust file drift: {relative}')
                    hashes[relative] = expected_file
    return hashes


def declarations(tree):
    found = []
    if tree.get('kind') in ('FunctionDecl', 'ParmVarDecl', 'VarDecl') and tree.get('name'):
        found.append({'name': tree['name'], 'kind': tree['kind'], 'type': tree.get('type'), 'location': tree.get('loc'),
                      'range': tree.get('range'), 'id': tree.get('id')})
    for child in tree.get('inner', []):
        found.extend(declarations(child))
    return found


def local_references(tree):
    result = []
    target = tree.get('referencedDecl', {})
    if tree.get('kind') == 'DeclRefExpr' and target.get('kind') in ('ParmVarDecl', 'VarDecl'):
        result.append({'targetId': target['id'], 'name': target['name'], 'range': tree.get('range')})
    for child in tree.get('inner', []):
        result.extend(local_references(child))
    return result


def main():
    clang = Path(os.environ.get('VVS_CLANGXX', r'X:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\Llvm\x64\bin\clang++.exe'))
    require(clang.exists(), 'Configure VVS_CLANGXX to the pinned Clang 19.1.5 compiler')
    require(digest(clang.read_bytes()) == '20a8e84f2bd6a9b771f05caf764a67054e917177d132d119986e7c7936e148b8', 'Clang binary pin mismatch')
    hashes = verify_portable_tools()
    rustc = TOOLS / 'rust/bin/rustc.exe'
    godot = TOOLS / 'godot/Godot_v4.5.2-stable_win64_console.exe'
    versions = {}
    for language, command, expected in [
        ('cpp', [clang, '--version'], 'clang version 19.1.5'),
        ('rust', [rustc, '--version', '--verbose'], 'rustc 1.99.0'),
        ('gdscript', [godot, '--version'], '4.5.2.stable'),
    ]:
        code, stdout, stderr = invoke(command)
        require(code == 0 and expected in stdout, f'{language} version mismatch: {stdout}{stderr}')
        versions[language] = stdout.strip()
    project = OUTPUT / 'godot'
    project.mkdir(exist_ok=True)
    (project / 'project.godot').write_text('config_version=5\n[application]\nconfig/name="VVS trusted check-only fixtures"\n')
    results = []
    failures = []
    for language, fixtures in CASES.items():
        for case in fixtures:
            path = OUTPUT / (language + '-' + case['id'] + {'cpp': '.cpp', 'rust': '.rs', 'gdscript': '.gd'}[language])
            path.write_text(case['source'], encoding='utf-8', newline='\n')
            require(path.read_bytes() == case['source'].encode('utf-8'), f'Compiler input bytes differ: {language}/{case["id"]}')
            if language == 'cpp':
                command = [clang, '--target=x86_64-pc-windows-msvc', '-std=c++17', '-nostdinc', '-nostdinc++',
                           '-fsyntax-only', '-fno-color-diagnostics', '-Xclang', '-ast-dump=json', path]
            elif language == 'rust':
                command = [rustc, '--sysroot', TOOLS / 'rust', '--edition=2021', '--target=x86_64-pc-windows-msvc',
                           '--crate-type=lib', '--crate-name=trusted_fixture', '--emit=metadata', '--error-format=json',
                           '-o', OUTPUT / 'trusted.rmeta', path]
            else:
                command = [godot, '--headless', '--path', project, '--check-only', '--script', path]
            code, stdout, stderr = invoke(command)
            record = {'language': language, 'id': case['id'], 'expectedValid': case['valid'],
                      'exitCode': code, 'sourceSha256': digest(path.read_bytes()), 'command': [str(x) for x in command]}
            # Keep raw independent evidence, including diagnostics and source spans.
            (OUTPUT / (language + '-' + case['id'] + '.stdout')).write_text(stdout, encoding='utf-8')
            (OUTPUT / (language + '-' + case['id'] + '.stderr')).write_text(stderr, encoding='utf-8')
            valid = code == 0
            errors = []
            if valid != case['valid']:
                errors.append('acceptance differs from curated expectation')
            if not case['valid'] and case['diagnostic'].lower() not in (stdout + stderr).lower():
                errors.append('expected native diagnostic absent')
            if language == 'cpp' and valid:
                record['declarations'] = declarations(json.loads(stdout))
                record['references'] = local_references(json.loads(stdout))
                names = {item['name'] for item in record['declarations']}
                if not set(case['facts']).issubset(names):
                    errors.append('native declaration facts absent')
            if language == 'rust':
                record['diagnostics'] = [json.loads(line) for line in stderr.splitlines() if line.startswith('{')]
            record['errors'] = errors
            results.append(record)
            failures.extend(f"{language}/{case['id']}: {error}" for error in errors)
    report = {'scope': 'XL-01 native preflight only; no graph adapter certification',
              'profiles': {'cpp': 'C++17, Windows MSVC target, no includes', 'rust': 'edition2021, Windows MSVC target, metadata only',
                           'gdscript': 'Godot4.5.2, trusted isolated check-only project'},
              'versions': versions, 'toolchainHashes': hashes, 'cases': results, 'failures': failures,
              'verse': 'authoritative validator and host profile still required'}
    (OUTPUT / 'results.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'Native readiness: {len(results)} curated cases, {len(failures)} failures; no generated programs executed')
    require(not failures, '\n'.join(failures))


if __name__ == '__main__':
    main()
