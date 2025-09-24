# Phase 1 - Core Merger Implementation Plan

## 🎯 **Component Overview**

The **Core Merger** is responsible for loading transformed staging data into the core business layer using Slowly Changing Dimension (SCD) Type 2 logic and fact table upsert operations. It maintains historical dimension data and ensures referential integrity across the core data warehouse layer.

### **Core Responsibilities**

- Load dimensions with SCD2 change tracking
- Upsert facts with proper foreign key relationships
- Maintain referential integrity between dimensions and facts
- Handle business key conflicts and resolution
- Support incremental and full refresh operations
- Implement dimension-first, facts-second loading strategy
- Provide detailed audit trails for all core operations

---

## 📁 **Related Files**

### **Database Schema - Core Layer**

- [`src/db/schema/core/dimensions.ts`](../../src/db/schema/core/dimensions.ts) - Core dimension table definitions with SCD2
- [`src/db/schema/core/facts.ts`](../../src/db/schema/core/facts.ts) - Core fact table definitions
- [`src/db/schema/schemas.ts`](../../src/db/schema/schemas.ts) - Core schema setup and configuration
- [`src/db/schema/shared/enums.ts`](../../src/db/schema/shared/enums.ts) - Extract type enums and mappings

### **Database Schema - Staging Layer**

- [`src/db/schema/stg/patients.ts`](../../src/db/schema/stg/patients.ts) - Staging patients table (source data)
- [`src/db/schema/stg/appointments.ts`](../../src/db/schema/stg/appointments.ts) - Staging appointments table (source data)
- [`src/db/schema/stg/providers.ts`](../../src/db/schema/stg/providers.ts) - Staging providers table (source data)
- [`src/db/schema/stg/practice_info.ts`](../../src/db/schema/stg/practice_info.ts) - Staging practice info table (source data)
- [`src/db/schema/stg/invoices.ts`](../../src/db/schema/stg/invoices.ts) - Staging invoices table (source data)

### **Database Schema - ETL Layer**

- [`src/db/schema/etl/audit.ts`](../../src/db/schema/etl/audit.ts) - Load run and file tracking tables
- [`src/db/schema/etl/health.ts`](../../src/db/schema/etl/health.ts) - Health monitoring tables
- [`src/db/schema/etl/config.ts`](../../src/db/schema/etl/config.ts) - Configuration and thresholds tables

### **Utilities**

- [`src/utils/create-table.ts`](../../src/utils/create-table.ts) - Database table creation utilities
- [`src/utils/logger.ts`](../../src/utils/logger.ts) - Logging utilities for core loading operations

### **Database Connection**

- [`src/db/client.ts`](../../src/db/client.ts) - Database client setup and configuration

### **Project Documentation**

- [`docs/schema/schema-guide.md`](../schema/schema-guide.md) - Comprehensive schema documentation
- [`docs/schema/schema-coverage.md`](../schema/schema-coverage.md) - Schema implementation status tracker
- [`docs/schema/schema-todo.md`](../schema/schema-todo.md) - Schema implementation tracking

---

## 📋 **Detailed Implementation Tasks**

### **Task 1: SCD2 Dimension Management Engine**

**Duration**: 8 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create SCD2 comparison and change detection logic
- [ ] Implement effective date range management
- [ ] Add historical record versioning
- [ ] Support dimension attribute change tracking
- [ ] Handle business key uniqueness constraints

#### **SCD2 Management System:**

