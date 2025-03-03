"use strict";
/**
 * Database schema definition for the VVS Web syntax database
 * This file contains the configuration for IndexedDB including
 * database name, version, and table schemas
 */
var _a;
exports.__esModule = true;
exports.openDatabase = exports.createSchema = exports.StoreIndices = exports.StoreNames = exports.DB_VERSION = exports.DB_NAME = void 0;
exports.DB_NAME = 'vvs_syntax_db';
exports.DB_VERSION = 1;
/**
 * Database store (table) names
 */
var StoreNames;
(function (StoreNames) {
    StoreNames["LANGUAGES"] = "languages";
    StoreNames["FUNCTIONS"] = "functions";
    StoreNames["SYNTAX_PATTERNS"] = "syntaxPatterns";
    StoreNames["TYPES"] = "types";
    StoreNames["TYPE_MAPPINGS"] = "typeMappings";
})(StoreNames = exports.StoreNames || (exports.StoreNames = {}));
/**
 * Index definitions for each store
 */
exports.StoreIndices = (_a = {},
    _a[StoreNames.LANGUAGES] = {
        NAME_INDEX: 'name'
    },
    _a[StoreNames.FUNCTIONS] = {
        NAME_INDEX: 'name',
        CATEGORY_INDEX: 'category',
        BUILT_IN_INDEX: 'isBuiltIn'
    },
    _a[StoreNames.SYNTAX_PATTERNS] = {
        FUNCTION_LANGUAGE_INDEX: 'functionLanguage',
        LANGUAGE_INDEX: 'languageId'
    },
    _a[StoreNames.TYPES] = {
        NAME_INDEX: 'name'
    },
    _a[StoreNames.TYPE_MAPPINGS] = {
        TYPE_LANGUAGE_INDEX: 'typeLanguage',
        LANGUAGE_INDEX: 'languageId'
    },
    _a);
/**
 * Create the database schema during initialization
 * @param db The database instance
 */
function createSchema(db) {
    // Languages store
    if (!db.objectStoreNames.contains(StoreNames.LANGUAGES)) {
        var languageStore = db.createObjectStore(StoreNames.LANGUAGES, {
            keyPath: 'id',
            autoIncrement: true
        });
        // Create indices
        languageStore.createIndex(exports.StoreIndices[StoreNames.LANGUAGES].NAME_INDEX, 'name', { unique: true });
    }
    // Functions store
    if (!db.objectStoreNames.contains(StoreNames.FUNCTIONS)) {
        var functionStore = db.createObjectStore(StoreNames.FUNCTIONS, {
            keyPath: 'id',
            autoIncrement: true
        });
        // Create indices
        functionStore.createIndex(exports.StoreIndices[StoreNames.FUNCTIONS].NAME_INDEX, 'name', { unique: true });
        functionStore.createIndex(exports.StoreIndices[StoreNames.FUNCTIONS].CATEGORY_INDEX, 'category', { unique: false });
        functionStore.createIndex(exports.StoreIndices[StoreNames.FUNCTIONS].BUILT_IN_INDEX, 'isBuiltIn', { unique: false });
    }
    // Syntax patterns store
    if (!db.objectStoreNames.contains(StoreNames.SYNTAX_PATTERNS)) {
        var patternsStore = db.createObjectStore(StoreNames.SYNTAX_PATTERNS, {
            keyPath: 'id',
            autoIncrement: true
        });
        // Create compound index for function+language
        patternsStore.createIndex(exports.StoreIndices[StoreNames.SYNTAX_PATTERNS].FUNCTION_LANGUAGE_INDEX, ['functionId', 'languageId'], { unique: true });
        patternsStore.createIndex(exports.StoreIndices[StoreNames.SYNTAX_PATTERNS].LANGUAGE_INDEX, 'languageId', { unique: false });
    }
    // Types store
    if (!db.objectStoreNames.contains(StoreNames.TYPES)) {
        var typesStore = db.createObjectStore(StoreNames.TYPES, {
            keyPath: 'id',
            autoIncrement: true
        });
        // Create indices
        typesStore.createIndex(exports.StoreIndices[StoreNames.TYPES].NAME_INDEX, 'name', { unique: true });
    }
    // Type mappings store
    if (!db.objectStoreNames.contains(StoreNames.TYPE_MAPPINGS)) {
        var mappingsStore = db.createObjectStore(StoreNames.TYPE_MAPPINGS, {
            keyPath: 'id',
            autoIncrement: true
        });
        // Create compound index for abstractType+language
        mappingsStore.createIndex(exports.StoreIndices[StoreNames.TYPE_MAPPINGS].TYPE_LANGUAGE_INDEX, ['abstractTypeId', 'languageId'], { unique: true });
        mappingsStore.createIndex(exports.StoreIndices[StoreNames.TYPE_MAPPINGS].LANGUAGE_INDEX, 'languageId', { unique: false });
    }
}
exports.createSchema = createSchema;
/**
 * Simple utility to open a connection to the database
 * @returns Promise resolving to an open database connection
 */
function openDatabase() {
    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(exports.DB_NAME, exports.DB_VERSION);
        request.onerror = function () {
            var _a;
            reject(new Error("Failed to open database: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message)));
        };
        request.onsuccess = function () {
            resolve(request.result);
        };
        request.onupgradeneeded = function (event) {
            var db = request.result;
            createSchema(db);
        };
    });
}
exports.openDatabase = openDatabase;
