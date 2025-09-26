# Raw Loader Service

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

The **Raw Loader Service** is the critical data ingestion component of the Indici ETL pipeline responsible for streaming CSV data from S3 directly into PostgreSQL raw tables. It provides high-performance, lossless data loading with complete lineage tracking and robust error handling.

## 🎯 Overview

This service handles the second phase of the ETL pipeline by:

- **Streaming** CSV data processing with custom separators (`|~~|`, `|^^|`)
- **Handling** headerless CSV format with position-based column mapping
- **Loading** data into PostgreSQL raw tables with full lineage tracking
- **Supporting** all 18 Indici extract types with type-specific handlers
- **Implementing** idempotency checks to prevent duplicate loading
- **Providing** comprehensive error recovery and monitoring capabilities

## 🏗️ Architecture

### Core Components

```
┌─────────────────────┐      ┌──────────────────┐     ┌──────────────────────┐
│ RawLoaderService    │─────▶│  RawTableLoader  │────▶│  DatabasePool        │
│                     │      │                  │     │                      │
│ • Main orchestrator │      │ • Batch inserts  │     │ • Connection pooling │
│ • File coordination │      │ • Transactions   │     │ • Error handling     │
│ • Progress tracking │      │ • Lineage data   │     │ • Performance        │
└─────────────────────┘      └──────────────────┘     └──────────────────────┘
           │                           │                        │
           ▼                           ▼                        ▼
┌─────────────────────────┐    ┌───────────────────────┐    ┌─────────────────────┐
│ ExtractHandlerFactory   │    │  IndiciCSVParser      │    │  LineageService     │
│                         │    │                       │    │                     │
│ • Type-specific handlers│    │ • Custom separators   │    │ • Data provenance   │
│ • Validation rules      │    │ • Streaming parsing   │    │ • Load tracking     │
│ • Column mapping        │    │ • Error recovery      │    │ • Audit trails      │
└─────────────────────────┘    └───────────────────────┘    └─────────────────────┘
```

### Design Patterns

- **Dependency Injection**: Clean separation of concerns and testability
- **Strategy Pattern**: Multiple extract type handlers and processing strategies
- **Factory Pattern**: Dynamic handler creation based on extract type
- **Observer Pattern**: Progress tracking and metrics collection
- **Repository Pattern**: Abstraction over database operations

### Key Interfaces

```typescript
interface RawLoadOptions {
  extractType: string;
  batchSize?: number;
  maxRetries?: number;
  continueOnError?: boolean;
  validateRowCount?: boolean;
  skipValidation?: boolean;
  maxConcurrentFiles?: number;
}

interface LoadResult {
  totalRows: number;
  successfulBatches: number;
  failedBatches: number;
  errors: LoadError[];
  durationMs: number;
  bytesProcessed: number;
  rowsPerSecond: number;
  memoryUsageMB: number;
}
```

## 🚀 Quick Start

### Installation

The service is part of the larger ETL pipeline project. Ensure you have the required dependencies:

```bash
pnpm install
# Dependencies include:
# - pg (PostgreSQL client)
# - drizzle-orm (Database ORM)
# - node:stream (Streaming utilities)
```

### Basic Usage

```typescript
import { RawLoaderContainer } from "./services/raw-loader";

const rawLoader = RawLoaderContainer.create({
  database: {
    poolSize: 10,
    timeoutMs: 30000,
    maxConnections: 20,
  },
  processing: {
    batchSize: 1000,
    maxConcurrentFiles: 5,
    maxMemoryMB: 512,
    enableStreaming: true,
    bufferSizeMB: 16,
    continueOnError: true,
  },
  csv: {
    fieldSeparator: "|~~|",
    rowSeparator: "|^^|",
    maxRowLength: 10000,
    hasHeaders: false,
    skipEmptyRows: true,
  },
  errorHandling: {
    maxRetries: 3,
    retryDelayMs: 1000,
    continueOnError: true,
    logErrors: true,
    errorThreshold: 0.1,
  },
  monitoring: {
    enableMetrics: true,
    logLevel: "info",
    metricsInterval: 30000,
    enableProgressTracking: true,
    progressUpdateInterval: 5000,
  },
});

// Load a file
const result = await rawLoader.loadFile(discoveredFile, loadRunId);
console.log(`Loaded ${result.totalRows} rows successfully`);
```

