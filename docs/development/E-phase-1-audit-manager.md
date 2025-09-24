# Phase 1 - Audit Manager Implementation Plan

## 🎯 **Component Overview**

The **Audit Manager** is the central nervous system for ETL operations, responsible for comprehensive tracking, auditing, and metadata management across all layers of the data pipeline. It ensures complete traceability, operational visibility, and compliance with data governance requirements.

### **Core Responsibilities**

- Track all ETL operations and load runs
- Maintain detailed audit trails for data lineage
- Manage file-level processing metadata
- Handle rejection tracking and analysis
- Provide comprehensive operational metrics
- Support data quality monitoring and reporting
- Enable troubleshooting and debugging capabilities
- Ensure regulatory compliance through complete auditability

---

## 📁 **Related Files**

### **Database Schema - ETL Layer**

- [`src/db/schema/etl/audit.ts`](../../src/db/schema/etl/audit.ts) - Load runs, file tracking, and audit tables
- [`src/db/schema/etl/health.ts`](../../src/db/schema/etl/health.ts) - Health monitoring tables
- [`src/db/schema/etl/config.ts`](../../src/db/schema/etl/config.ts) - Configuration and thresholds tables
- [`src/db/schema/etl/dq_thresholds.ts`](../../src/db/schema/etl/dq_thresholds.ts) - Data quality thresholds (if exists)
- [`src/db/schema/schemas.ts`](../../src/db/schema/schemas.ts) - ETL schema setup and configuration

### **Database Schema - All Layers**

- [`src/db/schema/raw/patients.ts`](../../src/db/schema/raw/patients.ts) - Raw layer for lineage tracking
- [`src/db/schema/stg/patients.ts`](../../src/db/schema/stg/patients.ts) - Staging layer for transformation tracking
- [`src/db/schema/core/dimensions.ts`](../../src/db/schema/core/dimensions.ts) - Core layer for SCD2 audit tracking

### **Utilities**

- [`src/utils/create-table.ts`](../../src/utils/create-table.ts) - Database table creation utilities
- [`src/utils/logger.ts`](../../src/utils/logger.ts) - Logging utilities for audit operations

### **Database Connection**

- [`src/db/client.ts`](../../src/db/client.ts) - Database client setup and configuration

### **Project Documentation**

- [`docs/etl/etl-guide.md`](../etl/etl-guide.md) - ETL service architecture guide
- [`docs/schema/schema-guide.md`](../schema/schema-guide.md) - Comprehensive schema documentation
- [`docs/schema/schema-coverage.md`](../schema/schema-coverage.md) - Schema implementation status tracker

### **Configuration Files**

- [`package.json`](../../package.json) - Project dependencies and configuration
- [`tsconfig.json`](../../tsconfig.json) - TypeScript configuration
- [`drizzle.config.ts`](../../drizzle.config.ts) - Database configuration

---

## 📋 **Detailed Implementation Tasks**

### **Task 1: Load Run Management System**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create load run lifecycle management
- [ ] Implement load run status tracking
- [ ] Add load run metadata collection
- [ ] Support load run relationships and dependencies
- [ ] Create load run search and filtering

#### **Load Run Management:**

```typescript
interface LoadRun {
  loadRunId: string;
  startedAt: Date;
  finishedAt?: Date;
  status: LoadRunStatus;
  triggeredBy: TriggerType;
  triggeredByUser?: string;
  notes?: string;
  parentLoadRunId?: string; // For hierarchical runs
  childLoadRunIds: string[];
  totalFilesProcessed: number;
  totalRowsIngested: number;
  totalRowsRejected: number;
  errorCount: number;
  warningCount: number;
  metadata: LoadRunMetadata;
}

enum LoadRunStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PARTIAL = "partial",
  RETRYING = "retrying",
}

enum TriggerType {
  SCHEDULED = "scheduled",
  MANUAL = "manual",
  BACKFILL = "backfill",
  API = "api",
  RECOVERY = "recovery",
}

interface LoadRunMetadata {
  s3Files: string[];
  extractTypes: ExtractType[];
  dateRange: { from: Date; to: Date };
  processingMode: "full" | "incremental";
  configuration: Record<string, any>;
  environment: string;
  version: string;
}

class LoadRunManager {
  async createLoadRun(options: CreateLoadRunOptions): Promise<LoadRun>;

  async updateLoadRun(
    loadRunId: string,
    updates: Partial<LoadRun>
  ): Promise<LoadRun>;

  async getLoadRun(loadRunId: string): Promise<LoadRun | null>;

  async getLoadRuns(
    filters: LoadRunFilters,
    pagination?: PaginationOptions
  ): Promise<LoadRun[]>;

  async getLoadRunHierarchy(loadRunId: string): Promise<LoadRunHierarchy>;

  async completeLoadRun(
    loadRunId: string,
    result: LoadRunResult
  ): Promise<void>;

  async failLoadRun(loadRunId: string, error: LoadError): Promise<void>;
}

interface LoadRunFilters {
  status?: LoadRunStatus[];
  triggeredBy?: TriggerType[];
  extractTypes?: ExtractType[];
  dateRange?: { from: Date; to: Date };
  hasErrors?: boolean;
  minRowsIngested?: number;
}
```

