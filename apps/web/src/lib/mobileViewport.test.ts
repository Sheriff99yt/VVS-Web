import { describe, expect, test } from 'bun:test';
import {
  MOBILE_MAX_WIDTH_PX,
  PIN_CONNECTION_RADIUS_COARSE,
  PIN_CONNECTION_RADIUS_FINE,
  TOPNAV_ICON_BTN_COARSE,
  TOPNAV_ICON_BTN_FINE,
  canOpenAgentPanel,
  isNarrowViewportWidth,
  pinConnectionRadius,
  topNavIconButtonClass,
  topNavViewTabButtonClass,
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

  test('topNav icon buttons keep the fine-pointer class and enlarge for coarse/mobile', () => {
    expect(topNavIconButtonClass(false)).toBe(TOPNAV_ICON_BTN_FINE);
    expect(topNavIconButtonClass(true)).toBe(TOPNAV_ICON_BTN_COARSE);
    expect(topNavIconButtonClass(false)).toContain('p-1.5');
    expect(topNavIconButtonClass(false)).not.toContain('min-w-11');
    expect(topNavIconButtonClass(true)).toContain('min-w-11');
    expect(topNavIconButtonClass(true)).toContain('min-h-11');
  });

  test('topNav view-tab buttons keep desktop padding and enlarge for coarse/mobile', () => {
    expect(topNavViewTabButtonClass(false)).toBe('px-2.5 py-1.5');
    expect(topNavViewTabButtonClass(true)).toContain('min-w-11');
    expect(topNavViewTabButtonClass(true)).toContain('min-h-11');
  });
});