// Jest setup file
import '@testing-library/jest-dom';

// Mock performance.now() for consistent testing
const mockNow = jest.fn(() => 1234567890);
global.performance = {
    now: mockNow,
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    memory: {
        jsHeapSizeLimit: 2147483648,
        totalJSHeapSize: 1073741824,
        usedJSHeapSize: 536870912
    }
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

// Mock cancelAnimationFrame
global.cancelAnimationFrame = (handle: number): void => {
    clearTimeout(handle as unknown as NodeJS.Timeout);
};

// Add custom matchers
expect.extend({
    toBeWithinRange(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () =>
                    `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
}); 