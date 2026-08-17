import { describe, expect, test } from 'bun:test';
import {
  MOBILE_MAX_WIDTH_PX,
  PIN_CONNECTION_RADIUS_COARSE,
  PIN_CONNECTION_RADIUS_FINE,
  canOpenAgentPanel,
  isNarrowViewportWidth,
  pinConnectionRadius,
} from './mobileViewport';

describe('mobileViewport', () => {
  test('isNarrowViewportWidth is true at and below the mobile max width', () => {
    expect(isNarrowViewportWidth(MOBILE_MAX_WIDTH_PX)).toBe(true);
    expect(isNarrowViewportWidth(MOBILE_MAX_WIDTH_PX - 1)).toBe(true);
    expect(isNarrowViewportWidth(MOBILE_MAX_WIDTH_PX + 1)).toBe(false);
  });

  test('canOpenAgentPanel is false on a narrow viewport', () => {
    expect(canOpenAgentPanel(true)).toBe(false);
    expect(canOpenAgentPanel(false)).toBe(true);
  });

  test('pinConnectionRadius is larger for coarse pointers than fine', () => {
    expect(pinConnectionRadius(true)).toBe(PIN_CONNECTION_RADIUS_COARSE);
    expect(pinConnectionRadius(false)).toBe(PIN_CONNECTION_RADIUS_FINE);
    expect(pinConnectionRadius(true)).toBeGreaterThan(pinConnectionRadius(false));
  });
});
