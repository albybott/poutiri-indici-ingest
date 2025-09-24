# Phase 1 - S3 Discovery Service Implementation Plan

## 🎯 **Component Overview**

The **S3 Discovery Service** is the foundational component of the ETL pipeline responsible for discovering, parsing, and organizing Indici CSV files from AWS S3. It serves as the entry point for the entire data ingestion process.

### **Core Responsibilities**

- Discover new Indici extract files in S3 bucket
- Parse filename convention to extract metadata
- Group files by batch (`DateExtracted`)
- Support both full and delta file processing
- Provide file metadata for downstream processing
- Handle S3 versioning and file integrity

---

## 📁 **Related Files**

### **Project Requirements & Configuration**

- [`package.json`](../../package.json) - AWS SDK dependencies and project configuration
- [`docs/project-files/ingest-tool-requirements.md`](../project-files/ingest-tool-requirements.md) - Technical requirements including S3 specifications
- [`docs/project-files/data-extract-Info.md`](../project-files/data-extract-Info.md) - CSV format and filename convention specifications

### **Database Schema**

- [`src/db/schema/schemas.ts`](../../src/db/schema/schemas.ts) - Database schema setup and configuration
- [`src/db/schema/shared/enums.ts`](../../src/db/schema/shared/enums.ts) - Extract type definitions and enums

### **Utilities**

- [`src/utils/logger.ts`](../../src/utils/logger.ts) - Logging utilities for S3 operations
- [`src/utils/create-table.ts`](../../src/utils/create-table.ts) - Database table creation utilities

### **Configuration Files**

- [`tsconfig.json`](../../tsconfig.json) - TypeScript configuration
- [`drizzle.config.ts`](../../drizzle.config.ts) - Database configuration

---

## 📋 **Detailed Implementation Tasks**

### **Task 1: AWS S3 Client Setup**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Install and configure AWS SDK v3 (`@aws-sdk/client-s3`)
- [ ] Create S3 client with proper credentials management
- [ ] Set up region configuration (ap-southeast-2 Sydney)
- [ ] Implement credential loading from environment variables
- [ ] Add connection testing and error handling

#### **Technical Requirements:**

```typescript
interface S3Config {
  bucket: string; // "poutiri-datacraft-data"
  region: string; // "ap-southeast-2"
  prefix?: string; // Optional prefix for file filtering
  maxKeys?: number; // Limit for listObjects calls
}

interface S3Client {
  listObjects(prefix?: string): Promise<S3Object[]>;
  getObjectMetadata(key: string): Promise<S3ObjectMetadata>;
  downloadObject(key: string): Promise<NodeJS.ReadableStream>;
}
```

#### **Environment Variables:**

```bash
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
S3_BUCKET_NAME=poutiri-datacraft-data
S3_BUCKET_PREFIX=<optional-prefix>
```

---

### **Task 2: Filename Parser Implementation**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement filename convention parser
- [ ] Extract and validate all filename components
- [ ] Handle date parsing for DateFrom, DateTo, DateExtracted
- [ ] Validate PerOrgID and PracticeID
- [ ] Create strongly typed metadata objects

#### **Filename Convention:**

`685146545<ExtractType>_<DateFrom>_<DateTo>_<DateExtracted>`

**Example**: `685146545Appointments_202508180544_202508190544_2508190850`

#### **Parser Implementation:**

```typescript
interface ParsedFilename {
  perOrgId: string; // "685146" - EBPHA PerOrgID
  practiceId: string; // "545" - Indici PracticeID
  extractType: ExtractType; // "Appointments", "Patients", etc.
  dateFrom: Date; // 2025-08-18 05:44
  dateTo: Date; // 2025-08-19 05:44
  dateExtracted: Date; // 2025-08-19 08:50
  isFullLoad: boolean; // Determined by filename pattern
  isDelta: boolean; // Determined by filename pattern
}

type ExtractType =
  | "Patients"
  | "Appointments"
  | "Providers"
  | "PracticeInfo"
  | "Invoices"
  | "InvoiceDetail"
  | "Immunisations"
  | "Diagnoses"
  | "Measurements"
  | "Recalls"
  | "Inbox"
  | "InboxDetail"
  | "Medicine"
  | "NextOfKin"
  | "Vaccine"
  | "Allergies"
  | "AppointmentMedications"
  | "PatientAlerts";

class FilenameParser {
  static parse(filename: string): ParsedFilename;
  static validate(parsed: ParsedFilename): boolean;
  static extractDateExtracted(filename: string): Date;
}
```