```typescript
interface DimensionRecord {
  // Business keys
  businessKey: Record<string, any>;
  practiceId: string;
  perOrgId: string;

  // SCD2 tracking
  effectiveFrom: Date;
  effectiveTo?: Date;
  isCurrent: boolean;
  version: number;

  // Dimension attributes
  attributes: Record<string, any>;

  // Lineage
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  loadRunId: string;
  loadTs: Date;
}

interface SCD2Change {
  changeType: "new" | "update" | "no_change";
  attributeChanges: AttributeChange[];
  previousVersion?: DimensionRecord;
  newVersion: DimensionRecord;
}

interface AttributeChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
  changeType: "added" | "modified" | "deleted";
  significant: boolean; // Does this change require new version?
}

class SCD2Engine {
  async detectChanges(
    currentRecord: DimensionRecord,
    newRecord: DimensionRecord,
    comparisonRules: ComparisonRule[]
  ): Promise<SCD2Change>;

  async createNewVersion(
    baseRecord: DimensionRecord,
    changes: SCD2Change,
    loadMetadata: LoadMetadata
  ): Promise<DimensionRecord>;

  async expireCurrentVersion(
    currentRecord: DimensionRecord,
    loadMetadata: LoadMetadata
  ): Promise<DimensionRecord>;

  async validateSCD2Constraints(
    records: DimensionRecord[],
    dimensionType: DimensionType
  ): Promise<ValidationResult>;

  async getCurrentVersion(
    businessKey: Record<string, any>,
    dimensionType: DimensionType
  ): Promise<DimensionRecord | null>;
}

interface ComparisonRule {
  fieldName: string;
  compareType: "exact" | "significant" | "always_version" | "never_version";
  weight: number; // For significance scoring
  customComparator?: (oldVal: any, newVal: any) => boolean;
}

enum DimensionType {
  PATIENT = "patient",
  PROVIDER = "provider",
  PRACTICE = "practice",
  VACCINE = "vaccine",
  MEDICINE = "medicine",
}
```

#### **SCD2 Loading Strategy:**

```typescript
interface SCD2LoadOptions {
  dimensionType: DimensionType;
  batchSize: number;
  detectInserts: boolean;
  detectUpdates: boolean;
  detectDeletes: boolean;
  changeThreshold: number; // Minimum significance for new version
  backfillMode: boolean; // For historical data loading
}

class DimensionLoader {
  async loadDimension(
    stagingRecords: Record<string, any>[],
    dimensionType: DimensionType,
    loadRunId: string,
    options: SCD2LoadOptions
  ): Promise<DimensionLoadResult>;

  async upsertDimensionRecord(
    record: Record<string, any>,
    dimensionType: DimensionType,
    loadRunId: string
  ): Promise<DimensionUpsertResult>;

  async expireDimensionRecord(
    businessKey: Record<string, any>,
    dimensionType: DimensionType,
    loadRunId: string
  ): Promise<void>;

  async getDimensionHistory(
    businessKey: Record<string, any>,
    dimensionType: DimensionType
  ): Promise<DimensionRecord[]>;
}

interface DimensionLoadResult {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  expiredRecords: number;
  errors: DimensionError[];
  durationMs: number;
}
```

---

### **Task 2: Foreign Key Resolution Engine**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create dimension lookup and caching system
- [ ] Implement foreign key relationship mapping
- [ ] Add missing dimension handling strategies
- [ ] Support deferred foreign key resolution
- [ ] Create dimension surrogate key management

#### **Foreign Key Resolution:**

```typescript
interface FKRelationship {
  factTable: string;
  factColumn: string;
  dimensionType: DimensionType;
  dimensionKeyColumn: string;
  required: boolean;
  lookupColumns: string[]; // Columns to match against dimension business keys
  fallbackStrategy: "create" | "null" | "error";
}

interface DimensionLookup {
  businessKey: Record<string, any>;
  dimensionType: DimensionType;
  surrogateKey: number;
  isCurrent: boolean;
  lookupTimestamp: Date;
  confidence: number;
}

class FKResolver {
  async resolveForeignKeys(
    factRecord: Record<string, any>,
    relationships: FKRelationship[]
  ): Promise<ResolvedFKRecord>;

  async lookupDimensionKey(
    businessKey: Record<string, any>,
    dimensionType: DimensionType,
    lookupTime?: Date
  ): Promise<DimensionLookup | null>;

  async createMissingDimension(
    businessKey: Record<string, any>,
    dimensionType: DimensionType,
    defaultAttributes: Record<string, any>
  ): Promise<DimensionLookup>;

  async getDimensionCache(): Promise<Map<string, DimensionLookup>>;
  async refreshDimensionCache(dimensionType?: DimensionType): Promise<void>;
}

interface ResolvedFKRecord {
  factRecord: Record<string, any>;
  resolvedKeys: Map<string, number>; // dimension_type -> surrogate_key
  missingDimensions: MissingDimension[];
  resolutionErrors: FKError[];
}

interface MissingDimension {
  dimensionType: DimensionType;
  businessKey: Record<string, any>;
  suggestedAttributes: Record<string, any>;
  reason: string;
}
```

