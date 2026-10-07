"""Pinned compile-only curated header evidence, not adapter admission."""
from validate_native_scalars import main
import sys

if __name__ == '__main__':
    selection = next((arg.removeprefix('--only=').split(',') for arg in sys.argv[1:] if arg.startswith('--only=')), None)
    main('native_signature_cases.json', 'native-signatures', selection)