#### **Validation Rules:**

- PerOrgID must be "685146"
- PracticeID must be "545"
- ExtractType must match known types
- Dates must be valid and in correct format
- DateExtracted must be >= DateTo

---

### **Task 3: File Discovery Engine**

**Duration**: 8 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement S3 file listing with pagination
- [ ] Filter files by naming convention
- [ ] Group files by DateExtracted batch
- [ ] Identify full vs delta files
- [ ] Sort files by priority and timestamp
- [ ] Handle S3 versioning metadata

#### **Discovery Implementation:**

```typescript
interface DiscoveredFile {
  s3Key: string;
  s3VersionId: string;
  fileSize: number;
  lastModified: Date;
  etag: string;
  parsed: ParsedFilename;
  fileHash?: string; // Calculated later
}

interface FileBatch {
  dateExtracted: Date;
  batchId: string; // Formatted dateExtracted
  files: DiscoveredFile[];
  totalFiles: number;
  totalSize: number;
  extractTypes: ExtractType[];
}

class FileDiscovery {
  async discoverFiles(options?: DiscoveryOptions): Promise<DiscoveredFile[]>;
  async groupByBatch(files: DiscoveredFile[]): Promise<FileBatch[]>;
  async findLatestBatch(): Promise<FileBatch | null>;
  async findBatchByDate(dateExtracted: Date): Promise<FileBatch | null>;
  async findFilesByExtractType(
    extractType: ExtractType
  ): Promise<DiscoveredFile[]>;
}

interface DiscoveryOptions {
  extractTypes?: ExtractType[]; // Filter by specific extract types
  dateFrom?: Date; // Filter files from date
  dateTo?: Date; // Filter files to date
  includeProcessed?: boolean; // Include already processed files
  maxBatches?: number; // Limit number of batches returned
}
```

---

### **Task 4: File Integrity and Versioning**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Calculate file hashes (SHA-256) for integrity
- [ ] Track S3 version IDs for idempotency
- [ ] Implement file metadata caching
- [ ] Add file size validation
- [ ] Handle S3 object versioning

#### **Integrity Implementation:**

```typescript
interface FileIntegrity {
  s3VersionId: string;
  fileHash: string; // SHA-256 hash
  fileSize: number;
  checksumValidated: boolean;
  lastChecked: Date;
}

class FileIntegrityService {
  async calculateHash(s3Key: string): Promise<string>;
  async validateIntegrity(file: DiscoveredFile): Promise<boolean>;
  async getFileMetadata(s3Key: string): Promise<FileIntegrity>;
  async compareVersions(
    file1: DiscoveredFile,
    file2: DiscoveredFile
  ): Promise<boolean>;
}
```

---

### **Task 5: Batch Processing Logic**

**Duration**: 6 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement batch selection algorithms
- [ ] Handle full vs delta processing logic
- [ ] Support backfill operations
- [ ] Add batch priority management
- [ ] Create batch validation rules

#### **Batch Processing:**

