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

**Duration**: 3 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Install and configure AWS SDK v3 packages (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/credential-providers`)
- [ ] Create S3 client with proper credentials management and credential providers
- [ ] Set up region configuration (ap-southeast-2 Sydney) with retry and timeout settings
- [ ] Implement credential loading from environment variables or IAM roles
- [ ] Add connection testing, health checks, and comprehensive error handling

#### **Technical Requirements:**

```typescript
interface S3Config {
  bucket: string; // "poutiri-datacraft-data"
  region: string; // "ap-southeast-2"
  prefix?: string; // Optional prefix for file filtering
  maxKeys?: number; // Limit for listObjects calls (default: 1000)
  maxConcurrency?: number; // For lib-storage operations (default: 4)
  partSize?: number; // Multipart upload part size (default: 5MB)
}

interface S3Client {
  listObjectsV2(prefix?: string): Promise<S3Object[]>;
  getObjectMetadata(key: string): Promise<S3ObjectMetadata>;
  downloadObject(key: string): Promise<NodeJS.ReadableStream>;
  uploadObject(key: string, body: any): Promise<UploadResult>;
}
```

#### **Environment Variables:**

```bash
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
S3_BUCKET_NAME=poutiri-datacraft-data
S3_BUCKET_PREFIX=<optional-prefix>
AWS_PROFILE=<optional-profile-name>
```

#### **AWS SDK Configuration:**

```typescript
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import {
  fromEnv,
  fromIni,
  fromInstanceMetadata,
} from "@aws-sdk/credential-providers";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: fromEnv(), // Environment variables
  // credentials: fromIni({ profile: process.env.AWS_PROFILE }), // AWS profile
  // credentials: fromInstanceMetadata(), // EC2/ECS instance metadata
  maxAttempts: 3, // Retry attempts
  requestTimeout: 30000, // 30 seconds timeout
});
```

---

### **Task 2: Filename Parser Implementation**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement filename convention parser using regex patterns
- [ ] Extract and validate all filename components
- [ ] Handle date parsing for DateFrom, DateTo, DateExtracted
- [ ] Validate PerOrgID and PracticeID against known values
- [ ] Create strongly typed metadata objects with validation
- [ ] Add comprehensive error handling for malformed filenames

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
  batchId: string; // Formatted dateExtracted for batch grouping
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

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement S3 file listing with pagination and continuation tokens
- [ ] Filter files by naming convention using regex patterns
- [ ] Group files by DateExtracted batch efficiently
- [ ] Identify full vs delta files based on filename patterns
- [ ] Sort files by priority and timestamp for optimal processing
- [ ] Handle S3 versioning metadata and ETags
- [ ] Implement intelligent caching for discovery results

#### **Discovery Implementation:**

```typescript
interface DiscoveredFile {
  s3Key: string;
  s3VersionId: string;
  fileSize: number;
  lastModified: Date;
  etag: string;
  parsed: ParsedFilename;
  fileHash?: string; // Calculated later for integrity checks
  checksum?: string; // S3 checksum for quick comparison
}

interface FileBatch {
  dateExtracted: Date;
  batchId: string; // Formatted dateExtracted for unique identification
  files: DiscoveredFile[];
  totalFiles: number;
  totalSize: number;
  extractTypes: ExtractType[];
  isComplete: boolean; // Whether all expected files are present
}

