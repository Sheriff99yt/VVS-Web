/// <reference types="reflect-metadata" />
import 'reflect-metadata';

/**
 * Utility types and functions for handling deprecation
 */

export interface DeprecationMetadata {
    version: string;
    message: string;
    removalVersion?: string;
    alternatives?: string[];
}

/**
 * Decorator for marking deprecated classes
 */
export function Deprecated(metadata: DeprecationMetadata): ClassDecorator {
    return function (target: Function) {
        Reflect.defineMetadata('deprecation', metadata, target);
        
        // Add console warning when class is instantiated
        const original = target as { new (...args: any[]): any };
        function deprecatedClass(this: any, ...args: any[]) {
            console.warn(
                `[Deprecated] ${target.name}: ${metadata.message}\n` +
                `Will be removed in version ${metadata.removalVersion}`
            );
            return new original(...args);
        }
        
        // Copy prototype and static properties
        Object.setPrototypeOf(deprecatedClass, target);
        deprecatedClass.prototype = target.prototype;
        
        return deprecatedClass as any;
    };
}

/**
 * Decorator for marking deprecated methods
 */
export function DeprecatedMethod(metadata: DeprecationMetadata): MethodDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            console.warn(
                `[Deprecated] ${String(propertyKey)}: ${metadata.message}\n` +
                `Will be removed in version ${metadata.removalVersion}`
            );
            return originalMethod.apply(this, args);
        };
        
        return descriptor;
    };
}

/**
 * Function to check if a class or method is deprecated
 */
export function isDeprecated(target: any): boolean {
    return Reflect.hasMetadata('deprecation', target);
}

/**
 * Function to get deprecation metadata
 */
export function getDeprecationInfo(target: any): DeprecationMetadata | null {
    return Reflect.getMetadata('deprecation', target) || null;
} 