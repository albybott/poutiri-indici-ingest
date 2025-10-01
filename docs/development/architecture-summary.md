# ETL Architecture Summary

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          S3 Bucket (Indici Extracts)                    │
│                     Patient_2024-01-15.csv, etc.                        │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         S3 Discovery Service                            │
│  • Scans bucket for new files                                           │
│  • Parses filenames                                                     │
│  • Checks idempotency                                                   │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Raw Loader Service                              │
│  • Streams CSV from S3                                                  │
│  • Loads to raw.* tables (all text columns)                             │
│  • Tracks lineage via load_run_file_id FK                               │
│  • Uses: BatchLoader, StreamBatchProcessor, DatabasePool                │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            raw.* Tables                                 │
│  • All columns as TEXT                                                  │
│  • Full data preservation                                               │
│  • FK to etl.load_run_files                                             │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Staging Transformer Service                          │
│  • Reads from raw.* via SQL queries                                     │
│  • Transforms text → typed columns                                      │
│  • Validates business rules                                             │
│  • Rejects invalid rows                                                 │
│  • Loads to stg.* with upsert                                           │
│  • Uses: TransformationEngine, ValidationEngine, BatchLoader            │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            stg.* Tables                                 │
│  • Typed columns (date, boolean, decimal)                               │
│  • Data quality constraints                                             │
│  • Embedded lineage columns                                             │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Core Merger Service (Future)                      │
│  • Reads from stg.* via SQL                                             │
│  • Implements SCD2 logic                                                │
│  • Maintains dimension surrogate keys                                   │
│  • Loads facts with FK relationships                                    │
└─────────────────────────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            core.* Tables                                │
│  • Star schema (dimensions + facts)                                     │
│  • SCD2 history tracking                                                │
│  • Analytics-ready                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🏗️ Service Architecture

### Layer 1: Shared Infrastructure

```
src/services/shared/
├── database-pool.ts          ← Generic PostgreSQL connection pool
├── batch-loader.ts           ← Generic batch insertion (handles pg limits)
├── stream-batch-processor.ts ← Generic stream processing with backpressure
├── types.ts                  ← Shared type definitions
└── index.ts                  ← Barrel exports
```

**Used by:** All ETL services (raw, staging, core)

**Key Features:**
- Transaction management
- Automatic batch size calculation
- Backpressure handling
- Error resilience

---

### Layer 2: Raw Loader Service

```
src/services/raw-loader/
├── raw-loader-service.ts     ← Orchestrator
├── raw-table-loader.ts       ← Database operations (uses shared)
├── csv-parser.ts             ← CSV parsing
├── idempotency-service.ts    ← Prevent duplicate loads
├── lineage-service.ts        ← Track data provenance
├── error-handler.ts          ← Error management
├── load-monitor.ts           ← Progress tracking
└── extract-handler-factory.ts ← Handler per extract type
```

**Purpose:** S3 CSV → `raw.*` tables

**Key Features:**
- Streams from S3
- All columns as TEXT
- Full data preservation
- Idempotency checks
- Foreign key to `etl.load_run_files`

---

### Layer 3: Staging Transformer Service ✨ NEW

```
src/services/staging-transformer/
├── staging-transformer-service.ts   ← Orchestrator
├── staging-table-loader.ts          ← Database operations (uses shared)
├── transformation-engine.ts         ← Type conversion logic
├── validation-engine.ts             ← Business rule validation
├── rejection-handler.ts             ← Invalid row management
├── raw-query-builder.ts             ← SQL query generation
├── staging-transformer-container.ts ← Dependency injection
└── types/
    ├── config.ts                    ← Configuration types
    └── transformer.ts               ← Core types
```

**Purpose:** `raw.*` tables → `stg.*` tables

**Key Features:**
- SQL-to-SQL transformation
- Type conversion (text → typed)
- Validation rules engine
- Rejection handling
- Upsert logic for idempotency
- Embedded lineage columns

---

### Layer 4: Core Merger Service (Future)

```
src/services/core-merger/
├── core-merger-service.ts
├── scd2-handler.ts              ← Slowly Changing Dimensions
├── dimension-loader.ts          ← Load dimensions first
├── fact-loader.ts               ← Load facts with FK lookups
└── surrogate-key-manager.ts    ← Manage surrogate keys
```

**Purpose:** `stg.*` tables → `core.*` tables

**Key Features:**
- SCD2 implementation
- Surrogate key generation
- Dimension lookups
- Star schema optimization

---

## 🔄 Data Transformation Comparison

