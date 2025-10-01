## Core Merger Service

The **Core Merger Service** is the final stage of the ETL pipeline, responsible for loading validated staging data into the core dimensional model (`core.*` tables) using Slowly Changing Dimension Type 2 (SCD2) logic for dimensions and proper foreign key resolution for facts.

## 🎯 Purpose

This service is responsible for the third layer of the ETL pipeline:

```
S3 CSV Files → [Raw Loader] → raw.* tables → [Staging Transformer] → stg.* tables → [Core Merger] → core.* tables
                                                                                           ↑ YOU ARE HERE
```

## 🔄 What It Does

1. **Loads Dimensions** with SCD2 change tracking (patient, provider, practice)
2. **Detects Changes** using hybrid strategy (significant vs non-significant attributes)
3. **Versions History** by creating new dimension records for significant changes
4. **Resolves Foreign Keys** by looking up dimension surrogate keys for facts
5. **Loads Facts** with proper relationships to dimensions (appointments, immunisations, etc.)
6. **Ensures Integrity** through validation and referential integrity checks
7. **Tracks Lineage** for complete end-to-end traceability

## 📦 Components

### Core Services

1. **`SCD2Engine`** - Detects changes and manages dimension versioning
2. **`DimensionLoader`** - Orchestrates dimension loading with SCD2
3. **`ForeignKeyResolver`** - Lookups dimensions and caches surrogate keys
4. **`FactLoader`** - Loads facts with FK resolution
5. **`CoreMergerService`** - Main orchestrator with idempotency

### Dimension Handlers

- **`PatientDimensionHandler`** - Patient dimension with demographics
- **`ProviderDimensionHandler`** - Provider dimension with credentials
- **`PracticeDimensionHandler`** - Practice dimension with organization info

### Fact Handlers

- **`AppointmentFactHandler`** - Appointment facts with patient/provider/practice FKs

### Supporting Infrastructure

- Uses **shared components**: `DatabasePool`, `BatchLoader`
- Integrates with **Audit Service** for lineage tracking
- Leverages **Load Monitor** for progress tracking

## 🚀 Usage

### Basic Example

```typescript
import { CoreMergerContainer } from "./services/core-merger";

// Create service
const coreMerger = CoreMergerContainer.create({
  dimension: {
    batchSize: 500,
    enableSCD2: true,
    scd2Strategy: "hash",
  },
  fact: {
    batchSize: 1000,
    enableFKValidation: true,
  },
});

// Merge staging data to core
const result = await coreMerger.mergeToCore({
  loadRunId: "abc-123-def-456",
  extractTypes: ["Patient", "Appointment"],
});

console.log(`Dimensions created: ${result.dimensionsCreated}`);
console.log(`Dimensions updated: ${result.dimensionsUpdated}`);
console.log(`Facts inserted: ${result.factsInserted}`);
```

### Load Specific Dimension

```typescript
import { DimensionLoader } from "./services/core-merger";
import { PatientDimensionHandler } from "./services/core-merger";
import { db } from "./db/client";

// Create dimension loader
const handler = new PatientDimensionHandler();
const loader = new DimensionLoader(db, handler, true); // true = use hash strategy

// Load patient dimension
const result = await loader.loadDimension({
  loadRunId: "abc-123",
  extractType: "Patient",
  batchSize: 500,
  enableSCD2: true,
});

console.log(`Patients processed: ${result.totalRowsRead}`);
console.log(`New patients: ${result.recordsCreated}`);
console.log(`Updated patients (new versions): ${result.recordsUpdated}`);
console.log(`Unchanged patients: ${result.recordsSkipped}`);
```

### Foreign Key Resolution with Caching

