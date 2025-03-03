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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.SyntaxDatabaseServiceImpl = void 0;
var DatabaseInitializer_1 = require("./DatabaseInitializer");
var FunctionRepository_1 = require("./repositories/FunctionRepository");
var LanguageRepository_1 = require("./repositories/LanguageRepository");
var PatternRepository_1 = require("./repositories/PatternRepository");
var TypeMappingRepository_1 = require("./repositories/TypeMappingRepository");
var TypeRepository_1 = require("./repositories/TypeRepository");
/**
 * Implementation of the SyntaxDatabaseService interface.
 * This service provides access to all syntax-related data in the database.
 */
var SyntaxDatabaseServiceImpl = /** @class */ (function () {
    function SyntaxDatabaseServiceImpl() {
        this.initialized = false;
        this.initializing = null;
        this.languageRepository = new LanguageRepository_1.LanguageRepository();
        this.functionRepository = new FunctionRepository_1.FunctionRepository();
        this.patternRepository = new PatternRepository_1.PatternRepository();
        this.typeRepository = new TypeRepository_1.TypeRepository();
        this.typeMappingRepository = new TypeMappingRepository_1.TypeMappingRepository();
        this.databaseInitializer = new DatabaseInitializer_1.DatabaseInitializer();
    }
    /**
     * Initialize the service and ensure the database is ready
     */
    SyntaxDatabaseServiceImpl.prototype.ensureInitialized = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.initialized) {
                            return [2 /*return*/];
                        }
                        if (this.initializing) {
                            return [2 /*return*/, this.initializing];
                        }
                        this.initializing = this.databaseInitializer.initialize();
                        return [4 /*yield*/, this.initializing];
                    case 1:
                        _a.sent();
                        this.initialized = true;
                        this.initializing = null;
                        return [2 /*return*/];
                }
            });
        });
    };
    // Language methods
    SyntaxDatabaseServiceImpl.prototype.getLanguageById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.languageRepository.getById(id)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.getLanguages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.languageRepository.getAll()];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.createLanguage = function (language) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.languageRepository.create(language)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.updateLanguage = function (language) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.languageRepository.update(language)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.deleteLanguage = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.languageRepository["delete"](id)];
                }
            });
        });
    };
    // Function methods
    SyntaxDatabaseServiceImpl.prototype.getFunctionById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.functionRepository.getById(id)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.getFunctionsByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.functionRepository.getByCategory(category)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.searchFunctions = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.functionRepository.search(query)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.createFunction = function (functionDef) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.functionRepository.create(functionDef)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.updateFunction = function (functionDef) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.functionRepository.update(functionDef)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.deleteFunction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.functionRepository["delete"](id)];
                }
            });
        });
    };
    // Syntax pattern methods
    SyntaxDatabaseServiceImpl.prototype.getSyntaxPattern = function (functionId, languageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.patternRepository.getByFunctionAndLanguage(functionId, languageId)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.getSyntaxPatternsByLanguage = function (languageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.patternRepository.getByLanguage(languageId)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.createSyntaxPattern = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.patternRepository.create(pattern)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.updateSyntaxPattern = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.patternRepository.update(pattern)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.deleteSyntaxPattern = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.patternRepository["delete"](id)];
                }
            });
        });
    };
    // Type methods
    SyntaxDatabaseServiceImpl.prototype.getTypeById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeRepository.getById(id)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.getTypes = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeRepository.getAll()];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.createType = function (typeDef) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeRepository.create(typeDef)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.updateType = function (typeDef) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeRepository.update(typeDef)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.deleteType = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeRepository["delete"](id)];
                }
            });
        });
    };
    // Type mapping methods
    SyntaxDatabaseServiceImpl.prototype.getTypeMapping = function (abstractTypeId, languageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeMappingRepository.getByTypeAndLanguage(abstractTypeId, languageId)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.getTypeMappingsByLanguage = function (languageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeMappingRepository.getByLanguage(languageId)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.createTypeMapping = function (mapping) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeMappingRepository.create(mapping)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.updateTypeMapping = function (mapping) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeMappingRepository.update(mapping)];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.deleteTypeMapping = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.typeMappingRepository["delete"](id)];
                }
            });
        });
    };
    // Database management methods
    SyntaxDatabaseServiceImpl.prototype.initDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.initialized = false;
                        this.initializing = null;
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.clearDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.databaseInitializer.clearDatabase()];
                    case 1:
                        _a.sent();
                        this.initialized = false;
                        this.initializing = null;
                        return [2 /*return*/];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.exportDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var languages, functions, patterns, types, typeMappings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.languageRepository.getAll()];
                    case 2:
                        languages = _a.sent();
                        return [4 /*yield*/, this.functionRepository.getAll()];
                    case 3:
                        functions = _a.sent();
                        return [4 /*yield*/, this.patternRepository.getAll()];
                    case 4:
                        patterns = _a.sent();
                        return [4 /*yield*/, this.typeRepository.getAll()];
                    case 5:
                        types = _a.sent();
                        return [4 /*yield*/, this.typeMappingRepository.getAll()];
                    case 6:
                        typeMappings = _a.sent();
                        return [2 /*return*/, {
                                languages: languages,
                                functions: functions,
                                patterns: patterns,
                                types: types,
                                typeMappings: typeMappings
                            }];
                }
            });
        });
    };
    SyntaxDatabaseServiceImpl.prototype.importDatabase = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, language, id, languageData, _b, _c, func, id, funcData, _d, _e, pattern, id, patternData, _f, _g, type, id, typeData, _h, _j, mapping, id, mappingData;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, this.clearDatabase()];
                    case 1:
                        _k.sent();
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 2:
                        _k.sent();
                        if (!(data.languages && Array.isArray(data.languages))) return [3 /*break*/, 6];
                        _i = 0, _a = data.languages;
                        _k.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        language = _a[_i];
                        id = language.id, languageData = __rest(language, ["id"]);
                        return [4 /*yield*/, this.createLanguage(languageData)];
                    case 4:
                        _k.sent();
                        _k.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!(data.functions && Array.isArray(data.functions))) return [3 /*break*/, 10];
                        _b = 0, _c = data.functions;
                        _k.label = 7;
                    case 7:
                        if (!(_b < _c.length)) return [3 /*break*/, 10];
                        func = _c[_b];
                        id = func.id, funcData = __rest(func, ["id"]);
                        return [4 /*yield*/, this.createFunction(funcData)];
                    case 8:
                        _k.sent();
                        _k.label = 9;
                    case 9:
                        _b++;
                        return [3 /*break*/, 7];
                    case 10:
                        if (!(data.patterns && Array.isArray(data.patterns))) return [3 /*break*/, 14];
                        _d = 0, _e = data.patterns;
                        _k.label = 11;
                    case 11:
                        if (!(_d < _e.length)) return [3 /*break*/, 14];
                        pattern = _e[_d];
                        id = pattern.id, patternData = __rest(pattern, ["id"]);
                        return [4 /*yield*/, this.createSyntaxPattern(patternData)];
                    case 12:
                        _k.sent();
                        _k.label = 13;
                    case 13:
                        _d++;
                        return [3 /*break*/, 11];
                    case 14:
                        if (!(data.types && Array.isArray(data.types))) return [3 /*break*/, 18];
                        _f = 0, _g = data.types;
                        _k.label = 15;
                    case 15:
                        if (!(_f < _g.length)) return [3 /*break*/, 18];
                        type = _g[_f];
                        id = type.id, typeData = __rest(type, ["id"]);
                        return [4 /*yield*/, this.createType(typeData)];
                    case 16:
                        _k.sent();
                        _k.label = 17;
                    case 17:
                        _f++;
                        return [3 /*break*/, 15];
                    case 18:
                        if (!(data.typeMappings && Array.isArray(data.typeMappings))) return [3 /*break*/, 22];
                        _h = 0, _j = data.typeMappings;
                        _k.label = 19;
                    case 19:
                        if (!(_h < _j.length)) return [3 /*break*/, 22];
                        mapping = _j[_h];
                        id = mapping.id, mappingData = __rest(mapping, ["id"]);
                        return [4 /*yield*/, this.createTypeMapping(mappingData)];
                    case 20:
                        _k.sent();
                        _k.label = 21;
                    case 21:
                        _h++;
                        return [3 /*break*/, 19];
                    case 22: return [2 /*return*/];
                }
            });
        });
    };
    return SyntaxDatabaseServiceImpl;
}());
exports.SyntaxDatabaseServiceImpl = SyntaxDatabaseServiceImpl;
