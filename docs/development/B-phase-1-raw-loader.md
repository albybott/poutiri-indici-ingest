# Phase 1 - Raw Loader Implementation Plan

## 🎯 **Component Overview**

The **Raw Loader** is responsible for streaming CSV data from S3 directly into raw PostgreSQL tables. It serves as the critical bridge between the S3 Discovery Service and the rest of the ETL pipeline, ensuring lossless data capture with complete lineage tracking.

### **Core Responsibilities**

- Receive discovered files from S3 Discovery Service
- Stream CSV data processing with custom separators
- Handle headerless CSV format with predefined column mapping
- Load data into raw tables with full lineage tracking
- Support all 18 Indici extract types
- Implement idempotency checks to prevent duplicate loading
- Provide detailed loading metrics and error reporting

---

## 📁 **Related Files**

### **Database Schema - Raw Layer**

- [`src/db/schema/raw/patients.ts`](../../src/db/schema/raw/patients.ts) - Raw patients table definition
- [`src/db/schema/raw/appointments.ts`](../../src/db/schema/raw/appointments.ts) - Raw appointments table definition
- [`src/db/schema/raw/providers.ts`](../../src/db/schema/raw/providers.ts) - Raw providers table definition
- [`src/db/schema/raw/practice_info.ts`](../../src/db/schema/raw/practice_info.ts) - Raw practice info table definition
- [`src/db/schema/raw/invoices.ts`](../../src/db/schema/raw/invoices.ts) - Raw invoices table definition
- [`src/db/schema/schemas.ts`](../../src/db/schema/schemas.ts) - Raw schema setup and configuration
- [`src/db/schema/shared/enums.ts`](../../src/db/schema/shared/enums.ts) - Extract type enums

### **Database Schema - ETL Layer**

- [`src/db/schema/etl/audit.ts`](../../src/db/schema/etl/audit.ts) - Load run and file tracking tables
- [`src/db/schema/etl/health.ts`](../../src/db/schema/etl/health.ts) - Health monitoring tables

### **Utilities**

- [`src/utils/create-table.ts`](../../src/utils/create-table.ts) - Database table creation utilities
- [`src/utils/logger.ts`](../../src/utils/logger.ts) - Logging utilities for raw loading operations

### **Database Connection**

- [`src/db/client.ts`](../../src/db/client.ts) - Database client setup and configuration

### **Project Documentation**

- [`docs/project-files/data-extract-Info.md`](../project-files/data-extract-Info.md) - CSV format specifications and column definitions
- [`docs/schema/schema-guide.md`](../schema/schema-guide.md) - Comprehensive schema documentation

---

## 📋 **Detailed Implementation Tasks**

### **Task 1: CSV Parser Implementation**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create custom CSV parser for headerless format
- [ ] Implement custom field separator (`|~~|`) handling
- [ ] Implement custom row separator (`|^^|`) handling
- [ ] Add column position-to-name mapping system
- [ ] Handle variable-length rows and malformed data
- [ ] Support streaming processing for large files

#### **CSV Processing Requirements:**

```typescript
interface CSVParseOptions {
  fieldSeparator: string; // "|~~|"
  rowSeparator: string; // "|^^|"
  hasHeaders: boolean; // false for Indici extracts
  columnMapping: string[]; // Predefined column names by position
  maxRowLength?: number; // Safety limit for row size
  skipEmptyRows: boolean; // Skip completely empty rows
}

interface CSVRow {
  [columnName: string]: string;
  rowNumber: number;
  rawText: string; // Original row text for debugging
}

class IndiciCSVParser {
  async parseStream(
    stream: NodeJS.ReadableStream,
    options: CSVParseOptions
  ): Promise<CSVRow[]>;

  async parseFile(s3Key: string, options: CSVParseOptions): Promise<CSVRow[]>;

  async validateRow(
    row: CSVRow,
    extractType: ExtractType
  ): Promise<ValidationResult>;

  async countRows(
    stream: NodeJS.ReadableStream,
    options: CSVParseOptions
  ): Promise<number>;
}
```