```typescript
import { ForeignKeyResolver } from "./services/core-merger";
import { DimensionType } from "./services/core-merger";
import { db } from "./db/client";

// Create FK resolver with caching
const fkResolver = new ForeignKeyResolver(
  db,
  true, // enable cache
  1000000, // max 1M entries
  300000 // 5 min TTL
);

// Preload dimensions into cache for fast lookups
await fkResolver.preloadCache(); // All dimensions
// OR
await fkResolver.preloadCache(DimensionType.PATIENT); // Specific dimension

// Resolve foreign key
const resolved = await fkResolver.resolveForeignKey(
  DimensionType.PATIENT,
  {
    patientId: "P001",
    practiceId: "PR001",
    perOrgId: "ORG001",
  }
);

if (resolved.found) {
  console.log(`Patient surrogate key: ${resolved.surrogateKey}`);
} else {
  console.log("Patient not found in dimension");
}

// Get cache stats
const stats = fkResolver.getCacheStats();
console.log(`Cache size: ${stats.size} / ${stats.maxSize}`);
```

## 🔧 Configuration

### Default Configuration

```typescript
const config: CoreMergerConfig = {
  dimension: {
    batchSize: 500,
    enableSCD2: true,
    scd2Strategy: "hash", // or "field"
    trackAllAttributes: false, // Hybrid: only significant attrs
    maxConcurrentLoads: 1, // Sequential for safety
    timeoutMs: 300000, // 5 minutes
  },
  fact: {
    batchSize: 1000,
    enableFKValidation: true,
    missingDimensionStrategy: MissingDimensionStrategy.SKIP,
    maxConcurrentLoads: 2,
    timeoutMs: 300000,
    allowPartialInserts: true,
  },
  cache: {
    enableDimensionCache: true,
    cacheRefreshInterval: 60000, // 1 minute
    maxCacheSize: 1000000,
    cacheTtlMs: 300000, // 5 minutes
  },
  errorHandling: {
    continueOnError: true,
    maxErrors: 1000,
    maxErrorRate: 0.05, // 5%
    maxRetries: 3,
    retryDelayMs: 1000,
    enableDetailedLogging: true,
  },
  monitoring: {
    enableMetrics: true,
    enableProgressTracking: true,
    progressUpdateInterval: 5000,
    logLevel: "info",
  },
};
```

## 📊 SCD2 Strategy

### Hybrid Approach (Recommended)

The Core Merger uses a **hybrid SCD2 strategy**:

| Attribute Type | Example Fields | Strategy |
|----------------|----------------|----------|
| **Significant** (Demographics) | NHI, Name, DOB, Gender | Create new version |
| **Non-Significant** (Transactional) | Email, Phone, Balance, Address | Update in place |

### Example: Patient Dimension

```typescript
// Significant changes (trigger new version):
- nhiNumber
- firstName, middleName, familyName
- dob
- gender
- isAlive, deathDate

// Non-significant changes (update in place):
- email
- cellNumber
- balance
- address fields
```

### Change Detection

```
1. Read staging record
2. Get current dimension version from core
3. Compare attributes using SCD2Engine
4. If significant change → Expire old + Insert new version
5. If non-significant change → Update current version in place
6. If no change → Skip
```

### Hash-based Change Detection (Default)

```typescript
// Fast comparison using hash of significant attributes
Old Hash: a3f5c8e9... (based on name, DOB, gender)
New Hash: b7d2f1a4... (name changed)
Result: Significant change → Create new version
```

## 🔑 Foreign Key Resolution

### FK Strategy

```typescript
// Required FKs (patient for appointment)
if (!patientKey) {
  skip appointment; // Log warning
}

// Optional FKs (provider might be external)
if (!providerKey) {
  providerKey = NULL; // Allow NULL
}

// Reference data (practice should always exist)
if (!practiceKey) {
  throw error; // Data quality issue
}
```

### FK Resolution with Cache

```
1. Check cache first (fast)
2. If not cached → Query database
3. Cache result for future lookups
4. Return surrogate key or NULL
```

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  CoreMergerService                         │
│                  (Main Orchestrator)                       │
└─────┬──────────────────┬─────────────────┬────────────────┘
      │                  │                 │
      ▼                  ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  Dimension  │  │    Fact      │  │   Foreign   │
│   Loader    │  │   Loader     │  │     Key     │
│             │  │              │  │  Resolver   │
│• SCD2 logic │  │• FK lookup   │  │• Cache dims │
│• Versioning │  │• Upsert      │  │• Fast lookup│
└─────────────┘  └──────────────┘  └─────────────┘
      │                  │                 │
      ▼                  ▼                 ▼