### Configuration

```typescript
const config = {
  database: {
    poolSize: 10, // Connection pool size
    timeoutMs: 30000, // Query timeout
    maxConnections: 20, // Maximum connections
  },
  processing: {
    batchSize: 1000, // Rows per batch insert
    maxConcurrentFiles: 5, // Parallel file processing
    maxMemoryMB: 512, // Memory usage limit
    enableStreaming: true, // Use streaming for large files
    bufferSizeMB: 16, // Stream buffer size
    continueOnError: true, // Continue on individual errors
  },
  csv: {
    fieldSeparator: "|~~|", // Indici field separator
    rowSeparator: "|^^|", // Indici row separator
    maxRowLength: 10000, // Maximum row length
    hasHeaders: false, // Indici files are headerless
    skipEmptyRows: true, // Skip empty rows
  },
  errorHandling: {
    maxRetries: 3, // Retry attempts per batch
    retryDelayMs: 1000, // Delay between retries
    continueOnError: true, // Continue processing other files
    logErrors: true, // Log error details
    errorThreshold: 0.1, // Error rate threshold
  },
  monitoring: {
    enableMetrics: true, // Collect performance metrics
    logLevel: "info", // Logging level
    metricsInterval: 30000, // Metrics collection interval
    enableProgressTracking: true, // Track file progress
    progressUpdateInterval: 5000, // Progress update frequency
  },
};
```

## 📋 API Reference

### RawLoaderService

The main service class that orchestrates all loading operations.

#### Constructor

```typescript
constructor(
  csvParser: IndiciCSVParser,
  tableLoader: RawTableLoader,
  handlerFactory: ExtractHandlerFactory,
  idempotencyService: IdempotencyService,
  lineageService: LineageService,
  errorHandler: ErrorHandler,
  monitor: LoadMonitor,
  config: RawLoaderConfig
)
```

#### Methods

##### `loadFile(fileMetadata, loadRunId, options?)`

Loads a single file from S3 to the raw database tables.

```typescript
const result = await rawLoader.loadFile(discoveredFile, loadRunId, {
  batchSize: 500,
  continueOnError: true,
});
```

**Parameters:**

- `fileMetadata` (required): `DiscoveredFile` from Discovery Service
- `loadRunId` (required): Unique identifier for this load run
- `options` (optional): `RawLoadOptions` for customization

**Returns:** `LoadResult`

##### `loadMultipleFiles(files, loadRunId, options?)`

Loads multiple files in parallel with concurrency control.

```typescript
const results = await rawLoader.loadMultipleFiles(fileBatch.files, loadRunId, {
  maxConcurrentFiles: 3,
  continueOnError: true,
});
```

**Returns:** `LoadResult[]`

##### `getLoadProgress(fileKey)`

Returns current progress for a specific file.

```typescript
const progress = await rawLoader.getLoadProgress("file-key");
```

**Returns:** `LoadProgress`

##### `getErrorSummary(errors)`

Aggregates and summarizes loading errors.

```typescript
const summary = await rawLoader.getErrorSummary(loadResults.flatMap(r => r.errors));
```

**Returns:** `ErrorSummary`

##### `getMetrics()`

Returns current loading metrics.

```typescript
const metrics = await rawLoader.getMetrics();
```

**Returns:** `LoadMetrics`

##### `healthCheck()`

Validates service connectivity and configuration.

```typescript
const isHealthy = await rawLoader.healthCheck();
```

**Returns:** `boolean`

### RawLoaderContainer

Dependency injection container for creating configured service instances.

#### `create(config)`

Creates a fully configured Raw Loader service.

```typescript
const rawLoader = RawLoaderContainer.create(config);
```

**Returns:** `RawLoaderService`

## 🔧 Configuration Options

### Database Configuration

| Option           | Default  | Description                  |
| ---------------- | -------- | ---------------------------- |
| `poolSize`       | `10`     | Database connection pool size |
| `timeoutMs`      | `30000`  | Query timeout in milliseconds |
| `maxConnections` | `20`     | Maximum database connections |

### Processing Configuration