#### **Load Run Lifecycle:**

```typescript
class LoadRunLifecycle {
  async startLoadRun(options: StartLoadRunOptions): Promise<LoadRun>;

  async updateProgress(
    loadRunId: string,
    progress: LoadProgress
  ): Promise<void>;

  async addMetrics(loadRunId: string, metrics: LoadMetrics): Promise<void>;

  async addError(loadRunId: string, error: LoadError): Promise<void>;

  async completeWithSuccess(
    loadRunId: string,
    finalMetrics: FinalLoadMetrics
  ): Promise<void>;

  async completeWithFailure(
    loadRunId: string,
    error: LoadError,
    partialResults?: PartialLoadResults
  ): Promise<void>;

  async retryLoadRun(
    loadRunId: string,
    retryOptions: RetryOptions
  ): Promise<LoadRun>;
}
```

---

### **Task 2: File Processing Tracker**

**Duration**: 5 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement file-level processing tracking
- [ ] Add file status management
- [ ] Create file processing metrics collection
- [ ] Support file retry and recovery
- [ ] Enable file lineage tracking

#### **File Processing Tracking:**

```typescript
interface FileProcessingRecord {
  loadRunFileId: string;
  loadRunId: string;
  s3Bucket: string;
  s3Key: string;
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  extractType: ExtractType;
  perOrgId: string;
  practiceId: string;
  fileSize: number;
  status: FileProcessingStatus;
  startedAt: Date;
  finishedAt?: Date;
  rowsIngested: number;
  rowsRejected: number;
  errors: FileError[];
  warnings: FileWarning[];
  processingTimeMs: number;
  retryCount: number;
  metadata: FileMetadata;
}

enum FileProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
  RETRYING = "retrying",
}

interface FileMetadata {
  originalFileName: string;
  processingAttempts: number;
  lastError?: FileError;
  customProperties: Record<string, any>;
  qualityScore: number;
  validationResults: ValidationSummary;
}

class FileProcessingTracker {
  async startFileProcessing(
    loadRunId: string,
    fileMetadata: DiscoveredFile
  ): Promise<FileProcessingRecord>;

  async updateFileProgress(
    loadRunFileId: string,
    progress: FileProgress
  ): Promise<FileProcessingRecord>;

  async completeFileProcessing(
    loadRunFileId: string,
    result: FileProcessingResult
  ): Promise<FileProcessingRecord>;

  async failFileProcessing(
    loadRunFileId: string,
    error: FileError
  ): Promise<FileProcessingRecord>;

  async getFileProcessingRecords(
    loadRunId: string,
    filters?: FileProcessingFilters
  ): Promise<FileProcessingRecord[]>;

  async getFailedFiles(loadRunId: string): Promise<FileProcessingRecord[]>;

  async retryFileProcessing(
    loadRunFileId: string,
    retryOptions: RetryOptions
  ): Promise<FileProcessingRecord>;
}
```

#### **File Status Management:**

```typescript
class FileStatusManager {
  async updateStatus(
    loadRunFileId: string,
    status: FileProcessingStatus,
    metadata?: Record<string, any>
  ): Promise<void>;

  async getFilesByStatus(
    status: FileProcessingStatus,
    loadRunId?: string
  ): Promise<FileProcessingRecord[]>;

  async getProcessingFiles(
    extractType?: ExtractType
  ): Promise<FileProcessingRecord[]>;

  async markFileCompleted(
    loadRunFileId: string,
    finalStats: FileFinalStats
  ): Promise<void>;

  async markFileFailed(loadRunFileId: string, error: FileError): Promise<void>;

  async getFileStatistics(loadRunId: string): Promise<FileStatistics>;
}
```

