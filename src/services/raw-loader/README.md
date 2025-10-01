## Raw Loader Service

The **Raw Loader Service** is the first stage of the ETL pipeline, responsible for loading Indici healthcare data extracts from S3 CSV files into raw database tables (`raw.*`). It preserves the original data structure and handles the complex Indici CSV format with custom separators.

## 🎯 Purpose

This service is responsible for the first layer of the ETL pipeline:

```
S3 CSV Files → [Raw Loader] → raw.* tables → [Staging Transformer] → stg.* tables → [Core Merger] → core.* tables
                    ↑ YOU ARE HERE
```

## 🔄 What It Does

1. **Discovers** CSV files from S3 using the Discovery Service
2. **Parses** Indici CSV format with custom separators (`|^^|` and `|~~|`)
3. **Validates** basic file structure and data integrity
4. **Loads** raw data into `raw.*` tables (preserving all columns as text)
5. **Tracks** processing lineage and handles idempotency
6. **Monitors** performance and errors with comprehensive logging

## 📦 Components

### Core Services

1. **`RawLoaderService`** - Main orchestrator coordinating the entire loading process
2. **`CSVParser`** - Handles Indici's custom CSV format with `|^^|` field separators and `|~~|` row separators
3. **`RawTableLoader`** - Database operations using shared `DatabasePool` and `BatchLoader`
4. **`ExtractHandlerFactory`** - Factory for extract-specific handlers (Patient, Appointments, etc.)
5. **`IdempotencyService`** - Prevents duplicate file processing
6. **`ErrorHandler`** - Comprehensive error handling and recovery
7. **`LoadMonitor`** - Performance monitoring and progress tracking

### Supporting Infrastructure

- Uses **shared components**: `DatabasePool`, `BatchLoader`, `StreamBatchProcessor`
- Integrates with **Discovery Service** for file discovery
- Leverages existing `ErrorHandler` from shared services

## 🚀 Usage

### Basic Example

```typescript
import { RawLoaderContainer } from "./services/raw-loader";
import type { DiscoveredFile } from "./services/discovery/types/files";

// Create service
const rawLoader = RawLoaderContainer.create({
  database: {
    poolSize: 10,
    timeoutMs: 30000,
  },
  processing: {
    batchSize: 1000,
    maxConcurrentFiles: 5,
  },
}, {
  bucket: "my-s3-bucket",
  region: "us-east-1",
});

// Load a single file
const result = await rawLoader.loadFile(discoveredFile, "load-run-123", {
  batchSize: 500,
  continueOnError: true,
});

console.log(`Loaded: ${result.totalRows} rows`);
console.log(`Errors: ${result.errors.length}`);
```

### Load Multiple Files with Concurrency

```typescript
// Load multiple files in parallel batches
const results = await rawLoader.loadMultipleFiles(
  discoveredFiles,
  "load-run-456",
  {
    batchSize: 1000,
    maxConcurrentFiles: 3, // Process 3 files at a time
    continueOnError: true,
  }
);

const totalRows = results.reduce((sum, r) => sum + r.totalRows, 0);
console.log(`Total loaded: ${totalRows} rows across ${results.length} files`);
```

### Health Check

```typescript
const isHealthy = await rawLoader.healthCheck();
if (!isHealthy) {
  console.error("Raw Loader service is unhealthy");
}
```

## 🔧 Configuration

### Default Configuration

```typescript
const config: RawLoaderConfig = {
  database: {
    poolSize: 10,
    timeoutMs: 30000,
    maxConnections: 20,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
  processing: {
    batchSize: 1000,
    maxConcurrentFiles: 5,
    maxMemoryMB: 512,
    enableStreaming: true,
    bufferSizeMB: 16,
    continueOnError: true,
  },
  errorHandling: {
    maxRetries: 3,
    retryDelayMs: 1000,
    continueOnError: true,
    logErrors: true,
    errorThreshold: 0.1, // Stop if >10% errors
  },
  monitoring: {
    enableMetrics: true,
    logLevel: "info",
    metricsInterval: 30000,
    enableProgressTracking: true,
    progressUpdateInterval: 5000,
  },
};
```

### Override Configuration

