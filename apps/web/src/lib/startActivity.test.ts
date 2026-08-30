import { expect, test } from 'bun:test';
import { isStartActivityId, isStartLocalActivityId, migrateStartActivity } from './startActivity';

test('start activity ids', () => {
  expect(isStartActivityId('start')).toBe(true);
  expect(isStartActivityId('docs')).toBe(true);
  expect(isStartActivityId('history')).toBe(false);
  expect(isStartLocalActivityId('recent')).toBe(false);
  expect(isStartLocalActivityId('examples')).toBe(true);
  expect(migrateStartActivity('recent')).toBe('start');
  expect(isStartLocalActivityId('library')).toBe(false);
});
