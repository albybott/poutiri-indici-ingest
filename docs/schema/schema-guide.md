# Database Schema Guide

## Overview

This document provides a comprehensive guide to the database schema architecture for the Poutiri Indici healthcare data ingestion system. The schema implements a **4-layer ETL architecture** designed for scalability, data quality, and enterprise-grade healthcare data processing.

## Architecture Overview

The schema follows a **layered architecture** that separates concerns and ensures data quality at each stage:

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

## Schema Layers

### 1. Raw Layer (`src/db/schema/raw/`)

**Purpose**: Direct capture of source data with minimal processing.

**Characteristics**:

- **Data Structure**: All columns stored as `text` for maximum compatibility
- **No Transformations**: Preserves original data exactly as received
- **Complete Lineage**: Full audit trail including S3 metadata and file information
- **Error Isolation**: Failures don't affect processed data

**Table Naming**: `raw.{extract_name}` (e.g., `raw.patients`, `raw.appointments`)

**Key Features**:

- Captures all source CSV columns as text
- Includes S3 metadata (bucket, key, version_id, file_hash)
- Maintains `date_extracted` from filename for batch tracking
- Stores `load_run_id` for traceability and idempotency

**Example Raw Table Structure**:

```sql
CREATE TABLE raw.patients (
  -- Source columns as text (preserves original format)
  patient_id text,
  nhi_number text,
  first_name text,
  family_name text NOT NULL,
  dob text,  -- Stored as text, converted later in staging
  -- ... all other columns

  -- Lineage columns (essential for auditability)
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

- **Typed Columns**: Proper PostgreSQL data types with constraints
- **Data Validation**: NOT NULL, CHECK, and UNIQUE constraints
- **Quality Gates**: Rejects invalid data to separate ETL tables
- **Transformation**: Basic data cleaning and standardization

**Table Naming**: `stg.{extract_name}` (e.g., `stg.patients`, `stg.appointments`)

**Key Features**:

- Converts text fields to appropriate types (dates, integers, decimals, booleans)
- Enforces data quality rules and business constraints
- Maps enum values to standardized codes
- Validates required fields and data formats
- Maintains all lineage information from raw layer

**Example Staging Table Structure**:

```sql
CREATE TABLE stg.patients (
  patient_id text NOT NULL,
  nhi_number text,
  first_name text,
  family_name text NOT NULL,     -- NOT NULL constraint added
  dob date,                      -- Converted from text to date
  is_active boolean NOT NULL DEFAULT true,  -- Typed with default
  age integer,                   -- Converted from text to integer
  -- ... other properly typed columns

  -- Data quality constraints
  UNIQUE (patient_id, practice_id, per_org_id),  -- Natural key constraint

  -- Lineage columns (preserved from raw)
  s3_version_id text NOT NULL,
  load_run_id uuid NOT NULL,
  load_ts timestamp NOT NULL DEFAULT NOW()
);
```

### 3. Core Layer (`src/db/schema/core/`)

**Purpose**: Business-ready dimensional model optimized for analytics.

**Characteristics**:

- **Dimensional Design**: Star schema with dimensions and facts
- **SCD2 History**: Slowly Changing Dimensions for historical tracking
- **Business Keys**: Surrogate keys with meaningful business identifiers
- **Analytics Ready**: Optimized for reporting, dashboards, and ML

**Table Naming**:

- **Dimensions**: `core.{entity}` (e.g., `core.patient`, `core.provider`)
- **Facts**: `core.fact_{event}` (e.g., `core.fact_appointment`, `core.fact_immunisation`)

**Key Features**:

- **Dimensions**: Patient, Provider, Practice, Medicine, Vaccine
- **Facts**: Appointments, Immunizations, Invoices, Diagnoses, Measurements
- **SCD2**: Track historical changes with validity periods
- **Referential Integrity**: Foreign keys between facts and dimensions
- **Privacy Protection**: Minimal PII exposure in curated layer

**Example Dimension (SCD2)**:

```sql
CREATE TABLE core.patient (
  patient_key serial PRIMARY KEY,        -- Surrogate key
  patient_id text NOT NULL,
  practice_id text NOT NULL,
  per_org_id text NOT NULL,

  -- SCD2 fields for historical tracking
  effective_from timestamp NOT NULL,
  effective_to timestamp,
  is_current boolean NOT NULL DEFAULT true,

  -- Selected business attributes (non-sensitive)
  family_name text NOT NULL,
  dob date,
  age integer,
  is_alive boolean NOT NULL DEFAULT true,
  ethnicity text,
  -- ... other curated fields

  -- Lineage (essential for auditability)
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
  patient_key integer REFERENCES core.patient(patient_key),
  provider_key integer REFERENCES core.provider(provider_key),
  practice_key integer REFERENCES core.practice(practice_key),

  -- Measures and attributes
  appointment_type text,
  appointment_status text,
  schedule_date timestamp,
  duration integer,  -- minutes
  consult_time integer,  -- minutes

  -- Status flags
  arrived boolean NOT NULL DEFAULT false,
  appointment_completed boolean NOT NULL DEFAULT false,
  is_confidential boolean NOT NULL DEFAULT false,

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

- **Audit Trail**: Complete history of all data processing operations
- **Health Monitoring**: System status and performance tracking
- **Configuration**: Runtime parameters and feature flags
- **Data Quality**: DQ results and rejection tracking

**Table Naming**: `etl.{functionality}` (e.g., `etl.load_runs`, `etl.dq_results`)

**Key Tables**:

**Load Runs** - Tracks ETL execution:

```sql
CREATE TABLE etl.load_runs (
  load_run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamp NOT NULL DEFAULT NOW(),
  finished_at timestamp,
  status text NOT NULL,  -- 'running', 'completed', 'failed', 'cancelled'
  triggered_by text NOT NULL,  -- 'scheduled', 'manual', 'backfill'
  total_files_processed integer DEFAULT 0,
  total_rows_ingested integer DEFAULT 0,
  total_rows_rejected integer DEFAULT 0,
  notes text  -- For operational notes
);
```

**Load Run Files** - Tracks individual file processing:

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
  error_message text,

  -- Idempotency constraint (prevents reprocessing)
  UNIQUE (s3_version_id, file_hash)
);
```

**Data Quality Results** - Tracks validation metrics:

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

## Naming Conventions

### Table Naming

- **Raw Layer**: `raw.{extract_name}` (e.g., `raw.patients`, `raw.appointments`)
- **Staging Layer**: `stg.{extract_name}` (e.g., `stg.patients`, `stg.invoices`)
- **Core Dimensions**: `core.{entity}` (e.g., `core.patient`, `core.provider`)
- **Core Facts**: `core.fact_{event}` (e.g., `core.fact_appointment`)
- **ETL Tables**: `etl.{functionality}` (e.g., `etl.load_runs`, `etl.health`)

### Column Naming

- **Snake Case**: All column names use snake_case (e.g., `patient_id`, `first_name`)
- **Consistent with Source**: Column names match source CSV headers where possible
- **Descriptive**: Clear, self-documenting names
- **Standard Suffixes**: `_id`, `_date`, `_at`, `_by` for common patterns

### Index Naming

- **Descriptive**: `idx_{table}_{columns}` (e.g., `idx_patients_nhi_number`)
- **Unique Indexes**: `uq_{table}_{columns}` (e.g., `uq_patients_natural_key`)
- **Foreign Keys**: `fk_{child}_{parent}` (e.g., `fk_appointment_patient`)

## Key Design Decisions

### 1. 4-Layer Architecture

**Why**: Separates concerns and ensures data quality progression.

**Benefits**:

- **Raw**: Preserves source fidelity for auditability
- **Staging**: Enforces quality gates and type safety
- **Core**: Provides business-ready analytics data
- **ETL**: Enables monitoring and operational control

### 2. SCD2 for Dimensions

**Why**: Healthcare data changes over time (patients move, providers change practices).

**Implementation**:

- `effective_from` / `effective_to` for validity periods
- `is_current` flag for easy querying of current state
- Unique constraints ensure one current record per business key
- Historical queries possible with date ranges

### 3. Comprehensive Lineage

**Why**: Healthcare requires complete auditability for compliance.

**Implementation**:

- Every record traceable to source file and load
- S3 versioning and file hashing for exact reproducibility
- Load run tracking for operational visibility
- Preservation of lineage across all layers

### 4. Multi-tenant Design

**Why**: Support multiple organizations and practices in one system.

**Implementation**:

- `per_org_id` and `practice_id` in all tables
- Row-level security possible at application level
- Natural keys include tenant identifiers
- Separate health monitoring per tenant

### 5. Data Type Strategy

**Why**: Balance flexibility with performance and validation.

**Raw Layer**: All as `text` for maximum compatibility
**Staging Layer**: Proper types with constraints for validation
**Core Layer**: Optimized types for analytics performance
**ETL Layer**: Mixed types based on operational needs

## Data Types and Constraints

### Common Data Types

- **Identifiers**: `text` (flexible for various ID formats)
- **Names**: `text` (supports international characters)
- **Dates**: `date` or `timestamp with time zone`
- **Flags**: `boolean` with appropriate defaults
- **Numbers**: `integer`, `decimal(precision, scale)`
- **Audit Fields**: `uuid`, `timestamp with time zone`

### Constraint Strategy

- **Raw Layer**: Minimal constraints (mostly NOT NULL for lineage)
- **Staging Layer**: Business rules and natural key constraints
- **Core Layer**: Referential integrity and SCD2 constraints
- **ETL Layer**: Operational constraints for monitoring

### Null Handling

- **Raw Layer**: Allow NULLs to preserve source data
- **Staging Layer**: NOT NULL for required business fields
- **Core Layer**: Minimal NULLs in curated data
- **ETL Layer**: NULLs as appropriate for operational data

## Relationships and Integrity

### Foreign Key Strategy

- **Facts → Dimensions**: Facts reference dimension surrogate keys
- **Deferred Constraints**: Allow loading flexibility
- **Cascading**: Generally avoided (use application logic)
- **Naming**: Consistent `fk_{child_table}_{parent_table}`

### Referential Integrity

- **Staging Layer**: Natural key constraints only
- **Core Layer**: Full referential integrity with foreign keys
- **ETL Layer**: References to operational entities
- **Cross-layer**: Lineage references maintained across layers

### Business Key Constraints

- **Natural Keys**: Enforced in staging and core layers
- **Composite Keys**: Include `practice_id` and `per_org_id` for multi-tenancy
- **Upsert Logic**: Based on natural keys for idempotency
- **SCD2 Constraints**: Ensure one current record per business key

## SCD2 Implementation Details

### Dimension Structure

```sql
-- Standard SCD2 pattern for all dimensions
CREATE TABLE core.{dimension} (
  {surrogate_key} serial PRIMARY KEY,
  -- Business keys
  {business_key} text NOT NULL,
  practice_id text NOT NULL,
  per_org_id text NOT NULL,

  -- SCD2 fields
  effective_from timestamp NOT NULL,
  effective_to timestamp,
  is_current boolean NOT NULL DEFAULT true,

  -- Business attributes (selected, curated fields)
  -- ... dimension-specific columns

  -- Lineage
  s3_version_id text NOT NULL,
  load_run_id uuid NOT NULL,

  -- SCD2 constraint
  UNIQUE ({business_key}, practice_id, per_org_id, is_current)
);
```

### Query Patterns

```sql
-- Current state (default)
SELECT * FROM core.patient WHERE is_current = true;

