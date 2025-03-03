"use strict";
/**
 * Core data models for the VVS Web syntax database
 * These interfaces define the structure of language definitions, function definitions,
 * syntax patterns, and type mappings used throughout the system.
 */
exports.__esModule = true;
exports.PatternType = exports.FunctionCategory = void 0;
/**
 * Categories for organizing function definitions
 */
var FunctionCategory;
(function (FunctionCategory) {
    FunctionCategory["MATH"] = "Math";
    FunctionCategory["STRING"] = "String";
    FunctionCategory["ARRAY"] = "Array";
    FunctionCategory["OBJECT"] = "Object";
    FunctionCategory["CONTROL_FLOW"] = "Control Flow";
    FunctionCategory["IO"] = "Input/Output";
    FunctionCategory["CONVERSION"] = "Conversion";
    FunctionCategory["DATE_TIME"] = "Date & Time";
    FunctionCategory["UTILITY"] = "Utility";
    FunctionCategory["CUSTOM"] = "Custom";
})(FunctionCategory = exports.FunctionCategory || (exports.FunctionCategory = {}));
/**
 * The type of pattern to use in code generation
 */
var PatternType;
(function (PatternType) {
    PatternType["EXPRESSION"] = "expression";
    PatternType["STATEMENT"] = "statement";
    PatternType["BLOCK"] = "block"; // Multi-line code block
})(PatternType = exports.PatternType || (exports.PatternType = {}));
