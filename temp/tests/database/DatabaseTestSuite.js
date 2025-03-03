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
exports.runDatabaseTests = exports.DatabaseTestSuite = void 0;
var DatabaseSchema_1 = require("../../services/database/DatabaseSchema");
var LanguageRepository_1 = require("../../services/database/repositories/LanguageRepository");
var FunctionRepository_1 = require("../../services/database/repositories/FunctionRepository");
var PatternRepository_1 = require("../../services/database/repositories/PatternRepository");
var TypeRepository_1 = require("../../services/database/repositories/TypeRepository");
var TypeMappingRepository_1 = require("../../services/database/repositories/TypeMappingRepository");
var SyntaxDatabaseServiceImpl_1 = require("../../services/database/SyntaxDatabaseServiceImpl");
/**
 * DatabaseTestSuite provides a framework for testing all database operations
 * in the VVS Web Python MVP.
 */
var DatabaseTestSuite = /** @class */ (function () {
    function DatabaseTestSuite() {
        this.testCount = 0;
        this.passCount = 0;
        this.languageRepository = new LanguageRepository_1.LanguageRepository();
        this.functionRepository = new FunctionRepository_1.FunctionRepository();
        this.patternRepository = new PatternRepository_1.PatternRepository();
        this.typeRepository = new TypeRepository_1.TypeRepository();
        this.typeMappingRepository = new TypeMappingRepository_1.TypeMappingRepository();
        this.dbService = new SyntaxDatabaseServiceImpl_1.SyntaxDatabaseServiceImpl(this.languageRepository, this.functionRepository, this.patternRepository, this.typeRepository, this.typeMappingRepository);
        this.testResults = new Map();
    }
    /**
     * Run all database tests
     */
    DatabaseTestSuite.prototype.runAllTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Running VVS Web Database Test Suite...');
                        console.log('=====================================');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        // Setup test environment
                        return [4 /*yield*/, this.setupTestEnvironment()];
                    case 2:
                        // Setup test environment
                        _a.sent();
                        // Run tests for each repository
                        return [4 /*yield*/, this.runLanguageRepositoryTests()];
                    case 3:
                        // Run tests for each repository
                        _a.sent();
                        return [4 /*yield*/, this.runFunctionRepositoryTests()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.runPatternRepositoryTests()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.runTypeRepositoryTests()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.runTypeMappingRepositoryTests()];
                    case 7:
                        _a.sent();
                        // Run integration tests
                        return [4 /*yield*/, this.runRepositoryIntegrationTests()];
                    case 8:
                        // Run integration tests
                        _a.sent();
                        // Cleanup test environment
                        return [4 /*yield*/, this.cleanupTestEnvironment()];
                    case 9:
                        // Cleanup test environment
                        _a.sent();
                        // Print summary
                        this.printSummary();
                        return [3 /*break*/, 11];
                    case 10:
                        error_1 = _a.sent();
                        console.error('Test suite failed with error:', error_1);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup test environment by clearing the database
     */
    DatabaseTestSuite.prototype.setupTestEnvironment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, stores, clearDb_1, tx_1, _loop_1, _i, stores_1, store, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        console.log('Setting up test environment...');
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        stores = Array.from(db.objectStoreNames);
                        db.close();
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 2:
                        clearDb_1 = _a.sent();
                        tx_1 = clearDb_1.transaction(stores, 'readwrite');
                        _loop_1 = function (store) {
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                                            var clearRequest = tx_1.objectStore(store).clear();
                                            clearRequest.onsuccess = function () { return resolve(); };
                                            clearRequest.onerror = function () { return reject(clearRequest.error); };
                                        })];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, stores_1 = stores;
                        _a.label = 3;
                    case 3:
                        if (!(_i < stores_1.length)) return [3 /*break*/, 6];
                        store = stores_1[_i];
                        return [5 /*yield**/, _loop_1(store)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, new Promise(function (resolve) {
                            tx_1.oncomplete = function () {
                                clearDb_1.close();
                                resolve();
                            };
                        })];
                    case 7:
                        _a.sent();
                        console.log('Test environment setup complete.');
                        return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        console.error('Failed to setup test environment:', error_2);
                        throw error_2;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up test environment
     */
    DatabaseTestSuite.prototype.cleanupTestEnvironment = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Same as setup - clear the database
                    return [4 /*yield*/, this.setupTestEnvironment()];
                    case 1:
                        // Same as setup - clear the database
                        _a.sent();
                        console.log('Test environment cleanup complete.');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run tests for LanguageRepository
     */
    DatabaseTestSuite.prototype.runLanguageRepositoryTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testLang;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nRunning LanguageRepository Tests...');
                        testLang = {
                            id: 0,
                            name: 'TestLang',
                            version: '1.0.0',
                            description: 'A test language',
                            website: 'https://testlang.example.com',
                            syntaxRules: {
                                lineComment: '//',
                                blockCommentStart: '/*',
                                blockCommentEnd: '*/',
                                statementTerminator: ';',
                                caseInsensitive: false
                            }
                        };
                        return [4 /*yield*/, this.runTest('languageCreate', function () { return __awaiter(_this, void 0, void 0, function () {
                                var id;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.languageRepository.create(testLang)];
                                        case 1:
                                            id = _a.sent();
                                            this.assert(id > 0, "Expected positive ID, got ".concat(id));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        // Test language retrieval
                        return [4 /*yield*/, this.runTest('languageGetById', function () { return __awaiter(_this, void 0, void 0, function () {
                                var languages, id, language;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.languageRepository.getAll()];
                                        case 1:
                                            languages = _a.sent();
                                            if (languages.length === 0)
                                                return [2 /*return*/, false];
                                            id = languages[0].id;
                                            return [4 /*yield*/, this.languageRepository.getById(id)];
                                        case 2:
                                            language = _a.sent();
                                            this.assert(language !== null, 'Expected language to be found');
                                            this.assert(language.name === 'TestLang', "Expected language name to be TestLang, got ".concat(language.name));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test language retrieval
                        _a.sent();
                        // Test language update
                        return [4 /*yield*/, this.runTest('languageUpdate', function () { return __awaiter(_this, void 0, void 0, function () {
                                var languages, language, updated;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.languageRepository.getAll()];
                                        case 1:
                                            languages = _a.sent();
                                            if (languages.length === 0)
                                                return [2 /*return*/, false];
                                            language = languages[0];
                                            language.description = 'Updated description';
                                            return [4 /*yield*/, this.languageRepository.update(language)];
                                        case 2:
                                            _a.sent();
                                            return [4 /*yield*/, this.languageRepository.getById(language.id)];
                                        case 3:
                                            updated = _a.sent();
                                            this.assert(updated.description === 'Updated description', "Expected description to be updated, got ".concat(updated.description));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 3:
                        // Test language update
                        _a.sent();
                        // Test language deletion
                        return [4 /*yield*/, this.runTest('languageDelete', function () { return __awaiter(_this, void 0, void 0, function () {
                                var languages, id, deleted;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.languageRepository.getAll()];
                                        case 1:
                                            languages = _a.sent();
                                            if (languages.length === 0)
                                                return [2 /*return*/, false];
                                            id = languages[0].id;
                                            return [4 /*yield*/, this.languageRepository["delete"](id)];
                                        case 2:
                                            _a.sent();
                                            return [4 /*yield*/, this.languageRepository.getById(id)];
                                        case 3:
                                            deleted = _a.sent();
                                            this.assert(deleted === null, 'Expected language to be deleted');
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 4:
                        // Test language deletion
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run tests for FunctionRepository
     */
    DatabaseTestSuite.prototype.runFunctionRepositoryTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testFunc;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nRunning FunctionRepository Tests...');
                        testFunc = {
                            id: 0,
                            name: 'testFunction',
                            category: 'test',
                            description: 'A test function',
                            parameters: [
                                {
                                    name: 'param1',
                                    type: 'string',
                                    description: 'First parameter',
                                    optional: false
                                }
                            ],
                            returnType: 'number',
                            examples: ['testFunction("hello") // returns 5'],
                            tags: ['test', 'example']
                        };
                        return [4 /*yield*/, this.runTest('functionCreate', function () { return __awaiter(_this, void 0, void 0, function () {
                                var id;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.functionRepository.create(testFunc)];
                                        case 1:
                                            id = _a.sent();
                                            this.assert(id > 0, "Expected positive ID, got ".concat(id));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        // Test function retrieval
                        return [4 /*yield*/, this.runTest('functionGetById', function () { return __awaiter(_this, void 0, void 0, function () {
                                var functions, id, func;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.functionRepository.getAll()];
                                        case 1:
                                            functions = _a.sent();
                                            if (functions.length === 0)
                                                return [2 /*return*/, false];
                                            id = functions[0].id;
                                            return [4 /*yield*/, this.functionRepository.getById(id)];
                                        case 2:
                                            func = _a.sent();
                                            this.assert(func !== null, 'Expected function to be found');
                                            this.assert(func.name === 'testFunction', "Expected function name to be testFunction, got ".concat(func.name));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test function retrieval
                        _a.sent();
                        // Test function search by category
                        return [4 /*yield*/, this.runTest('functionGetByCategory', function () { return __awaiter(_this, void 0, void 0, function () {
                                var functions;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.functionRepository.getByCategory('test')];
                                        case 1:
                                            functions = _a.sent();
                                            this.assert(functions.length > 0, 'Expected at least one function with category "test"');
                                            this.assert(functions[0].category === 'test', "Expected function category to be test, got ".concat(functions[0].category));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 3:
                        // Test function search by category
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run tests for PatternRepository
     */
    DatabaseTestSuite.prototype.runPatternRepositoryTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testLang, langId, testFunc, funcId, testPattern;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nRunning PatternRepository Tests...');
                        testLang = {
                            id: 0,
                            name: 'PatternTestLang',
                            version: '1.0.0',
                            description: 'A test language for patterns',
                            website: 'https://example.com',
                            syntaxRules: {
                                lineComment: '//',
                                blockCommentStart: '/*',
                                blockCommentEnd: '*/',
                                statementTerminator: ';',
                                caseInsensitive: false
                            }
                        };
                        return [4 /*yield*/, this.languageRepository.create(testLang)];
                    case 1:
                        langId = _a.sent();
                        testFunc = {
                            id: 0,
                            name: 'patternTestFunc',
                            category: 'test',
                            description: 'A test function for patterns',
                            parameters: [
                                {
                                    name: 'param1',
                                    type: 'string',
                                    description: 'First parameter',
                                    optional: false
                                }
                            ],
                            returnType: 'number',
                            examples: ['patternTestFunc("hello") // returns 5'],
                            tags: ['test', 'pattern']
                        };
                        return [4 /*yield*/, this.functionRepository.create(testFunc)];
                    case 2:
                        funcId = _a.sent();
                        testPattern = {
                            id: 0,
                            functionId: funcId,
                            languageId: langId,
                            pattern: 'patternTestFunc($1)',
                            description: 'A test pattern',
                            examples: ['patternTestFunc("test")']
                        };
                        return [4 /*yield*/, this.runTest('patternCreate', function () { return __awaiter(_this, void 0, void 0, function () {
                                var id;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.patternRepository.create(testPattern)];
                                        case 1:
                                            id = _a.sent();
                                            this.assert(id > 0, "Expected positive ID, got ".concat(id));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 3:
                        _a.sent();
                        // Test pattern retrieval
                        return [4 /*yield*/, this.runTest('patternGetById', function () { return __awaiter(_this, void 0, void 0, function () {
                                var patterns, id, pattern;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.patternRepository.getAll()];
                                        case 1:
                                            patterns = _a.sent();
                                            if (patterns.length === 0)
                                                return [2 /*return*/, false];
                                            id = patterns[0].id;
                                            return [4 /*yield*/, this.patternRepository.getById(id)];
                                        case 2:
                                            pattern = _a.sent();
                                            this.assert(pattern !== null, 'Expected pattern to be found');
                                            this.assert(pattern.pattern === 'patternTestFunc($1)', "Expected pattern to be patternTestFunc($1), got ".concat(pattern.pattern));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 4:
                        // Test pattern retrieval
                        _a.sent();
                        // Test pattern retrieval by function and language
                        return [4 /*yield*/, this.runTest('patternGetByFunctionAndLanguage', function () { return __awaiter(_this, void 0, void 0, function () {
                                var patterns;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.patternRepository.getByFunctionAndLanguage(funcId, langId)];
                                        case 1:
                                            patterns = _a.sent();
                                            this.assert(patterns.length > 0, 'Expected at least one pattern for function and language');
                                            this.assert(patterns[0].functionId === funcId, "Expected functionId to be ".concat(funcId, ", got ").concat(patterns[0].functionId));
                                            this.assert(patterns[0].languageId === langId, "Expected languageId to be ".concat(langId, ", got ").concat(patterns[0].languageId));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 5:
                        // Test pattern retrieval by function and language
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run tests for TypeRepository
     */
    DatabaseTestSuite.prototype.runTypeRepositoryTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testType;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nRunning TypeRepository Tests...');
                        testType = {
                            id: 0,
                            name: 'TestType',
                            category: 'test',
                            description: 'A test type',
                            properties: [
                                {
                                    name: 'prop1',
                                    type: 'string',
                                    description: 'First property'
                                }
                            ]
                        };
                        return [4 /*yield*/, this.runTest('typeCreate', function () { return __awaiter(_this, void 0, void 0, function () {
                                var id;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.typeRepository.create(testType)];
                                        case 1:
                                            id = _a.sent();
                                            this.assert(id > 0, "Expected positive ID, got ".concat(id));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        // Test type retrieval
                        return [4 /*yield*/, this.runTest('typeGetById', function () { return __awaiter(_this, void 0, void 0, function () {
                                var types, id, type;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.typeRepository.getAll()];
                                        case 1:
                                            types = _a.sent();
                                            if (types.length === 0)
                                                return [2 /*return*/, false];
                                            id = types[0].id;
                                            return [4 /*yield*/, this.typeRepository.getById(id)];
                                        case 2:
                                            type = _a.sent();
                                            this.assert(type !== null, 'Expected type to be found');
                                            this.assert(type.name === 'TestType', "Expected type name to be TestType, got ".concat(type.name));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test type retrieval
                        _a.sent();
                        // Test type retrieval by name
                        return [4 /*yield*/, this.runTest('typeGetByName', function () { return __awaiter(_this, void 0, void 0, function () {
                                var type;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.typeRepository.getByName('TestType')];
                                        case 1:
                                            type = _a.sent();
                                            this.assert(type !== null, 'Expected type to be found by name');
                                            this.assert(type.name === 'TestType', "Expected type name to be TestType, got ".concat(type.name));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 3:
                        // Test type retrieval by name
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run tests for TypeMappingRepository
     */
    DatabaseTestSuite.prototype.runTypeMappingRepositoryTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var abstractType, abstractTypeId, testLang, langId, testMapping;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nRunning TypeMappingRepository Tests...');
                        abstractType = {
                            id: 0,
                            name: 'AbstractTestType',
                            category: 'abstract',
                            description: 'An abstract test type',
                            properties: []
                        };
                        return [4 /*yield*/, this.typeRepository.create(abstractType)];
                    case 1:
                        abstractTypeId = _a.sent();
                        testLang = {
                            id: 0,
                            name: 'MappingTestLang',
                            version: '1.0.0',
                            description: 'A test language for type mappings',
                            website: 'https://example.com',
                            syntaxRules: {
                                lineComment: '//',
                                blockCommentStart: '/*',
                                blockCommentEnd: '*/',
                                statementTerminator: ';',
                                caseInsensitive: false
                            }
                        };
                        return [4 /*yield*/, this.languageRepository.create(testLang)];
                    case 2:
                        langId = _a.sent();
                        testMapping = {
                            id: 0,
                            abstractTypeId: abstractTypeId,
                            languageId: langId,
                            concreteType: 'ConcreteTestType',
                            description: 'A test type mapping'
                        };
                        return [4 /*yield*/, this.runTest('typeMappingCreate', function () { return __awaiter(_this, void 0, void 0, function () {
                                var id;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.typeMappingRepository.create(testMapping)];
                                        case 1:
                                            id = _a.sent();
                                            this.assert(id > 0, "Expected positive ID, got ".concat(id));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 3:
                        _a.sent();
                        // Test type mapping retrieval
                        return [4 /*yield*/, this.runTest('typeMappingGetById', function () { return __awaiter(_this, void 0, void 0, function () {
                                var mappings, id, mapping;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.typeMappingRepository.getAll()];
                                        case 1:
                                            mappings = _a.sent();
                                            if (mappings.length === 0)
                                                return [2 /*return*/, false];
                                            id = mappings[0].id;
                                            return [4 /*yield*/, this.typeMappingRepository.getById(id)];
                                        case 2:
                                            mapping = _a.sent();
                                            this.assert(mapping !== null, 'Expected mapping to be found');
                                            this.assert(mapping.concreteType === 'ConcreteTestType', "Expected concrete type to be ConcreteTestType, got ".concat(mapping.concreteType));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 4:
                        // Test type mapping retrieval
                        _a.sent();
                        // Test type mapping retrieval by abstract type and language
                        return [4 /*yield*/, this.runTest('typeMappingGetByAbstractTypeAndLanguage', function () { return __awaiter(_this, void 0, void 0, function () {
                                var mapping;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.typeMappingRepository.getByAbstractTypeAndLanguage(abstractTypeId, langId)];
                                        case 1:
                                            mapping = _a.sent();
                                            this.assert(mapping !== null, 'Expected mapping to be found');
                                            this.assert(mapping.abstractTypeId === abstractTypeId, "Expected abstractTypeId to be ".concat(abstractTypeId, ", got ").concat(mapping.abstractTypeId));
                                            this.assert(mapping.languageId === langId, "Expected languageId to be ".concat(langId, ", got ").concat(mapping.languageId));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 5:
                        // Test type mapping retrieval by abstract type and language
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run integration tests between repositories
     */
    DatabaseTestSuite.prototype.runRepositoryIntegrationTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nRunning Repository Integration Tests...');
                        // Test relationship between function and pattern
                        return [4 /*yield*/, this.runTest('functionPatternRelationship', function () { return __awaiter(_this, void 0, void 0, function () {
                                var testLang, langId, testFunc, funcId, testPattern, patternId, patterns, func;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            testLang = {
                                                id: 0,
                                                name: 'IntegrationTestLang',
                                                version: '1.0.0',
                                                description: 'A test language for integration tests',
                                                website: 'https://example.com',
                                                syntaxRules: {
                                                    lineComment: '//',
                                                    blockCommentStart: '/*',
                                                    blockCommentEnd: '*/',
                                                    statementTerminator: ';',
                                                    caseInsensitive: false
                                                }
                                            };
                                            return [4 /*yield*/, this.languageRepository.create(testLang)];
                                        case 1:
                                            langId = _a.sent();
                                            testFunc = {
                                                id: 0,
                                                name: 'integrationTestFunc',
                                                category: 'test',
                                                description: 'A test function for integration tests',
                                                parameters: [
                                                    {
                                                        name: 'param1',
                                                        type: 'string',
                                                        description: 'First parameter',
                                                        optional: false
                                                    }
                                                ],
                                                returnType: 'number',
                                                examples: ['integrationTestFunc("hello") // returns 5'],
                                                tags: ['test', 'integration']
                                            };
                                            return [4 /*yield*/, this.functionRepository.create(testFunc)];
                                        case 2:
                                            funcId = _a.sent();
                                            testPattern = {
                                                id: 0,
                                                functionId: funcId,
                                                languageId: langId,
                                                pattern: 'integrationTestFunc($1)',
                                                description: 'A test pattern for integration tests',
                                                examples: ['integrationTestFunc("test")']
                                            };
                                            return [4 /*yield*/, this.patternRepository.create(testPattern)];
                                        case 3:
                                            patternId = _a.sent();
                                            return [4 /*yield*/, this.dbService.getSyntaxPatternsForFunction(funcId, langId)];
                                        case 4:
                                            patterns = _a.sent();
                                            this.assert(patterns.length > 0, 'Expected patterns to be found for function');
                                            this.assert(patterns[0].id === patternId, "Expected pattern ID to be ".concat(patternId, ", got ").concat(patterns[0].id));
                                            return [4 /*yield*/, this.dbService.getFunctionById(funcId)];
                                        case 5:
                                            func = _a.sent();
                                            this.assert(func !== null, 'Expected function to be found');
                                            this.assert(func.name === 'integrationTestFunc', "Expected function name to be integrationTestFunc, got ".concat(func.name));
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 1:
                        // Test relationship between function and pattern
                        _a.sent();
                        // Test DatabaseInitializer integration with repositories
                        return [4 /*yield*/, this.runTest('databaseInitializerIntegration', function () { return __awaiter(_this, void 0, void 0, function () {
                                var langs, funcs, patterns, types, mappings;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.languageRepository.getAll()];
                                        case 1:
                                            langs = _a.sent();
                                            return [4 /*yield*/, this.functionRepository.getAll()];
                                        case 2:
                                            funcs = _a.sent();
                                            return [4 /*yield*/, this.patternRepository.getAll()];
                                        case 3:
                                            patterns = _a.sent();
                                            return [4 /*yield*/, this.typeRepository.getAll()];
                                        case 4:
                                            types = _a.sent();
                                            return [4 /*yield*/, this.typeMappingRepository.getAll()];
                                        case 5:
                                            mappings = _a.sent();
                                            // We've created several test entities, so we should have data in each repository
                                            this.assert(langs.length > 0, 'Expected languages to exist');
                                            this.assert(funcs.length > 0, 'Expected functions to exist');
                                            this.assert(patterns.length > 0, 'Expected patterns to exist');
                                            this.assert(types.length > 0, 'Expected types to exist');
                                            this.assert(mappings.length > 0, 'Expected type mappings to exist');
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test DatabaseInitializer integration with repositories
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
    DatabaseTestSuite.prototype.runTest = function (name, testFn) {
        return __awaiter(this, void 0, void 0, function () {
            var success, error_3, errorMessage;
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
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : String(error_3);
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
    DatabaseTestSuite.prototype.assert = function (condition, message) {
        if (!condition) {
            throw new Error("Assertion failed: ".concat(message));
        }
    };
    /**
     * Print summary of test results
     */
    DatabaseTestSuite.prototype.printSummary = function () {
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
    return DatabaseTestSuite;
}());
exports.DatabaseTestSuite = DatabaseTestSuite;
/**
 * Run the database test suite
 */
function runDatabaseTests() {
    return __awaiter(this, void 0, void 0, function () {
        var testSuite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testSuite = new DatabaseTestSuite();
                    return [4 /*yield*/, testSuite.runAllTests()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runDatabaseTests = runDatabaseTests;