| Option              | Default | Description                     |
| ------------------- | ------- | ------------------------------- |
| `batchSize`         | `1000`  | Rows per database batch insert  |
| `maxConcurrentFiles`| `5`     | Parallel file processing limit  |
| `maxMemoryMB`       | `512`   | Memory usage limit per process  |
| `enableStreaming`   | `true`  | Use streaming for large files   |
| `bufferSizeMB`      | `16`    | Stream buffer size              |
| `continueOnError`   | `true`  | Continue processing on errors   |

### CSV Configuration

| Option           | Default    | Description                     |
| ---------------- | ---------- | ------------------------------- |
| `fieldSeparator` | `"\|~~\|"` | Indici field separator          |
| `rowSeparator`   | `"\|^^\|"` | Indici row separator            |
| `maxRowLength`   | `10000`    | Maximum row length in characters|
| `hasHeaders`     | `false`    | Indici files are headerless     |
| `skipEmptyRows`  | `true`     | Skip completely empty rows      |

### Error Handling Configuration

| Option         | Default | Description                  |
| -------------- | ------- | ---------------------------- |
| `maxRetries`   | `3`     | Retry attempts per batch     |
| `retryDelayMs` | `1000`  | Delay between retries        |
| `continueOnError`| `true` | Continue processing other files |
| `logErrors`    | `true`  | Log detailed error information |
| `errorThreshold`| `0.1`  | Error rate threshold (10%)   |

### Monitoring Configuration

| Option                    | Default | Description                      |
| ------------------------- | ------- | -------------------------------- |
| `enableMetrics`           | `true`  | Collect performance metrics      |
| `logLevel`                | `"info"`| Logging level                    |
| `metricsInterval`         | `30000` | Metrics collection interval (ms) |
| `enableProgressTracking`  | `true`  | Track individual file progress   |
| `progressUpdateInterval`  | `5000`  | Progress update frequency (ms)   |

## 📁 File Structure

```
src/services/raw-loader/
├── README.md                       # This file
├── index.ts                        # Main exports
├── raw-loader-service.ts           # Core service implementation
├── indici-csv-parser.ts            # CSV parsing with custom separators
├── raw-table-loader.ts             # Database loading and batch operations
├── extract-handler-factory.ts      # Extract type-specific handlers
├── idempotency-service.ts          # Duplicate prevention
├── lineage-service.ts              # Data lineage and audit trails
├── error-handler.ts                # Error handling and recovery
├── load-monitor.ts                 # Monitoring and metrics collection
├── types/
│   ├── raw-loader.ts               # Core service types
│   ├── csv.ts                      # CSV processing types
│   ├── config.ts                   # Configuration types
│   └── errors.ts                   # Error types and utilities
├── handlers/
│   ├── base-extract-handler.ts     # Base handler implementation
│   ├── patients-handler.ts         # Patients-specific logic
│   ├── appointments-handler.ts     # Appointments-specific logic
│   └── [other extract handlers]    # Additional type handlers
├── utils/
│   ├── batch-utils.ts              # Batch processing utilities
│   ├── validation-utils.ts         # Data validation utilities
│   └── performance-utils.ts        # Performance optimization utilities
└── __tests__/
    ├── raw-loader-service.test.ts  # Main service tests
    ├── unit/                       # Unit tests
    ├── integration/                # Integration tests
    └── fixtures/                   # Test data and fixtures
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm vitest run src/services/raw-loader/__tests__/raw-loader-service.test.ts

# Run tests in watch mode
pnpm vitest src/services/raw-loader/__tests__/
```

### Test Coverage

The service includes comprehensive tests covering:

- ✅ Service initialization and configuration
- ✅ CSV parsing with custom separators
- ✅ Database operations and transactions
- ✅ Extract type handler creation and validation
- ✅ Idempotency checks and duplicate prevention
- ✅ Error handling and recovery scenarios
- ✅ Progress tracking and metrics collection
- ✅ Health checks and monitoring

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { RawLoaderContainer } from "../raw-loader-service";

