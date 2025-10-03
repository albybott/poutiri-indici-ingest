import {
  text,
  timestamp,
  uuid,
  integer,
  serial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";

// Load runs - one per execution
export const loadRuns = createTable("etl.load_runs", {
  loadRunId: uuid("load_run_id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
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
    loadRunId: uuid("load_run_id")
      .notNull()
      .references(() => loadRuns.loadRunId),
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
  (table) => [
    // Unique constraint for idempotency - ensure only one record per file
    uniqueIndex("load_run_files_unique_idx").on(
      table.s3VersionId,
      table.fileHash
    ),
    // Index for querying files by load run
    index("load_run_files_load_run_idx").on(table.loadRunId),
  ]
);

// Staging runs - tracks raw to staging transformation runs
export const stagingRuns = createTable(
  "etl.staging_runs",
  {
    stagingRunId: uuid("staging_run_id").primaryKey().defaultRandom(),
    loadRunId: uuid("load_run_id")
      .notNull()
      .references(() => loadRuns.loadRunId),
    extractType: text("extract_type").notNull(),
    sourceTable: text("source_table").notNull(),
    targetTable: text("target_table").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: text("status").notNull(), // 'running', 'completed', 'failed'
    totalRowsRead: integer("total_rows_read").default(0),
    totalRowsTransformed: integer("total_rows_transformed").default(0),
    totalRowsRejected: integer("total_rows_rejected").default(0),
    totalRowsDeduplicated: integer("total_rows_deduplicated").default(0),
    successfulBatches: integer("successful_batches").default(0),
    failedBatches: integer("failed_batches").default(0),
    durationMs: integer("duration_ms"),
    rowsPerSecond: integer("rows_per_second"),
    memoryUsageMB: integer("memory_usage_mb"),
    error: text("error"),
    result: text("result"), // JSON string of full result
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Unique constraint for idempotency - one completed staging run per load_run and extract_type
    uniqueIndex("staging_runs_load_run_completed_idx")
      .on(table.loadRunId, table.extractType)
      .where(sql`${table.status} = 'completed'`),
    // Index for querying by status
    index("staging_runs_status_idx").on(table.status),
    // Index for querying by load run
    index("staging_runs_load_run_idx").on(table.loadRunId),
  ]
);

// Core merge runs - tracks staging to core transformation runs
export const coreMergeRuns = createTable(
  "etl.core_merge_runs",
  {
    mergeRunId: uuid("merge_run_id").primaryKey().defaultRandom(),
    loadRunId: uuid("load_run_id")
      .notNull()
      .references(() => loadRuns.loadRunId),
    extractType: text("extract_type").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: text("status").notNull(), // 'running', 'completed', 'failed'
    dimensionsCreated: integer("dimensions_created").default(0),
    dimensionsUpdated: integer("dimensions_updated").default(0),
    factsInserted: integer("facts_inserted").default(0),
    factsUpdated: integer("facts_updated").default(0),
    error: text("error"),
    result: text("result"), // JSON string of full result
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Unique constraint for idempotency - one completed merge per load_run
    uniqueIndex("core_merge_runs_load_run_completed_idx")
      .on(table.loadRunId, table.extractType)
      .where(sql`${table.status} = 'completed'`),
    // Index for querying by status
    index("core_merge_runs_status_idx").on(table.status),
  ]
);
