# ETL Service Guide

## Overview

This ETL (Extract, Transform, Load) service implements industry best practices with a robust 4-layer architecture designed to handle healthcare data ingestion from Indici extracts. The service processes CSV files from AWS S3, applies data quality checks, and maintains comprehensive audit trails for compliance and traceability.

## Architecture Overview

The service follows a **4-layer architecture** that separates concerns and ensures data quality:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Raw        │───▶│    Staging      │───▶│      Core       │───▶│   Analytics     │
│                 │    │                 │    │                 │    │                 │
│ • Direct CSV    │    │ • Type casting  │    │ • Dimensions    │    │ • Reports       │
│ • No transforms │    │ • Validation    │    │ • Facts         │    │ • Dashboards    │
│ • Lineage       │    │ • Constraints   │    │ • SCD2 history  │    │ • ML models     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                  ┌─────────────────┐        │
         │                  │      ETL        │────────┘
         └─────────────────▶│                 │
                            │ • Audit trails  │
                            │ • Health checks │
                            │ • Monitoring    │
                            └─────────────────┘
```

## Layer Details

### 1. Raw Layer (`src/db/schema/raw/`)

**Purpose**: Direct capture of source data with minimal processing.

**Characteristics**:

- **Data Structure**: All columns as `text` type
- **No Transformations**: Preserves original data exactly as received
- **Full Lineage**: Complete audit trail including S3 metadata
- **Error Isolation**: Failures don't affect processed data

**Key Features**:

- Captures all source CSV columns as text
- Includes S3 metadata (bucket, key, version_id, file_hash)
- Maintains `date_extracted` from filename
- Stores `load_run_id` for traceability

**Example Raw Table**:

```sql
CREATE TABLE raw.patients_raw (
  -- Source columns as text
  patient_id text,
  nhi_number text,
  first_name text,
  -- ... all other columns as text

  -- Lineage columns
  s3_bucket text NOT NULL,
  s3_key text NOT NULL,
  s3_version_id text NOT NULL,
  file_hash text NOT NULL,
  date_extracted text NOT NULL,
  extract_type text NOT NULL,
  load_run_id uuid NOT NULL,
  load_ts timestamp NOT NULL DEFAULT NOW()
);
```

### 2. Staging Layer (`src/db/schema/stg/`)

**Purpose**: Data validation, type conversion, and quality enforcement.

**Characteristics**:

- **Typed Columns**: Proper PostgreSQL data types
- **Data Validation**: NOT NULL, CHECK, and UNIQUE constraints
- **Quality Gates**: Rejects invalid data to separate tables
- **Transformation**: Basic data cleaning and standardization

**Key Features**:

- Converts text fields to appropriate types (dates, integers, decimals)
- Enforces data quality rules
- Maps enum values to standardized codes
- Validates required fields and data formats

**Example Staging Table**:

```sql
CREATE TABLE stg.patients_stg (
  patient_id text NOT NULL,
  nhi_number text,
  first_name text,
  family_name text NOT NULL,  -- NOT NULL constraint
  dob date,                   -- Converted from text
  is_active boolean NOT NULL DEFAULT true,  -- Typed with default
  -- ... other typed columns

  -- Natural key constraint
  UNIQUE (patient_id, practice_id, per_org_id),

  -- Lineage columns (preserved from raw)
  s3_version_id text NOT NULL,
  load_run_id uuid NOT NULL
);
```

### 3. Core Layer (`src/db/schema/core/`)

**Purpose**: Business-ready dimensional model for analytics.

**Characteristics**:

- **Dimensional Design**: Star schema with dimensions and facts
- **SCD2 History**: Slowly Changing Dimensions for historical tracking
- **Business Keys**: Surrogate keys with meaningful business identifiers
- **Analytics Ready**: Optimized for reporting and analysis

**Key Features**:

- **Dimensions**: Patient, Provider, Practice, Medicine, Vaccine
- **Facts**: Appointments, Immunizations, Invoices, Measurements
- **SCD2**: Track historical changes with validity periods
- **Referential Integrity**: Foreign keys between facts and dimensions

**Example Dimension (SCD2)**:

```sql
CREATE TABLE core.dim_patient (
  patient_key serial PRIMARY KEY,        -- Surrogate key
  patient_id text NOT NULL,
  practice_id text NOT NULL,
  per_org_id text NOT NULL,

  -- SCD2 fields
  effective_from timestamp NOT NULL,
  effective_to timestamp,
  is_current boolean NOT NULL DEFAULT true,

  -- Business attributes (selected, non-PII fields)
  family_name text NOT NULL,
  dob date,
  age integer,
  is_alive boolean NOT NULL DEFAULT true,

  -- Lineage
  s3_version_id text NOT NULL,
  load_run_id uuid NOT NULL,

  -- SCD2 constraint: only one current record per business key
  UNIQUE (patient_id, practice_id, per_org_id, is_current)
);
```

**Example Fact Table**:

```sql
CREATE TABLE core.fact_appointment (
  appointment_key serial PRIMARY KEY,
  appointment_id text NOT NULL,
  practice_id text NOT NULL,
  per_org_id text NOT NULL,

  -- Foreign keys to dimensions
  patient_key integer REFERENCES dim_patient(patient_key),
  provider_key integer REFERENCES dim_provider(provider_key),
  practice_key integer REFERENCES dim_practice(practice_key),

  -- Measures and attributes
  appointment_type text,
  appointment_status text,
  schedule_date timestamp,
  duration integer,

  -- Lineage
  s3_version_id text NOT NULL,
  load_run_id uuid NOT NULL,

  -- Business key constraint
  UNIQUE (appointment_id, practice_id, per_org_id)
);
```

### 4. ETL Layer (`src/db/schema/etl/`)

**Purpose**: Audit trails, monitoring, configuration, and operational metadata.

**Characteristics**:

- **Audit Trail**: Complete history of all data loads
- **Health Monitoring**: System status and performance metrics
- **Configuration**: Runtime parameters and thresholds
- **Data Quality**: DQ results and rejection tracking

**Key Tables**:

**Load Runs**:

```sql
CREATE TABLE etl.load_runs (
  load_run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamp NOT NULL DEFAULT NOW(),
  finished_at timestamp,
  status text NOT NULL,  -- 'running', 'completed', 'failed'
  triggered_by text NOT NULL,  -- 'scheduled', 'manual', 'backfill'
  total_files_processed integer DEFAULT 0,
  total_rows_ingested integer DEFAULT 0,
  total_rows_rejected integer DEFAULT 0
);
```

**Load Run Files**:

```sql
CREATE TABLE etl.load_run_files (
  load_run_file_id serial PRIMARY KEY,
  load_run_id uuid NOT NULL,
  s3_bucket text NOT NULL,
  s3_key text NOT NULL,
  s3_version_id text NOT NULL,
  file_hash text NOT NULL,
  extract_type text NOT NULL,
  rows_read integer DEFAULT 0,
  rows_ingested integer DEFAULT 0,
  rows_rejected integer DEFAULT 0,
  status text NOT NULL,  -- 'pending', 'processing', 'completed', 'failed'

  -- Idempotency constraint
  UNIQUE (s3_version_id, file_hash)
);
```

**Data Quality Results**:

```sql
CREATE TABLE etl.dq_results (
  dq_result_id serial PRIMARY KEY,
  load_run_id uuid NOT NULL,
  metric_name text NOT NULL,
  metric_value decimal,
  pass boolean NOT NULL,
  threshold decimal,
  extract_type text,
  per_org_id text,
  practice_id text
);
```

## Data Flow

### 1. File Discovery

- Scans S3 bucket for new/updated files
- Parses filename for `date_extracted` batch identifier
- Groups files by batch for coordinated processing
- Checks idempotency to prevent reprocessing

### 2. Raw Layer Loading

- Streams CSV data from S3
- Performs COPY into raw tables
- Validates field counts and basic structure
- Captures full lineage metadata
- Supports both full and delta loads

### 3. Staging Transformation

- Applies type conversions (text → date, integer, decimal)
- Enforces data validation rules
- Maps enum values to standardized codes
- Rejects invalid records to separate tables
- Maintains referential integrity

### 4. Core Loading

- **Dimensions First**: Load/update dimension tables with SCD2 logic
- **Facts Second**: Load fact tables with foreign key relationships
- **Upsert Logic**: Update existing records, insert new ones
- **Historical Tracking**: Maintain history in SCD2 dimensions

### 5. Audit Finalization

- Updates load run status and metrics
- Records data quality results
- Updates health monitoring tables
- Generates notifications for failures

## Best Practices Implemented

### Data Quality

- **Layered Validation**: Validate at each stage with appropriate rigor
- **Rejection Tracking**: Invalid data stored with reasons for analysis
- **Quality Gates**: Configurable thresholds for acceptable error rates
- **DQ Metrics**: Comprehensive monitoring of data quality trends

### Traceability

- **Complete Lineage**: Every record traceable to source file and load
- **Audit Trail**: Full history of all transformations and loads
- **Immutability**: Raw data never modified, full reproduction capability
- **Version Control**: S3 versioning and file hashing for exact reproducibility

### Scalability

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Batch Processing**: Configurable batch sizes for memory efficiency
- **Parallel Processing**: Independent extracts can run in parallel
- **Incremental Loading**: Efficient delta processing for large datasets

### Reliability

- **Idempotency**: Safe to rerun failed loads without duplication
- **Error Isolation**: Single file failures don't affect other processing
- **Rollback Support**: Lineage enables precise rollback if needed
- **Health Monitoring**: Proactive monitoring with alerting capabilities

### Security & Compliance

- **Multi-tenancy**: Per-org and practice-level isolation
- **Access Control**: Role-based permissions for different user types
- **Data Retention**: Configurable retention policies by layer
- **Privacy Protection**: Minimal PII exposure in core layer

## Usage

### Basic Data Loading

```typescript
import { loadExtract } from "./services/etl-service";

