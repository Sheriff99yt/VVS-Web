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
exports.DatabaseInitializer = void 0;
var DatabaseSchema_1 = require("./DatabaseSchema");
var LanguageRepository_1 = require("./repositories/LanguageRepository");
var FunctionRepository_1 = require("./repositories/FunctionRepository");
var PatternRepository_1 = require("./repositories/PatternRepository");
var TypeRepository_1 = require("./repositories/TypeRepository");
var TypeMappingRepository_1 = require("./repositories/TypeMappingRepository");
var PythonAnalyzer_1 = require("./seeding/PythonAnalyzer");
/**
 * Service for initializing and seeding the syntax database
 */
var DatabaseInitializer = /** @class */ (function () {
    function DatabaseInitializer() {
        this.languageRepository = new LanguageRepository_1.LanguageRepository();
        this.functionRepository = new FunctionRepository_1.FunctionRepository();
        this.patternRepository = new PatternRepository_1.PatternRepository();
        this.typeRepository = new TypeRepository_1.TypeRepository();
        this.typeMappingRepository = new TypeMappingRepository_1.TypeMappingRepository();
        this.pythonAnalyzer = new PythonAnalyzer_1.PythonAnalyzer();
    }
    /**
     * Set the syntax database service reference
     * @param service The syntax database service
     */
    DatabaseInitializer.prototype.setSyntaxDatabaseService = function (service) {
        this.syntaxDbService = service;
    };
    /**
     * Initialize the database and seed it with initial data
     */
    DatabaseInitializer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        db.close();
                        // Check if we need to seed the database with initial data
                        return [4 /*yield*/, this.seedIfNeeded()];
                    case 2:
                        // Check if we need to seed the database with initial data
                        _a.sent();
                        console.log('Database initialized successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to initialize database:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Seed the database with initial data if it's empty
     */
    DatabaseInitializer.prototype.seedIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var languages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.languageRepository.getAll()];
                    case 1:
                        languages = _a.sent();
                        if (!(languages.length === 0)) return [3 /*break*/, 3];
                        console.log('Seeding database with initial data...');
                        return [4 /*yield*/, this.seedPythonLanguage()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Seed the database with Python language data
     */
    DatabaseInitializer.prototype.seedPythonLanguage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pythonLangDef, pythonId, typeMap, typeDefinitions, _i, typeDefinitions_1, typeDef, typeId, typeMappings, _a, typeMappings_1, mapping, functionMap, functionDefinitions, _b, functionDefinitions_1, funcDef, funcId, syntaxPatterns, _c, syntaxPatterns_1, pattern, error_2;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 23, , 24]);
                        return [4 /*yield*/, this.pythonAnalyzer.extractLanguageDefinition()];
                    case 1:
                        pythonLangDef = _d.sent();
                        return [4 /*yield*/, this.languageRepository.create(pythonLangDef)];
                    case 2:
                        pythonId = _d.sent();
                        console.log("Added Python language definition with ID: ".concat(pythonId));
                        typeMap = new Map();
                        return [4 /*yield*/, this.pythonAnalyzer.extractTypeDefinitions()];
                    case 3:
                        typeDefinitions = _d.sent();
                        _i = 0, typeDefinitions_1 = typeDefinitions;
                        _d.label = 4;
                    case 4:
                        if (!(_i < typeDefinitions_1.length)) return [3 /*break*/, 7];
                        typeDef = typeDefinitions_1[_i];
                        return [4 /*yield*/, this.typeRepository.create(typeDef)];
                    case 5:
                        typeId = _d.sent();
                        typeMap.set(typeDef.name, typeId);
                        console.log("Added type definition for ".concat(typeDef.name, " with ID ").concat(typeId));
                        _d.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [4 /*yield*/, this.pythonAnalyzer.generateTypeMappings(typeMap, pythonId)];
                    case 8:
                        typeMappings = _d.sent();
                        _a = 0, typeMappings_1 = typeMappings;
                        _d.label = 9;
                    case 9:
                        if (!(_a < typeMappings_1.length)) return [3 /*break*/, 12];
                        mapping = typeMappings_1[_a];
                        return [4 /*yield*/, this.typeMappingRepository.create(mapping)];
                    case 10:
                        _d.sent();
                        console.log("Added type mapping for abstract type ID ".concat(mapping.abstractTypeId));
                        _d.label = 11;
                    case 11:
                        _a++;
                        return [3 /*break*/, 9];
                    case 12:
                        functionMap = new Map();
                        return [4 /*yield*/, this.pythonAnalyzer.extractBuiltInFunctions()];
                    case 13:
                        functionDefinitions = _d.sent();
                        _b = 0, functionDefinitions_1 = functionDefinitions;
                        _d.label = 14;
                    case 14:
                        if (!(_b < functionDefinitions_1.length)) return [3 /*break*/, 17];
                        funcDef = functionDefinitions_1[_b];
                        return [4 /*yield*/, this.functionRepository.create(funcDef)];
                    case 15:
                        funcId = _d.sent();
                        functionMap.set(funcDef.name, funcId);
                        console.log("Added function definition for ".concat(funcDef.name, " with ID ").concat(funcId));
                        _d.label = 16;
                    case 16:
                        _b++;
                        return [3 /*break*/, 14];
                    case 17: return [4 /*yield*/, this.pythonAnalyzer.generateSyntaxPatterns(functionMap, pythonId)];
                    case 18:
                        syntaxPatterns = _d.sent();
                        _c = 0, syntaxPatterns_1 = syntaxPatterns;
                        _d.label = 19;
                    case 19:
                        if (!(_c < syntaxPatterns_1.length)) return [3 /*break*/, 22];
                        pattern = syntaxPatterns_1[_c];
                        return [4 /*yield*/, this.patternRepository.create(pattern)];
                    case 20:
                        _d.sent();
                        console.log("Added syntax pattern for function ID ".concat(pattern.functionId));
                        _d.label = 21;
                    case 21:
                        _c++;
                        return [3 /*break*/, 19];
                    case 22:
                        console.log('Python language data seeded successfully');
                        return [3 /*break*/, 24];
                    case 23:
                        error_2 = _d.sent();
                        console.error('Error seeding Python language data:', error_2);
                        throw error_2;
                    case 24: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear all data from the database
     */
    DatabaseInitializer.prototype.clearDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, storeNames, dbRW_1, transaction_1, _loop_1, _i, storeNames_1, storeName, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        storeNames = Array.from(db.objectStoreNames);
                        // Close the database before reopening for transaction
                        db.close();
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 2:
                        dbRW_1 = _a.sent();
                        transaction_1 = dbRW_1.transaction(storeNames, 'readwrite');
                        _loop_1 = function (storeName) {
                            var store;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        store = transaction_1.objectStore(storeName);
                                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                var request = store.clear();
                                                request.onsuccess = function () { return resolve(); };
                                                request.onerror = function () { return reject(request.error); };
                                            })];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, storeNames_1 = storeNames;
                        _a.label = 3;
                    case 3:
                        if (!(_i < storeNames_1.length)) return [3 /*break*/, 6];
                        storeName = storeNames_1[_i];
                        return [5 /*yield**/, _loop_1(storeName)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Close the database when done
                        transaction_1.oncomplete = function () {
                            dbRW_1.close();
                            console.log('Database cleared successfully');
                        };
                        // Wait for transaction to complete
                        return [4 /*yield*/, new Promise(function (resolve) {
                                transaction_1.oncomplete = function () { return resolve(); };
                            })];
                    case 7:
                        // Wait for transaction to complete
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        error_3 = _a.sent();
                        console.error('Failed to clear database:', error_3);
                        throw error_3;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reset the database by clearing all data and reseeding
     */
    DatabaseInitializer.prototype.resetDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.clearDatabase()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.initialize()];
                    case 2:
                        _a.sent();
                        console.log('Database reset successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Failed to reset database:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseInitializer;
}());
exports.DatabaseInitializer = DatabaseInitializer;