#### **Column Mapping System:**

```typescript
interface ColumnMapping {
  extractType: ExtractType;
  columnNames: string[]; // Ordered array of column names
  requiredColumns: string[]; // Columns that must be present
  optionalColumns: string[]; // Columns that can be empty/missing
}

class ColumnMappingService {
  async getMapping(extractType: ExtractType): Promise<ColumnMapping>;
  async validateMapping(mapping: ColumnMapping): Promise<boolean>;
  async getColumnCount(extractType: ExtractType): Promise<number>;
}
```

---

### **Task 2: Raw Table Loader Implementation**

**Duration**: 8 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create generic raw table loader
- [ ] Implement batch insert operations
- [ ] Handle all 18 extract type tables
- [ ] Add lineage column population
- [ ] Support transaction management
- [ ] Implement rollback on failures

#### **Raw Loader Architecture:**

```typescript
interface RawLoadOptions {
  extractType: ExtractType;
  batchSize: number; // Rows per batch insert
  maxRetries: number; // Retry attempts for failed batches
  continueOnError: boolean; // Continue processing other batches on error
  validateRowCount: boolean; // Validate expected vs actual row counts
}

interface LoadResult {
  totalRows: number;
  successfulBatches: number;
  failedBatches: number;
  errors: LoadError[];
  durationMs: number;
  bytesProcessed: number;
}

class RawTableLoader {
  async loadFromStream(
    stream: NodeJS.ReadableStream,
    fileMetadata: DiscoveredFile,
    options: RawLoadOptions
  ): Promise<LoadResult>;

  async loadFromRows(
    rows: CSVRow[],
    fileMetadata: DiscoveredFile,
    options: RawLoadOptions
  ): Promise<LoadResult>;

  private async prepareBatch(
    rows: CSVRow[],
    fileMetadata: DiscoveredFile,
    extractType: ExtractType
  ): Promise<InsertBatch>;

  private async executeBatch(
    batch: InsertBatch,
    options: RawLoadOptions
  ): Promise<BatchResult>;
}

interface InsertBatch {
  tableName: string;
  columns: string[];
  values: any[][];
  rowCount: number;
  batchNumber: number;
}
```

#### **Lineage Column Management:**

```typescript
interface LineageData {
  s3Bucket: string;
  s3Key: string;
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  extractType: ExtractType;
  loadRunId: string;
  loadTs: Date;
}

class LineageService {
  async generateLineageData(
    fileMetadata: DiscoveredFile,
    loadRunId: string
  ): Promise<LineageData>;

  async populateLineageColumns(
    rowData: Record<string, any>,
    lineageData: LineageData
  ): Promise<RawTableRow>;

  async validateLineageData(lineageData: LineageData): Promise<boolean>;
}
```

---

### **Task 3: Extract Type Handler Factory**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create factory pattern for extract type handlers
- [ ] Implement handlers for all 18 extract types
- [ ] Add column validation per extract type
- [ ] Support extract-specific processing rules
- [ ] Enable dynamic handler registration

#### **Handler Factory Implementation:**

```typescript
interface ExtractHandler {
  extractType: ExtractType;
  tableName: string;
  columnMapping: ColumnMapping;
  validationRules: ValidationRule[];
  preProcess?: (row: CSVRow) => CSVRow;
  postProcess?: (row: RawTableRow) => RawTableRow;
}

interface ValidationRule {
  columnName: string;
  ruleType: "required" | "format" | "range" | "enum";
  validator: (value: string) => boolean;
  errorMessage: string;
}

class ExtractHandlerFactory {
  async getHandler(extractType: ExtractType): Promise<ExtractHandler>;
  async registerHandler(handler: ExtractHandler): Promise<void>;
  async getAllHandlers(): Promise<ExtractHandler[]>;
  async validateHandler(handler: ExtractHandler): Promise<boolean>;
}

class BaseExtractHandler implements ExtractHandler {
  extractType: ExtractType;
  tableName: string;
  columnMapping: ColumnMapping;
  validationRules: ValidationRule[];

  constructor(extractType: ExtractType) {
    // Initialize with extract-specific configuration
  }

  async validateRow(row: CSVRow): Promise<ValidationResult>;
  async transformRow(row: CSVRow): Promise<RawTableRow>;
}
```