describe("RawLoaderService", () => {
  let service: RawLoaderService;

  beforeEach(() => {
    service = RawLoaderContainer.create(mockConfig);
  });

  it("should initialize correctly", () => {
    expect(service).toBeDefined();
    expect(service.healthCheck()).toBeDefined();
  });

  it("should load files successfully", async () => {
    const result = await service.loadFile(mockFile, "test-run");
    expect(result.totalRows).toBeGreaterThan(0);
  });
});
```

## 🔍 CSV Data Format

### Indici CSV Characteristics

The Raw Loader is specifically designed to handle Indici's unique CSV format:

- **Headerless Format**: Files contain no column headers
- **Custom Field Separator**: Uses `|~~|` instead of commas
- **Custom Row Separator**: Uses `|^^|` instead of newlines
- **Position-Based Mapping**: Column names are mapped by position
- **Variable Row Lengths**: Rows may have different numbers of fields
- **Encoding Issues**: May contain special characters and encoding artifacts

### Sample Data Structure

```csv
patient_id|~~|practice_id|~~|nhi_number|~~|first_name|~~|last_name|~~|date_of_birth|~~|gender|^^|
12345|~~|535|~~|ABC1234|~~|John|~~|Doe|~~|1985-06-15|~~|M|^^|
67890|~~|535|~~|DEF5678|~~|Jane|~~|Smith|~~|1990-08-20|~~|F|^^|
11111|~~|535|~~|GHI9012|~~|Bob|~~|Johnson|~~|1978-12-10|~~|M
```

### Supported Extract Types

- `Patient` - Patient demographic and clinical data
- `Appointments` - Appointment scheduling and history
- `Providers` - Healthcare provider information
- `PracticeInfo` - Practice configuration and settings
- `Invoices` - Billing and invoice records
- `InvoiceDetail` - Detailed invoice line items
- `Immunisations` - Vaccination and immunization records
- `Diagnoses` - Diagnosis codes and descriptions
- `Measurements` - Clinical measurements and vitals
- `Recalls` - Patient recall and reminder data
- `Inbox` - Inbox messages and communications
- `InboxDetail` - Detailed inbox message content
- `Medicine` - Medication prescriptions and history
- `NextOfKin` - Next of kin and emergency contacts
- `Vaccine` - Vaccine inventory and management
- `Allergies` - Patient allergy information
- `AppointmentMedications` - Medication-related appointments
- `PatientAlerts` - Patient alert and notification data

## 📊 Monitoring & Metrics

### Loading Metrics

```typescript
interface LoadMetrics {
  filesProcessed: number; // Files successfully loaded
  totalRowsLoaded: number; // Total rows inserted
  totalBytesProcessed: number; // Data volume processed
  averageRowsPerSecond: number; // Processing throughput
  averageProcessingTimeMs: number; // Average file processing time
  errorRate: number; // Error percentage
  retryCount: number; // Retry operations count
  memoryPeakUsageMB: number; // Peak memory usage
  databaseConnectionsUsed: number; // Active DB connections
  throughputMBps: number; // Data throughput
  averageLatencyMs: number; // Database operation latency
}
```

### Load Progress

```typescript
interface LoadProgress {
  fileKey: string; // S3 file key
  extractType: string; // Data type being loaded
  totalRows: number; // Total rows in file
  processedRows: number; // Rows processed so far
  currentBatch: number; // Current batch number
  totalBatches: number; // Total batches expected
  estimatedTimeRemaining: number; // Time remaining (ms)
  currentStatus: LoadStatus; // Current processing status
  errors: LoadError[]; // Errors encountered
  warnings: LoadWarning[]; // Non-critical issues
  bytesProcessed: number; // Bytes processed
  memoryUsageMB: number; // Current memory usage
  startTime: Date; // Processing start time
  lastUpdate: Date; // Last progress update
}
```

### Error Types

```typescript
enum LoadErrorType {
  CSV_PARSE_ERROR = "CSV_PARSE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  IDEMPOTENCY_ERROR = "IDEMPOTENCY_ERROR",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
  MEMORY_ERROR = "MEMORY_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

enum LoadStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PARTIAL = "PARTIAL",
  RETRYING = "RETRYING",
}
```

## 🔄 Integration Points

### Upstream Components

1. **S3 Discovery Service**: Provides `DiscoveredFile[]` and file metadata
2. **Configuration Service**: Provides runtime configuration and defaults
3. **Audit Manager**: Receives load run information and tracking data

### Downstream Components

1. **Staging Transformer**: Consumes loaded raw data for transformation
2. **Health Monitor**: Receives loading status and performance metrics
3. **Error Reporting**: Receives detailed error information and summaries

### Data Flow

```
S3 File Discovery
       ↓
  Raw Data Loading
       ↓
