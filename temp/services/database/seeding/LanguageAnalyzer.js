"use strict";
exports.__esModule = true;
exports.BaseLanguageAnalyzer = void 0;
/**
 * Base class for language analyzer implementations
 * Provides common functionality and partial implementations
 */
var BaseLanguageAnalyzer = /** @class */ (function () {
    function BaseLanguageAnalyzer() {
    }
    /**
     * Categorize a function based on its name and properties
     * @param name Function name
     * @param properties Additional properties to consider for categorization
     * @returns The category name
     */
    BaseLanguageAnalyzer.prototype.categorizeFunction = function (name, properties) {
        if (properties === void 0) { properties = {}; }
        // Common categorization logic
        var lowerName = name.toLowerCase();
        if (lowerName.startsWith('math_') || ['add', 'subtract', 'multiply', 'divide'].includes(lowerName)) {
            return 'Math';
        }
        if (lowerName.startsWith('str_') || lowerName.includes('string')) {
            return 'String';
        }
        if (lowerName.startsWith('array_') || lowerName.startsWith('list_')) {
            return 'Array';
        }
        if (lowerName.startsWith('dict_') || lowerName.startsWith('obj_') || lowerName.startsWith('object_')) {
            return 'Object';
        }
        if (lowerName.includes('if') || lowerName.includes('loop') || lowerName.includes('while') || lowerName.includes('for')) {
            return 'Control Flow';
        }
        if (lowerName.includes('print') || lowerName.includes('input') || lowerName.includes('read') || lowerName.includes('write')) {
            return 'IO';
        }
        if (lowerName.includes('to_') || lowerName.includes('convert') || lowerName.includes('parse')) {
            return 'Conversion';
        }
        if (lowerName.includes('date') || lowerName.includes('time')) {
            return 'Date & Time';
        }
        // Default category
        return 'Utility';
    };
    /**
     * Generate tags for a function based on its name, category, and properties
     * @param name Function name
     * @param category Function category
     * @param properties Additional properties to consider for tag generation
     * @returns Array of tags
     */
    BaseLanguageAnalyzer.prototype.generateTags = function (name, category, properties) {
        if (properties === void 0) { properties = {}; }
        var tags = [category.toLowerCase()];
        // Add name components as tags
        var nameParts = name.split('_');
        for (var _i = 0, nameParts_1 = nameParts; _i < nameParts_1.length; _i++) {
            var part = nameParts_1[_i];
            if (part && !tags.includes(part)) {
                tags.push(part);
            }
        }
        // Add specific tags based on function properties
        if (properties.isAsync) {
            tags.push('async');
        }
        if (properties.isStatic) {
            tags.push('static');
        }
        return tags;
    };
    return BaseLanguageAnalyzer;
}());
exports.BaseLanguageAnalyzer = BaseLanguageAnalyzer;
