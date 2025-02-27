import { PerformanceMetrics } from '../types';

export interface PerformanceConfig {
    enableMetrics?: boolean;
    batchOperations?: boolean;
    debounceTime?: number;
    maxBatchSize?: number;
    sampleInterval?: number;
    maxSamples?: number;
}

export interface BatchMetrics {
    totalBatches: number;
    averageBatchSize: number;
    maxBatchSize: number;
    totalOperations: number;
    averageProcessingTime: number;
    lastBatchTime: number;
}

export class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        operationCount: 0,
        lastOperationTime: 0,
        averageOperationTime: 0,
        memoryUsage: 0,
        historySize: 0,
        snapshotCount: 0
    };

    private batchMetrics: BatchMetrics = {
        totalBatches: 0,
        averageBatchSize: 0,
        maxBatchSize: 0,
        totalOperations: 0,
        averageProcessingTime: 0,
        lastBatchTime: 0
    };

    private measurements: Map<string, { startTime: number; count: number; total: number }> = new Map();
    private config: Required<PerformanceConfig>;
    private disposed: boolean = false;
    private samples: { timestamp: number; metrics: PerformanceMetrics }[] = [];
    private sampleInterval: NodeJS.Timeout | undefined;

    constructor(config: PerformanceConfig = {}) {
        this.config = {
            enableMetrics: config.enableMetrics ?? true,
            batchOperations: config.batchOperations ?? true,
            debounceTime: config.debounceTime ?? 100,
            maxBatchSize: config.maxBatchSize ?? 50,
            sampleInterval: config.sampleInterval ?? 1000,
            maxSamples: config.maxSamples ?? 100
        };

        if (this.config.enableMetrics) {
            this.startSampling();
        }
    }

    startMeasure(operation: string): () => void {
        if (!this.config.enableMetrics || this.disposed) {
            return () => {}; // No-op if metrics are disabled or monitor is disposed
        }

        const startTime = performance.now();
        let measurement = this.measurements.get(operation);
        
        if (!measurement) {
            measurement = { startTime: 0, count: 0, total: 0 };
            this.measurements.set(operation, measurement);
        }

        measurement.startTime = startTime;

        return () => {
            if (this.disposed) return;
            
            const endTime = performance.now();
            const duration = endTime - startTime;

            measurement!.count++;
            measurement!.total += duration;

            this.metrics.operationCount++;
            this.metrics.lastOperationTime = duration;
            this.metrics.averageOperationTime = measurement!.total / measurement!.count;

            this.updateMemoryMetrics();
        };
    }

    measureBatch(batchSize: number, processingTime: number): void {
        if (!this.config.enableMetrics || this.disposed) return;

        this.batchMetrics.totalBatches++;
        this.batchMetrics.totalOperations += batchSize;
        this.batchMetrics.lastBatchTime = processingTime;
        this.batchMetrics.maxBatchSize = Math.max(this.batchMetrics.maxBatchSize, batchSize);
        this.batchMetrics.averageBatchSize = 
            this.batchMetrics.totalOperations / this.batchMetrics.totalBatches;
        this.batchMetrics.averageProcessingTime = 
            (this.batchMetrics.averageProcessingTime * (this.batchMetrics.totalBatches - 1) + processingTime) / 
            this.batchMetrics.totalBatches;
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    getBatchMetrics(): BatchMetrics {
        return { ...this.batchMetrics };
    }

    getSamples(): { timestamp: number; metrics: PerformanceMetrics }[] {
        return [...this.samples];
    }

    getMeasurement(operation: string): { count: number; average: number } | undefined {
        const measurement = this.measurements.get(operation);
        if (!measurement) return undefined;

        return {
            count: measurement.count,
            average: measurement.total / measurement.count
        };
    }

    clearMeasurements(): void {
        this.measurements.clear();
        this.metrics = {
            operationCount: 0,
            lastOperationTime: 0,
            averageOperationTime: 0,
            memoryUsage: 0,
            historySize: 0,
            snapshotCount: 0
        };
        this.batchMetrics = {
            totalBatches: 0,
            averageBatchSize: 0,
            maxBatchSize: 0,
            totalOperations: 0,
            averageProcessingTime: 0,
            lastBatchTime: 0
        };
        this.samples = [];
    }

    dispose(): void {
        this.disposed = true;
        if (this.sampleInterval) {
            clearInterval(this.sampleInterval);
            this.sampleInterval = undefined;
        }
        this.clearMeasurements();
    }

    private startSampling(): void {
        this.sampleInterval = setInterval(() => {
            this.samples.push({
                timestamp: Date.now(),
                metrics: { ...this.metrics }
            });

            // Keep only the last maxSamples samples
            if (this.samples.length > this.config.maxSamples) {
                this.samples = this.samples.slice(-this.config.maxSamples);
            }
        }, this.config.sampleInterval);
    }

    private updateMemoryMetrics(): void {
        try {
            if (typeof performance !== 'undefined' && 
                'memory' in performance &&
                (performance as any).memory?.usedJSHeapSize) {
                this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
            }
        } catch (error) {
            console.warn('Memory metrics not available:', error);
        }
    }
} 