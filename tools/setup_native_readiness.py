"""Prepare pinned portable validation tools in ignored scratch, without PATH changes."""
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor
import tarfile
import urllib.request
import zipfile

from validate_native_readiness import TOOLS, PINS, digest, require


def download_ranges(url, partial):
    # Explicit fallback for the observed full-response GitHub transfer stalls.
    size, step = 77480943, 65536

    def chunk(start):
        end = min(size - 1, start + step - 1)
        request = urllib.request.Request(url, headers={'Range': f'bytes={start}-{end}'})
        with urllib.request.urlopen(request, timeout=30) as response:
            require(response.status == 206 and response.headers.get('Content-Range') == f'bytes {start}-{end}/{size}',
                    'Server did not honor the pinned Godot range request')
            data = response.read()
        require(len(data) == end - start + 1, 'Incomplete archive chunk')
        return start, data

    with partial.open('wb') as output, ThreadPoolExecutor(max_workers=12) as pool:
        output.truncate(size)
        for start, data in pool.map(chunk, range(0, size, step)):
            output.seek(start)
            output.write(data)


def main():
    TOOLS.mkdir(parents=True, exist_ok=True)
    for name, expected in PINS.items():
        archive = TOOLS / name
        url = ('https://github.com/godotengine/godot-builds/releases/download/4.5.2-stable/'
               if name.endswith('.zip') else 'https://static.rust-lang.org/dist/2026-10-01/') + name
        if not archive.exists() or digest(archive.read_bytes()) != expected:
            partial = archive.with_suffix(archive.suffix + '.partial')
            print(f'Downloading {name}', flush=True)
            if name.endswith('.zip') and '--range-download' in sys.argv:
                download_ranges(url, partial)
            else:
                with urllib.request.urlopen(url, timeout=60) as response, partial.open('wb') as output:
                    shutil.copyfileobj(response, output, length=64 * 1024)
            require(digest(partial.read_bytes()) == expected, f'Archive hash mismatch: {name}')
            partial.replace(archive)
        require(digest(archive.read_bytes()) == expected, f'Archive hash mismatch: {name}')
        if name.endswith('.zip'):
            target = TOOLS / 'godot'
            target.mkdir(exist_ok=True)
            with zipfile.ZipFile(archive) as bundle:
                for entry in bundle.infolist():
                    # Verify the absolute destination before any extraction/write.
                    destination = (target / entry.filename).resolve()
                    require(destination.is_relative_to(target.resolve()), 'Archive path outside tool directory')
                bundle.extractall(target)
        else:
            with tarfile.open(archive) as bundle:
                bundle.extractall(TOOLS, filter='data')
            component = 'rustc' if name.startswith('rustc-') else 'rust-std-x86_64-pc-windows-msvc'
            source = TOOLS / name.removesuffix('.tar.xz') / component
            shutil.copytree(source, TOOLS / 'rust', dirs_exist_ok=True)
        print(f'Pinned portable component ready: {name}', flush=True)


if __name__ == '__main__':
    main()
