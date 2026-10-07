"""Compile trusted generated-header fixtures; no fixture execution."""
from validate_native_scalars import main
from validate_native_readiness import ROOT

if __name__ == '__main__':
    main(str(ROOT / 'scratch/native-signature-print/fixtures.json'), 'native-signature-print')
