### Scope and goals

- Implement a nightly ingestion that discovers the newest Indici extract files in the AWS S3 Sydney bucket, loads them into Postgres across raw, staging, and core zones, and enforces data contracts with comprehensive audits and rejects for traceability and reliability .
- Exclude downstream dashboards and marts; those will consume curated core tables once the ingestion is reliable and repeatable under idempotent semantics .

### Architecture overview

- Sources: Headerless CSV files per extract type (Patients, Appointments, Immunisations, Invoices, InvoiceDetail, Providers, PracticeInfo, Measurements, Diagnoses, Recalls, Inbox, InboxDetail, Medicine, NextOfKin, Vaccine), delivered to S3 with versioning and a strict naming convention containing DateFrom, DateTo, and DateExtracted batch marker .
- Zones: Postgres schemas raw (lossless text landing), stg (typed and validated), core (conformed dimensions and deduped facts), and etl (audit, config, health, rejects, DQ) to separate concerns and enforce contracts .
- Idempotency: File‑level uniqueness by (s3_version_id, file_hash) and batch grouping by DateExtracted; row‑level dedupe/upsert via natural keys per extract during core merges to prevent duplication across re‑runs and deltas .

## Data sources

- Location: AWS S3 bucket “poutiri-datacraft-data” in Sydney region with versioning enabled.
- Delivery: For each extract type, two files exist initially—a full load and a delta since last extract; ongoing weekly schedule (Sunday midday) with potential frequency increase.
- Naming convention: <PerOrgID><PracticeID><ExtractType><DateFrom><DateTo><DateExtracted>; DateExtracted uniquely identifies a batch set. Example: 685146545Appointments2025081805442025081905442508190850.
- File format: Headerless CSV; field and row separators per spec; additional columns PerOrgID and LoadedDateTime included; column names must be applied from documentation.

### Data contracts

- Maintain machine‑readable specs per extract that define column order, names, types, required fields, domain enums, natural keys, and SCD behavior for relevant dimensions; derive raw/staging/core migrations and validation rules directly from these specs to minimize drift from source documentation .
- Use the source’s PerOrgID and PracticeID in all zones as part of keys and lineage to support multi‑org separation and core conformance while preserving sovereignty and access boundaries in Sydney .

### Database schemas and tables

- raw: One table per extract with all source fields as text, plus lineage columns: s3_bucket, s3_key, s3_version_id, file_hash, date_extracted, extract_type, per_org_id, practice_id, load_run_id, load_ts, and the LoadedDateTime the feed includes; minimal constraints and COPY‑friendly structure to ensure fast landing and lossless capture .
- stg: One table per extract with typed columns and constraints (NOT NULL on requireds, CHECK on domains, UNIQUE on natural keys), enum mapping tables for values like AppointmentStatus and StatusGroup, and timestamp parsing to timestamptz; rejects stored separately with row text and reasons; lineage columns are retained for traceability .
- core: Conformed dimensions (patient with hashed/salted NHI, provider, practice, vaccine, medicine) and facts (appointments, immunisations, invoices, invoice_detail, diagnoses, measurements) with SCD on selected dimension attributes and unique constraints on composite business keys for fact upserts; soft or deferred FKs as appropriate for load order .
- etl: load*runs, load_run_files, dq_results, rejects*<extract>, health, and config tables to power idempotency, audits, DQ thresholds, run summaries, and feature flags for full vs delta logic; enforce uniqueness on (s3_version_id, file_hash) in load_run_files for process‑once semantics .

### Key constraints and indexes

- raw: CHECK or loader assertion for uniform field counts per row; indexes on (date_extracted, extract_type) and optionally (per_org_id, practice_id) to aid discovery/backfill; lineage columns always populated for auditability .
- stg: UNIQUE on natural keys per extract (e.g., appointment_id + practice_id + per_org_id), CHECK on domain enums via mapping tables, and NOT NULL on required fields to catch contract breaches early; lineage retained to simplify triage and rollback .
- core: UNIQUE on composite natural keys for facts, surrogate PKs for dims, SCD2 uniqueness on (business_key, effective_to IS NULL), and FKs from facts to dims to ensure referential consistency of curated data used by downstream consumers .

### Idempotency strategy

- File level: On discovery, compute file_hash and read s3_version_id, then upsert a pending record in etl.load_run_files with unique (s3_version_id, file_hash); if already present and status processed, skip, else allow controlled reprocess by load_run_id override for recoverability without duplication .
- Row level: In core merges, upsert by natural keys per extract so re‑ingesting a delta or re‑running a batch updates the same business rows rather than duplicating; use date_extracted only for lineage, not as a business key, to separate physical batch identity from logical records .

### End‑to‑end flow

- Discover: Enumerate S3 keys per extract, group by DateExtracted from filenames, select newest per type for the nightly run, and support backfill by date range or prefix while preserving process order when dedupe rules require it; capture s3 metadata for every file considered .
- Load raw: Stream each CSV from S3 and COPY into raw.<extract>\_raw, verifying uniform field counts and recording rows_read; attach lineage columns including PerOrgID and LoadedDateTime from the file and date_extracted parsed from filename; failures stop processing for that file and mark it failed in load_run_files .
- Transform to staging: Apply column names by position, cast to types, parse tz‑aware timestamps, map enums, normalize empty strings to NULL, and enforce required fields; send non‑conforming rows to etl.rejects\_<extract> with reasons and log metrics to etl.dq_results; update rows_ingested/rows_rejected in load_run_files .
- Merge to core: Upsert dimensions first with SCD as specified, then upsert facts using composite natural keys to dedupe; attach s3_version_id, file_hash, date_extracted, and load_run_id lineage in core rows for full traceability and reproducibility of the curated layer .
- Finalize audits: Update load_run_files to processed or failed with start/end times and counts; update load_runs with completion status and a summary suitable for notifications and the health endpoint; store anomalies vs prior baselines in dq_results or a summary JSON for alerting .