CSV Parsing & Validation
       ↓
   Batch Processing
       ↓
Database Insertion
       ↓
 Lineage Tracking
       ↓
Progress Monitoring
       ↓
 Error Handling & Recovery
```

## 🚀 Performance Optimization

### Best Practices

1. **Batch Sizing**: Use appropriate batch sizes (500-2000 rows) for optimal database performance
2. **Memory Management**: Monitor and configure `maxMemoryMB` for your environment
3. **Concurrency Control**: Set `maxConcurrentFiles` based on database capacity
4. **Streaming**: Enable streaming for large files (>100MB)
5. **Error Handling**: Use `continueOnError` for resilient processing

### Scalability Considerations

- **Database Connection Pooling**: Configure `poolSize` based on concurrent load
- **Transaction Management**: Automatic rollback on batch failures
- **Progress Tracking**: Real-time progress for long-running operations
- **Resource Monitoring**: Memory and connection usage tracking
- **Parallel Processing**: Multiple files processed concurrently

### Performance Targets

| File Size | Expected Performance | Configuration |
| --------- | -------------------- | ------------- |
| < 1K rows | < 10 seconds | Default settings |
| 1K-100K rows | < 2 minutes | `batchSize: 1000` |
| 100K+ rows | < 5 minutes | `batchSize: 2000`, streaming enabled |
| Concurrent files | Up to 5 simultaneous | `maxConcurrentFiles: 5` |

## 🤝 Contributing

### Development Setup

1. **Clone the repository** and navigate to the project root
2. **Install dependencies**: `pnpm install`
3. **Run tests**: `pnpm test`
4. **Build the project**: `pnpm build`

### Code Style

- Use **TypeScript** for all new code
- Follow **kebab-case** naming convention for files
- Use **ESLint** and **Prettier** configurations
- Write **comprehensive tests** for new features
- Add **JSDoc comments** for public APIs

### Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation as needed
5. Create a pull request with clear description

## 📈 Future Enhancements

### Planned Features

- [ ] **Advanced Validation**: Schema-based validation with JSON Schema
- [ ] **Data Quality Checks**: Automated data quality assessment
- [ ] **Parallel Loading**: Multi-threaded database loading
- [ ] **Compression Support**: Gzip/Brotli compressed CSV files
- [ ] **Delta Detection**: Smart incremental vs full load detection
- [ ] **Real-time Streaming**: Kafka/EventBridge integration
- [ ] **Advanced Error Recovery**: Resume partial loads from checkpoints
- [ ] **Performance Profiling**: Detailed performance analysis tools

### Architecture Improvements

- [ ] **Plugin System**: Extensible extract type handlers
- [ ] **Connection Pooling**: Advanced database connection management
- [ ] **Load Balancing**: Multiple database instances
- [ ] **Distributed Processing**: Multi-node processing support
- [ ] **Metrics Export**: Prometheus/Grafana integration

## 📞 Support

### Getting Help

- **Documentation**: Check this README first
- **Issues**: Create GitHub issues for bugs and features
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: All changes require review

### Troubleshooting

#### Common Issues

1. **Database Connection Errors**

   ```bash
   # Ensure database credentials are properly configured
   export DB_HOST=your-postgres-host
   export DB_NAME=your-database
   export DB_USER=your-username
   export DB_PASSWORD=your-password
   ```

2. **Memory Issues**

   ```typescript
   // Adjust memory limits for large files
   const config = {
     processing: { maxMemoryMB: 1024 },
   };
   ```

3. **CSV Parsing Errors**

   ```typescript
   // Verify CSV configuration matches file format
   const config = {
     csv: {
       fieldSeparator: "|~~|",
       rowSeparator: "|^^|",
       hasHeaders: false,
     },
   };
   ```

4. **Handler Not Found**

   ```bash
   # Ensure extract type handlers are registered
   # Check available handlers in the factory
   ```

## 📄 License

This project is part of the Poutiri Indici Ingest system and follows the project's licensing terms.

---

**Built with ❤️ for reliable, high-performance data ingestion at scale**
