import { describe, expect, test } from 'bun:test';
import { filterDetailsPropertySchema, hiddenDetailsPropertyKeys } from './detailsPropertySchema';

describe('detailsPropertySchema hide list', () => {
  test('event_bind hides leftover eventName next to eventId so the picker is the write path', () => {
    const hidden = hiddenDetailsPropertyKeys('event_bind');
    expect(hidden.has('eventId')).toBe(true);
    expect(hidden.has('eventName')).toBe(true);
    const shown = filterDetailsPropertySchema(
      [
        { key: 'eventId', label: 'Event id' },
        { key: 'eventName', label: 'Event' },
      ],
      'event_bind'
    );
    expect(shown).toEqual([]);
  });

  test('event_dispatch and event_define also hide eventName if a pack ever adds it', () => {
    expect(hiddenDetailsPropertyKeys('event_dispatch').has('eventName')).toBe(true);
    expect(hiddenDetailsPropertyKeys('event_define').has('eventName')).toBe(true);
  });

  test('class_define still hides form/extends/implements in favor of dedicated editors', () => {
    const shown = filterDetailsPropertySchema(
      [
        { key: 'name' },
        { key: 'form' },
        { key: 'extendsType' },
        { key: 'visibility' },
        { key: 'isAbstract' },
      ],
      'class_define'
    );
    expect(shown.map((f) => f.key)).toEqual(['name', 'visibility', 'isAbstract']);
  });
});
