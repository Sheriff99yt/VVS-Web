import { 
    IPort,
    SystemState,
    NodeState,
    ConnectionState,
    ValidationError,
    StateManagerConfig,
    StateEvent,
    StateHistoryEntry,
    StateSnapshot,
    PerformanceMetrics,
    PersistenceConfig,
    StateMigration,
    InternalConfig
} from '../types';

export abstract class StateManager {
    protected currentState: SystemState;
    protected history: StateHistoryEntry[];
    protected future: StateHistoryEntry[];
    protected config: InternalConfig;
    protected autosaveTimer?: number;
    protected isTransactionActive: boolean = false;
    protected transactionChanges: Partial<SystemState> = {};
    protected persistence: Required<PersistenceConfig>;
    protected migrations: StateMigration[];
    protected snapshots: Map<string, StateSnapshot> = new Map();
    protected operationQueue: Array<() => void> = [];
    protected batchTimeout?: number;
    protected metrics: PerformanceMetrics = {
        operationCount: 0,
        lastOperationTime: 0,
        averageOperationTime: 0,
        memoryUsage: 0,
        historySize: 0,
        snapshotCount: 0
    };

    constructor(initialState: SystemState, config: StateManagerConfig = {}) {
        this.currentState = initialState;
        this.history = [];
        this.future = [];
        this.migrations = config.migrations || [];
        this.persistence = {
            storage: config.persistence?.storage || 'local',
            key: config.persistence?.key || 'nodeSystemState',
            customStorage: config.persistence?.customStorage || {
                getItem: async () => null,
                setItem: async () => {},
                removeItem: async () => {}
            },
            autoSave: config.persistence?.autoSave ?? true,
            saveInterval: config.persistence?.saveInterval || 60000,
            compression: config.persistence?.compression ?? false
        };
        this.config = {
            maxHistorySize: config.maxHistorySize || 100,
            autosaveInterval: config.autosaveInterval || 60000,
            validationRules: {
                validateNode: config.validationRules?.validateNode || (() => []),
                validateConnection: config.validationRules?.validateConnection || (() => []),
                validateSystem: config.validationRules?.validateSystem || (() => [])
            },
            performance: {
                enableMetrics: config.performance?.enableMetrics ?? true,
                batchOperations: config.performance?.batchOperations ?? true,
                debounceTime: config.performance?.debounceTime || 100,
                maxBatchSize: config.performance?.maxBatchSize || 50
            }
        };

        if (this.persistence.autoSave) {
            this.setupAutosave();
        }
    }

    private setupAutosave() {
        if (this.persistence.saveInterval > 0) {
            this.autosaveTimer = window.setInterval(async () => {
                await this.saveState();
            }, this.persistence.saveInterval);
        }
    }

    public abstract updateNode(nodeId: string, updates: Partial<NodeState>): Promise<void>;
    public abstract addConnection(connection: ConnectionState): Promise<void>;
    public abstract removeConnection(connectionId: string): Promise<void>;
    public abstract dispose(): void;
    protected abstract validateNode(node: NodeState): Promise<ValidationError[]>;
    protected abstract validateConnection(connection: ConnectionState): Promise<ValidationError[]>;
    protected abstract validateSystem(state: SystemState): Promise<ValidationError[]>;

    public async beginTransaction(description: string): Promise<void> {
        if (this.isTransactionActive) {
            throw new Error('A transaction is already active');
        }
        this.isTransactionActive = true;
        this.transactionChanges = {};
    }