┌─────────────────────────────────────────────────┐
│              SCD2Engine                         │
│                                                 │
│ • Hash-based change detection                   │
│ • Attribute comparison                          │
│ • Significance scoring                          │
└─────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│         Dimension Handlers                      │
│                                                 │
│ • PatientDimensionHandler                       │
│ • ProviderDimensionHandler                      │
│ • PracticeDimensionHandler                      │
└─────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│             Core Tables (Drizzle)               │
│                                                 │
│ • core.patient (SCD2)                           │
│ • core.provider (SCD2)                          │
│ • core.practice (SCD2)                          │
│ • core.fact_appointment                         │
│ • core.fact_immunisation                        │
└─────────────────────────────────────────────────┘
```

## 📝 Best Practices

### 1. Preload Dimension Cache Before Fact Loading

```typescript
// Good: Preload cache for fast FK lookups
await fkResolver.preloadCache();
await factLoader.loadFacts(options); // Fast FK resolution

// Bad: No cache preload
await factLoader.loadFacts(options); // Slow database lookups
```

### 2. Use Appropriate SCD2 Configuration

```typescript
// For patient: Track demographics, not contact info
const patientSCD2Config = {
  trackedFields: ["nhiNumber", "firstName", "familyName", "dob"],
  changeThreshold: 0.5,
};

// For practice: Track legal/organizational changes
const practiceSCD2Config = {
  trackedFields: ["practiceName", "legalStatus", "pho"],
  changeThreshold: 0.5,
};
```

### 3. Handle Missing Foreign Keys Appropriately

```typescript
// Required FK - skip fact if missing
{
  dimensionType: DimensionType.PATIENT,
  required: true,
  missingStrategy: "skip", // Don't insert appointment without patient
}

// Optional FK - allow NULL
{
  dimensionType: DimensionType.PROVIDER,
  required: false,
  missingStrategy: "null", // External provider OK
}
```

### 4. Monitor SCD2 Version Counts

```typescript
const result = await dimensionLoader.loadDimension(options);

// Check version creation rate
const versionRate = result.recordsUpdated / result.totalRowsRead;
if (versionRate > 0.3) {
  console.warn(`High version creation rate: ${(versionRate * 100).toFixed(1)}%`);
  // Investigate: Are tracked fields too sensitive?
}
```

### 5. Batch Size Tuning

```typescript
// For dimensions (wider tables, SCD2 overhead)
const dimensionConfig = {
  batchSize: 500, // Smaller batches
};

// For facts (narrower tables, simple inserts)
const factConfig = {
  batchSize: 2000, // Larger batches
};
```

## 🔍 SCD2 Examples

### Example 1: New Patient

```sql
-- Staging data
stg.patients: {patient_id: "P001", first_name: "John", dob: "1990-01-01"}

-- Core result (INSERT)
core.patient:
patient_key | patient_id | first_name | effective_from | effective_to | is_current
1          | P001       | John       | 2024-06-15    | NULL         | true
```

### Example 2: Significant Change (Name)

```sql
-- Old version
patient_key | patient_id | first_name | effective_from | effective_to | is_current
1          | P001       | John       | 2024-01-01    | NULL         | true

-- New staging data: first_name changed from "John" to "Jonathan"
stg.patients: {patient_id: "P001", first_name: "Jonathan"}

-- Core result (EXPIRE old + INSERT new)
patient_key | patient_id | first_name | effective_from | effective_to   | is_current
1          | P001       | John       | 2024-01-01    | 2024-06-15    | false     ← Expired
2          | P001       | Jonathan   | 2024-06-15    | NULL          | true      ← New version
```

### Example 3: Non-Significant Change (Email)

```sql
-- Current version
patient_key | patient_id | first_name | email         | effective_from | is_current
1          | P001       | John       | john@old.com  | 2024-01-01    | true

-- New staging data: email changed
stg.patients: {patient_id: "P001", email: "john@new.com"}

-- Core result (UPDATE in place)
patient_key | patient_id | first_name | email         | effective_from | is_current
1          | P001       | John       | john@new.com  | 2024-01-01    | true      ← Updated
                                        ↑ Email updated without new version