---

### **Task 3: Audit Trail and Lineage System**

**Duration**: 7 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create comprehensive audit trail management
- [ ] Implement data lineage tracking
- [ ] Add change history for all operations
- [ ] Support audit queries and reporting
- [ ] Create audit data retention policies

#### **Audit and Lineage Management:**

```typescript
interface AuditTrailEntry {
  auditId: string;
  timestamp: Date;
  loadRunId: string;
  component: AuditComponent;
  operation: AuditOperation;
  entityType: EntityType;
  entityId: string;
  userId?: string;
  details: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

enum AuditComponent {
  S3_DISCOVERY = "s3_discovery",
  RAW_LOADER = "raw_loader",
  STAGING_TRANSFORMER = "staging_transformer",
  CORE_MERGER = "core_merger",
  AUDIT_MANAGER = "audit_manager",
  HEALTH_MONITOR = "health_monitor",
}

enum AuditOperation {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  READ = "read",
  PROCESS = "process",
  VALIDATE = "validate",
  REJECT = "reject",
  ERROR = "error",
}

enum EntityType {
  LOAD_RUN = "load_run",
  FILE = "file",
  RECORD = "record",
  DIMENSION = "dimension",
  FACT = "fact",
  REJECTION = "rejection",
  QUALITY_METRIC = "quality_metric",
}

class AuditTrailManager {
  async recordAuditEntry(entry: AuditTrailEntry): Promise<void>;

  async getAuditTrail(
    filters: AuditTrailFilters,
    pagination: PaginationOptions
  ): Promise<AuditTrailEntry[]>;

  async getEntityHistory(
    entityType: EntityType,
    entityId: string
  ): Promise<AuditTrailEntry[]>;

  async getLoadRunAuditTrail(loadRunId: string): Promise<AuditTrailEntry[]>;

  async searchAuditTrail(
    searchTerm: string,
    filters: AuditTrailFilters
  ): Promise<AuditTrailEntry[]>;

  async getAuditSummary(
    timeRange: { from: Date; to: Date },
    component?: AuditComponent
  ): Promise<AuditSummary>;
}
```

#### **Data Lineage Tracking:**

```typescript
interface DataLineageRecord {
  lineageId: string;
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
  transformationType: TransformationType;
  transformationDetails: Record<string, any>;
  loadRunId: string;
  createdAt: Date;
  confidence: number; // 0-1 confidence score
  verified: boolean;
}

enum TransformationType {
  EXTRACT = "extract",
  TRANSFORM = "transform",
  LOAD = "load",
  AGGREGATE = "aggregate",
  FILTER = "filter",
  JOIN = "join",
  SCD2_UPDATE = "scd2_update",
  VALIDATION = "validation",
}

class DataLineageTracker {
  async recordLineage(lineageRecord: DataLineageRecord): Promise<void>;

  async traceDataLineage(
    entityType: EntityType,
    entityId: string,
    direction: "upstream" | "downstream"
  ): Promise<LineageTrace>;

  async getLineageGraph(
    entityIds: string[],
    maxDepth: number
  ): Promise<LineageGraph>;

  async validateLineage(
    lineageRecord: DataLineageRecord
  ): Promise<ValidationResult>;

  async getLineageReport(loadRunId: string): Promise<LineageReport>;
}

interface LineageTrace {
  rootEntity: { type: EntityType; id: string };
  path: LineageStep[];
  totalSteps: number;
  confidence: number;
  gaps: LineageGap[];
}

interface LineageStep {
  fromEntity: { type: EntityType; id: string };
  toEntity: { type: EntityType; id: string };
  transformation: TransformationType;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

---

### **Task 4: Rejection Management and Analysis**

**Duration**: 5 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement comprehensive rejection tracking
- [ ] Create rejection analysis and reporting
- [ ] Add rejection pattern recognition
- [ ] Support rejection recovery workflows
- [ ] Enable rejection threshold management

#### **Rejection Management System:**

```typescript
interface RejectionAnalysis {
  rejectionId: string;
  loadRunId: string;
  extractType: ExtractType;
  rejectionCategory: RejectionCategory;
  rejectionReason: string;
  count: number;
  percentage: number;
  trend: TrendDirection;
  severity: RejectionSeverity;
  examples: RejectionExample[];
  recommendations: string[];
  firstSeen: Date;
  lastSeen: Date;
}

