# Shared ETL Services

This directory contains generic, layer-agnostic services that can be used across all ETL layers (raw, staging, and core).

## 🎯 Purpose

These shared components implement common patterns for ETL operations:
- Database connection pooling and transaction management
- Batch insertion with PostgreSQL parameter limit handling
- Stream processing with backpressure management
- Generic error handling and progress tracking

## 📦 Components

### `DatabasePool`
Generic database connection pool wrapper with transaction support.

**Features:**
- Connection pooling with configurable limits
- Transaction management with automatic rollback
- Error handling and retry logic
- Connection statistics and health monitoring

**Usage:**
```typescript
import { DatabasePool } from '../shared/database-pool';

const pool = new DatabasePool({
  maxConnections: 20,
  timeoutMs: 30000,
});

// Execute a query
const result = await pool.query('SELECT * FROM table', [params]);

// Execute in a transaction
const result = await pool.transaction(async (client) => {
  await client.query('INSERT INTO ...', [data]);
  await client.query('UPDATE ...', [data]);
  return result;
});

// Get pool stats
const stats = pool.getStats();
console.log(stats); // { totalCount, idleCount, waitingCount }

// Close pool
await pool.close();
```

### `BatchLoader`
Generic batch insertion service with optimized parameter handling.

**Features:**
- Automatic batch size calculation based on column count
- Handles PostgreSQL parameter limits (65,535 params)
- Transaction-based batch insertion
- Built-in error handling and retry logic
- Support for upsert operations (ON CONFLICT)

**Usage:**
```typescript
import { BatchLoader } from '../shared/batch-loader';

const loader = new BatchLoader(dbPool, errorHandler);

// Calculate optimal batch size
const batchSize = loader.calculateOptimalBatchSize(50, 1000); // columns, requested

// Execute a batch
const batch = {
  tableName: 'stg.patients',
  columns: ['patient_id', 'first_name', 'last_name'],
  values: [
    ['123', 'John', 'Doe'],
    ['456', 'Jane', 'Smith'],
  ],
  rowCount: 2,
  batchNumber: 1,
};

const result = await loader.executeBatch(batch, { continueOnError: true });

// Build upsert query
const { query, paramCount } = loader.buildUpsertQuery(
  'stg.patients',
  ['patient_id', 'first_name', 'last_name'],
  ['patient_id'], // conflict columns
  ['first_name', 'last_name'], // update columns
  100 // row count
);
```

### `StreamBatchProcessor`
Generic stream processing service with batching and backpressure management.

**Features:**
- Handles any readable stream with custom parser
- Automatic batching with configurable size
- Backpressure management (pause/resume)
- Queue-based processing with concurrency control
- Progress tracking and memory monitoring
- Error resilience with detailed reporting

**Usage:**
```typescript
import { StreamBatchProcessor } from '../shared/stream-batch-processor';

const processor = new StreamBatchProcessor();

const result = await processor.processStream(
  readableStream,
  csvParser, // Any parser with .parser property
  async (rows, batchNumber) => {
    // Process batch
    const batch = prepareBatch(rows, batchNumber);
    return await loader.executeBatch(batch);
  },
  {
    batchSize: 1000,
    maxQueueSize: 5,
    progressLogInterval: 500,
  }
);

console.log(result);
// {
//   totalRows: 10000,
//   successfulBatches: 10,
//   failedBatches: 0,
//   errors: [],
//   warnings: [],
//   durationMs: 5000,
//   rowsPerSecond: 2000,
//   memoryUsageMB: 150
// }
```

### `types.ts`
Shared type definitions for ETL operations.

**Key Types:**
- `InsertBatch` - Structure for batch inserts
- `BatchResult` - Result of batch operations
- `LoadError` - Standardized error information
- `LoadWarning` - Warning information
- `LoadErrorType` - Enumeration of error types
- `BatchLoadOptions` - Generic options for batch loading

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Layer-Specific Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RawLoader    │  │  Staging     │  │     Core     │      │
│  │  Service     │  │ Transformer  │  │    Merger    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────────────────────────────────▼───────────┐
│              Shared ETL Infrastructure                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Database    │  │    Batch     │  │    Stream    │    │
│  │     Pool     │  │    Loader    │  │   Processor  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

## 🔄 Design Principles

### Single Responsibility
Each component has a clear, focused responsibility:
- `DatabasePool` → Connection management
- `BatchLoader` → Batch insertion logic
- `StreamBatchProcessor` → Stream orchestration

### Layer Agnostic
These services work with any ETL layer:
- **Raw Layer**: CSV → text columns
- **Staging Layer**: text → typed columns + validation
- **Core Layer**: typed → dimensions/facts + SCD2

### Composability
Components can be composed for specific layer needs:

```typescript
// Raw Layer Example
const pool = new DatabasePool(config);
const loader = new BatchLoader(pool, errorHandler);
const processor = new StreamBatchProcessor();

// Staging Layer Example (same components, different usage)
const pool = new DatabasePool(config);
const loader = new BatchLoader(pool, errorHandler);
// Use loader.buildUpsertQuery for conflict resolution
```

### Extensibility
Easy to extend for layer-specific needs:
- Override batch preparation logic
- Custom error handling strategies
- Layer-specific validation rules

## 📝 Best Practices

### 1. Connection Pool Management
```typescript
// Create once, reuse throughout application lifecycle
const pool = new DatabasePool(config);

// Always close when done
try {
  // ... operations
} finally {
  await pool.close();
}
```

### 2. Batch Size Optimization
```typescript
// Let BatchLoader calculate optimal size
const optimalSize = loader.calculateOptimalBatchSize(
  columnCount,
  requestedSize
);

// For wide tables (many columns), this prevents:
// - PostgreSQL parameter limit errors
// - Memory issues
// - Query performance problems
```

### 3. Error Handling
```typescript
// Use continueOnError for resilient processing
const result = await loader.executeBatch(batch, {
  continueOnError: true,
});

// Check results and handle errors
if (result.errors.length > 0) {
  // Log, retry, or skip based on error type
}
```

### 4. Memory Management
```typescript
// StreamBatchProcessor monitors memory automatically
const result = await processor.processStream(stream, parser, executor, {
  batchSize: 1000, // Tune based on row width
  maxQueueSize: 5, // Limit concurrent batches
});

console.log(`Peak memory: ${result.memoryUsageMB}MB`);
```

## 🧪 Testing

Shared components are designed to be easily testable:

```typescript
// Mock dependencies
const mockPool = {
  transaction: jest.fn(),
  query: jest.fn(),
  close: jest.fn(),
};

const mockErrorHandler = {
  handleError: jest.fn(),
};

// Test batch loader
const loader = new BatchLoader(mockPool, mockErrorHandler);
await loader.executeBatch(testBatch);

expect(mockPool.transaction).toHaveBeenCalledTimes(1);
```

## 🚀 Future Enhancements

Potential additions to the shared services:

1. **Parallel Batch Executor**: Process multiple batches in parallel
2. **Retry Strategy Service**: Configurable retry policies
3. **Data Quality Service**: Generic validation framework
4. **Performance Monitor**: Detailed metrics and profiling
5. **Cache Manager**: Shared caching for lookups/mappings

## 📚 Related Documentation

- [Phase 1 Implementation Plan](../../../docs/development/phase-1.md)
- [Raw Loader Service](../raw-loader/README.md)
- [Staging Transformer Plan](../../../docs/development/c-phase-1-staging-transformer.md)
- [ETL Architecture Guide](../../../docs/etl/etl-guide.md)