// Load a single extract
await loadExtract("patients", {
  s3Bucket: "poutiri-datacraft-data",
  dateExtracted: "202508190850",
});

// Load all extracts for a batch
await loadExtractsForBatch({
  dateExtracted: "202508190850",
  perOrgId: "685146",
  practiceId: "545",
});
```

### Health Monitoring

```typescript
import { getHealthStatus } from "./services/health-service";

// Check system health
const health = await getHealthStatus();
console.log(`Last successful run: ${health.lastSuccessfulRunAt}`);
console.log(`Reject rate: ${health.rejectRate}%`);
console.log(`Processing time: ${health.avgProcessingTimeMinutes} minutes`);
```

### Configuration

```typescript
// ETL Configuration
const config = {
  maxRejectRate: 0.05, // 5% max rejection rate
  maxProcessingTimeMinutes: 60, // 1 hour timeout
  concurrencyLimit: 3, // Max concurrent extracts
  batchSize: 10000, // Batch size for processing
  rawDataRetentionDays: 90, // Raw data retention
  auditDataRetentionDays: 365, // Audit retention
};
```

## Monitoring & Troubleshooting

### Health Dashboard

- **Last Successful Run**: Per extract and overall
- **Reject Rates**: Trend analysis and alerting
- **Processing Times**: Performance monitoring
- **Data Volume**: Rows processed per extract

### Common Issues

**High Rejection Rates**:

- Check DQ results for specific failure patterns
- Review source data format consistency
- Verify enum mappings are up-to-date
- Consider adjusting validation thresholds

**Performance Issues**:

- Monitor batch sizes and adjust if needed
- Check for concurrent load conflicts
- Review index usage and consider partitioning
- Scale up resources for peak loads

**Data Quality Problems**:

- Examine rejected records for patterns
- Review source system data quality
- Update validation rules based on findings
- Implement upstream data quality improvements

## Extension Points

### Adding New Extracts

1. Create raw schema in `src/db/schema/raw/`
2. Create staging schema in `src/db/schema/stg/`
3. Add to schema collections in `index.ts`
4. Update extract types enum
5. Implement transformation logic

### Custom Validations

1. Add DQ rules to `etl.dq_thresholds`
2. Implement validation logic in staging transforms
3. Configure alerting for validation failures

### Performance Optimization

1. Add indexes for common query patterns
2. Implement table partitioning for large facts
3. Configure parallel processing parameters
4. Set up read replicas for reporting workloads

---

_This ETL service demonstrates enterprise-grade data engineering practices with robust error handling, comprehensive auditing, and scalable architecture suitable for healthcare data processing._