enum RejectionCategory {
  DATA_QUALITY = "data_quality",
  TYPE_CONVERSION = "type_conversion",
  MISSING_REQUIRED = "missing_required",
  INVALID_FORMAT = "invalid_format",
  BUSINESS_RULE = "business_rule",
  DUPLICATE_RECORD = "duplicate_record",
  SYSTEM_ERROR = "system_error",
  ENUM_MAPPING = "enum_mapping",
}

enum RejectionSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

enum TrendDirection {
  INCREASING = "increasing",
  DECREASING = "decreasing",
  STABLE = "stable",
  VOLATILE = "volatile",
}

class RejectionAnalyzer {
  async analyzeRejections(
    loadRunId: string,
    extractType?: ExtractType
  ): Promise<RejectionAnalysis[]>;

  async getRejectionPatterns(
    timeRange: { from: Date; to: Date },
    extractType?: ExtractType
  ): Promise<RejectionPattern[]>;

  async getTopRejectionReasons(
    limit: number,
    timeRange?: { from: Date; to: Date }
  ): Promise<RejectionReasonSummary[]>;

  async generateRejectionReport(loadRunId: string): Promise<RejectionReport>;

  async predictRejectionTrends(
    extractType: ExtractType,
    predictionDays: number
  ): Promise<TrendPrediction>;

  async getRejectionThresholds(
    extractType: ExtractType
  ): Promise<RejectionThresholds>;

  async shouldAlertOnRejections(
    analysis: RejectionAnalysis[]
  ): Promise<AlertRecommendation[]>;
}
```

#### **Rejection Recovery:**

```typescript
interface RejectionRecoveryPlan {
  recoveryId: string;
  loadRunId: string;
  rejectionCategory: RejectionCategory;
  recoveryStrategy: RecoveryStrategy;
  affectedRecords: number;
  estimatedSuccessRate: number;
  steps: RecoveryStep[];
  prerequisites: string[];
  rollbackPlan: RollbackPlan;
}

enum RecoveryStrategy {
  AUTO_FIX = "auto_fix",
  MANUAL_REVIEW = "manual_review",
  REPROCESS = "reprocess",
  IGNORE = "ignore",
  ESCALATE = "escalate",
}

class RejectionRecoveryManager {
  async createRecoveryPlan(
    rejectionAnalysis: RejectionAnalysis[]
  ): Promise<RejectionRecoveryPlan>;

  async executeRecoveryPlan(
    recoveryPlan: RejectionRecoveryPlan
  ): Promise<RecoveryResult>;

  async rollbackRecovery(
    recoveryPlan: RejectionRecoveryPlan
  ): Promise<RollbackResult>;

  async getRecoveryHistory(loadRunId: string): Promise<RecoveryRecord[]>;

  async validateRecoveryPlan(
    recoveryPlan: RejectionRecoveryPlan
  ): Promise<ValidationResult>;
}
```

---

### **Task 5: Operational Metrics and Reporting**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement comprehensive metrics collection
- [ ] Create operational dashboard data
- [ ] Add performance benchmarking
- [ ] Support SLA monitoring
- [ ] Enable custom reporting capabilities

#### **Metrics and Reporting:**

```typescript
interface OperationalMetrics {
  timeRange: { from: Date; to: Date };
  summary: MetricsSummary;
  byComponent: Map<AuditComponent, ComponentMetrics>;
  byExtractType: Map<ExtractType, ExtractMetrics>;
  slaMetrics: SLAMetrics;
  qualityMetrics: QualityMetrics;
  performanceMetrics: PerformanceMetrics;
  alerts: AlertSummary[];
}

interface MetricsSummary {
  totalLoadRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageProcessingTime: number;
  totalRowsProcessed: number;
  totalRejections: number;
  overallSuccessRate: number;
  averageRejectionRate: number;
}

class MetricsCollector {
  async collectOperationalMetrics(timeRange: {
    from: Date;
    to: Date;
  }): Promise<OperationalMetrics>;