#### **Extract-Specific Handlers:**

```typescript
// Example: Patients Handler
class PatientsHandler extends BaseExtractHandler {
  extractType = 'patients';
  tableName = 'raw.patients';

  constructor() {
    super('patients');
    this.validationRules = [
      { columnName: 'patient_id', ruleType: 'required', ... },
      { columnName: 'nhi_number', ruleType: 'format', ... },
      // Additional patients-specific validation rules
    ];
  }

  async transformRow(row: CSVRow): Promise<RawTableRow> {
    // Patients-specific transformations
    return transformedRow;
  }
}
```

---

### **Task 4: Idempotency and Duplicate Prevention**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement file-level deduplication
- [ ] Add row-level duplicate checking
- [ ] Support partial load resumption
- [ ] Create idempotency tracking system
- [ ] Handle S3 version conflicts

#### **Idempotency Implementation:**

```typescript
interface IdempotencyCheck {
  s3Key: string;
  s3VersionId: string;
  fileHash: string;
  extractType: ExtractType;
  isProcessed: boolean;
  loadRunId?: string;
  processedAt?: Date;
  rowCount?: number;
}

class IdempotencyService {
  async checkFileProcessed(
    fileMetadata: DiscoveredFile
  ): Promise<IdempotencyCheck>;

  async markFileProcessing(
    fileMetadata: DiscoveredFile,
    loadRunId: string
  ): Promise<void>;

  async markFileCompleted(
    fileMetadata: DiscoveredFile,
    loadRunId: string,
    rowCount: number
  ): Promise<void>;

  async getDuplicateFiles(
    fileMetadata: DiscoveredFile
  ): Promise<DiscoveredFile[]>;

  async shouldSkipFile(fileMetadata: DiscoveredFile): Promise<boolean>;
}

interface LoadState {
  fileKey: string;
  processedRows: number;
  totalRows: number;
  lastProcessedRow: number;
  isCompleted: boolean;
  errorCount: number;
  loadRunId: string;
}

class LoadStateManager {
  async saveLoadState(state: LoadState): Promise<void>;
  async getLoadState(fileKey: string): Promise<LoadState | null>;
  async resumeLoad(state: LoadState): Promise<LoadResult>;
  async cleanupLoadState(fileKey: string): Promise<void>;
}
```

---

### **Task 5: Error Handling and Recovery**

**Duration**: 5 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement comprehensive error classification
- [ ] Add batch-level error recovery
- [ ] Create error reporting and logging
- [ ] Support partial load resumption
- [ ] Add data quality error tracking

#### **Error Management System:**

```typescript
enum LoadErrorType {
  CSV_PARSE_ERROR = "CSV_PARSE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  IDEMPOTENCY_ERROR = "IDEMPOTENCY_ERROR",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
}

interface LoadError {
  errorType: LoadErrorType;
  message: string;
  fileKey: string;
  rowNumber?: number;
  columnName?: string;
  rawRow?: string;
  timestamp: Date;
  isRetryable: boolean;
  context?: Record<string, any>;
}

class ErrorHandler {
  async handleError(error: Error, context: any): Promise<LoadError>;
  async shouldRetry(error: LoadError): Promise<boolean>;
  async getRetryDelay(attempt: number): Promise<number>;
  async logError(error: LoadError): Promise<void>;
  async getErrorSummary(errors: LoadError[]): Promise<ErrorSummary>;
}

interface ErrorSummary {
  totalErrors: number;
  errorsByType: Record<LoadErrorType, number>;
  topErrors: LoadError[];
  retryableErrors: number;
  blockingErrors: number;
}
```

