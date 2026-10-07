"""Reproduce the shipped GDScript grammar from pinned upstream source/tooling.

Requires locally activated Emscripten4.0.17; never changes global configuration.
"""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SDK_COMMIT = '96c657fc60920d2a6a82318aa50e0abf82749604'
SDK = Path(os.environ.get('VVS_EMSDK', ROOT / 'scratch/native-toolchains' / ('emsdk-' + SDK_COMMIT)))
INTEGRITY = 'Uy5+GWLkec2JaS1mamiJYsC9j/JoW2FxFq4bnji95gyTtMTsqO6+RSVIaBTU/vRGSNEi3PVDZzyV0j3B4RdntA=='
EXPECTED = '24e7a0d164b8c4d3068b7ff9cf665a977c16b3cca6cb13125f4a036d9e72dc90'
TOOL_PINS = {
    'upstream/emscripten/emcc.py': '36a652b391823c9fc51dbca1fbd8cf88198eb478f68164780b2340a3a237a668',
    'upstream/bin/clang.exe': 'e001a33514a0cd00c5337bdf23969e3799359242c79f830392654589bc202f19',
    'upstream/bin/wasm-ld.exe': '93903ed8bdded0e1aa142e48cdcc2521c1aaa52ae2766dccba8f2742d30743b2',
    'upstream/bin/wasm-opt.exe': 'ef9acd7f8b91c2a596339681e9ab2c69667ea96dba253a3f08cf6e518f664c17',
}


def main():
    for relative, expected in TOOL_PINS.items():
        if hashlib.sha256((SDK / relative).read_bytes()).hexdigest() != expected:
            raise RuntimeError(f'Windows Emscripten4.0.17 tool pin changed: {relative}')
    directory = ROOT / 'scratch/gdscript-grammar-build'
    directory.mkdir(parents=True, exist_ok=True)
    archive = directory / 'tree-sitter-gdscript-6.1.0.tgz'
    if not archive.exists():
        with urllib.request.urlopen('https://registry.npmjs.org/tree-sitter-gdscript/-/tree-sitter-gdscript-6.1.0.tgz', timeout=30) as response:
            archive.write_bytes(response.read())
    data = archive.read_bytes()
    if base64.b64encode(hashlib.sha512(data).digest()).decode() != INTEGRITY:
        raise RuntimeError('GDScript upstream source integrity changed')
    with tarfile.open(fileobj=io.BytesIO(data)) as bundle:
        bundle.extractall(directory, filter='data')
    source = directory / 'package'
    output = directory / 'tree-sitter-gdscript.wasm'
    flags = ['-O2', '-sSIDE_MODULE=2', "-sEXPORTED_FUNCTIONS=['_tree_sitter_gdscript']"]
    path_mapping = f'-ffile-prefix-map={source}=tree-sitter-gdscript'
    command = [sys.executable, str(SDK / 'upstream/emscripten/emcc.py'), *flags,
               path_mapping,
               '-I', str(source / 'src'), str(source / 'src/parser.c'), str(source / 'src/scanner.c'), '-o', str(output)]
    environment = {**os.environ, 'EM_CONFIG': str(SDK / '.emscripten')}
    version = subprocess.check_output([sys.executable, str(SDK / 'upstream/emscripten/emcc.py'), '--version'], env=environment, text=True)
    if '4.0.17' not in version.splitlines()[0]:
        raise RuntimeError('Emscripten version drift')
    subprocess.run(command, env=environment, check=True)
    if hashlib.sha256(output.read_bytes()).hexdigest() != EXPECTED:
        raise RuntimeError('Rebuilt GDScript artifact differs from the reviewed pin')
    vendor = ROOT / 'packages/source-import/vendor/gdscript'
    vendor.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(output, vendor / output.name)
    shutil.copyfile(source / 'LICENSE', vendor / 'LICENSE')
    provenance = {'grammarPackage': 'tree-sitter-gdscript', 'grammarVersion': '6.1.0',
                  'sourceIntegrity': 'sha512-' + INTEGRITY, 'abi': 14, 'sha256': EXPECTED,
                  'emsdkCommit': SDK_COMMIT, 'emsdkArchiveSha256': 'e1e547e3c7eda7e50c4731350e6f32422baf2fdd7159713a23af215bef9cc52d',
                  'sdkRelease': '41d2106c68c28e101e6252a48e22c78b07722508', 'emscriptenVersion': '4.0.17',
                  'toolPins': TOOL_PINS, 'platform': 'Windows-x64', 'flags': flags + ['-ffile-prefix-map=<source>=tree-sitter-gdscript'],
                  'reproduce': 'python tools/build_gdscript_grammar.py'}
    (vendor / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print(f'GDScript grammar reproduced: {output.stat().st_size} bytes, SHA256 {EXPECTED}, ABI14')


if __name__ == '__main__':
    main()