-- Historical state at specific date
SELECT * FROM core.patient
WHERE effective_from <= '2025-01-01'
  AND (effective_to IS NULL OR effective_to > '2025-01-01');

-- Changes over time for a specific entity
SELECT * FROM core.patient
WHERE patient_id = '123' AND practice_id = '456'
ORDER BY effective_from;
```

### Update Process

1. **Insert New Record**: New `effective_from`, `is_current = true`
2. **Expire Old Record**: Set `effective_to`, `is_current = false`
3. **Preserve History**: All historical records remain intact
4. **Audit Trail**: Lineage updated for both records

## Indexing Strategy

### Raw Layer Indexes

- **Discovery**: `idx_{table}_date_extracted_extract_type`
- **Natural Keys**: `idx_{table}_{business_key}` for common lookups
- **Lineage**: `idx_{table}_load_run_id`, `idx_{table}_s3_version_id`

### Staging Layer Indexes

- **Natural Keys**: `uq_{table}_natural_key` (unique constraints)
- **Business Keys**: `idx_{table}_{business_key}` for lookups
- **Lineage**: Preserved from raw layer

### Core Layer Indexes

- **Surrogate Keys**: Primary keys (auto-indexed)
- **Business Keys**: `uq_{table}_business_key_current` for SCD2
- **Foreign Keys**: Foreign key constraints (auto-indexed)
- **Common Queries**: Analytics-specific indexes for reporting

### ETL Layer Indexes

- **Operational**: Status, timestamps for monitoring
- **Troubleshooting**: Load run and file tracking
- **Performance**: Optimized for operational queries

## Extension Guidelines

### Adding New Extracts

1. **Create Raw Table**: `src/db/schema/raw/{extract}.ts`
2. **Create Staging Table**: `src/db/schema/stg/{extract}.ts`
3. **Update Index**: Add exports to `src/db/schema/index.ts`
4. **Add Schema Collections**: Update raw/staging schema collections
5. **Consider Core Integration**: Add to dimensions/facts if business-relevant

### Adding New Dimensions

1. **Design SCD2 Structure**: Include `effective_from`, `effective_to`, `is_current`
2. **Define Business Keys**: Identify natural key for the entity
3. **Select Attributes**: Choose curated fields for analytics
4. **Add Relationships**: Update fact tables with foreign keys
5. **Create Indexes**: Add appropriate indexes for query patterns

### Adding New Facts

1. **Design Fact Structure**: Include measures and dimension foreign keys
2. **Define Grain**: Determine the level of detail (e.g., appointment-level)
3. **Add Relationships**: Foreign keys to relevant dimensions
4. **Create Indexes**: Optimize for common analytical queries
5. **Update ETL**: Modify loading logic for new fact table

### Modifying Existing Tables

1. **Raw Layer**: Avoid changes (preserve source fidelity)
2. **Staging Layer**: Add validation rules and type conversions
3. **Core Layer**: Extend with new attributes, avoid structure changes
4. **ETL Layer**: Add monitoring and configuration as needed

## Examples and Best Practices

### Querying Current vs Historical Data

```sql
-- Current patients (default)
SELECT p.*, pr.full_name as provider_name
FROM core.patient p
JOIN core.provider pr ON p.provider_key = pr.provider_key
WHERE p.is_current = true;