```typescript
interface BatchProcessingOptions {
  mode: "latest" | "backfill" | "specific";
  extractTypes?: ExtractType[];
  dateRange?: { from: Date; to: Date };
  specificBatch?: string;
  priorityOrder?: ExtractType[];
}

interface ProcessingPlan {
  batches: FileBatch[];
  totalFiles: number;
  estimatedDuration: number;
  dependencies: ExtractTypeDependency[];
  processingOrder: DiscoveredFile[];
}

class BatchProcessor {
  async createProcessingPlan(
    options: BatchProcessingOptions
  ): Promise<ProcessingPlan>;
  async selectNextBatch(): Promise<FileBatch | null>;
  async validateBatch(batch: FileBatch): Promise<ValidationResult>;
  async markBatchStarted(batch: FileBatch): Promise<void>;
  async markBatchCompleted(batch: FileBatch): Promise<void>;
}

interface ExtractTypeDependency {
  extractType: ExtractType;
  dependsOn: ExtractType[];
  priority: number;
}
```

---

### **Task 6: Configuration Management**

**Duration**: 3 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Create configuration schema
- [ ] Implement environment-based config
- [ ] Add validation for configuration values
- [ ] Support runtime configuration updates
- [ ] Create configuration documentation

#### **Configuration Schema:**

```typescript
interface S3DiscoveryConfig {
  s3: {
    bucket: string;
    region: string;
    prefix: string;
    maxConcurrency: number;
    retryAttempts: number;
    timeoutMs: number;
  };
  discovery: {
    batchSize: number;
    maxFilesPerBatch: number;
    enableVersioning: boolean;
    validateHashes: boolean;
    cacheMetadata: boolean;
    cacheTtlMinutes: number;
  };
  processing: {
    priorityExtracts: ExtractType[];
    maxConcurrentFiles: number;
    processingTimeoutMs: number;
  };
}

class ConfigurationManager {
  static load(): S3DiscoveryConfig;
  static validate(config: S3DiscoveryConfig): boolean;
  static get<T>(path: string): T;
  static update(path: string, value: any): void;
}
```

---

### **Task 7: Error Handling and Resilience**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement comprehensive error handling
- [ ] Add retry logic with exponential backoff
- [ ] Handle S3 rate limiting
- [ ] Create error classification system
- [ ] Add circuit breaker pattern

#### **Error Handling:**

```typescript
enum ErrorType {
  S3_CONNECTION = "S3_CONNECTION",
  INVALID_FILENAME = "INVALID_FILENAME",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RATE_LIMITED = "RATE_LIMITED",
  HASH_MISMATCH = "HASH_MISMATCH",
}

interface DiscoveryError {
  type: ErrorType;
  message: string;
  s3Key?: string;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}

class ErrorHandler {
  async handleError(error: Error, context: any): Promise<DiscoveryError>;
  async shouldRetry(error: DiscoveryError): Promise<boolean>;
  async getRetryDelay(attempt: number): Promise<number>;
  async logError(error: DiscoveryError): Promise<void>;
}
```

---

### **Task 8: Logging and Monitoring**

**Duration**: 3 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement structured logging
- [ ] Add performance metrics collection
- [ ] Create discovery status reporting
- [ ] Add debugging capabilities
- [ ] Implement health checks

#### **Monitoring Implementation:**

```typescript
interface DiscoveryMetrics {
  filesDiscovered: number;
  batchesFound: number;
  totalSizeBytes: number;
  discoveryDurationMs: number;
  errorsEncountered: number;
  s3ApiCalls: number;
  cacheHitRate: number;
}

interface DiscoveryStatus {
  isHealthy: boolean;
  lastDiscovery: Date;
  latestBatch: string;
  availableBatches: number;
  pendingFiles: number;
  errors: DiscoveryError[];
  metrics: DiscoveryMetrics;
}

class DiscoveryMonitor {
  async getStatus(): Promise<DiscoveryStatus>;
  async getMetrics(): Promise<DiscoveryMetrics>;
  async healthCheck(): Promise<boolean>;
  logDiscoveryStart(options: DiscoveryOptions): void;
  logDiscoveryComplete(metrics: DiscoveryMetrics): void;
  logError(error: DiscoveryError): void;
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

- [ ] Filename parser with various valid/invalid formats
- [ ] S3 client mock responses and error scenarios
- [ ] Batch grouping logic with edge cases
- [ ] File integrity validation
- [ ] Configuration validation

### **Integration Tests**

- [ ] Real S3 bucket connection (with test data)
- [ ] End-to-end file discovery flow
- [ ] Batch processing with multiple extract types
- [ ] Error handling and retry mechanisms
- [ ] Performance testing with large file lists

### **Test Data Requirements**

- [ ] Sample S3 bucket with test files
- [ ] Various filename formats (valid/invalid)
- [ ] Different extract types and batch scenarios
- [ ] Error simulation data (corrupted files, etc.)

---

## 🏗️ **Implementation Architecture**

### **Core Classes and Structure**

```typescript
// Main service orchestrator
export class S3DiscoveryService {
  private s3Client: S3Client;
  private filenameParser: FilenameParser;
  private fileDiscovery: FileDiscovery;
  private batchProcessor: BatchProcessor;
  private integrityService: FileIntegrityService;
  private monitor: DiscoveryMonitor;