---

### **Task 3: Fact Table Loading Engine**

**Duration**: 7 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create fact table upsert logic
- [ ] Implement business key conflict resolution
- [ ] Add fact record deduplication
- [ ] Support incremental fact loading
- [ ] Handle fact-to-dimension relationships

#### **Fact Loading System:**

```typescript
interface FactRecord {
  // Business keys
  businessKey: Record<string, any>;
  practiceId: string;
  perOrgId: string;

  // Foreign keys to dimensions
  dimensionKeys: Map<DimensionType, number>;

  // Fact measures and attributes
  measures: Record<string, number>;
  attributes: Record<string, any>;

  // Metadata
  eventTime?: Date;
  loadMetadata: LoadMetadata;
}

interface FactLoadOptions {
  factType: FactType;
  upsertMode: "insert" | "update" | "upsert";
  handleDuplicates: "error" | "ignore" | "merge" | "version";
  batchSize: number;
  validateFKs: boolean;
  allowPartialInserts: boolean;
}

class FactLoader {
  async loadFacts(
    stagingRecords: Record<string, any>[],
    factType: FactType,
    loadRunId: string,
    options: FactLoadOptions
  ): Promise<FactLoadResult>;

  async upsertFactRecord(
    factRecord: FactRecord,
    factType: FactType,
    options: FactLoadOptions
  ): Promise<FactUpsertResult>;

  async resolveFactBusinessKey(
    record: Record<string, any>,
    factType: FactType
  ): Promise<Record<string, any>>;

  async validateFactConstraints(
    factRecord: FactRecord,
    factType: FactType
  ): Promise<ValidationResult>;

  async deduplicateFacts(
    facts: FactRecord[],
    factType: FactType
  ): Promise<DeduplicationResult>;
}

enum FactType {
  APPOINTMENT = "appointment",
  IMMUNISATION = "immunisation",
  INVOICE = "invoice",
  INVOICE_DETAIL = "invoice_detail",
  DIAGNOSIS = "diagnosis",
  MEASUREMENT = "measurement",
}

interface FactLoadResult {
  totalRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  duplicateRecords: number;
  errorRecords: number;
  durationMs: number;
  constraintViolations: number;
}
```

#### **Business Key Management:**

```typescript
interface BusinessKeyDefinition {
  factType: FactType;
  keyColumns: string[];
  uniqueConstraints: UniqueConstraint[];
  updateRules: UpdateRule[];
}

interface UniqueConstraint {
  constraintName: string;
  columns: string[];
  errorMessage: string;
}

class BusinessKeyService {
  async generateBusinessKey(
    record: Record<string, any>,
    factType: FactType
  ): Promise<string>;

  async validateBusinessKey(
    businessKey: string,
    factType: FactType,
    existingKeys: string[]
  ): Promise<ValidationResult>;

  async resolveKeyConflicts(
    conflictingRecords: FactRecord[],
    factType: FactType
  ): Promise<ConflictResolution>;

  async getFactBusinessKeys(
    factType: FactType,
    dateRange?: { from: Date; to: Date }
  ): Promise<string[]>;
}
```

---

### **Task 4: Core Loading Orchestrator**

**Duration**: 5 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create dimension-first loading strategy
- [ ] Implement dependency management
- [ ] Add transaction coordination
- [ ] Support load order optimization
- [ ] Handle circular dependencies

