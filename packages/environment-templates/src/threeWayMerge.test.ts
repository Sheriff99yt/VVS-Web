import { describe, expect, test } from 'bun:test';
import { threeWayMerge } from './threeWayMerge';

describe('threeWayMerge', () => {
  test('returns ours when only ours changed', () => {
    const base = 'a\nb\nc\n';
    const ours = 'a\nB\nc\n';
    const theirs = 'a\nb\nc\n';
    const result = threeWayMerge(base, ours, theirs);
    expect(result).toEqual({ ok: true, text: ours });
  });

  test('returns theirs when only theirs changed', () => {
    const base = 'a\nb\nc\n';
    const ours = 'a\nb\nc\n';
    const theirs = 'a\nb\nc\nd\n';
    const result = threeWayMerge(base, ours, theirs);
    expect(result).toEqual({ ok: true, text: theirs });
  });

  test('keeps user edit and applies template addition in different hunks', () => {
    const base = 'from App import App\n# stable\n# v1\n';
    const ours = 'from App import App\n# user banner\n# stable\n# v1\n';
    const theirs = 'from App import App\n# stable\n# v1\n# extra\n';
    const result = threeWayMerge(base, ours, theirs);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe('from App import App\n# user banner\n# stable\n# v1\n# extra\n');
    }
  });

  test('conflicts when both sides change the same line', () => {
    const base = 'from App import App\n# v1\n';
    const ours = 'from App import App\n# user edit\n';
    const theirs = 'from App import App\n# v2\n';
    expect(threeWayMerge(base, ours, theirs)).toEqual({ ok: false, reason: 'conflict' });
  });

  test('identical both-sides change is not a conflict', () => {
    const base = 'a\nb\n';
    const both = 'a\nB\n';
    expect(threeWayMerge(base, both, both)).toEqual({ ok: true, text: both });
  });
});
