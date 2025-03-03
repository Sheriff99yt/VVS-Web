"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.runPythonAnalyzerTests = exports.PythonAnalyzerTestSuite = void 0;
var PythonAnalyzer_1 = require("../../services/database/seeding/PythonAnalyzer");
/**
 * Test suite for the PythonAnalyzer class
 */
var PythonAnalyzerTestSuite = /** @class */ (function () {
    function PythonAnalyzerTestSuite() {
        this.testCount = 0;
        this.passCount = 0;
        this.analyzer = new PythonAnalyzer_1.PythonAnalyzer();
        this.testResults = new Map();
    }
    /**
     * Run all tests for the PythonAnalyzer
     */
    PythonAnalyzerTestSuite.prototype.runAllTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Running Python Analyzer Test Suite...');
                        console.log('=====================================');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        // Test language definition extraction
                        return [4 /*yield*/, this.testLanguageDefinitionExtraction()];
                    case 2:
                        // Test language definition extraction
                        _a.sent();
                        // Test built-in function extraction
                        return [4 /*yield*/, this.testBuiltInFunctionExtraction()];
                    case 3:
                        // Test built-in function extraction
                        _a.sent();
                        // Test type definition extraction
                        return [4 /*yield*/, this.testTypeDefinitionExtraction()];
                    case 4:
                        // Test type definition extraction
                        _a.sent();
                        // Test pattern generation
                        return [4 /*yield*/, this.testSyntaxPatternGeneration()];
                    case 5:
                        // Test pattern generation
                        _a.sent();
                        // Test type mapping generation
                        return [4 /*yield*/, this.testTypeMappingGeneration()];
                    case 6:
                        // Test type mapping generation
                        _a.sent();
                        // Print summary
                        this.printSummary();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error('Test suite failed with error:', error_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test language definition extraction
     */
    PythonAnalyzerTestSuite.prototype.testLanguageDefinitionExtraction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nTesting Language Definition Extraction...');
                        return [4 /*yield*/, this.runTest('extractLanguageDefinition', function () { return __awaiter(_this, void 0, void 0, function () {
                                var languageDef;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.analyzer.extractLanguageDefinition()];
                                        case 1:
                                            languageDef = _a.sent();
                                            // Verify language properties
                                            this.assert(languageDef !== null, 'Expected language definition to be non-null');
                                            this.assert(languageDef.language.name === 'Python', "Expected language name to be Python, got ".concat(languageDef.language.name));
                                            this.assert(languageDef.language.version !== '', 'Expected language version to be non-empty');
                                            // Verify syntax rules
                                            this.assert(languageDef.syntaxRules !== null, 'Expected syntax rules to be non-null');
                                            this.assert(languageDef.syntaxRules.statementTerminator === '\n', "Expected statement terminator to be newline, got ".concat(languageDef.syntaxRules.statementTerminator));
                                            this.assert(languageDef.syntaxRules.lineComment === '#', "Expected line comment to be #, got ".concat(languageDef.syntaxRules.lineComment));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test built-in function extraction
     */
    PythonAnalyzerTestSuite.prototype.testBuiltInFunctionExtraction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nTesting Built-in Function Extraction...');
                        return [4 /*yield*/, this.runTest('extractBuiltInFunctions', function () { return __awaiter(_this, void 0, void 0, function () {
                                var functions, hasLen, hasStr, hasPrint, printFunc;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.analyzer.extractBuiltInFunctions()];
                                        case 1:
                                            functions = _a.sent();
                                            // Verify we have functions extracted
                                            this.assert(functions.length > 0, 'Expected to extract at least some functions');
                                            hasLen = functions.some(function (f) { return f.name === 'len'; });
                                            hasStr = functions.some(function (f) { return f.name === 'str'; });
                                            hasPrint = functions.some(function (f) { return f.name === 'print'; });
                                            this.assert(hasLen, 'Expected to find len() function');
                                            this.assert(hasStr, 'Expected to find str() function');
                                            this.assert(hasPrint, 'Expected to find print() function');
                                            printFunc = functions.find(function (f) { return f.name === 'print'; });
                                            if (printFunc) {
                                                this.assert(printFunc.category !== '', 'Expected print function to have a category');
                                                this.assert(printFunc.parameters.length > 0, 'Expected print function to have parameters');
                                                this.assert(printFunc.returnType !== '', 'Expected print function to have a return type');
                                            }
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test type definition extraction
     */
    PythonAnalyzerTestSuite.prototype.testTypeDefinitionExtraction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nTesting Type Definition Extraction...');
                        return [4 /*yield*/, this.runTest('extractTypeDefinitions', function () { return __awaiter(_this, void 0, void 0, function () {
                                var types, hasString, hasList, hasDict, listType;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.analyzer.extractTypeDefinitions()];
                                        case 1:
                                            types = _a.sent();
                                            // Verify we have types extracted
                                            this.assert(types.length > 0, 'Expected to extract at least some types');
                                            hasString = types.some(function (t) { return t.name === 'string'; });
                                            hasList = types.some(function (t) { return t.name === 'list'; });
                                            hasDict = types.some(function (t) { return t.name === 'dict'; });
                                            this.assert(hasString, 'Expected to find string type');
                                            this.assert(hasList, 'Expected to find list type');
                                            this.assert(hasDict, 'Expected to find dict type');
                                            listType = types.find(function (t) { return t.name === 'list'; });
                                            if (listType) {
                                                this.assert(listType.category !== '', 'Expected list type to have a category');
                                                this.assert(listType.description !== '', 'Expected list type to have a description');
                                            }
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test syntax pattern generation
     */
    PythonAnalyzerTestSuite.prototype.testSyntaxPatternGeneration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nTesting Syntax Pattern Generation...');
                        return [4 /*yield*/, this.runTest('generateSyntaxPatterns', function () { return __awaiter(_this, void 0, void 0, function () {
                                var functionMap, languageId, patterns, hasLenPattern, hasSortedPattern, lenPattern;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            functionMap = new Map([
                                                ['len', 1],
                                                ['str', 2],
                                                ['print', 3],
                                                ['sorted', 4]
                                            ]);
                                            languageId = 1;
                                            return [4 /*yield*/, this.analyzer.generateSyntaxPatterns(functionMap, languageId)];
                                        case 1:
                                            patterns = _a.sent();
                                            // Verify we have patterns generated
                                            this.assert(patterns.length > 0, 'Expected to generate at least some patterns');
                                            hasLenPattern = patterns.some(function (p) { return p.functionId === 1; });
                                            hasSortedPattern = patterns.some(function (p) { return p.functionId === 4; });
                                            this.assert(hasLenPattern, 'Expected to find pattern for len() function');
                                            this.assert(hasSortedPattern, 'Expected to find pattern for sorted() function');
                                            lenPattern = patterns.find(function (p) { return p.functionId === 1; });
                                            if (lenPattern) {
                                                this.assert(lenPattern.pattern.includes('len'), "Expected pattern to include \"len\", got ".concat(lenPattern.pattern));
                                                this.assert(lenPattern.languageId === languageId, "Expected languageId to be ".concat(languageId, ", got ").concat(lenPattern.languageId));
                                            }
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test type mapping generation
     */
    PythonAnalyzerTestSuite.prototype.testTypeMappingGeneration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nTesting Type Mapping Generation...');
                        return [4 /*yield*/, this.runTest('generateTypeMappings', function () { return __awaiter(_this, void 0, void 0, function () {
                                var typeMap, languageId, mappings, hasStringMapping, hasListMapping, stringMapping;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            typeMap = new Map([
                                                ['string', 1],
                                                ['list', 2],
                                                ['dict', 3],
                                                ['number', 4]
                                            ]);
                                            languageId = 1;
                                            return [4 /*yield*/, this.analyzer.generateTypeMappings(typeMap, languageId)];
                                        case 1:
                                            mappings = _a.sent();
                                            // Verify we have mappings generated
                                            this.assert(mappings.length > 0, 'Expected to generate at least some type mappings');
                                            hasStringMapping = mappings.some(function (m) { return m.abstractTypeId === 1; });
                                            hasListMapping = mappings.some(function (m) { return m.abstractTypeId === 2; });
                                            this.assert(hasStringMapping, 'Expected to find mapping for string type');
                                            this.assert(hasListMapping, 'Expected to find mapping for list type');
                                            stringMapping = mappings.find(function (m) { return m.abstractTypeId === 1; });
                                            if (stringMapping) {
                                                this.assert(stringMapping.concreteType !== '', 'Expected concrete type to be non-empty');
                                                this.assert(stringMapping.languageId === languageId, "Expected languageId to be ".concat(languageId, ", got ").concat(stringMapping.languageId));
                                            }
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run a single test
     * @param name The name of the test
     * @param testFn The test function
     */
    PythonAnalyzerTestSuite.prototype.runTest = function (name, testFn) {
        return __awaiter(this, void 0, void 0, function () {
            var success, error_2, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.testCount++;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, testFn()];
                    case 2:
                        success = _a.sent();
                        if (success) {
                            this.passCount++;
                            this.testResults.set(name, { success: true, message: 'Passed' });
                            console.log("\u2705 ".concat(name, ": Passed"));
                        }
                        else {
                            this.testResults.set(name, { success: false, message: 'Failed (returned false)' });
                            console.log("\u274C ".concat(name, ": Failed (returned false)"));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                        this.testResults.set(name, { success: false, message: "Error: ".concat(errorMessage) });
                        console.log("\u274C ".concat(name, ": Error - ").concat(errorMessage));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assert a condition and throw an error if it fails
     * @param condition The condition to assert
     * @param message The error message if the assertion fails
     */
    PythonAnalyzerTestSuite.prototype.assert = function (condition, message) {
        if (!condition) {
            throw new Error("Assertion failed: ".concat(message));
        }
    };
    /**
     * Print summary of test results
     */
    PythonAnalyzerTestSuite.prototype.printSummary = function () {
        console.log('\n=====================================');
        console.log("Test Summary: ".concat(this.passCount, "/").concat(this.testCount, " tests passed"));
        console.log('=====================================');
        if (this.passCount === this.testCount) {
            console.log('✅ All tests passed!');
        }
        else {
            console.log('Failed tests:');
            this.testResults.forEach(function (result, name) {
                if (!result.success) {
                    console.log("\u274C ".concat(name, ": ").concat(result.message));
                }
            });
        }
    };
    return PythonAnalyzerTestSuite;
}());
exports.PythonAnalyzerTestSuite = PythonAnalyzerTestSuite;
/**
 * Run the Python analyzer test suite
 */
function runPythonAnalyzerTests() {
    return __awaiter(this, void 0, void 0, function () {
        var testSuite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testSuite = new PythonAnalyzerTestSuite();
                    return [4 /*yield*/, testSuite.runAllTests()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runPythonAnalyzerTests = runPythonAnalyzerTests;
