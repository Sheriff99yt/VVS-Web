import unittest
from validate_native_scalars import validate_fixture_paths


class NativeFixturePathTests(unittest.TestCase):
    def test_case_collision_rejects_before_native_compilation(self):
        with self.assertRaisesRegex(RuntimeError, 'case-insensitive'):
            validate_fixture_paths({'cpp': [{'id': 'function-value'}, {'id': 'function-Value'}]})

    def test_language_and_stable_index_disambiguate(self):
        validate_fixture_paths({'cpp': [{'id': 'function-0-value'}, {'id': 'function-1-Value'}], 'rust': [{'id': 'function-0-value'}]})

    def test_duplicate_id_rejects(self):
        with self.assertRaisesRegex(RuntimeError, 'collide'):
            validate_fixture_paths({'rust': [{'id': 'same'}, {'id': 'same'}]})


if __name__ == '__main__':
    unittest.main()