class FileDiscovery {
  async discoverFiles(options?: DiscoveryOptions): Promise<DiscoveredFile[]>;
  async groupByBatch(files: DiscoveredFile[]): Promise<FileBatch[]>;
  async findLatestBatch(): Promise<FileBatch | null>;
  async findBatchByDate(dateExtracted: Date): Promise<FileBatch | null>;
  async findFilesByExtractType(
    extractType: ExtractType
  ): Promise<DiscoveredFile[]>;
  async validateBatchCompleteness(batch: FileBatch): Promise<boolean>;
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

- [ ] Calculate file hashes (SHA-256) for integrity using Node.js crypto
- [ ] Track S3 version IDs and ETags for idempotency
- [ ] Implement file metadata caching with TTL
- [ ] Add file size validation and checksum verification
- [ ] Handle S3 object versioning and concurrent modification detection

#### **Integrity Implementation:**

```typescript
import { createHash } from "node:crypto";

interface FileIntegrity {
  s3VersionId: string;
  etag: string; // S3 ETag for quick comparison
  fileHash?: string; // SHA-256 hash for content integrity
  fileSize: number;
  checksumValidated: boolean;
  lastChecked: Date;
  checksumAlgorithm?: string; // S3 checksum algorithm (SHA256, SHA1, etc.)
}

class FileIntegrityService {
  async calculateHash(stream: NodeJS.ReadableStream): Promise<string> {
    const hash = createHash("sha256");
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    return hash.digest("hex");
  }

  async validateIntegrity(
    file: DiscoveredFile,
    contentStream: NodeJS.ReadableStream
  ): Promise<boolean> {
    const calculatedHash = await this.calculateHash(contentStream);
    return calculatedHash === file.fileHash;
  }

  async getFileMetadata(s3Key: string): Promise<FileIntegrity>;
  async compareVersions(
    file1: DiscoveredFile,
    file2: DiscoveredFile
  ): Promise<boolean> {
    return file1.s3VersionId === file2.s3VersionId || file1.etag === file2.etag;
  }
}
```

---

### **Task 5: Batch Processing Logic**

**Duration**: 5 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement batch selection algorithms with dependency resolution
- [ ] Handle full vs delta processing logic based on file patterns
- [ ] Support backfill operations with date range filtering
- [ ] Add batch priority management based on extract type importance
- [ ] Create batch validation rules and completeness checks
- [ ] Implement processing order optimization

#### **Batch Processing:**

```typescript
interface BatchProcessingOptions {
  mode: "latest" | "backfill" | "specific";
  extractTypes?: ExtractType[];
  dateRange?: { from: Date; to: Date };
  specificBatch?: string;
  priorityOrder?: ExtractType[];
  skipValidation?: boolean; // For performance in large backfills
}

interface ProcessingPlan {
  batches: FileBatch[];
  totalFiles: number;
  estimatedDuration: number;
  dependencies: ExtractTypeDependency[];
  processingOrder: DiscoveredFile[];
  warnings: string[]; // Non-critical issues found
}

class BatchProcessor {
  async createProcessingPlan(
    options: BatchProcessingOptions
  ): Promise<ProcessingPlan>;
  async selectNextBatch(): Promise<FileBatch | null>;
  async validateBatch(batch: FileBatch): Promise<ValidationResult>;
  async markBatchStarted(batch: FileBatch): Promise<void>;
  async markBatchCompleted(batch: FileBatch): Promise<void>;
  async optimizeProcessingOrder(
    files: DiscoveredFile[]
  ): Promise<DiscoveredFile[]>;
}

interface ExtractTypeDependency {
  extractType: ExtractType;
  dependsOn: ExtractType[];
  priority: number;
  estimatedProcessingTime: number; // Minutes
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
├── s3-discovery-service.ts     # Main service class
├── filename-parser.ts         # Filename parsing logic
├── file-discovery.ts          # File discovery engine
├── batch-processor.ts         # Batch processing logic
├── file-integrity-service.ts  # File integrity checks
├── discovery-monitor.ts       # Monitoring and metrics
├── adapters/
│   ├── s3-file-system-adapter.ts    # S3 adapter implementation
│   └── file-system-adapter.ts       # Interface definition
├── types/
│   ├── discovery.ts           # Discovery-related types
│   ├── files.ts              # File-related types
│   └── config.ts             # Configuration types
├── utils/
│   ├── date-utils.ts          # Date parsing utilities
│   ├── hash-utils.ts          # File hashing utilities
│   └── retry-utils.ts         # Retry logic utilities
└── __tests__/
    ├── unit/                 # Unit tests
    ├── integration/          # Integration tests
    └── fixtures/             # Test data
```

---

## 🚀 **Implementation Timeline**

### **Week 1 - Core Implementation (18 hours total)**

- **Day 1 (6 hours)**:
  - Task 1: AWS S3 Client Setup (3 hours)
  - Task 2: Filename Parser Implementation (3 hours)

- **Day 2 (6 hours)**:
  - Task 2: Complete Filename Parser (1 hour)
  - Task 3: File Discovery Engine (5 hours)

- **Day 3 (6 hours)**:
  - Task 3: Complete File Discovery Engine (1 hour)
  - Task 4: File Integrity and Versioning (4 hours)
  - Task 5: Batch Processing Logic (1 hour)

### **Week 1 - Enhancement Tasks (10 hours)**

- Task 5: Complete Batch Processing Logic (4 hours)
- Task 6: Configuration Management (3 hours)
- Task 7: Error Handling and Resilience (3 hours)

### **Week 1 - Polish and Testing (5 hours)**

- Task 8: Logging and Monitoring (3 hours)
- Integration Testing and Documentation (2 hours)

### **Total Estimated Time: 33 hours**

---

## ✅ **Success Criteria**

### **Functional Requirements**

- [ ] Successfully discover and parse all 17 Indici file types
- [ ] Correctly group files by DateExtracted batches with 100% accuracy
- [ ] Handle both full and delta files appropriately based on filename patterns
- [ ] Provide complete file metadata for downstream processing
- [ ] Support backfill operations by date range with flexible filtering
- [ ] Validate filename conventions and reject malformed files
- [ ] Generate processing plans with dependency resolution

### **Non-Functional Requirements**

- [ ] Process 1000+ files within 30 seconds using pagination
- [ ] Handle S3 errors gracefully with exponential backoff retry
- [ ] Maintain detailed structured logs for debugging and monitoring
- [ ] Support concurrent discovery operations safely
- [ ] Provide health check endpoint with status information
- [ ] Memory usage under 256MB during large discovery operations
- [ ] File integrity validation with SHA-256 hashing

### **Integration Requirements**

- [ ] Expose clean interface for Raw Loader component with type safety
- [ ] Provide streaming interfaces for CSV processing
- [ ] Support idempotency checks via file hashing and versioning
- [ ] Integrate with audit/monitoring systems for operational visibility
- [ ] Support dependency injection for testability and flexibility

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
import { DiscoveryContainer } from "./services/discovery";
import type { S3DiscoveryConfig } from "./services/discovery/types/config";

const config: S3DiscoveryConfig = {
  s3: {
    bucket: process.env.S3_BUCKET_NAME || "poutiri-datacraft-data",
    region: process.env.AWS_REGION || "ap-southeast-2",
    prefix: process.env.S3_BUCKET_PREFIX,
    maxConcurrency: 4,
    retryAttempts: 3,
    timeoutMs: 30000,
  },
  discovery: {
    batchSize: 1000,
    maxFilesPerBatch: 100,
    enableVersioning: true,
    validateHashes: true,
    cacheMetadata: true,
    cacheTtlMinutes: 60,
  },
  processing: {
    priorityExtracts: ["Patients", "Appointments", "Providers"],
    maxConcurrentFiles: 10,
    processingTimeoutMs: 300000, // 5 minutes
  },
};

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

// Get discovery status and health
const status = await discoveryService.getDiscoveryStatus();
console.log("Service is healthy:", status.isHealthy);
console.log("Latest batch:", status.latestBatch);
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