#### **Loading Orchestration:**

```typescript
interface LoadOrchestratorOptions {
  priorityOrder: DimensionType[];
  maxConcurrency: number;
  enableTransactions: boolean;
  allowPartialFailure: boolean;
  optimizeLoadOrder: boolean;
  validateDependencies: boolean;
}

interface LoadPlan {
  dimensions: DimensionLoadPlan[];
  facts: FactLoadPlan[];
  dependencies: LoadDependency[];
  estimatedDuration: number;
  riskAssessment: RiskLevel;
}

interface DimensionLoadPlan {
  dimensionType: DimensionType;
  recordCount: number;
  estimatedChanges: number;
  dependencies: DimensionType[];
  loadStrategy: "full" | "incremental" | "upsert";
}

class LoadOrchestrator {
  async createLoadPlan(
    stagingData: Map<ExtractType, Record<string, any>[]>,
    loadRunId: string
  ): Promise<LoadPlan>;

  async executeLoadPlan(
    loadPlan: LoadPlan,
    options: LoadOrchestratorOptions
  ): Promise<LoadExecutionResult>;

  async validateLoadOrder(loadPlan: LoadPlan): Promise<ValidationResult>;

  async optimizeLoadOrder(loadPlan: LoadPlan): Promise<LoadPlan>;

  async handleLoadDependencies(
    dependencies: LoadDependency[]
  ): Promise<DependencyResolution>;
}

interface LoadExecutionResult {
  dimensionsLoaded: number;
  factsLoaded: number;
  totalRecords: number;
  errors: LoadError[];
  warnings: LoadWarning[];
  durationMs: number;
  transactionsUsed: number;
}
```

---

### **Task 5: Integrity Validation and Constraints**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement referential integrity checks
- [ ] Add data consistency validation
- [ ] Create constraint violation handling
- [ ] Support cross-table consistency checks
- [ ] Add data quality validation for core layer

#### **Integrity Management:**

```typescript
interface IntegrityCheck {
  checkType: "referential" | "business" | "data_quality" | "consistency";
  description: string;
  validator: (records: Record<string, any>[]) => Promise<IntegrityResult>;
  severity: "error" | "warning" | "info";
  enabled: boolean;
}

interface IntegrityResult {
  passed: boolean;
  violations: IntegrityViolation[];
  summary: string;
  canContinue: boolean;
}

interface IntegrityViolation {
  recordId?: string;
  fieldName?: string;
  violationType: string;
  message: string;
  suggestedFix?: string;
  severity: "error" | "warning" | "info";
}

class IntegrityValidator {
  async validateReferentialIntegrity(
    factRecords: FactRecord[],
    dimensionLookups: Map<DimensionType, DimensionLookup[]>
  ): Promise<IntegrityResult>;

  async validateBusinessRules(
    records: Record<string, any>[],
    factType: FactType
  ): Promise<IntegrityResult>;

  async validateDataConsistency(
    dimensionRecords: DimensionRecord[],
    factRecords: FactRecord[]
  ): Promise<IntegrityResult>;

  async validateCoreConstraints(
    records: Record<string, any>[],
    tableType: "dimension" | "fact",
    tableName: string
  ): Promise<IntegrityResult>;

  async getIntegrityReport(loadRunId: string): Promise<IntegrityReport>;
}

class ConstraintManager {
  async checkUniqueConstraints(
    records: Record<string, any>[],
    constraints: UniqueConstraint[]
  ): Promise<ConstraintResult>;

  async checkForeignKeyConstraints(
    records: Record<string, any>[],
    relationships: FKRelationship[]
  ): Promise<ConstraintResult>;

  async validateCheckConstraints(
    records: Record<string, any>[],
    checkConstraints: CheckConstraint[]
  ): Promise<ConstraintResult>;
}
```

---

### **Task 6: Core Audit and Lineage Tracking**

