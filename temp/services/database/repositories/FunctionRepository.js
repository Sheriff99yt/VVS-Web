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
exports.FunctionRepository = void 0;
var DatabaseSchema_1 = require("../DatabaseSchema");
/**
 * Repository for managing function definitions in the database
 */
var FunctionRepository = /** @class */ (function () {
    function FunctionRepository() {
    }
    /**
     * Get a function definition by its ID
     * @param id The function ID
     * @returns The function or null if not found
     */
    FunctionRepository.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var request = store.get(id);
                                request.onsuccess = function () {
                                    resolve(request.result || null);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get function with ID ".concat(id, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Get all function definitions in the database
     * @returns Array of all functions
     */
    FunctionRepository.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var request = store.getAll();
                                request.onsuccess = function () {
                                    resolve(request.result || []);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get all functions: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Get a function by its name
     * @param name The function name
     * @returns The function or null if not found
     */
    FunctionRepository.prototype.getByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var index = store.index(DatabaseSchema_1.StoreIndices[DatabaseSchema_1.StoreNames.FUNCTIONS].NAME_INDEX);
                                var request = index.get(name);
                                request.onsuccess = function () {
                                    resolve(request.result || null);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get function with name ".concat(name, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Get functions by category
     * @param category The category name
     * @returns Array of functions in the specified category
     */
    FunctionRepository.prototype.getByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var index = store.index(DatabaseSchema_1.StoreIndices[DatabaseSchema_1.StoreNames.FUNCTIONS].CATEGORY_INDEX);
                                var request = index.getAll(category);
                                request.onsuccess = function () {
                                    resolve(request.result || []);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get functions with category ".concat(category, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Get built-in functions
     * @returns Array of built-in functions
     */
    FunctionRepository.prototype.getBuiltIn = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readonly');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var index = store.index(DatabaseSchema_1.StoreIndices[DatabaseSchema_1.StoreNames.FUNCTIONS].BUILT_IN_INDEX);
                                var functions = [];
                                var request = index.openCursor(IDBKeyRange.only(1));
                                request.onsuccess = function (event) {
                                    var cursor = event.target.result;
                                    if (cursor) {
                                        functions.push(cursor.value);
                                        cursor["continue"]();
                                    }
                                    else {
                                        resolve(functions);
                                    }
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to get built-in functions: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Search for functions by name, description, or tags
     * @param query The search query
     * @returns Array of matching functions
     */
    FunctionRepository.prototype.search = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var functions, lowerQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!query || query.trim() === '') {
                            return [2 /*return*/, this.getAll()];
                        }
                        return [4 /*yield*/, this.getAll()];
                    case 1:
                        functions = _a.sent();
                        lowerQuery = query.toLowerCase();
                        return [2 /*return*/, functions.filter(function (func) {
                                return func.name.toLowerCase().includes(lowerQuery) ||
                                    func.displayName.toLowerCase().includes(lowerQuery) ||
                                    func.description.toLowerCase().includes(lowerQuery) ||
                                    func.tags.some(function (tag) { return tag.toLowerCase().includes(lowerQuery); });
                            })];
                }
            });
        });
    };
    /**
     * Create a new function definition
     * @param functionDef The function to create (without ID)
     * @returns The ID of the created function
     */
    FunctionRepository.prototype.create = function (functionDef) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readwrite');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var request = store.add(functionDef);
                                request.onsuccess = function () {
                                    resolve(request.result);
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to create function: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Update an existing function definition
     * @param functionDef The function to update (with ID)
     */
    FunctionRepository.prototype.update = function (functionDef) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (functionDef.id === undefined) {
                            throw new Error('Cannot update function without an ID');
                        }
                        return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readwrite');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var request = store.put(functionDef);
                                request.onsuccess = function () {
                                    resolve();
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to update function: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
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
     * Delete a function definition
     * @param id The ID of the function to delete
     */
    FunctionRepository.prototype["delete"] = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, DatabaseSchema_1.openDatabase)()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(DatabaseSchema_1.StoreNames.FUNCTIONS, 'readwrite');
                                var store = transaction.objectStore(DatabaseSchema_1.StoreNames.FUNCTIONS);
                                var request = store["delete"](id);
                                request.onsuccess = function () {
                                    resolve();
                                };
                                request.onerror = function () {
                                    var _a;
                                    reject(new Error("Failed to delete function with ID ".concat(id, ": ").concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
                                };
                                transaction.oncomplete = function () {
                                    db.close();
                                };
                            })];
                }
            });
        });
    };
    return FunctionRepository;
}());
exports.FunctionRepository = FunctionRepository;