-- Patients as of specific date
SELECT p.*, pr.full_name as provider_name
FROM core.patient p
JOIN core.provider pr ON p.provider_key = pr.provider_key
WHERE p.effective_from <= '2024-06-01'
  AND (p.effective_to IS NULL OR p.effective_to > '2024-06-01');
```

### Joining Facts with Dimensions

```sql
-- Appointment analytics with patient and provider context
SELECT
  a.appointment_date,
  a.appointment_type,
  p.family_name,
  p.age_group,
  pr.full_name as provider_name,
  pr.provider_code,
  pr.user_role
FROM core.fact_appointment a
JOIN core.patient p ON a.patient_key = p.patient_key
JOIN core.provider pr ON a.provider_key = pr.provider_key
WHERE a.appointment_date >= '2024-01-01'
  AND a.appointment_date < '2025-01-01';
```

### Troubleshooting with Lineage

```sql
-- Trace a specific appointment back to source
SELECT
  a.*,
  lrf.s3_bucket,
  lrf.s3_key,
  lrf.date_extracted,
  lr.started_at as load_started,
  lr.status as load_status
FROM core.fact_appointment a
JOIN etl.load_run_files lrf ON a.load_run_id = lrf.load_run_id
  AND a.s3_version_id = lrf.s3_version_id
