"""Pinned compile-only facts for handwritten local/body source fixtures."""
from validate_native_scalars import main
from validate_native_readiness import ROOT
import sys

if __name__ == '__main__':
    retry = next((arg.split('=', 1)[1].split(',') if arg.split('=', 1)[1] else [] for arg in sys.argv if arg.startswith('--retry-native=')), None)
    main(str(ROOT / 'packages/source-import/test/native-local-source-cases.json'), 'native-local-source', retry)