  async discoverLatestFiles(): Promise<ProcessingPlan>;
  async discoverByDateRange(from: Date, to: Date): Promise<ProcessingPlan>;
  async discoverSpecificBatch(batchId: string): Promise<FileBatch>;
  async getDiscoveryStatus(): Promise<DiscoveryStatus>;
}

// File system interface
export interface FileSystemAdapter {
  listFiles(prefix?: string): Promise<FileMetadata[]>;
  getFileStream(key: string): Promise<NodeJS.ReadableStream>;
  getFileMetadata(key: string): Promise<FileMetadata>;
}

// S3 implementation
export class S3FileSystemAdapter implements FileSystemAdapter {
  // S3-specific implementation
}
```

### **Dependency Injection Setup**

```typescript
// Container setup for testability
export class DiscoveryContainer {
  static create(config: S3DiscoveryConfig): S3DiscoveryService {
    const s3Client = new S3Client(config.s3);
    const adapter = new S3FileSystemAdapter(s3Client);
    const parser = new FilenameParser();
    const discovery = new FileDiscovery(adapter, parser);
    const processor = new BatchProcessor();
    const integrity = new FileIntegrityService(adapter);
    const monitor = new DiscoveryMonitor();

    return new S3DiscoveryService(
      discovery,
      processor,
      integrity,
      monitor,
      config
    );
  }
}
```

---

## 📊 **Performance Requirements**

### **Scalability Targets**

- **File Discovery**: Handle 1000+ files in S3 bucket within 30 seconds
- **Batch Processing**: Group and sort 100+ files per batch within 5 seconds
- **Memory Usage**: Keep memory footprint under 256MB during discovery
- **Concurrent Operations**: Support up to 10 concurrent S3 operations

### **Optimization Strategies**

- Use S3 ListObjectsV2 with pagination for large buckets
- Implement intelligent caching for file metadata
- Batch S3 operations where possible
- Use streaming for large file operations
- Implement connection pooling for S3 client

---

## 🔒 **Security Considerations**

### **AWS IAM Permissions**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:ListBucket",
        "s3:GetBucketVersioning"
      ],
      "Resource": [
        "arn:aws:s3:::poutiri-datacraft-data",
        "arn:aws:s3:::poutiri-datacraft-data/*"
      ]
    }
  ]
}
```

### **Security Best Practices**

- [ ] Use IAM roles instead of access keys when possible
- [ ] Implement least privilege access
- [ ] Validate all S3 responses
- [ ] Sanitize file paths and names
- [ ] Log security-relevant events
- [ ] Use secure credential storage

---

## 📋 **File Structure**

