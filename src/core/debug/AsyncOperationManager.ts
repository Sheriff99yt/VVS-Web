import { AsyncOperationManager as IAsyncOperationManager } from './types';

export class AsyncOperationManager implements IAsyncOperationManager {
    private pendingOperations: Map<string, Promise<void>> = new Map();
    private operationTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private operationControllers: Map<string, AbortController> = new Map();
    private operationRejects: Map<string, (error: Error) => void> = new Map();
    
    async executeNodeOperation(
        nodeId: string,
        operation: () => Promise<void>,
        timeout?: number
    ): Promise<void> {
        // Create abort controller for this operation
        const controller = new AbortController();
        this.operationControllers.set(nodeId, controller);

        // Create the operation promise with cancellation support
        const operationPromise = new Promise<void>((resolve, reject) => {
            this.operationRejects.set(nodeId, reject);
            operation().then(resolve).catch(reject);
        });

        // Store the current operation
        const currentOperation = operationPromise;
        this.pendingOperations.set(nodeId, currentOperation);

        try {
            // Set timeout if specified
            if (timeout) {
                const timeoutPromise = new Promise<void>((_, reject) => {
                    const timer = setTimeout(() => {
                        if (this.pendingOperations.get(nodeId) === currentOperation) {
                            reject(new Error(`Operation timeout for node ${nodeId}`));
                        }
                    }, timeout);
                    this.operationTimeouts.set(nodeId, timer);
                });

                // Race between operation and timeout
                await Promise.race([operationPromise, timeoutPromise]);
            } else {
                await operationPromise;
            }

            // Only cleanup if this is still the current operation
            if (this.pendingOperations.get(nodeId) === currentOperation) {
                console.log(`Operation completed for node ${nodeId}`);
                this.cleanup(nodeId);
            }
        } catch (error) {
            // Only cleanup and throw if this is still the current operation
            if (this.pendingOperations.get(nodeId) === currentOperation) {
                console.error(`Operation failed for node ${nodeId}:`, error);
                this.cleanup(nodeId);
                throw error;
            }
        }
    }
    
    hasPendingOperations(nodeId: string): boolean {
        return this.pendingOperations.has(nodeId);
    }
    
    async waitForNode(nodeId: string): Promise<void> {
        const pending = this.pendingOperations.get(nodeId);
        if (pending) {
            try {
                await pending;
            } catch (error) {
                // Ignore errors from cancelled operations
                if (!(error instanceof Error && error.message.includes('cancelled'))) {
                    throw error;
                }
            }
        }
    }

    getPendingOperations(): Map<string, Promise<void>> {
        return new Map(this.pendingOperations);
    }

    async cancelOperation(nodeId: string): Promise<void> {
        // Clear timeout if exists
        const timeout = this.operationTimeouts.get(nodeId);
        if (timeout) {
            clearTimeout(timeout);
            this.operationTimeouts.delete(nodeId);
        }

        // Abort the operation if exists
        const controller = this.operationControllers.get(nodeId);
        if (controller) {
            controller.abort();
            this.operationControllers.delete(nodeId);
        }

        // Reject the operation if exists
        const reject = this.operationRejects.get(nodeId);
        if (reject) {
            reject(new Error(`Operation cancelled for node ${nodeId}`));
            this.operationRejects.delete(nodeId);
        }

        // Remove from pending operations
        this.pendingOperations.delete(nodeId);
    }

    private cleanup(nodeId: string): void {
        this.pendingOperations.delete(nodeId);
        this.operationRejects.delete(nodeId);
        const timeout = this.operationTimeouts.get(nodeId);
        if (timeout) {
            clearTimeout(timeout);
            this.operationTimeouts.delete(nodeId);
        }
        const controller = this.operationControllers.get(nodeId);
        if (controller) {
            this.operationControllers.delete(nodeId);
        }
    }

    isOperationPending(nodeId: string): boolean {
        return this.pendingOperations.has(nodeId);
    }
} 