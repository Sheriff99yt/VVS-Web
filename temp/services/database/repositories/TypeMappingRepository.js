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
exports.TypeMappingRepository = void 0;
var DatabaseSchema_1 = require("../DatabaseSchema");
/**
 * Repository for managing type mappings in the database
 */
var TypeMappingRepository = /** @class */ (function () {
    function TypeMappingRepository() {
    }
    /**
     * Get a type mapping by its ID
     * @param id The mapping ID
     * @returns The type mapping or null if not found
     */
    TypeMappingRepository.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var request = store.get(id);
                                request.onsuccess = function () {
                                    resolve(request.result || null);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get type mapping with ID ".concat(id, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    /**
     * Get all type mappings in the database
     * @returns Array of all type mappings
     */
    TypeMappingRepository.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var request = store.getAll();
                                request.onsuccess = function () {
                                    resolve(request.result || []);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get all type mappings: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    /**
     * Get type mapping by abstract type ID and language ID
     * @param abstractTypeId The abstract type ID
     * @param languageId The language ID
     * @returns The type mapping or null if not found
     */
    TypeMappingRepository.prototype.getByTypeAndLanguage = function (abstractTypeId, languageId) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var index = store.index(DatabaseSchema_1.StoreIndices[DatabaseSchema_1.StoreNames.TYPE_MAPPINGS].TYPE_LANGUAGE_INDEX);
                                var request = index.get([abstractTypeId, languageId]);
                                request.onsuccess = function () {
                                    resolve(request.result || null);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get type mapping for type ".concat(abstractTypeId, " and language ").concat(languageId, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    /**
     * Get type mappings for a specific language
     * @param languageId The language ID
     * @returns Array of type mappings for the language
     */
    TypeMappingRepository.prototype.getByLanguage = function (languageId) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var index = store.index(DatabaseSchema_1.StoreIndices[DatabaseSchema_1.StoreNames.TYPE_MAPPINGS].LANGUAGE_INDEX);
                                var request = index.getAll(languageId);
                                request.onsuccess = function () {
                                    resolve(request.result || []);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get type mappings for language ".concat(languageId, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    /**
     * Create a new type mapping
     * @param mapping The mapping to create (without ID)
     * @returns The ID of the created mapping
     */
    TypeMappingRepository.prototype.create = function (mapping) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readwrite');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var request = store.add(mapping);
                                request.onsuccess = function () {
                                    resolve(request.result);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to create type mapping: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    /**
     * Update an existing type mapping
     * @param mapping The mapping to update (with ID)
     */
    TypeMappingRepository.prototype.update = function (mapping) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (mapping.id === undefined) {
                            throw new Error('Cannot update type mapping without an ID');
                        }
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readwrite');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var request = store.put(mapping);
                                request.onsuccess = function () {
                                    resolve();
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to update type mapping: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    /**
     * Delete a type mapping
     * @param id The ID of the mapping to delete
     */
    TypeMappingRepository.prototype["delete"] = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS, 'readwrite');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.TYPE_MAPPINGS);
                                var request = store["delete"](id);
                                request.onsuccess = function () {
                                    resolve();
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to delete type mapping with ID ".concat(id, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    return TypeMappingRepository;
}());
exports.TypeMappingRepository = TypeMappingRepository;