```
src/services/discovery/
├── index.ts                    # Main exports
├── S3DiscoveryService.ts      # Main service class
├── FilenameParser.ts          # Filename parsing logic
├── FileDiscovery.ts           # File discovery engine
├── BatchProcessor.ts          # Batch processing logic
├── FileIntegrityService.ts    # File integrity checks
├── DiscoveryMonitor.ts        # Monitoring and metrics
├── adapters/
│   ├── S3FileSystemAdapter.ts # S3 adapter implementation
│   └── FileSystemAdapter.ts   # Interface definition
├── types/
│   ├── discovery.ts           # Discovery-related types
│   ├── files.ts              # File-related types
│   └── config.ts             # Configuration types
├── utils/
│   ├── dateUtils.ts          # Date parsing utilities
│   ├── hashUtils.ts          # File hashing utilities
│   └── retryUtils.ts         # Retry logic utilities
└── __tests__/
    ├── unit/                 # Unit tests
    ├── integration/          # Integration tests
    └── fixtures/             # Test data
```

---

## 🚀 **Implementation Timeline**

### **Week 1 - Days 1-2 (16 hours total)**

- **Day 1 (8 hours)**:
  - Task 1: AWS S3 Client Setup (4 hours)
  - Task 2: Filename Parser Implementation (4 hours)

- **Day 2 (8 hours)**:
  - Task 2: Complete Filename Parser (2 hours)
  - Task 3: File Discovery Engine (6 hours)

### **Remaining Tasks (12 hours)**

- Task 3: Complete File Discovery Engine (2 hours)
- Task 4: File Integrity and Versioning (4 hours)
- Task 5: Batch Processing Logic (6 hours)

### **Optional Enhancements (11 hours)**

- Task 6: Configuration Management (3 hours)
- Task 7: Error Handling and Resilience (4 hours)
- Task 8: Logging and Monitoring (3 hours)
- Testing and Documentation (1 hour)

---

## ✅ **Success Criteria**

### **Functional Requirements**

- [ ] Successfully discover and parse all Indici file types
- [ ] Correctly group files by DateExtracted batches
- [ ] Handle both full and delta files appropriately
- [ ] Provide file metadata for downstream processing
- [ ] Support backfill operations by date range

### **Non-Functional Requirements**

- [ ] Process 100+ files within 30 seconds
- [ ] Handle S3 errors gracefully with retries
- [ ] Maintain detailed logs for debugging
- [ ] Support concurrent discovery operations
- [ ] Provide health check capabilities

### **Integration Requirements**

- [ ] Expose clean interface for Raw Loader component
- [ ] Provide file streams for CSV processing
- [ ] Support idempotency checks via file hashing
- [ ] Integrate with audit/monitoring systems

---

## 🔄 **Integration Points**

### **Downstream Dependencies**

- **Raw Loader**: Receives `DiscoveredFile[]` and file streams
- **Audit Manager**: Receives discovery metrics and file metadata
- **Health Monitor**: Receives discovery status and health checks

### **External Dependencies**

- **AWS S3**: File storage and metadata
- **Configuration Service**: Runtime configuration
- **Logging Service**: Structured logging output

---

## 📖 **Usage Examples**

### **Basic Discovery**

```typescript
const discoveryService = DiscoveryContainer.create(config);

// Discover latest batch
const plan = await discoveryService.discoverLatestFiles();
console.log(`Found ${plan.totalFiles} files in ${plan.batches.length} batches`);

// Process specific extract types
const appointmentPlan = await discoveryService.discoverLatestFiles({
  extractTypes: ["Appointments", "Patients"],
});
```

### **Backfill Operations**

```typescript
// Backfill specific date range
const backfillPlan = await discoveryService.discoverByDateRange(
  new Date("2025-08-01"),
  new Date("2025-08-31")
);

// Process specific batch
const batch = await discoveryService.discoverSpecificBatch("2508190850");
```

---

## 📅 **Next Steps**

1. **Review and approve** this implementation plan
2. **Begin implementation** with Task 1: AWS S3 Client Setup
3. **Move to Raw Loader** implementation plan after completion
4. **Update progress** in phase-1.md as tasks are completed

**Status**: ✅ **Approved** - Ready for Implementation
**Start Date**: [Insert start date]
**Estimated Completion**: [Insert completion date]
**Owner**: [Insert owner name]