#### **Recovery Strategies:**

```typescript
interface RecoveryOptions {
  maxRetries: number;
  retryDelayMs: number;
  continueOnRowError: boolean;
  skipDuplicateFiles: boolean;
  cleanupOnFailure: boolean;
}

class RecoveryManager {
  async attemptRecovery(
    error: LoadError,
    context: any,
    options: RecoveryOptions
  ): Promise<RecoveryResult>;

  async resumePartialLoad(
    fileKey: string,
    startRow: number
  ): Promise<LoadResult>;

  async rollbackFailedLoad(fileKey: string, loadRunId: string): Promise<void>;
}

enum RecoveryResult {
  SUCCESS = "SUCCESS",
  RETRY = "RETRY",
  SKIP = "SKIP",
  FAIL = "FAIL",
}
```

---

### **Task 6: Performance Optimization**

**Duration**: 4 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement batch processing optimization
- [ ] Add connection pooling for database
- [ ] Support parallel file processing
- [ ] Optimize memory usage for large files
- [ ] Add progress tracking and metrics

#### **Performance Optimization:**

```typescript
interface PerformanceConfig {
  maxBatchSize: number;
  maxConcurrentFiles: number;
  maxMemoryUsageMB: number;
  enableStreaming: boolean;
  enableCompression: boolean;
  connectionPoolSize: number;
}

class PerformanceOptimizer {
  async optimizeBatchSize(fileSize: number, rowCount: number): Promise<number>;

  async calculateOptimalConcurrency(
    fileCount: number,
    totalSize: number
  ): Promise<number>;

  async monitorMemoryUsage(): Promise<MemoryStats>;
  async adjustResources(stats: MemoryStats): Promise<void>;
}

interface MemoryStats {
  usedMB: number;
  availableMB: number;
  peakUsageMB: number;
  rowBufferSize: number;
  isNearLimit: boolean;
}
```

---

### **Task 7: Monitoring and Metrics**

**Duration**: 3 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement comprehensive metrics collection
- [ ] Add load progress tracking
- [ ] Create performance monitoring
- [ ] Support real-time status reporting
- [ ] Add alerting for anomalies

#### **Metrics and Monitoring:**

```typescript
interface LoadMetrics {
  filesProcessed: number;
  totalRowsLoaded: number;
  totalBytesProcessed: number;
  averageRowsPerSecond: number;
  averageProcessingTimeMs: number;
  errorRate: number;
  retryCount: number;
  memoryPeakUsageMB: number;
  databaseConnectionsUsed: number;
}

interface LoadProgress {
  fileKey: string;
  extractType: ExtractType;
  totalRows: number;
  processedRows: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
  currentStatus: LoadStatus;
  errors: LoadError[];
}

enum LoadStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PARTIAL = "PARTIAL",
  RETRYING = "RETRYING",
}

class LoadMonitor {
  async getMetrics(): Promise<LoadMetrics>;
  async getProgress(fileKey: string): Promise<LoadProgress>;
  async getAllProgress(): Promise<LoadProgress[]>;
  async updateProgress(progress: LoadProgress): Promise<void>;
  async logMetrics(metrics: LoadMetrics): Promise<void>;
  async healthCheck(): Promise<boolean>;
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

- [ ] CSV parser with various data formats and separators
- [ ] Extract handler validation rules
- [ ] Lineage data generation and validation
- [ ] Idempotency checks and duplicate prevention
- [ ] Error handling and recovery scenarios

### **Integration Tests**

- [ ] End-to-end loading of sample CSV files
- [ ] Large file processing with streaming
- [ ] Batch processing with failures and retries
- [ ] Idempotency testing with duplicate files
- [ ] Performance testing with various file sizes

### **Test Data Requirements**

- [ ] Sample CSV files for each extract type
- [ ] Files with various error conditions
- [ ] Large test files (100K+ rows) for performance testing
- [ ] Duplicate and versioned files for idempotency testing

---

## 🏗️ **Implementation Architecture**

### **Core Classes and Structure**

```typescript
// Main service orchestrator
export class RawLoaderService {
  private csvParser: IndiciCSVParser;
  private tableLoader: RawTableLoader;
  private handlerFactory: ExtractHandlerFactory;
  private idempotencyService: IdempotencyService;
  private lineageService: LineageService;
  private errorHandler: ErrorHandler;
  private monitor: LoadMonitor;

