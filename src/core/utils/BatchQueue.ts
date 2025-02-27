import { TypedBatchOperation, UpdateNodeOperation, AddConnectionOperation, RemoveConnectionOperation } from '../state/EnhancedStateManager';

export class TypedBatchQueue<T extends TypedBatchOperation> {
    private items: T[] = [];
    private readonly maxSize: number;

    constructor(maxSize: number = 50) {
        this.maxSize = maxSize;
    }

    add(item: T): boolean {
        this.items.push(item);
        return this.items.length >= this.maxSize;
    }

    clear(): void {
        this.items = [];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }

    process<U extends T>(
        predicate: (value: T) => value is U,
        handler: (items: U[]) => Promise<void>
    ): Promise<void> {
        const filtered = this.items.filter(predicate as (value: T) => boolean) as U[];
        return handler(filtered);
    }

    getAll(): T[] {
        return [...this.items];
    }
}

export class BatchQueueManager {
    private nodeUpdates: TypedBatchQueue<UpdateNodeOperation>;
    private connectionAdditions: TypedBatchQueue<AddConnectionOperation>;
    private connectionRemovals: TypedBatchQueue<RemoveConnectionOperation>;

    constructor(maxBatchSize: number = 50) {
        this.nodeUpdates = new TypedBatchQueue<UpdateNodeOperation>(maxBatchSize);
        this.connectionAdditions = new TypedBatchQueue<AddConnectionOperation>(maxBatchSize);
        this.connectionRemovals = new TypedBatchQueue<RemoveConnectionOperation>(maxBatchSize);
    }

    addOperation(operation: TypedBatchOperation): boolean {
        switch (operation.type) {
            case 'updateNode':
                return this.nodeUpdates.add(operation as UpdateNodeOperation);
            case 'addConnection':
                return this.connectionAdditions.add(operation as AddConnectionOperation);
            case 'removeConnection':
                return this.connectionRemovals.add(operation as RemoveConnectionOperation);
        }
    }

    hasOperations(): boolean {
        return !this.nodeUpdates.isEmpty() ||
               !this.connectionAdditions.isEmpty() ||
               !this.connectionRemovals.isEmpty();
    }

    clear(): void {
        this.nodeUpdates.clear();
        this.connectionAdditions.clear();
        this.connectionRemovals.clear();
    }

    getNodeUpdates(): UpdateNodeOperation[] {
        return this.nodeUpdates.getAll();
    }

    getConnectionAdditions(): AddConnectionOperation[] {
        return this.connectionAdditions.getAll();
    }

    getConnectionRemovals(): RemoveConnectionOperation[] {
        return this.connectionRemovals.getAll();
    }
} 