import { expect, test } from 'bun:test';
import { connectionEndPoint } from './connectionEndPoint';
test('touch-end reads the ended finger and rejects cancellation and multi-touch', () => {
  const event = { type: 'touchend', touches: [], changedTouches: [{ clientX: 7, clientY: 9 }] } as unknown as TouchEvent;
  expect(connectionEndPoint(event)).toEqual({ x: 7, y: 9 });
  expect(connectionEndPoint({ ...event, type: 'touchcancel' } as TouchEvent)).toBeNull();
  expect(connectionEndPoint({ ...event, touches: [{}] } as unknown as TouchEvent)).toBeNull();
  expect(connectionEndPoint({ ...event, changedTouches: [] } as unknown as TouchEvent)).toBeNull();
});