  async loadFile(
    fileMetadata: DiscoveredFile,
    loadRunId: string,
    options?: RawLoadOptions
  ): Promise<LoadResult>;

  async loadMultipleFiles(
    files: DiscoveredFile[],
    loadRunId: string,
    options?: RawLoadOptions
  ): Promise<LoadResult[]>;
}

// Factory for creating service instances
export class RawLoaderFactory {
  static create(config: RawLoaderConfig): RawLoaderService;
}
```

### **File Structure**

```
src/services/raw-loader/
├── index.ts                      # Main exports
├── RawLoaderService.ts           # Main service class
├── IndiciCSVParser.ts            # CSV parsing logic
├── RawTableLoader.ts             # Database loading logic
├── ExtractHandlerFactory.ts      # Extract type handlers
├── IdempotencyService.ts         # Duplicate prevention
├── LineageService.ts             # Lineage data management
├── ErrorHandler.ts               # Error handling
├── LoadMonitor.ts                # Monitoring and metrics
├── types/
│   ├── raw-loader.ts             # Service types
│   ├── csv.ts                    # CSV processing types
│   └── errors.ts                 # Error types
├── handlers/
│   ├── BaseExtractHandler.ts     # Base handler class
│   ├── PatientsHandler.ts        # Patients-specific logic
│   ├── AppointmentsHandler.ts    # Appointments-specific logic
│   └── [Other extract handlers]
├── utils/
│   ├── batchUtils.ts             # Batch processing utilities
│   ├── validationUtils.ts        # Validation utilities
│   └── performanceUtils.ts       # Performance utilities
└── __tests__/
    ├── unit/                     # Unit tests
    ├── integration/              # Integration tests
    └── fixtures/                 # Test data
```

---

## 📊 **Performance Requirements**

### **Scalability Targets**

- **Small Files (<1K rows)**: Load within 10 seconds
- **Medium Files (1K-100K rows)**: Load within 2 minutes
- **Large Files (100K+ rows)**: Load within 5 minutes
- **Concurrent Files**: Process up to 5 files simultaneously
- **Memory Usage**: Keep under 512MB for 100K row files

### **Optimization Strategies**

- Stream processing for large CSV files
- Batch inserts with configurable batch sizes
- Connection pooling for database operations
- Parallel processing for multiple files
- Intelligent memory management for large datasets

---

## 🔒 **Security Considerations**

### **Database Permissions**

```sql
-- Required permissions for raw loader
GRANT INSERT ON ALL TABLES IN SCHEMA raw TO etl_writer;
GRANT USAGE ON SCHEMA raw TO etl_writer;
```

### **Security Best Practices**

- [ ] Validate all input data before processing
- [ ] Sanitize file paths and S3 keys
- [ ] Use parameterized queries for all database operations
- [ ] Implement proper transaction boundaries
- [ ] Log security-relevant events and access patterns
- [ ] Rate limiting for batch operations

---

## 📋 **Configuration Management**

### **Environment Variables**

```bash
# Database Configuration
RAW_LOADER_DB_POOL_SIZE=10
RAW_LOADER_DB_TIMEOUT_MS=30000

# Batch Processing
RAW_LOADER_BATCH_SIZE=1000
RAW_LOADER_MAX_CONCURRENT_FILES=5
RAW_LOADER_MAX_MEMORY_MB=512

# CSV Processing
RAW_LOADER_FIELD_SEPARATOR="|~~|"
RAW_LOADER_ROW_SEPARATOR="|^^|"
RAW_LOADER_MAX_ROW_LENGTH=10000