**Duration**: 3 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement core layer lineage tracking
- [ ] Add SCD2 change audit trails
- [ ] Create core operation logging
- [ ] Support traceability queries
- [ ] Add performance metrics collection

#### **Audit and Lineage:**

```typescript
interface CoreLineageRecord {
  loadRunId: string;
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  stagingRecordsProcessed: number;
  dimensionsCreated: number;
  dimensionsUpdated: number;
  factsInserted: number;
  factsUpdated: number;
  integrityViolations: number;
  processingStartTime: Date;
  processingEndTime: Date;
  durationMs: number;
}

interface SCD2AuditRecord {
  auditId: string;
  dimensionType: DimensionType;
  businessKey: Record<string, any>;
  changeType: "insert" | "update" | "expire";
  attributeChanges: AttributeChange[];
  previousRecordId?: string;
  newRecordId: string;
  changedAt: Date;
  changedByLoadRun: string;
  changeReason: string;
}

class CoreAuditService {
  async recordCoreLineage(lineageData: CoreLineageRecord): Promise<void>;

  async recordSCD2Change(auditRecord: SCD2AuditRecord): Promise<void>;

  async getLoadRunLineage(loadRunId: string): Promise<CoreLineageRecord>;

  async getDimensionChangeHistory(
    businessKey: Record<string, any>,
    dimensionType: DimensionType
  ): Promise<SCD2AuditRecord[]>;

  async generateTraceabilityReport(
    businessKey: Record<string, any>,
    factType: FactType
  ): Promise<TraceabilityReport>;
}

interface TraceabilityReport {
  originalS3File: string;
  stagingProcessing: StagingTrace[];
  coreLoading: CoreTrace[];
  currentDimensionVersions: DimensionTrace[];
  relatedFacts: FactTrace[];
  fullChain: TraceChain[];
}
```

---

### **Task 7: Performance Optimization and Monitoring**

**Duration**: 4 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement bulk loading optimizations
- [ ] Add dimension caching strategies
- [ ] Create performance monitoring
- [ ] Support parallel dimension loading
- [ ] Add load performance analytics

#### **Performance Management:**

```typescript
interface LoadPerformanceMetrics {
  dimensionsLoaded: number;
  factsLoaded: number;
  totalProcessingTimeMs: number;
  averageRecordsPerSecond: number;
  dimensionLoadTimes: Map<DimensionType, number>;
  factLoadTimes: Map<FactType, number>;
  constraintCheckTimeMs: number;
  memoryPeakUsageMB: number;
  databaseConnectionsUsed: number;
}

interface OptimizationStrategy {
  strategyType: "batching" | "caching" | "parallelism" | "indexing";
  target: "dimensions" | "facts" | "constraints";
  expectedImprovement: number;
  appliedAt: Date;
  parameters: Record<string, any>;
}

class PerformanceOptimizer {
  async optimizeDimensionLoading(
    dimensionType: DimensionType,
    recordCount: number
  ): Promise<OptimizationStrategy[]>;

  async optimizeFactLoading(
    factType: FactType,
    recordCount: number
  ): Promise<OptimizationStrategy[]>;

  async calculateOptimalBatchSizes(
    dimensionCounts: Map<DimensionType, number>
  ): Promise<Map<DimensionType, number>>;

  async monitorLoadPerformance(
    loadRunId: string
  ): Promise<LoadPerformanceMetrics>;

  async applyOptimizationStrategies(
    strategies: OptimizationStrategy[]
  ): Promise<OptimizationResult>;
}

class LoadMonitor {
  async trackLoadProgress(
    loadPlan: LoadPlan,
    currentProgress: LoadProgress
  ): Promise<void>;

  async estimateTimeRemaining(
    currentProgress: LoadProgress,
    historicalData: HistoricalMetrics[]
  ): Promise<TimeEstimate>;

  async getLoadBottlenecks(loadRunId: string): Promise<BottleneckAnalysis>;

  async generatePerformanceReport(
    loadRunId: string
  ): Promise<PerformanceReport>;
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

- [ ] SCD2 change detection with various scenarios
- [ ] Foreign key resolution with missing dimensions
- [ ] Fact upsert logic with duplicates
- [ ] Integrity validation rules
- [ ] Business key conflict resolution

### **Integration Tests**

- [ ] End-to-end dimension and fact loading
- [ ] SCD2 versioning with historical data
- [ ] Referential integrity across multiple facts
- [ ] Performance testing with large datasets
- [ ] Error recovery and partial loading

### **Test Data Requirements**

- [ ] Sample dimension data with various change scenarios
- [ ] Fact data with foreign key relationships
- [ ] Historical data for SCD2 testing
- [ ] Constraint violation test cases
- [ ] Performance benchmark datasets

---

## 🏗️ **Implementation Architecture**

### **Core Classes and Structure**

```typescript
// Main service orchestrator
export class CoreMergerService {
  private scd2Engine: SCD2Engine;
  private fkResolver: FKResolver;
  private factLoader: FactLoader;
  private orchestrator: LoadOrchestrator;
  private integrityValidator: IntegrityValidator;
  private auditService: CoreAuditService;
  private performanceOptimizer: PerformanceOptimizer;