| Aspect              | Raw Loader           | Staging Transformer        | Core Merger (Future)   |
| ------------------- | -------------------- | -------------------------- | ---------------------- |
| **Source**          | S3 CSV files         | `raw.*` SQL tables         | `stg.*` SQL tables     |
| **Target**          | `raw.*` tables       | `stg.*` tables             | `core.*` tables        |
| **Data Type**       | All TEXT             | Typed (date, bool, etc.)   | Business entities      |
| **Transformation**  | CSV → TEXT           | TEXT → Typed + Validation  | Typed → SCD2 + Star    |
| **Lineage**         | FK to load_run_files | Embedded columns           | Embedded columns       |
| **Idempotency**     | File hash + version  | Natural key upsert         | SCD2 effective dates   |
| **Error Handling**  | Skip file            | Reject rows to etl table   | Reject to etl table    |
| **Validation**      | Schema only          | Business rules             | Referential integrity  |
| **Performance**     | Streaming            | Batch SQL                  | Batch SQL with lookups |

---

## 📦 Shared Component Usage

```
┌───────────────────────────────────────────────────────────┐
│              Application Services                         │
├───────────────┬───────────────┬───────────────────────────┤
│  Raw Loader   │   Staging     │      Core Merger          │
│               │  Transformer  │                           │
└───────┬───────┴───────┬───────┴──────────┬────────────────┘
        │               │                  │
        └───────────────┴──────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
┌───────▼────────┐  ┌─────────────────────▼──────┐
│ DatabasePool   │  │    BatchLoader              │
│                │  │                             │
│ • Connections  │  │ • Batch insert              │
│ • Transactions │  │ • Upsert builder            │
│ • Query exec   │  │ • Param optimization        │
└────────────────┘  └─────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────┐
│         StreamBatchProcessor                   │
│                                                │
│ • Backpressure management                      │
│ • Queue-based processing                       │
│ • Memory monitoring                            │
└────────────────────────────────────────────────┘
```

---

## 🎯 Implementation Status

| Component                 | Status | Lines of Code | Files |
| ------------------------- | ------ | ------------- | ----- |
| **Shared Infrastructure** | ✅     | ~600          | 4     |
| **Raw Loader**            | ✅     | ~2,000        | 15+   |
| **Staging Transformer**   | ✅     | ~1,500        | 10    |
| **Core Merger**           | 📋     | TBD           | TBD   |

---

## 🚀 Next Steps

1. **Create Extract Handlers** for staging transformer
   - Patients, Appointments, Invoices, etc.
   - Define transformations and validation rules

2. **Test Staging Transformer**
   - Unit tests for components
   - Integration tests with database
   - End-to-end tests

3. **Build Core Merger Service**
   - SCD2 implementation
   - Dimension and fact loading
   - Surrogate key management

4. **Orchestration Layer**
   - Coordinate all services
   - Handle dependencies
   - Schedule runs

---

## 📚 Key Design Decisions

### 1. **Shared Infrastructure First**
✅ Extract common patterns (DatabasePool, BatchLoader, StreamBatchProcessor)  
✅ Enables code reuse across all ETL layers  
✅ Easier to maintain and test

### 2. **Layer-Specific Services**
✅ Each layer has unique responsibilities  
✅ Raw: CSV → TEXT (preservation)  
✅ Staging: TEXT → Typed (validation)  
✅ Core: Typed → Star Schema (analytics)

### 3. **SQL-to-SQL for Staging & Core**
✅ Leverage PostgreSQL's power  
✅ Batch processing with cursors  
✅ Transaction safety  
✅ No intermediate files

### 4. **Rejection over Failure**
✅ Invalid rows don't stop pipeline  
✅ Store rejections for analysis  
✅ Track detailed failure reasons  
✅ Enable data quality monitoring

### 5. **Embedded Lineage in Staging/Core**
✅ Full traceability to source  
✅ No joins needed for lineage  
✅ Easier querying and auditing

---

## 🎓 Lessons Learned

1. **Postgres Parameter Limits Matter**
   - BatchLoader automatically calculates optimal batch size
   - Wide tables need smaller batches

2. **Backpressure is Critical**
   - StreamBatchProcessor prevents memory issues
   - Queue-based processing with pause/resume

3. **Validation vs Transformation**
   - Separate concerns for clarity
   - TransformationEngine: type conversion
   - ValidationEngine: business rules

4. **Upsert for Idempotency**
   - Natural keys enable reruns
   - ON CONFLICT DO UPDATE pattern
   - No duplicate data

---

## 📖 Documentation

- **Architecture**: [ETL Guide](../etl/etl-guide.md)
- **Schema Design**: [Schema Guide](../schema/schema-guide.md)
- **Raw Loader**: [Raw Loader README](../../src/services/raw-loader/README.md)
- **Staging Transformer**: [Staging Transformer README](../../src/services/staging-transformer/README.md)
- **Shared Services**: [Shared README](../../src/services/shared/README.md)