# Error Handling
RAW_LOADER_MAX_RETRIES=3
RAW_LOADER_RETRY_DELAY_MS=1000
RAW_LOADER_CONTINUE_ON_ERROR=true

# Performance
RAW_LOADER_ENABLE_STREAMING=true
RAW_LOADER_ENABLE_COMPRESSION=false
RAW_LOADER_BUFFER_SIZE_MB=16
```

---

## ✅ **Success Criteria**

### **Functional Requirements**

- [ ] Successfully load all 18 Indici extract types
- [ ] Handle custom CSV separators correctly
- [ ] Maintain data lineage for all loaded records
- [ ] Support idempotent file processing
- [ ] Handle malformed data gracefully

### **Non-Functional Requirements**

- [ ] Process 100K+ row files within 5 minutes
- [ ] Handle concurrent file processing
- [ ] Maintain detailed error reporting
- [ ] Support resumable partial loads
- [ ] Provide real-time progress tracking

### **Integration Requirements**

- [ ] Receive files from S3 Discovery Service
- [ ] Provide loading results to Audit Manager
- [ ] Support monitoring by Health Monitor
- [ ] Enable downstream Staging Transformer

---

## 🔄 **Integration Points**

### **Upstream Dependencies**

- **S3 Discovery Service**: Provides `DiscoveredFile[]` and file streams
- **Configuration Service**: Provides runtime configuration
- **Audit Manager**: Receives load run information

### **Downstream Dependencies**

- **Staging Transformer**: Consumes loaded raw data
- **Health Monitor**: Receives loading status and metrics
- **Error Reporting**: Receives detailed error information

---

## 📖 **Usage Examples**

### **Basic File Loading**

```typescript
const rawLoader = RawLoaderFactory.create(config);
const result = await rawLoader.loadFile(discoveredFile, loadRunId);

if (result.totalRows > 0) {
  console.log(`Loaded ${result.totalRows} rows successfully`);
}
```

### **Batch File Processing**

```typescript
const results = await rawLoader.loadMultipleFiles(discoveredFiles, loadRunId, {
  maxConcurrentFiles: 3,
});

const totalLoaded = results.reduce((sum, r) => sum + r.totalRows, 0);
console.log(
  `Processed ${results.length} files, loaded ${totalLoaded} total rows`
);
```

### **With Error Handling**

```typescript
const result = await rawLoader.loadFile(discoveredFile, loadRunId, {
  continueOnError: true,
  maxRetries: 3,
});

if (result.failedBatches > 0) {
  console.log(`Completed with ${result.failedBatches} failed batches`);
  // Handle partial failure scenario
}
```

---

## 🚀 **Implementation Timeline**

### **Week 1 - Days 3-4 (16 hours total)**

- **Day 3 (8 hours)**:
  - Task 1: CSV Parser Implementation (6 hours)
  - Task 2: Raw Table Loader Implementation (2 hours)

- **Day 4 (8 hours)**:
  - Task 2: Complete Raw Table Loader (6 hours)
  - Task 3: Extract Type Handler Factory (2 hours)

### **Remaining Tasks (11 hours)**

- Task 3: Complete Extract Handler Factory (4 hours)
- Task 4: Idempotency and Duplicate Prevention (4 hours)
- Task 5: Error Handling and Recovery (3 hours)

### **Optional Enhancements (10 hours)**

- Task 6: Performance Optimization (4 hours)
- Task 7: Monitoring and Metrics (3 hours)
- Testing and Documentation (3 hours)

---

## 📅 **Next Steps**

1. **Review and approve** this implementation plan
2. **Begin implementation** with Task 1: CSV Parser Implementation
3. **Move to Staging Transformer** implementation plan after completion
4. **Update progress** in phase-1.md as tasks are completed

**Status**: ✅ **Approved** - Ready for Implementation
**Start Date**: [Insert start date]
**Estimated Completion**: [Insert completion date]
**Owner**: [Insert owner name]
