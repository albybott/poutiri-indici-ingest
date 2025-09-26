# S3 Discovery Service

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS SDK v3](https://img.shields.io/badge/AWS%20SDK-v3-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/sdk-for-javascript/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

The **S3 Discovery Service** is a robust, production-ready component of the Indici ETL pipeline responsible for discovering, parsing, and organizing CSV files from AWS S3. It serves as the entry point for the entire data ingestion process, providing intelligent file discovery, batch management, and metadata extraction.

## 🎯 Overview

This service handles the critical first phase of the ETL pipeline by:

- **Discovering** new Indici extract files in S3 buckets
- **Parsing** filename conventions to extract metadata
- **Grouping** files by extraction batches (`DateExtracted`)
- **Supporting** both full and delta file processing modes
- **Providing** file metadata for downstream processing components
- **Handling** S3 versioning, integrity checks, and error recovery

## 🏗️ Architecture

### Core Components

```
┌─────────────────────┐      ┌──────────────────┐     ┌───────────────────┐
│ S3DiscoveryService  │─────▶│  FileDiscovery   │────▶│ FileSystemAdapter │
│                     │      │                  │     │                   │
│ • Main orchestrator │      │ • Batch grouping │     │ • S3 operations   │
│ • Configuration      │      │ • File filtering  │     │ • Streaming I/O   │
│ • Health checks     │      │ • Pagination     │     │ • Error handling  │
└─────────────────────┘      └──────────────────┘     └───────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────────┐    ┌───────────────────────┐
│ BatchProcessor          │    │ FilenameParser        │
│                         │    │                       │
│ • Processing plans      │    │ • Regex parsing       │
│ • Dependency resolution │    │ • Metadata extraction │
│ • Optimization          │    │ • Validation          │
└─────────────────────────┘    └───────────────────────┘
```

### Design Patterns

- **Dependency Injection**: Clean separation of concerns and testability
- **Adapter Pattern**: Abstraction over file system operations
- **Strategy Pattern**: Multiple credential providers and processing strategies
- **Observer Pattern**: Event-driven monitoring and metrics collection

### Key Interfaces

```typescript
interface FileSystemAdapter {
  listFiles(prefix?: string): Promise<FileMetadata[]>;
  getFileStream(key: string): Promise<NodeJS.ReadableStream>;
  getFileMetadata(key: string): Promise<FileMetadata>;
}

interface CredentialProvider {
  getCredentials(): Promise<AWSCredentials>;
}
```

## 🚀 Quick Start

### Installation

The service is part of the larger ETL pipeline project. Ensure you have the required dependencies:

```bash
pnpm install
# Dependencies include:
# - @aws-sdk/client-s3
# - @aws-sdk/lib-storage
# - @aws-sdk/credential-providers
```

### Basic Usage

```typescript
import { S3DiscoveryService } from "./services/discovery";

const service = new S3DiscoveryService({
  s3: {
    bucket: "poutiri-datacraft-data",
    region: "ap-southeast-2",
  },
});

// Discover latest files
const processingPlan = await service.discoverLatestFiles();
console.log(
  `Found ${processingPlan.totalFiles} files in ${processingPlan.batches.length} batches`
);

// Process specific extract types
const patientFiles = await service.discoverLatestFiles({
  extractTypes: ["Patients", "Appointments"],
});
```

### Configuration

```typescript
const config = {
  s3: {
    bucket: "poutiri-datacraft-data",
    region: "ap-southeast-2",
    prefix: "extracts/", // Optional S3 prefix
    maxKeys: 1000, // Pagination size
    maxConcurrency: 4, // Concurrent operations
    retryAttempts: 3, // Retry failed operations
    timeoutMs: 30000, // Request timeout
  },
  discovery: {
    batchSize: 1000, // Files per batch
    maxFilesPerBatch: 100, // Memory management
    enableVersioning: true, // Track S3 versions
    validateHashes: true, // Integrity checks
    cacheMetadata: true, // Performance optimization
    cacheTtlMinutes: 60, // Cache duration
  },
  processing: {
    priorityExtracts: ["Patients", "Appointments", "Providers"],
    maxConcurrentFiles: 10, // Parallel processing
    processingTimeoutMs: 300000, // 5 minutes per file
  },
};
```

## 📋 API Reference

### S3DiscoveryService

The main service class that orchestrates all discovery operations.

#### Constructor

```typescript
constructor(config?: Partial<S3DiscoveryConfig>)
```

#### Methods

##### `discoverLatestFiles(options?)`

Discovers the most recent files available for processing.

```typescript
const plan = await service.discoverLatestFiles({
  extractTypes: ["Patients", "Appointments"],
  maxBatches: 5,
});
```

**Parameters:**

- `extractTypes` (optional): Filter by specific extract types
- `maxBatches` (optional): Limit number of batches returned

**Returns:** `ProcessingPlan`

##### `discoverByDateRange(from, to)`

Discovers files within a specific date range for backfill operations.

```typescript
const backfillPlan = await service.discoverByDateRange(
  new Date("2025-01-01"),
  new Date("2025-01-31")
);
```

**Returns:** `ProcessingPlan`

##### `discoverSpecificBatch(batchId)`

Retrieves a specific batch by its ID.

```typescript
const batch = await service.discoverSpecificBatch("2501190850");
```

**Returns:** `FileBatch | null`

##### `getDiscoveryStatus()`

Returns current service status and health information.

```typescript
const status = await service.getDiscoveryStatus();
console.log("Service healthy:", status.isHealthy);
```

**Returns:** `DiscoveryStatus`

##### `healthCheck()`

Validates service connectivity and configuration.

```typescript
const isHealthy = await service.healthCheck();
```

**Returns:** `boolean`

### Configuration Management

#### `getConfig()`

Returns the current service configuration.

```typescript
const config = service.getConfig();
```

#### `updateConfig(newConfig)`

Updates service configuration at runtime.

```typescript
service.updateConfig({
  s3: { maxKeys: 500 },
});
```

## 🔧 Configuration Options

### AWS Authentication

The service supports multiple credential sources in order of preference:

1. **Environment Variables**

   ```bash
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=ap-southeast-2
   ```

2. **AWS Profiles**

   ```bash
   AWS_PROFILE=production
   ```

3. **IAM Roles / EC2 Instance Metadata**

   ```bash
   # Automatically detected in EC2/ECS environments
   ```

4. **Custom Credential Providers**
   ```typescript
   const customCredentials = fromIni({
     profile: "custom-profile",
   });
   ```

### S3 Settings

| Option           | Default                    | Description                 |
| ---------------- | -------------------------- | --------------------------- |
| `bucket`         | `'poutiri-datacraft-data'` | S3 bucket name              |
| `region`         | `'ap-southeast-2'`         | AWS region                  |
| `prefix`          | `undefined`                 | Optional S3 key prefix       |
| `maxKeys`        | `1000`                     | ListObjects pagination size |
| `maxConcurrency` | `4`                        | Concurrent operations limit |
| `retryAttempts`  | `3`                        | Retry failed operations     |
| `timeoutMs`      | `30000`                    | Request timeout (ms)        |

### Discovery Settings

| Option             | Default | Description               |
| ------------------ | ------- | ------------------------- |
| `batchSize`        | `1000`  | Files processed per batch |
| `maxFilesPerBatch` | `100`   | Memory management limit   |
| `enableVersioning` | `true`  | Track S3 object versions  |
| `validateHashes`   | `true`  | Perform integrity checks  |
| `cacheMetadata`    | `true`  | Cache file metadata       |
| `cacheTtlMinutes`  | `60`    | Cache expiration time     |

### Processing Settings

| Option                | Default                        | Description               |
| --------------------- | ------------------------------ | ------------------------- |
| `priorityExtracts`    | `['Patients', 'Appointments']` | Processing priority order |
| `maxConcurrentFiles`  | `10`                           | Parallel file processing  |
| `processingTimeoutMs` | `300000`                       | Per-file timeout          |

## 📁 File Structure

```
src/services/discovery/
├── README.md                    # This file
├── index.ts                     # Main exports
├── s3-discovery-service.ts      # Core service implementation
├── filename-parser.ts           # Filename convention parsing
├── file-discovery.ts            # S3 file discovery engine
├── batch-processor.ts           # Batch processing logic
├── file-integrity-service.ts    # File integrity validation
├── discovery-monitor.ts         # Monitoring and metrics
├── adapters/
│   ├── s3-file-system-adapter.ts # S3 implementation
│   └── file-system-adapter.ts    # Interface definition
├── types/
│   ├── config.ts                # Configuration types
│   ├── discovery.ts             # Discovery-related types
│   └── files.ts                 # File and batch types
└── __tests__/
    ├── unit/                    # Unit tests
    └── integration/             # Integration tests
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm vitest run src/services/discovery/__tests__/s3-discovery-service.test.ts

# Run tests in watch mode
pnpm vitest src/services/discovery/__tests__/
```

### Test Coverage

The service includes comprehensive tests covering:

- ✅ Service initialization and configuration
- ✅ AWS SDK integration and credential management
- ✅ S3 operations and error handling
- ✅ Health checks and monitoring
- ✅ Configuration updates and validation

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { S3DiscoveryService } from "../s3-discovery-service";

describe("S3DiscoveryService", () => {
  let service: S3DiscoveryService;

  beforeEach(() => {
    service = new S3DiscoveryService({
      s3: {
        bucket: "test-bucket",
        region: "us-east-1",
      },
    });
  });

  it("should initialize correctly", () => {
    expect(service).toBeDefined();
    expect(service.getConfig()).toBeDefined();
  });
});
```

## 🔍 Filename Conventions

The service parses Indici CSV files using the following convention:

```
685146_535_<ExtractType>_<DateFrom>_<DateTo>_<DateExtracted>.csv
```

**S3 Key Structure**: Files are stored with full Windows path as S3 key:

```
C:\Jobs\indici_export\ebpha_poutiri\working\685146_535_<ExtractType>_<DateFrom>_<DateTo>_<DateExtracted>.csv
```

### Examples

| Filename                                                           | ExtractType  | DateFrom         | DateTo           | DateExtracted    |
| ------------------------------------------------------------------ | ------------ | ---------------- | ---------------- | ---------------- |
| `685146_535_Patients_202508180544_202508190544_2508190850.csv`     | Patients     | 2025-08-18 05:44 | 2025-08-19 05:44 | 2025-08-19 08:50 |
| `685146_535_Appointments_202508190000_202508192359_2508200000.csv` | Appointments | 2025-08-19 00:00 | 2025-08-19 23:59 | 2025-08-20 00:00 |
| `685146_535_Allergies_202508180544_202508181044_2508181044.csv`    | Allergies    | 2025-08-18 05:44 | 2025-08-18 10:44 | 2025-08-18 10:44 |

### Supported Extract Types

- `Patients` - Patient demographic data
- `Appointments` - Appointment records
- `Providers` - Healthcare provider information
- `PracticeInfo` - Practice configuration data
- `Invoices` - Billing and invoice data
- `InvoiceDetail` - Detailed invoice line items
- `Immunisations` - Vaccination records
- `Diagnoses` - Diagnosis information
- `Measurements` - Clinical measurements
- `Recalls` - Recall and reminder data
- `Inbox` - Inbox messages
- `InboxDetail` - Detailed inbox content
- `Medicine` - Medication information
- `NextOfKin` - Next of kin details
- `Vaccine` - Vaccine inventory
- `Allergies` - Allergy information
- `AppointmentMedications` - Medication appointments
- `PatientAlerts` - Patient alert notifications

## 📊 Monitoring & Metrics

### Discovery Metrics

```typescript
interface DiscoveryMetrics {
  filesDiscovered: number; // Total files found
  batchesFound: number; // Batches identified
  totalSizeBytes: number; // Combined file size
  discoveryDurationMs: number; // Processing time
  errorsEncountered: number; // Error count
  s3ApiCalls: number; // S3 API calls made
  cacheHitRate: number; // Cache efficiency
}
```

### Service Status

```typescript
interface DiscoveryStatus {
  isHealthy: boolean; // Service health
  lastDiscovery: Date; // Last discovery run
  latestBatch: string; // Most recent batch ID
  availableBatches: number; // Pending batches
  pendingFiles: number; // Files awaiting processing
  errors: DiscoveryError[]; // Recent errors
  metrics: DiscoveryMetrics; // Performance metrics
}
```

### Error Types

```typescript
enum ErrorType {
  S3_CONNECTION = "S3_CONNECTION",
  INVALID_FILENAME = "INVALID_FILENAME",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RATE_LIMITED = "RATE_LIMITED",
  HASH_MISMATCH = "HASH_MISMATCH",
}
```

## 🔄 Integration Points

### Downstream Components

1. **Raw Loader**: Receives `DiscoveredFile[]` and file streams
2. **Audit Manager**: Receives discovery metrics and file metadata
3. **Health Monitor**: Receives discovery status and health checks

### External Dependencies

1. **AWS S3**: File storage and metadata retrieval
2. **Configuration Service**: Runtime configuration management
3. **Logging Service**: Structured logging and error reporting

### Event Flow

```
S3 File Discovery
       ↓
  File Parsing & Validation
       ↓
     Batch Grouping
       ↓
Processing Plan Creation
       ↓
  Raw Loader Processing
       ↓
   Audit & Monitoring
```

## 🚀 Performance Optimization

### Best Practices

1. **Pagination**: Use appropriate `maxKeys` values (100-1000)
2. **Concurrency**: Limit concurrent operations to avoid rate limiting
3. **Caching**: Enable metadata caching for repeated discoveries
4. **Streaming**: Use streaming for large file operations
5. **Batching**: Process files in optimal batch sizes

### Scalability Considerations

- **Large Buckets**: Implement continuation tokens for >1000 objects
- **Memory Management**: Configure `maxFilesPerBatch` appropriately
- **Rate Limiting**: Implement exponential backoff for S3 API calls
- **Connection Pooling**: Reuse S3 clients for multiple operations

### Monitoring Recommendations

- Track discovery duration and success rates
- Monitor S3 API call counts and error rates
- Set up alerts for failed discoveries
- Log file processing metrics for optimization

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

### Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation as needed
5. Create a pull request with clear description

## 📈 Future Enhancements

### Planned Features

- [ ] **Advanced Caching**: Redis/in-memory caching with TTL
- [ ] **Metrics Export**: Prometheus/Grafana integration
- [ ] **Event Streaming**: AWS EventBridge integration
- [ ] **Delta Detection**: Smart delta vs full load detection
- [ ] **Parallel Processing**: Multi-threaded file discovery
- [ ] **Advanced Filtering**: Complex query-based file filtering
- [ ] **Data Catalog Integration**: AWS Glue catalog support

### Architecture Improvements

- [ ] **Plugin System**: Extensible discovery strategies
- [ ] **Circuit Breaker**: Resilience patterns for S3 failures
- [ ] **Load Balancing**: Multiple S3 client instances
- [ ] **Distributed Discovery**: Multi-region support

## 📞 Support

### Getting Help

- **Documentation**: Check this README first
- **Issues**: Create GitHub issues for bugs and features
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: All changes require review

### Troubleshooting

#### Common Issues

1. **Credential Errors**

   ```bash
   # Ensure AWS credentials are properly configured
   aws configure
   # Or set environment variables
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

2. **Permission Denied**

   ```bash
   # Verify S3 bucket permissions
   aws s3 ls s3://your-bucket
   ```

3. **Rate Limiting**

   ```typescript
   // Reduce concurrency in configuration
   const config = {
     s3: { maxConcurrency: 2 },
   };
   ```

4. **Memory Issues**
   ```typescript
   // Adjust batch sizes for large datasets
   const config = {
     discovery: { maxFilesPerBatch: 50 },
   };
   ```

## 📄 License

This project is part of the Poutiri Indici Ingest system and follows the project's licensing terms.

---

**Built with ❤️ for reliable data ingestion at scale**