    public async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive) {
            throw new Error('No active transaction to commit');
        }

        const newState = {
            ...this.currentState,
            ...this.transactionChanges,
            version: this.currentState.version + 1,
            timestamp: Date.now()
        };

        await this.pushState(newState, 'Transaction commit');
        this.isTransactionActive = false;
        this.transactionChanges = {};
    }

    public async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive) {
            throw new Error('No active transaction to rollback');
        }
        this.isTransactionActive = false;
        this.transactionChanges = {};
    }

    public getCurrentState(): SystemState {
        return this.currentState;
    }

    public getHistory(): StateHistoryEntry[] {
        return [...this.history];
    }

    public async validateState(): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        
        // Validate nodes
        for (const node of Object.values(this.currentState.nodes)) {
            errors.push(...await this.validateNode(node));
        }

        // Validate connections
        for (const connection of Object.values(this.currentState.connections)) {
            errors.push(...await this.validateConnection(connection));
        }

        // Validate system state
        errors.push(...await this.validateSystem(this.currentState));

        return errors;
    }

    protected async pushState(state: SystemState, description: string): Promise<void> {
        const entry: StateHistoryEntry = {
            state,
            description,
            timestamp: Date.now()
        };

        this.history.push(entry);
        this.future = [];
        this.currentState = state;

        if (this.history.length > this.config.maxHistorySize) {
            this.history.shift();
        }

        if (this.persistence.autoSave) {
            await this.saveState();
        }
    }

    private async getStorage() {
        switch (this.persistence.storage) {
            case 'local':
                return localStorage;
            case 'session':
                return sessionStorage;
            case 'custom':
                return this.persistence.customStorage;
            default:
                return localStorage;
        }
    }

    private async compressState(state: SystemState): Promise<string> {
        if (!this.persistence.compression) {
            return JSON.stringify(state);
        }

        const stateStr = JSON.stringify(state);
        try {
            const compressed = await new Blob([stateStr])
                .stream()
                .pipeThrough(new CompressionStream('gzip'));
            
            const chunks = [];
            const reader = compressed.getReader();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const blob = new Blob(chunks);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn('Compression failed, falling back to uncompressed state:', error);
            return stateStr;
        }
    }

    private async decompressState(data: string): Promise<SystemState> {
        if (!this.persistence.compression) {
            return JSON.parse(data);
        }

        try {
            const response = await fetch(data);
            const compressed = await response.blob()
                .then(blob => blob.stream())
                .then(stream => stream.pipeThrough(new DecompressionStream('gzip')));
            
            const chunks = [];
            const reader = compressed.getReader();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const text = new TextDecoder().decode(
                chunks.reduce((acc, chunk) => {
                    const tmp = new Uint8Array(acc.length + chunk.length);
                    tmp.set(acc);
                    tmp.set(chunk, acc.length);
                    return tmp;
                }, new Uint8Array(0))
            );

            return JSON.parse(text);
        } catch (error) {
            console.warn('Decompression failed, attempting to parse as uncompressed:', error);
            return JSON.parse(data);
        }
    }

    protected async migrateState(state: SystemState): Promise<SystemState> {
        let currentState = { ...state };
        for (const migration of this.migrations) {
            if (migration.version > currentState.version) {
                currentState = await migration.migrate(currentState);
            }
        }
        return currentState;
    }

    public async saveState(key?: string) {
        try {
            const storage = await this.getStorage();
            const compressed = await this.compressState(this.currentState);
            await storage.setItem(key || this.persistence.key, compressed);
        } catch (error) {
            console.error('Failed to save state:', error);
            throw error;
        }
    }

    public async loadState(key?: string): Promise<SystemState> {
        try {
            const storage = await this.getStorage();
            const saved = await storage.getItem(key || this.persistence.key);
            if (!saved) throw new Error('No saved state found');

            const state = await this.decompressState(saved);
            return this.migrateState(state);
        } catch (error) {
            console.error('Failed to load state:', error);
            throw error;
        }
    }

    public async clearState(key?: string) {
        try {
            const storage = await this.getStorage();
            await storage.removeItem(key || this.persistence.key);
        } catch (error) {
            console.error('Failed to clear state:', error);
            throw error;
        }
    }

    public async exportState(): Promise<string> {
        return this.compressState(this.currentState);
    }

    public async importState(data: string) {
        const state = await this.decompressState(data);
        const migratedState = await this.migrateState(state);
        this.currentState = migratedState;
        this.history = [];
        this.future = [];
        if (this.persistence.autoSave) {
            await this.saveState();
        }
    }

    public createSnapshot(name: string, description?: string, tags?: string[], metadata?: Record<string, any>): string {
        const id = crypto.randomUUID();
        const snapshot: StateSnapshot = {
            id,
            name,
            description,
            tags,
            state: JSON.parse(JSON.stringify(this.currentState)), // Deep clone
            timestamp: Date.now(),
            metadata
        };
        this.snapshots.set(id, snapshot);
        this.updateMetrics();
        return id;
    }

    public getSnapshot(id: string): StateSnapshot | undefined {
        return this.snapshots.get(id);
    }

    public listSnapshots(): StateSnapshot[] {
        return Array.from(this.snapshots.values());
    }

    public restoreSnapshot(id: string): boolean {
        const snapshot = this.snapshots.get(id);
        if (!snapshot) return false;

        this.pushState(this.currentState, `Restore snapshot: ${snapshot.name}`);
        this.currentState = JSON.parse(JSON.stringify(snapshot.state)); // Deep clone
        return true;
    }

    public deleteSnapshot(id: string): boolean {
        const result = this.snapshots.delete(id);
        this.updateMetrics();
        return result;
    }

    public getMetrics(): PerformanceMetrics {
        this.updateMetrics();
        return { ...this.metrics };
    }

    private updateMetrics() {
        if (!this.config.performance.enableMetrics) return;

        let memoryUsage = 0;
        try {
            // Try to get memory usage if available
            if (typeof performance !== 'undefined' && 
                'memory' in performance &&
                (performance as any).memory?.usedJSHeapSize) {
                memoryUsage = (performance as any).memory.usedJSHeapSize;
            }
        } catch (error) {
            console.warn('Memory metrics not available:', error);
        }

        this.metrics = {
            ...this.metrics,
            historySize: this.history.length,
            snapshotCount: this.snapshots.size,
            memoryUsage
        };
    }

    private measureOperation<T>(operation: () => T): T {
        if (!this.config.performance.enableMetrics) return operation();

        const start = performance.now();
        const result = operation();
        const duration = performance.now() - start;

        this.metrics.operationCount++;
        this.metrics.lastOperationTime = duration;
        this.metrics.averageOperationTime = 
            (this.metrics.averageOperationTime * (this.metrics.operationCount - 1) + duration) / 
            this.metrics.operationCount;

        return result;
    }

    private queueOperation(operation: () => void) {
        if (!this.config.performance.batchOperations) {
            operation();
            return;
        }

        this.operationQueue.push(operation);

        if (this.operationQueue.length >= this.config.performance.maxBatchSize) {
            this.flushOperationQueue();
        } else if (!this.batchTimeout) {
            this.batchTimeout = window.setTimeout(
                () => this.flushOperationQueue(),
                this.config.performance.debounceTime
            );
        }
    }

    private flushOperationQueue() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = undefined;
        }

        if (this.operationQueue.length === 0) return;

        this.measureOperation(() => {
            const operations = this.operationQueue;
            this.operationQueue = [];
            operations.forEach(op => op());
        });
    }
} 