  async collectComponentMetrics(
    component: AuditComponent,
    timeRange: { from: Date; to: Date }
  ): Promise<ComponentMetrics>;

  async collectExtractMetrics(
    extractType: ExtractType,
    timeRange: { from: Date; to: Date }
  ): Promise<ExtractMetrics>;

  async getSLAMetrics(timeRange: { from: Date; to: Date }): Promise<SLAMetrics>;

  async generateMetricsReport(
    timeRange: { from: Date; to: Date },
    reportType: ReportType
  ): Promise<MetricsReport>;
}

enum ReportType {
  EXECUTIVE_SUMMARY = "executive_summary",
  DETAILED_OPERATIONAL = "detailed_operational",
  QUALITY_ANALYSIS = "quality_analysis",
  PERFORMANCE_BENCHMARK = "performance_benchmark",
  SLA_COMPLIANCE = "sla_compliance",
  CUSTOM = "custom",
}

interface MetricsReport {
  reportId: string;
  reportType: ReportType;
  timeRange: { from: Date; to: Date };
  generatedAt: Date;
  sections: ReportSection[];
  charts: ChartData[];
  recommendations: string[];
  metadata: Record<string, any>;
}
```

---

### **Task 6: Data Retention and Archiving**

**Duration**: 3 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement data retention policies
- [ ] Create archiving strategies
- [ ] Add audit data cleanup procedures
- [ ] Support compliance requirements
- [ ] Enable data export capabilities

#### **Data Retention Management:**

```typescript
interface RetentionPolicy {
  policyId: string;
  name: string;
  description: string;
  rules: RetentionRule[];
  defaultPolicy: boolean;
  complianceRequired: boolean;
  approvalRequired: boolean;
}

interface RetentionRule {
  dataType: DataRetentionType;
  retentionPeriod: number; // days
  archiveAfter: number; // days
  deleteAfter: number; // days
  conditions: RetentionCondition[];
  exceptions: RetentionException[];
}

enum DataRetentionType {
  RAW_DATA = "raw_data",
  STAGING_DATA = "staging_data",
  AUDIT_LOGS = "audit_logs",
  REJECTION_RECORDS = "rejection_records",
  LOAD_RUNS = "load_runs",
  QUALITY_METRICS = "quality_metrics",
}

class RetentionManager {
  async applyRetentionPolicies(): Promise<RetentionResult>;
  async archiveExpiredData(dataIds: string[]): Promise<ArchiveResult>;
  async deleteExpiredData(dataIds: string[]): Promise<DeletionResult>;
  async getDataForArchival(retentionType: DataRetentionType): Promise<string[]>;
  async exportAuditData(dateRange: {
    from: Date;
    to: Date;
  }): Promise<ExportResult>;
  async validateRetentionCompliance(): Promise<ComplianceResult>;
}

class ArchivalService {
  async createArchive(
    dataIds: string[],
    archiveType: ArchiveType,
    compression?: CompressionType
  ): Promise<ArchiveInfo>;

  async retrieveFromArchive(
    archiveId: string,
    dataIds: string[]
  ): Promise<RetrievedData>;

  async listArchives(filters: ArchiveFilters): Promise<ArchiveInfo[]>;

  async deleteArchive(archiveId: string): Promise<void>;
}
```

---

### **Task 7: Search and Query Engine**

**Duration**: 4 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Create comprehensive search capabilities
- [ ] Implement advanced filtering
- [ ] Add faceted search functionality
- [ ] Support complex query building
- [ ] Enable real-time search results

#### **Search and Query System:**

```typescript
interface SearchRequest {
  query: string;
  filters: SearchFilter[];
  facets: SearchFacet[];
  sorting: SearchSort[];
  pagination: PaginationOptions;
  searchType: SearchType;
  timeRange?: { from: Date; to: Date };
  context?: SearchContext;
}

interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  condition: "AND" | "OR" | "NOT";
}

enum FilterOperator {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  CONTAINS = "contains",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
  IN = "in",
  NOT_IN = "not_in",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
  BETWEEN = "between",
  IS_NULL = "is_null",
  IS_NOT_NULL = "is_not_null",
}

class AuditSearchEngine {
  async searchLoadRuns(request: SearchRequest): Promise<SearchResult<LoadRun>>;

  async searchFiles(
    request: SearchRequest
  ): Promise<SearchResult<FileProcessingRecord>>;

