import { expect, test } from 'bun:test';
import { isStartActivityId, isStartLocalActivityId } from './startActivity';

test('start activity ids', () => {
  expect(isStartActivityId('start')).toBe(true);
  expect(isStartActivityId('docs')).toBe(true);
  expect(isStartActivityId('history')).toBe(false);
  expect(isStartLocalActivityId('recent')).toBe(true);
  expect(isStartLocalActivityId('library')).toBe(false);
});