### Scheduling and operations

- Schedule: Nightly cron configured for the provider’s preferred window with room to finish before morning, and a manual trigger supporting backfills by DateExtracted range while maintaining dedupe and order guarantees; the S3 delivery is weekly (Sunday midday) initially but must scale to higher frequency without redesign .
- Reliability: Retries with exponential backoff for transient S3 or DB errors, partial failure isolation at file granularity, and idempotent re‑runs keyed by s3_version_id + file_hash to ensure repeatability without duplicates; health endpoint exposes last successful run per extract for observability .
- Notifications: On completion and failure, send a summary per extract with ingested, rejected, and anomaly indicators against baselines; include load_run_id and DateExtracted for quick triage links to audits and rejects .

### Security and compliance

- IAM: S3 read‑only role scoped to bucket/prefix in ap‑southeast‑2; least‑privilege database user with DML on raw/stg/core/etl only, no superuser; environment variables carry S3 credentials and DB URL with secrets stored in secure manager; all processing and storage remain in the Sydney region to meet sovereignty requirements .
- Access control: etl_writer role for ingestion service, admin role for migrations, and app_reader for downstream read‑only access to core; restrict raw/staging PII access to engineering only and ensure hashed/salted NHI in patient dimension to minimize exposure in curated and later marts .

### Performance and scaling

- COPY for bulk load of raw and batched upserts for staging/core to keep per‑file times in minutes and nightly completion before business hours; consider partitioning high‑volume facts by month and clustering on common FK filters to improve both merges and reads .
- Parallelism: Process extracts in parallel where referentially safe (e.g., appointments independent of invoices) while respecting dimension dependencies; throttle concurrency via configuration to balance throughput and DB resource limits .

### Deliverables and milestones

- Migrations: SQL/Drizzle migrations for raw, stg, core, and etl schemas, including enums/domain tables, SCD structures, and all indexes/constraints; initial set covers Patients, Appointments, Immunisations, Invoices, and InvoiceDetail with additional extracts following the same pattern .
- Contracts: JSON/YAML specs for each extract defining columns, types, required flags, domain maps, natural keys, and SCD attributes; codegen tasks that produce migrations and validation rules from these specs to reduce manual drift risk .
- Service: Containerized TypeScript/Node service that performs S3 discovery, idempotency checks, raw COPY loads, staging transforms with DQ, core merges with SCD upserts, and audit persistence; configuration via environment variables for bucket/prefix, DB URL, concurrency, feature flags, and thresholds .
- Runbook: Operational documentation explaining scheduling, backfills, overrides, DQ thresholds, alert responses, and how to trace a record via s3_version_id/file_hash/load_run_id; include examples for common failure modes and recovery steps without data duplication .

### DQ and reject management

- Required fields: Enforce presence and correct typing for declared required columns, rejecting violators with explicit reasons and counts used to trigger run failure if thresholds exceeded; each reject row stores source row text and field_errors JSON for reproducibility and debugging .
- Domain values: Maintain mapping tables for enumerations and reject unmapped or out‑of‑domain values; log mapping coverage metrics and trend anomalies to detect upstream changes early; prefer domain tables over Postgres enums for maintainability and reporting .

### Backfill strategy

- Selection: Backfill by DateExtracted range or filename prefix to replay historical batches; preserve processing order where natural key dedupe assumes temporal progression (especially for SCD dims) to avoid churn in SCD windows; all reprocessing remains idempotent due to natural key upserts and file uniqueness .
- Controls: Feature flags per extract enable/disable full vs delta logic during backfill windows and allow per‑extract thresholds to be relaxed when historical data quality differs from current feeds; record all overrides in load_runs notes for audit .

### Example keys by extract

- Appointments: Natural key (appointment_id, practice_id, per_org_id), enums AppointmentStatus and StatusGroup mapped before core; timestamps parsed to timestamptz; duration coerced to integer minutes .
- Invoices: Natural key (invoice_transaction_id, practice_id, per_org_id) with invoice_detail deduped on (invoice_detail_id, practice_id, per_org_id); numeric amounts typed and validated; date dimensions derived for common finance analytics later .
- Immunisations: Natural key (appointment_immunisation_id, practice_id, per_org_id), vaccine dimension linked by code/name with stable natural key; status domain mapped to core vocabulary before fact insert .

### Testing and CI

- Contract tests: Validate that all raw loads preserve field counts and row counts, staging enforces required fields and domains, and core merges produce the expected deduped counts given crafted full and delta samples; include a seed test using the documented separators and naming convention .
- Idempotency tests: Run the same batch twice and assert no duplicates across facts/dims and stable audit counts; simulate deltas that update a subset of records to confirm upsert behavior on natural keys and SCD change application in dimensions .

### Observability

- Structured logs: Correlate every operation with load_run_id and s3_key, and log per‑extract metrics for ingested, rejected, and durations; expose a health endpoint reporting last successful run and anomalies since baseline for alerting systems to consume .
- Audit coverage: Ensure every row in core can be traced back to an s3_version_id, file_hash, date_extracted, and load_run_id so investigations can reconstruct inputs and processing context exactly as executed in Sydney region infrastructure .