```

## 🛡️ Idempotency & Safety

### Load Run Tracking

```sql
-- Track merge runs to prevent duplicate processing
CREATE TABLE etl.core_merge_runs (
  merge_run_id UUID PRIMARY KEY,
  load_run_id UUID NOT NULL,
  extract_type TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  dimensions_created INTEGER,
  facts_inserted INTEGER
);

-- Unique constraint prevents duplicate processing
CREATE UNIQUE INDEX idx_core_merge_load_run 
ON etl.core_merge_runs(load_run_id, extract_type) 
WHERE status = 'completed';
```

### Idempotency Check

```typescript
// Service automatically checks if load_run already processed
const result = await coreMerger.mergeToCore({
  loadRunId: "abc-123",
});

// If already processed, returns cached result
if (result.status === "already_processed") {
  console.log("Load run already merged - skipping");
}
```

## 📈 Monitoring & Progress

### Load Progress Tracking

```typescript
const progress = await coreMerger.getLoadProgress(mergeRunId);

console.log(`Phase: ${progress.phase}`); // 'dimensions' | 'facts'
console.log(`Progress: ${progress.percentComplete}%`);
console.log(`ETA: ${progress.estimatedTimeRemaining}ms`);
```

### Performance Metrics

```typescript
const result = await coreMerger.mergeToCore(options);

console.log(`Duration: ${result.durationMs}ms`);
console.log(`Dimensions: ${result.dimensionsCreated + result.dimensionsUpdated}`);
console.log(`Facts: ${result.factsInserted}`);
console.log(`Throughput: ${result.rowsPerSecond} rows/sec`);
```

## 🧪 Testing

Example test structure:

```typescript
import { DimensionLoader, PatientDimensionHandler } from "./core-merger";

describe("DimensionLoader", () => {
  it("should create new dimension version for significant change", async () => {
    const handler = new PatientDimensionHandler();
    const loader = new DimensionLoader(db, handler);

    // Load initial version
    await loader.loadDimension({
      loadRunId: "run-1",
      extractType: "Patient",
    });

    // Load with name change
    await loader.loadDimension({
      loadRunId: "run-2",
      extractType: "Patient",
    });

    // Should have 2 versions
    const versions = await db.query(`
      SELECT * FROM core.patient 
      WHERE patient_id = 'P001'
      ORDER BY effective_from
    `);

    expect(versions.length).toBe(2);
    expect(versions[0].is_current).toBe(false); // Old expired
    expect(versions[1].is_current).toBe(true); // New current
  });

  it("should update in place for non-significant change", async () => {
    // Test email change doesn't create new version
  });
});
```

## 📚 Related Documentation

- [Core Merger Implementation Plan](../../../docs/development/D-phase-1-core-merger.md)
- [Staging Transformer](../staging-transformer/README.md) - Previous stage
- [Raw Loader](../raw-loader/README.md) - First stage
- [ETL Architecture](../../../docs/etl/etl-guide.md)
- [Schema Guide](../../../docs/schema/schema-guide.md) - Core table definitions
- [Shared Services](../shared/README.md)

## 🚧 Implementation Status

### ✅ Completed (Phase 1)

- Type definitions and configuration
- SCD2Engine with hybrid change detection
- DimensionLoader with handlers for Patient/Provider/Practice
- ForeignKeyResolver with caching
- Appointment fact handler configuration
- Comprehensive utilities (hash, business keys, SCD2)

### 🔄 In Progress

- FactLoader implementation
- CoreMergerService orchestrator
- CoreAuditService for lineage tracking
- LoadMonitor for progress tracking
- IntegrityValidator for referential integrity

### 📋 Planned (Phase 2)

- Additional dimension handlers (Vaccine, Medicine)
- Additional fact handlers (Immunisation, Invoice, Diagnosis)
- Advanced SCD2 strategies (Type 4, hybrid)
- Performance optimization and auto-tuning
- Comprehensive test coverage

---

**Status**: ✅ **Phase 1 Foundation Complete** - Core SCD2 and dimension loading operational
**Next**: Complete fact loading and orchestration components

