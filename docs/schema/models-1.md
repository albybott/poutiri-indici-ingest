Yes—here’s a concise Markdown outline of all required tables by schema to use as a guide while preparing detailed DDL and Drizzle models, aligned to the Indici extracts, raw→staging→core flow, and audit/idempotency requirements described earlier [1].

### raw schema

- raw.patients_raw — all source columns as text, plus lineage (s3_bucket, s3_key, s3_version_id, file_hash, date_extracted, extract_type, per_org_id, practice_id, load_run_id, load_ts, loaded_datetime) [1].
- raw.appointments_raw — same pattern: all fields as text + lineage; enforce uniform field counts at load time (via loader) [1].
- raw.immunisations_raw — text columns + lineage; mirrors source file column order exactly [1].
- raw.invoices_raw — text columns + lineage; retain row granularity as delivered (transactions) [1].
- raw.invoice_detail_raw — text columns + lineage; line items detail per invoice [1].
- raw.providers_raw — text columns + lineage [1].
- raw.practice_info_raw — text columns + lineage [1].
- raw.measurements_raw — text columns + lineage [1].
- raw.diagnoses_raw — text columns + lineage [1].
- raw.recalls_raw — text columns + lineage [1].
- raw.inbox_raw — text columns + lineage [1].
- raw.inbox_detail_raw — text columns + lineage [1].
- raw.medicine_raw — text columns + lineage [1].
- raw.next_of_kin_raw — text columns + lineage [1].
- raw.vaccine_raw — text columns + lineage [1].

### stg schema

- stg.patients_stg — typed columns, required field checks, unique candidate/natural keys, lineage retained; normalize booleans and timestamps [1].
- stg.appointments_stg — typed, enum-mapped status/status_group, unique (appointment_id, practice_id, per_org_id), lineage retained [1].
- stg.immunisations_stg — typed, status mapping, vaccine code references staged as text, lineage retained [1].
- stg.invoices_stg — typed amounts and dates, unique (invoice_transaction_id, practice_id, per_org_id), lineage retained [1].
- stg.invoice_detail_stg — typed line items, unique (invoice_detail_id, practice_id, per_org_id), lineage retained [1].
- stg.providers_stg — typed provider identifiers, lineage retained [1].
- stg.practice_info_stg — typed practice attributes, lineage retained [1].
- stg.measurements_stg — typed numeric/text result fields, units, lineage retained [1].
- stg.diagnoses_stg — typed code systems and dates, lineage retained [1].
- stg.recalls_stg — typed recall attributes, lineage retained [1].
- stg.inbox_stg — typed inbox headers, lineage retained [1].
- stg.inbox_detail_stg — typed inbox details, lineage retained [1].
- stg.medicine_stg — typed medicine codes/names, lineage retained [1].
- stg.next_of_kin_stg — typed NOK contacts, lineage retained [1].
- stg.vaccine_stg — typed vaccine codes/names, lineage retained [1].
- stg.map_appointment_status — lookup: source_value → core_value for AppointmentStatus [1].
- stg.map_status_group — lookup: source_value → core_value for StatusGroup [1].
- stg.map_immunisation_status — lookup: source_value → core_value for ImmunisationStatus [1].

### core schema — dimensions

- core.dim_patient — surrogate key, business keys (patient_id, practice_id, per_org_id), hashed/salted NHI, SCD2 attributes with effective_from/effective_to/is_current, minimal PII exposure [1].
- core.dim_provider — surrogate key, business keys (provider_id, practice_id, per_org_id), identifiers and role attributes, SCD2 where specified [1].
- core.dim_practice — surrogate key, business keys (practice_id, per_org_id), practice attributes, SCD1/2 as needed [1].
- core.dim_medicine — surrogate key, natural/business keys as per source, code sets (e.g., SCTID/PharmaCode), SCD1 [1].
- core.dim_vaccine — surrogate key, vaccine_code/name/group, NIR flags, SCD1 [1].

### core schema — facts

- core.fact_appointment — one row per appointment; FKs to dim_patient, dim_provider, dim_practice; timestamps, status fields, duration; unique (appointment_id, practice_id, per_org_id); include lineage (s3_version_id, file_hash, date_extracted, load_run_id) [1].
- core.fact_immunisation — one row per immunisation; FKs to patient/provider/practice/vaccine; dose/route/site/batch; unique (appointment_immunisation_id, practice_id, per_org_id); lineage columns [1].
- core.fact_invoice — one row per invoice transaction; FK to provider/practice; amounts and dates; unique (invoice_transaction_id, practice_id, per_org_id); lineage columns [1].
- core.fact_invoice_detail — line item detail; FK to fact_invoice; unique (invoice_detail_id, practice_id, per_org_id); lineage columns [1].
- core.fact_diagnosis — diagnosis events; FKs to patient/provider/practice; code systems and dates; unique (diagnosis_id, practice_id, per_org_id); lineage columns [1].
- core.fact_measurement — vitals/screening results; FK to patient/practice; value_num/value_text and units; dedupe on composite natural key from source; lineage columns [1].

### etl schema — audits, DQ, rejects, config

- etl.load_runs — one per execution; started_at/finished_at/status/triggered_by/notes; primary correlation id for logs and metrics [1].
- etl.load_run_files — one per input file; s3_bucket/s3_key/s3_version_id/file_hash/date_extracted/extract_type; rows_read/ingested/rejected; started_at/finished_at/status; unique (s3_version_id, file_hash) for idempotency [1].
- etl.dq_results — per-run metrics (per extract or per file): metric_name, metric_value, pass, threshold, s3_key, created_at; linked to load_run_id [1].
- etl.rejects\_<extract> — one table per extract; row_num, row_text, field_errors JSON, contract_breach flag, lineage columns, created_at; linked to load_run_id [1].
- etl.health — last_successful_run_at per extract, recent metrics to power health endpoint and alerts; populated at run end [1].
- etl.config — feature flags per extract (full/delta handling, thresholds), source schema versions, and operational toggles used at runtime [1].

### indexes and constraints to plan

- Raw: indexes on (date_extracted, extract_type) and optionally (per_org_id, practice_id); minimal constraints beyond lineage NOT NULLs [1].
- Staging: NOT NULL on required fields; CHECK on domain mappings; UNIQUE on natural keys per extract; lineage retained for triage; deferred FKs only if needed within staging [1].
- Core: UNIQUE on composite business keys for facts; SCD2 uniqueness on (business_key, effective_to IS NULL) for dims; FKs from facts to dims; lineage columns present in facts (and optionally in SCD rows) [1].

### idempotency and lineage fields (common)

- s3_bucket, s3_key, s3_version_id, file_hash, date_extracted, extract_type, per_org_id, practice_id, load_run_id, load_ts; raw also preserves loaded_datetime from the feed itself; core facts must retain s3_version_id/file_hash/date_extracted/load_run_id to support exact reproducibility [1].
