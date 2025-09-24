import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  serial,
  check,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../../utils/create-table";

// Load runs - one per execution
export const loadRuns = createTable("etl.load_runs", {
  loadRunId: uuid("load_run_id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(), // 'running', 'completed', 'failed', 'cancelled'
  triggeredBy: text("triggered_by").notNull(), // 'scheduled', 'manual', 'backfill'
  notes: text("notes"),
  totalFilesProcessed: integer("total_files_processed").default(0),
  totalRowsIngested: integer("total_rows_ingested").default(0),
  totalRowsRejected: integer("total_rows_rejected").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Load run files - one per input file
export const loadRunFiles = createTable(
  "etl.load_run_files",
  {
    loadRunFileId: serial("load_run_file_id").primaryKey(),
    loadRunId: uuid("load_run_id").notNull(),
    s3Bucket: text("s3_bucket").notNull(),
    s3Key: text("s3_key").notNull(),
    s3VersionId: text("s3_version_id").notNull(),
    fileHash: text("file_hash").notNull(),
    dateExtracted: text("date_extracted").notNull(),
    extractType: text("extract_type").notNull(),
    perOrgId: text("per_org_id").notNull(),
    practiceId: text("practice_id").notNull(),
    rowsRead: integer("rows_read").default(0),
    rowsIngested: integer("rows_ingested").default(0),
    rowsRejected: integer("rows_rejected").default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed'
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Unique constraint for idempotency - ensure only one record per file
    fileIdempotencyIdx: uniqueIndex("load_run_files_unique_idx").on(
      table.s3VersionId,
      table.fileHash
    ),
  })
);

// Data quality results - per-run metrics
export const dqResults = createTable("etl.dq_results", {
  dqResultId: serial("dq_result_id").primaryKey(),
  loadRunId: uuid("load_run_id").notNull(),
  loadRunFileId: integer("load_run_file_id"),
  metricName: text("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 15, scale: 4 }),
  pass: boolean("pass").notNull(),
  threshold: decimal("threshold", { precision: 15, scale: 4 }),
  s3Key: text("s3_key"),
  extractType: text("extract_type"),
  perOrgId: text("per_org_id"),
  practiceId: text("practice_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Rejects tables - one per extract type
export const rejectsPatients = createTable("etl.rejects_patients", {
  rejectId: serial("reject_id").primaryKey(),
  loadRunId: uuid("load_run_id").notNull(),
  loadRunFileId: integer("load_run_file_id").notNull(),
  rowNum: integer("row_num").notNull(),
  rowText: text("row_text").notNull(),
  fieldErrors: text("field_errors"), // JSON string
  contractBreach: boolean("contract_breach").notNull().default(false),
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rejectsAppointments = createTable("etl.rejects_appointments", {
  rejectId: serial("reject_id").primaryKey(),
  loadRunId: uuid("load_run_id").notNull(),
  loadRunFileId: integer("load_run_file_id").notNull(),
  rowNum: integer("row_num").notNull(),
  rowText: text("row_text").notNull(),
  fieldErrors: text("field_errors"), // JSON string
  contractBreach: boolean("contract_breach").notNull().default(false),
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rejectsImmunisations = createTable("etl.rejects_immunisations", {
  rejectId: serial("reject_id").primaryKey(),
  loadRunId: uuid("load_run_id").notNull(),
  loadRunFileId: integer("load_run_file_id").notNull(),
  rowNum: integer("row_num").notNull(),
  rowText: text("row_text").notNull(),
  fieldErrors: text("field_errors"), // JSON string
  contractBreach: boolean("contract_breach").notNull().default(false),
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rejectsInvoices = createTable("etl.rejects_invoices", {
  rejectId: serial("reject_id").primaryKey(),
  loadRunId: uuid("load_run_id").notNull(),
  loadRunFileId: integer("load_run_file_id").notNull(),
  rowNum: integer("row_num").notNull(),
  rowText: text("row_text").notNull(),
  fieldErrors: text("field_errors"), // JSON string
  contractBreach: boolean("contract_breach").notNull().default(false),
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rejectsInvoiceDetail = createTable("etl.rejects_invoice_detail", {
  rejectId: serial("reject_id").primaryKey(),
  loadRunId: uuid("load_run_id").notNull(),
  loadRunFileId: integer("load_run_file_id").notNull(),
  rowNum: integer("row_num").notNull(),
  rowText: text("row_text").notNull(),
  fieldErrors: text("field_errors"), // JSON string
  contractBreach: boolean("contract_breach").notNull().default(false),
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