JOIN etl.load_runs lr ON lrf.load_run_id = lr.load_run_id
WHERE a.appointment_id = 'specific_appointment_id';
```

## Performance Considerations

### Partitioning Strategy

- **Time-based**: Partition large fact tables by month/year
- **Tenant-based**: Consider partitioning by `per_org_id` for large deployments
- **Size thresholds**: Partition when tables exceed 10M+ rows

### Index Optimization

- **Composite Indexes**: Include multiple columns for common query patterns
- **Partial Indexes**: Index only active/current records where appropriate
- **Covering Indexes**: Include all columns needed for common queries

### Query Performance

- **Dimension Lookups**: Use surrogate keys for joins
- **Fact Filtering**: Apply dimension filters before fact joins
- **Aggregation**: Pre-aggregate common metrics in summary tables

## Security and Compliance

### Multi-tenancy

- All tables include `per_org_id` and `practice_id`
- Row-level security can be implemented at application level
- Separate audit trails per tenant

### Data Privacy

- Raw layer preserves all source data
- Core layer minimizes sensitive information
- Audit trails track all data access
- Data retention policies configurable per layer

### Auditability

- Complete lineage from source to analytics
- Historical tracking via SCD2
- Load run tracking for operational visibility
- Immutable audit trails for compliance

---

_This schema implements enterprise-grade healthcare data warehousing principles with robust auditability, scalability, and maintainability. The layered architecture ensures data quality progression while preserving complete traceability for compliance requirements._