  async loadToCore(
    stagingData: Map<ExtractType, Record<string, any>[]>,
    loadRunId: string,
    options?: CoreLoadOptions
  ): Promise<CoreLoadResult>;
}

// Factory for creating extract-specific loaders
export class CoreLoaderFactory {
  static getDimensionLoader(dimensionType: DimensionType): DimensionLoader;
  static getFactLoader(factType: FactType): FactLoader;
}
```

### **File Structure**

```
src/services/core-merger/
├── index.ts                          # Main exports
├── CoreMergerService.ts              # Main service class
├── SCD2Engine.ts                     # SCD2 management
├── FKResolver.ts                     # Foreign key resolution
├── FactLoader.ts                     # Fact table loading
├── LoadOrchestrator.ts               # Loading coordination
├── IntegrityValidator.ts             # Integrity checks
├── CoreAuditService.ts               # Audit and lineage
├── PerformanceOptimizer.ts           # Performance optimization
├── types/
│   ├── core.ts                       # Core loading types
│   ├── scd2.ts                       # SCD2 types
│   ├── integrity.ts                  # Integrity types
│   └── performance.ts                # Performance types
├── loaders/
│   ├── DimensionLoader.ts            # Base dimension loader
│   ├── PatientLoader.ts              # Patient dimension
│   ├── ProviderLoader.ts             # Provider dimension
│   ├── PracticeLoader.ts             # Practice dimension
│   ├── VaccineLoader.ts              # Vaccine dimension
│   ├── MedicineLoader.ts             # Medicine dimension
│   ├── FactLoader.ts                # Base fact loader
│   ├── AppointmentLoader.ts          # Appointment facts
│   ├── ImmunisationLoader.ts         # Immunisation facts
│   ├── InvoiceLoader.ts              # Invoice facts
│   └── InvoiceDetailLoader.ts       # Invoice detail facts
├── utils/
│   ├── SCD2Utils.ts                  # SCD2 utilities
│   ├── BusinessKeyUtils.ts          # Business key management
│   ├── ConstraintUtils.ts            # Constraint validation
│   └── PerformanceUtils.ts           # Performance utilities
└── __tests__/
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    └── fixtures/                     # Test data
```

---

## 📊 **Performance Requirements**

### **Scalability Targets**

- **Small Dimensions (<10K records)**: Load within 5 minutes
- **Medium Dimensions (10K-100K records)**: Load within 30 minutes
- **Large Dimensions (100K+ records)**: Load within 2 hours
- **Facts Processing**: Handle 500K+ fact records per hour
- **Concurrent Operations**: Support up to 3 parallel dimension loads

### **Optimization Strategies**

- Batch processing for bulk dimension updates
- Intelligent caching of dimension lookups
- Parallel fact loading where dependencies allow
- Index optimization for SCD2 queries
- Connection pooling for database operations

---

## ✅ **Success Criteria**

### **Functional Requirements**

- [ ] Successfully implement SCD2 for all dimension types
- [ ] Maintain referential integrity between dimensions and facts
- [ ] Handle business key conflicts appropriately
- [ ] Support both incremental and full refresh operations
- [ ] Provide complete audit trails for all changes

### **Non-Functional Requirements**

- [ ] Process 100K+ dimension records within 2 hours
- [ ] Handle concurrent dimension and fact loading
- [ ] Maintain <1% constraint violation rate
- [ ] Provide detailed performance metrics
- [ ] Support resumable core loading operations

### **Integration Requirements**

- [ ] Receive validated staging data from Staging Transformer
- [ ] Provide core data access for downstream consumers
- [ ] Supply loading metrics to Audit Manager
- [ ] Support monitoring by Health Monitor

---

## 🔄 **Integration Points**

### **Upstream Dependencies**

- **Staging Transformer**: Provides validated and transformed staging data
- **Configuration Service**: Supplies SCD2 rules and loading parameters

### **Downstream Dependencies**

- **Audit Manager**: Receives core loading results and SCD2 audit data
- **Health Monitor**: Receives core loading status and performance metrics
- **Data Consumers**: Access curated core dimension and fact data

---

## 📖 **Usage Examples**

### **Basic Core Loading**

```typescript
const coreMerger = new CoreMergerService();
const result = await coreMerger.loadToCore(stagingData, loadRunId, {
  enableSCD2: true,
  validateIntegrity: true,
});

