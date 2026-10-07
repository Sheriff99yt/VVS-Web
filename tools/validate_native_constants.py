"""Reuse the pinned compile-only assertion harness for curated operator/conversion trees."""
from validate_native_scalars import main
import sys

if __name__ == '__main__':
    selection=next((arg.removeprefix('--only=').split(',') for arg in sys.argv[1:] if arg.startswith('--only=')),None)
    main('native_constant_cases.json','native-constants',selection)
