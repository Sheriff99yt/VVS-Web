"""Independent native constant type/value assertions; curated source only, no execution."""
import json
import os
from pathlib import Path
from validate_native_readiness import ROOT, TOOLS, digest, invoke, require, verify_portable_tools

OUTPUT = ROOT / 'scratch/native-scalars'
OUTPUT.mkdir(parents=True, exist_ok=True)


def validate_fixture_paths(fixtures):
    paths = [language + '-' + case['id'] for language, cases in fixtures.items() for case in cases]
    require(len({path.casefold() for path in paths}) == len(paths), 'Native fixture paths collide on a case-insensitive filesystem')


def main(fixtures_name='native_scalar_cases.json', output_name='native-scalars', selected_cases=None):
    OUTPUT = ROOT / ('scratch/' + output_name)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    fixtures_path = Path(fixtures_name) if Path(fixtures_name).is_absolute() else Path(__file__).with_name(fixtures_name)
    fixtures = json.loads(fixtures_path.read_text(encoding='utf-8'))
    validate_fixture_paths(fixtures)
    previous = {}
    if selected_cases is not None:
        keys = {language+'/'+case['id'] for language,cases in fixtures.items() for case in cases}
        require(set(selected_cases).issubset(keys), 'Unknown native retry case')
        old = json.loads((OUTPUT/'results.json').read_text(encoding='utf-8'))
        previous = {case['language']+'/'+case['id']:case for case in old['cases']}
    clang = Path(os.environ.get('VVS_CLANGXX', r'X:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\Llvm\x64\bin\clang++.exe'))
    clang_hash = digest(clang.read_bytes())
    require(clang_hash == '20a8e84f2bd6a9b771f05caf764a67054e917177d132d119986e7c7936e148b8', 'Clang pin mismatch')
    hashes = verify_portable_tools()
    hashes['clang++.exe'] = clang_hash
    if selected_cases is not None:
        require(old['toolchainHashes'] == hashes, 'Retained native toolchain pins differ')
    project = OUTPUT / 'godot'
    project.mkdir(exist_ok=True)
    (project / 'project.godot').write_text('config_version=5\n',encoding='utf-8',newline='\n')
    results, failures = [], []
    for language, cases in fixtures.items():
        for case in cases:
            key=language+'/'+case['id']
            path = OUTPUT / (language + '-' + case['id'] + {'cpp':'.cpp','rust':'.rs','gdscript':'.gd'}[language])
            if language == 'cpp':
                command = [clang,'--target=x86_64-pc-windows-msvc','-std=c++17','-nostdinc','-nostdinc++','-fsyntax-only','-fno-color-diagnostics',path]
            elif language == 'rust':
                command = [TOOLS/'rust/bin/rustc.exe','--sysroot',TOOLS/'rust','--edition=2021','--target=x86_64-pc-windows-msvc','--crate-type=lib','--crate-name=trusted_scalars','--emit=metadata','--error-format=json','-o',OUTPUT/'trusted.rmeta',path]
            else:
                command = [TOOLS/'godot/Godot_v4.5.2-stable_win64_console.exe','--headless','--path',project,'--check-only','--script',path]
            if selected_cases is not None and key not in selected_cases:
                retained=previous.get(key)
                require(retained and retained['sourceSha256']==digest(case['source'].encode('utf-8')) and retained['expectedValid']==case['valid'], 'Retained native input/expectation differs: '+key)
                require(retained['command']==[str(arg) for arg in command], 'Retained native compiler profile differs: '+key)
                require(path.exists() and digest(path.read_bytes())==retained['sourceSha256'], 'Retained actual native input differs: '+key)
                results.append(retained)
                failures.extend(key+': '+error for error in retained['errors'])
                continue
            path.write_text(case['source'],encoding='utf-8',newline='\n')
            require(path.read_bytes() == case['source'].encode('utf-8'), 'Native source byte drift')
            code, stdout, stderr = invoke(command)
            errors = []
            if (code == 0) != case['valid']:
                errors.append('native type/value assertion or rejection differs')
            for kind, text in [('stdout',stdout),('stderr',stderr)]:
                (OUTPUT/(language+'-'+case['id']+'.'+kind)).write_text(text,encoding='utf-8',newline='\n')
            results.append({'language':language,'id':case['id'],'sourceSha256':digest(path.read_bytes()),'expectedValid':case['valid'],'exitCode':code,'command':[str(arg) for arg in command],'errors':errors})
            failures.extend(language+'/'+case['id']+': '+error for error in errors)
    report = {'scope':'native literal/unary-negative constant type/value assertions; not expression/effect/graph certification','toolchainHashes':hashes,
              'profiles':{'cpp':'Clang19.1.5 C++17 Windows MSVC LLP64, static_assert type/value','rust':'rustc1.99 edition2021 Windows MSVC pointer64, const assertions/type contrasts','gdscript':'Godot4.5.2 constant type/value zero-division assertions, isolated check-only'},'cases':results,'failures':failures}
    (OUTPUT/'results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'Native scalars: {len(results)} constant assertions/rejections, {len(failures)} failures; '+(f'{len(selected_cases)} retried, matching unchanged cases retained; ' if selected_cases is not None else '')+'no programs executed')
    require(not failures,'\n'.join(failures))


if __name__ == '__main__':
    main()