```typescript
const rawLoader = RawLoaderContainer.create({
  processing: {
    batchSize: 500, // Smaller batches for wide tables
    maxConcurrentFiles: 2, // Reduce concurrency
  },
  errorHandling: {
    errorThreshold: 0.05, // Stricter error threshold
  },
});
```

## 📊 Indici CSV Format

The Raw Loader handles Indici's proprietary CSV format:

| Feature | Indici Format | Standard CSV |
|---------|---------------|--------------|
| Field Separator | `\|^\^^\|` | `,` |
| Row Separator | `\|~\~\|` | `\n` |
| Encoding | UTF-16LE | UTF-8 |
| Headers | None | Optional |
| Quotes | Relaxed handling | Strict |

### Example Indici CSV Content

```
Patient^^^John^^^Doe^^^1990-01-01|~~|
Patient^^^Jane^^^Smith^^^1985-05-15|~~|
```

### Parsing Configuration

```typescript
const parser = new CSVParser({
  fieldSeparator: "|^^|",     // Custom field separator
  rowSeparator: "|~~|",       // Custom row separator
  encoding: "utf16le",         // UTF-16 Little Endian
  hasHeaders: false,          // No headers in Indici files
  columnMapping: ["type", "first_name", "last_name", "dob"], // Predefined columns
});
```

## 🔄 Extract Handlers

### Handler Factory Pattern

```typescript
// Get handler for specific extract type
const patientHandler = await handlerFactory.getHandler("Patient");

console.log(`Table: ${patientHandler.tableName}`);
console.log(`Columns: ${patientHandler.columnMapping.length}`);

// Register custom handler
await handlerFactory.registerHandler(new CustomExtractHandler());
```

### Built-in Handlers

| Extract Type | Handler Class | Table | Columns |
|--------------|---------------|-------|---------|
| `Patient` | `PatientsSchemaHandler` | `raw.patients` | 263+ |
| `Appointments` | `AppointmentsHandler` | `raw.appointments` | 10 |

### Custom Handler Implementation

```typescript
class CustomExtractHandler extends BaseExtractHandler {
  extractType = "Custom";
  tableName = "raw.custom_data";
  columnMapping = ["id", "name", "value", "created_at"];

  validationRules = [
    {
      columnName: "id",
      ruleType: "required",
      validator: (value) => /^\d+$/.test(value),
      errorMessage: "ID must be numeric",
    },
  ];
}
```

## 🛡️ Idempotency & Lineage

### File Processing Tracking

```sql
-- Raw file processing tracking
CREATE TABLE etl.raw_load_runs (
  load_run_id UUID PRIMARY KEY,
  extract_type TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT NOT NULL
);

CREATE TABLE etl.raw_load_run_files (
  load_run_file_id SERIAL PRIMARY KEY,
  load_run_id UUID NOT NULL REFERENCES etl.raw_load_runs(load_run_id),
  file_key TEXT NOT NULL,
  extract_type TEXT NOT NULL,
  row_count INTEGER,
  processed_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL
);
```

### Idempotency Checks

```typescript
// Service automatically prevents duplicate processing
const result = await rawLoader.loadFile(file, loadRunId);

// File already processed? Returns cached result
if (result.warnings.some(w => w.message.includes("already processed"))) {
  console.log("File was previously loaded, skipping");
}
```

## 📈 Monitoring & Progress

### Real-time Progress Tracking

```typescript
// Get progress for specific file
const progress = await rawLoader.getLoadProgress("s3://bucket/file.csv");

console.log(`Processed: ${progress.processedRows}/${progress.totalRows}`);
console.log(`Status: ${progress.currentStatus}`);
console.log(`ETA: ${progress.estimatedTimeRemaining}s`);
```

### Metrics Collection

```typescript
const metrics = await rawLoader.getMetrics();

console.log(`Files processed: ${metrics.filesProcessed}`);
console.log(`Total rows: ${metrics.totalRowsLoaded}`);
console.log(`Avg throughput: ${metrics.averageRowsPerSecond} rows/sec`);
```

## 🚫 Error Handling

### Comprehensive Error Recovery