console.log(
  `Loaded ${result.dimensionsLoaded} dimensions and ${result.factsLoaded} facts`
);
```

### **With Custom SCD2 Rules**

```typescript
const customSCD2Options = {
  changeThreshold: 0.8,
  significantFields: ["firstName", "familyName", "dob"],
  versioningStrategy: "always_version",
};

const result = await coreMerger.loadToCore(stagingData, loadRunId, {
  scd2Options: customSCD2Options,
});
```

### **Performance Monitoring**

```typescript
const loadPlan = await coreMerger.createLoadPlan(stagingData, loadRunId);
const optimizedPlan = await coreMerger.optimizeLoadOrder(loadPlan);

console.log(
  `Optimized plan reduces estimated time by ${optimizedPlan.estimatedImprovement}%`
);
```

---

## 🚀 **Implementation Timeline**

### **Week 3 - Days 1-3 (20 hours total)**

- **Day 1 (7 hours)**:
  - Task 1: SCD2 Dimension Management Engine (7 hours)

- **Day 2 (7 hours)**:
  - Task 2: Foreign Key Resolution Engine (6 hours)
  - Task 3: Fact Table Loading Engine (1 hour)

- **Day 3 (6 hours)**:
  - Task 3: Complete Fact Table Loading Engine (4 hours)
  - Task 4: Core Loading Orchestrator (2 hours)

### **Remaining Tasks (11 hours)**

- Task 4: Complete Core Loading Orchestrator (3 hours)
- Task 5: Integrity Validation and Constraints (4 hours)
- Task 6: Core Audit and Lineage Tracking (3 hours)
- Task 7: Performance Optimization and Monitoring (1 hour)

### **Optional Enhancements (8 hours)**

- Advanced SCD2 strategies (Type 4, hybrid approaches)
- Machine learning-based change significance detection
- Real-time core data consistency monitoring
- Advanced performance profiling and auto-tuning

---

## 📅 **Next Steps**

1. **Review and approve** this implementation plan
2. **Begin implementation** with Task 1: SCD2 Dimension Management Engine
3. **Move to Audit Manager** implementation plan after completion
4. **Update progress** in phase-1.md as tasks are completed

**Status**: ✅ **Approved** - Ready for Implementation
**Start Date**: [Insert start date]
**Estimated Completion**: [Insert completion date]
**Owner**: [Insert owner name]
