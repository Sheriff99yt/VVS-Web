import { describe, expect, test } from 'bun:test';
import { buildGeneratedFileTree } from './generatedFileTree';

describe('buildGeneratedFileTree', () => {
  test('nests paths under directories', () => {
    const tree = buildGeneratedFileTree(['src/app.py', 'src/utils/helpers.py', 'main.py']);
    expect(tree.map((n) => n.name)).toEqual(['src', 'main.py']);
    const src = tree.find((n) => n.name === 'src');
    expect(src?.children?.map((n) => n.name)).toEqual(['utils', 'app.py']);
    const utils = src?.children?.find((n) => n.name === 'utils');
    expect(utils?.children?.map((n) => n.name)).toEqual(['helpers.py']);
  });

  test('dedupes shared directory prefixes', () => {
    const tree = buildGeneratedFileTree(['a/b/c.py', 'a/d.py']);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe('a');
    expect(tree[0]?.children?.map((n) => n.name)).toEqual(['b', 'd.py']);
  });
});