```typescript
// Service handles various error types
const result = await rawLoader.loadFile(file, loadRunId);

if (result.errors.length > 0) {
  const summary = await rawLoader.getErrorSummary(result.errors);

  console.log(`Total errors: ${summary.totalErrors}`);
  console.log(`Retryable: ${summary.retryableErrors}`);
  console.log(`Blocking: ${summary.blockingErrors}`);
}
```

### Error Types Handled

- **Database errors**: Connection issues, constraint violations
- **CSV parsing errors**: Malformed data, encoding issues
- **File system errors**: S3 access, missing files
- **Memory errors**: Large file processing
- **Validation errors**: Data integrity issues

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    RawLoaderService                        │
│                     (Main Orchestrator)                    │
└─────┬──────────────────┬─────────────────┬────────────────┘
      │                  │                 │
      ▼                  ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  Discovery  │  │   CSVParser  │  │Idempotency  │
│   Service   │  │              │  │  Service    │
│• S3 files   │  │• |^^| fields │  │• Duplicate  │
│• Metadata   │  │• |~~| rows   │  │• Prevention │
└─────────────┘  └──────────────┘  └─────────────┘
      │                  │                 │
      ▼                  ▼                 ▼
┌─────────────────────────────────────────────────┐
│           ExtractHandlerFactory                 │
│                                                 │
│ • Patient handler                               │
│ • Appointments handler                          │
│ • Schema-driven configuration                   │
└─────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│             RawTableLoader                      │
│             (Batch Processing)                  │
│                                                 │
│ • Streaming CSV → Database                      │
│ • Batch optimization                            │
│ • Memory management                             │
└─────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│           Shared Infrastructure                 │
│                                                 │
│ • DatabasePool                                  │
│ • BatchLoader                                   │
│ • ErrorHandler                                  │
│ • LoadMonitor                                   │
└─────────────────────────────────────────────────┘
```

## 📝 Best Practices

### 1. Configure Appropriate Batch Sizes

```typescript
// For wide tables (many columns)
const config = {
  processing: {
    batchSize: 500, // Smaller batches
  },
};

// For narrow tables (few columns)
const config = {
  processing: {
    batchSize: 2000, // Larger batches
  },
};
```

### 2. Handle Large Files with Streaming

```typescript
// Enable streaming for large files
const config = {
  processing: {
    enableStreaming: true,
    bufferSizeMB: 16,
    maxMemoryMB: 512,
  },
};
```

### 3. Monitor Error Rates

```typescript
const result = await rawLoader.loadFile(file, loadRunId);

const errorRate = result.errors.length / (result.totalRows || 1);

if (errorRate > 0.1) { // 10% error rate
  console.warn(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
  // Investigate data quality issues
}
```

### 4. Use Idempotency for Reliability

```typescript
// Service automatically handles retries and duplicate prevention
const result = await rawLoader.loadFile(file, loadRunId, {
  skipValidation: false, // Check for duplicates
});
```

### 5. Configure Concurrency Based on Resources

```typescript
const rawLoader = RawLoaderContainer.create({
  processing: {
    maxConcurrentFiles: 3, // Balance throughput vs resource usage
  },
});
```

## 🧪 Testing

Example test structure:

```typescript
import { RawLoaderContainer } from "./raw-loader";
import { mockDiscoveredFile } from "./test-helpers";

describe("RawLoaderService", () => {
  it("should load valid CSV file", async () => {
    const rawLoader = RawLoaderContainer.create(testConfig);

    const result = await rawLoader.loadFile(
      mockDiscoveredFile("Patient"),
      "test-run-123"
    );

    expect(result.totalRows).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle malformed CSV gracefully", async () => {
    // Test error handling
  });

  it("should prevent duplicate file processing", async () => {
    // Test idempotency
  });
});
```

## 📚 Related Documentation

- [Discovery Service](../discovery/README.md) - File discovery from S3
- [Staging Transformer](../staging-transformer/README.md) - Next stage in ETL pipeline
- [ETL Architecture](../../../docs/etl/etl-guide.md)
- [Schema Guide](../../../docs/schema/schema-guide.md)
- [Shared Services](../shared/README.md)
- [Indici Data Extracts](../../../docs/project-files/data-extract-Info.md)