  async searchAuditTrail(
    request: SearchRequest
  ): Promise<SearchResult<AuditTrailEntry>>;

  async searchRejections(
    request: SearchRequest
  ): Promise<SearchResult<RejectionRecord>>;

  async getSearchSuggestions(
    query: string,
    searchType: SearchType,
    limit: number
  ): Promise<string[]>;

  async getSearchFacets(
    baseQuery: string,
    facetFields: string[]
  ): Promise<FacetResult[]>;
}

interface SearchResult<T> {
  items: T[];
  totalCount: number;
  facets: FacetResult[];
  suggestions: string[];
  searchTimeMs: number;
  queryId: string;
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

- [ ] Load run lifecycle management
- [ ] File processing tracking
- [ ] Audit trail recording and querying
- [ ] Rejection analysis algorithms
- [ ] Metrics collection and aggregation

### **Integration Tests**

- [ ] End-to-end audit trail from S3 discovery to core loading
- [ ] Complex search and filtering operations
- [ ] Data retention and archival workflows
- [ ] Performance testing with large audit datasets
- [ ] Multi-component audit trail consistency

### **Test Data Requirements**

- [ ] Sample load runs with various statuses
- [ ] File processing records with different outcomes
- [ ] Comprehensive audit trail entries
- [ ] Rejection records for pattern analysis
- [ ] Historical metrics for trend analysis

---

## 🏗️ **Implementation Architecture**

### **Core Classes and Structure**

```typescript
// Main service orchestrator
export class AuditManagerService {
  private loadRunManager: LoadRunManager;
  private fileTracker: FileProcessingTracker;
  private auditTrailManager: AuditTrailManager;
  private dataLineageTracker: DataLineageTracker;
  private rejectionAnalyzer: RejectionAnalyzer;
  private metricsCollector: MetricsCollector;
  private retentionManager: RetentionManager;
  private searchEngine: AuditSearchEngine;

  async trackLoadRun(
    loadRun: LoadRun,
    metadata: LoadRunMetadata
  ): Promise<void>;

  async recordAuditEntry(entry: AuditTrailEntry): Promise<void>;

  async searchAuditData(request: SearchRequest): Promise<SearchResult<any>>;

  async generateReport(
    reportType: ReportType,
    timeRange: { from: Date; to: Date }
  ): Promise<MetricsReport>;
}

// Factory for creating audit-related objects
export class AuditObjectFactory {
  static createLoadRun(options: CreateLoadRunOptions): LoadRun;
  static createAuditEntry(
    component: AuditComponent,
    operation: AuditOperation
  ): AuditTrailEntry;
}
```

### **File Structure**

```
src/services/audit-manager/
├── index.ts                          # Main exports
├── AuditManagerService.ts            # Main service class
├── LoadRunManager.ts                 # Load run management
├── FileProcessingTracker.ts          # File processing tracking
├── AuditTrailManager.ts              # Audit trail management
├── DataLineageTracker.ts             # Data lineage tracking
├── RejectionAnalyzer.ts              # Rejection analysis
├── MetricsCollector.ts               # Metrics collection
├── RetentionManager.ts               # Data retention
├── AuditSearchEngine.ts              # Search and query engine
├── types/
│   ├── audit.ts                      # Audit types
│   ├── search.ts                     # Search types
│   ├── retention.ts                  # Retention types
│   └── reporting.ts                  # Reporting types
├── models/
│   ├── LoadRun.ts                    # Load run model
│   ├── FileProcessingRecord.ts       # File processing model
│   ├── AuditTrailEntry.ts            # Audit entry model
│   ├── RejectionAnalysis.ts          # Rejection analysis model
│   └── Metrics.ts                    # Metrics model
├── utils/
│   ├── AuditUtils.ts                 # Audit utilities
│   ├── SearchUtils.ts                # Search utilities
│   ├── ValidationUtils.ts            # Validation utilities
│   └── DateUtils.ts                  # Date utilities
└── __tests__/
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    └── fixtures/                     # Test data
```

---

## 📊 **Performance Requirements**

### **Scalability Targets**

- **Audit Trail Queries**: Return results within 2 seconds for 1M+ records
- **Search Operations**: Handle complex searches within 5 seconds
- **Metrics Aggregation**: Generate reports within 30 seconds
- **Concurrent Operations**: Support 10+ simultaneous audit operations
- **Data Retention**: Manage 1TB+ of audit data efficiently

### **Optimization Strategies**

- Indexed audit trail for fast querying
- Partitioned audit tables by date
- Caching of frequently accessed audit data
- Asynchronous audit trail recording
- Compressed archival of historical data

---

## ✅ **Success Criteria**

### **Functional Requirements**

- [ ] Track all ETL operations with complete audit trails
- [ ] Maintain comprehensive data lineage across all layers
- [ ] Provide detailed rejection analysis and reporting
- [ ] Support complex search and filtering of audit data
- [ ] Enable operational metrics and SLA monitoring

### **Non-Functional Requirements**

- [ ] Handle 1M+ audit records with sub-second query response
- [ ] Support concurrent audit operations without conflicts
- [ ] Maintain audit data integrity under all failure scenarios
- [ ] Provide comprehensive reporting within 30 seconds
- [ ] Support regulatory compliance requirements

### **Integration Requirements**

- [ ] Receive audit data from all ETL components
- [ ] Provide audit data to Health Monitor
- [ ] Support external audit and compliance systems
- [ ] Enable integration with monitoring dashboards

---

## 🔄 **Integration Points**

### **Upstream Dependencies**

- **All ETL Components**: Provide audit data and operational metrics
- **Configuration Service**: Supplies audit configuration and retention policies

### **Downstream Dependencies**

- **Health Monitor**: Receives operational status and alerts
- **External Systems**: Provide audit data for compliance and reporting
- **Data Consumers**: Access audit trails for troubleshooting and analysis

---

## 📖 **Usage Examples**

### **Basic Audit Tracking**

```typescript
const auditManager = new AuditManagerService();
await auditManager.trackLoadRun(loadRun, metadata);

await auditManager.recordAuditEntry({
  component: AuditComponent.RAW_LOADER,
  operation: AuditOperation.PROCESS,
  entityType: EntityType.FILE,
  entityId: fileId,
  details: { rowsProcessed: 1000 },
});
```

### **Advanced Search and Analysis**

```typescript
const searchResults = await auditManager.searchAuditData({
  query: "failed processing",
  filters: [
    { field: "status", operator: FilterOperator.EQUALS, value: "failed" },
    {
      field: "component",
      operator: FilterOperator.IN,
      value: ["raw_loader", "staging_transformer"],
    },
  ],
  timeRange: { from: new Date("2024-01-01"), to: new Date("2024-01-31") },
});

const rejectionAnalysis = await auditManager.analyzeRejections(
  loadRunId,
  "patients"
);
```

### **Reporting and Metrics**

```typescript
const operationalMetrics = await auditManager.getOperationalMetrics({
  from: new Date("2024-01-01"),
  to: new Date("2024-01-31"),
});

const qualityReport = await auditManager.generateReport(
  ReportType.QUALITY_ANALYSIS,
  { from: new Date("2024-01-01"), to: new Date("2024-01-31") }
);
```

---

## 🚀 **Implementation Timeline**

### **Week 4 - Days 1-2 (16 hours total)**

- **Day 1 (8 hours)**:
  - Task 1: Load Run Management System (6 hours)
  - Task 2: File Processing Tracker (2 hours)

- **Day 2 (8 hours)**:
  - Task 2: Complete File Processing Tracker (3 hours)
  - Task 3: Audit Trail and Lineage System (5 hours)

### **Remaining Tasks (10 hours)**

- Task 3: Complete Audit Trail and Lineage System (2 hours)
- Task 4: Rejection Management and Analysis (5 hours)
- Task 5: Operational Metrics and Reporting (3 hours)

### **Optional Enhancements (9 hours)**

- Task 6: Data Retention and Archiving (3 hours)
- Task 7: Search and Query Engine (4 hours)
- Advanced analytics and machine learning-based insights (2 hours)

---

## 📅 **Next Steps**

1. **Review and approve** this implementation plan
2. **Begin implementation** with Task 1: Load Run Management System
3. **Move to Health Monitor** implementation plan after completion
4. **Update progress** in phase-1.md as tasks are completed

**Status**: ✅ **Approved** - Ready for Implementation
**Start Date**: [Insert start date]
**Estimated Completion**: [Insert completion date]
**Owner**: [Insert owner name]
