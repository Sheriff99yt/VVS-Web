import { DataType } from '../../old/components/nodes/CustomNodes';

// Function node structure interface
export interface NodeFunctionStructure {
    id: number;                // Integer ID for database primary key
    name: string;             // Unique function name
    // Access modifier as written in the language (e.g., "public", "private", "@private", "pub")
    accessModifier: string;
    // Static keyword as written in the language (e.g., "static", "@staticmethod", "static fn")
    isStatic: string;
    // Async keyword as written in the language (e.g., "async", "async def", "async fn")
    isAsync: string;
    // Return type as written in the language (e.g., "void", "-> None", "-> Result<T>")
    returnType: string;
    // Parameters as written in the language
    parameters: {
        text: string;            // Full parameter text (e.g., "name: string = 'default'")
        defaultValue: string;    // Default value as written (e.g., "'default'", "None", "null")
        isOptional: string;      // Optional marker as written (e.g., "?", "= undefined", "Option<T>")
    }[];
    // Throws clause as written in the language (e.g., "throws Exception", "-> Result<T, Error>")
    throws: string;
    // Body delimiters as written in the language
    bodyPrefix: string;         // e.g., "{", ":", "do"
    bodySuffix: string;         // e.g., "}", "end", "done"
    // Code sections as written in the language
    validation: string;         // Parameter validation code
    implementation: string;     // Main implementation code
    errorHandling: string;      // Error handling code
    // Metadata
    created: string;           // ISO date string
    modified: string;          // ISO date string
    language: string;          // Programming language identifier
    category: string;          // Function category
    description: string;       // Function description
}

export interface FunctionComponent {
    id: string;
    name: string;
    description: string;
    category: string;
    language: string;
    returnType: DataType;
    parameters: {
        name: string;
        type: DataType;
        description: string;
        isOptional: boolean;
        defaultValue?: any;
    }[];
    body: string;
    isAsync: boolean;
    throws?: string[];
    examples: {
        input: any[];
        output: any;
        description: string;
    }[];
    created: Date;
    modified: Date;
}

export class FunctionDB {
    private static DB_NAME = 'FunctionDB';
    private static DB_VERSION = 2; // Increased version for new schema
    private static STORE_NAMES = {
        FUNCTIONS: 'functions',
        FUNCTION_NODES: 'functionNodes'
    };
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(FunctionDB.DB_NAME, FunctionDB.DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Create or update function nodes store
                if (!db.objectStoreNames.contains(FunctionDB.STORE_NAMES.FUNCTION_NODES)) {
                    const functionNodeStore = db.createObjectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES, { 
                        keyPath: 'id',
                        autoIncrement: true  // Auto-increment integer IDs
                    });
                    
                    // Create indexes for function nodes
                    functionNodeStore.createIndex('name', 'name', { unique: true });  // Make name unique
                    functionNodeStore.createIndex('accessModifier', 'accessModifier', { unique: false });
                    functionNodeStore.createIndex('returnType', 'returnType', { unique: false });
                    functionNodeStore.createIndex('language', 'language', { unique: false });
                    functionNodeStore.createIndex('category', 'category', { unique: false });
                    functionNodeStore.createIndex('modified', 'modified', { unique: false });
                    functionNodeStore.createIndex('isAsync', 'isAsync', { unique: false });
                    functionNodeStore.createIndex('isStatic', 'isStatic', { unique: false });
                }
            };
        });
    }

    // Function Node CRUD operations
    async addFunctionNode(node: NodeFunctionStructure): Promise<string> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const request = store.add(node);

            request.onsuccess = () => resolve(node.id.toString());
            request.onerror = () => reject(new Error('Failed to add function node'));
        });
    }

    async getFunctionNode(id: string): Promise<NodeFunctionStructure | null> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readonly');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new Error('Failed to get function node'));
        });
    }

    async updateFunctionNode(node: NodeFunctionStructure): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const request = store.put(node);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to update function node'));
        });
    }

    async deleteFunctionNode(id: string): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete function node'));
        });
    }

    async getAllFunctionNodes(): Promise<NodeFunctionStructure[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readonly');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get all function nodes'));
        });
    }

    async searchFunctionNodesByCategory(category: string): Promise<NodeFunctionStructure[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readonly');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to search by category'));
        });
    }

    async searchFunctionNodesByName(query: string): Promise<NodeFunctionStructure[]> {
        const all = await this.getAllFunctionNodes();
        return all.filter(node => 
            node.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    async clearFunctionNodes(): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTION_NODES], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTION_NODES);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear function nodes'));
        });
    }

    async add(component: FunctionComponent): Promise<string> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const request = store.add(component);

            request.onsuccess = () => resolve(component.id);
            request.onerror = () => reject(new Error('Failed to add component'));
        });
    }

    async get(id: string): Promise<FunctionComponent | null> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readonly');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new Error('Failed to get component'));
        });
    }

    async update(component: FunctionComponent): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const request = store.put(component);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to update component'));
        });
    }

    async delete(id: string): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete component'));
        });
    }

    async getAll(): Promise<FunctionComponent[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readonly');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get all components'));
        });
    }

    async searchByCategory(category: string): Promise<FunctionComponent[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readonly');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to search by category'));
        });
    }

    async searchByName(query: string): Promise<FunctionComponent[]> {
        const all = await this.getAll();
        return all.filter(component => 
            component.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    async clear(): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([FunctionDB.STORE_NAMES.FUNCTIONS], 'readwrite');
            const store = transaction.objectStore(FunctionDB.STORE_NAMES.FUNCTIONS);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear database'));
        });
    }
} 