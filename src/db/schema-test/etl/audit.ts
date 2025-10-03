// import {
//   text,
//   timestamp,
//   uuid,
//   boolean,
//   integer,
//   decimal,
//   serial,
//   check,
//   uniqueIndex,
//   index,
// } from "drizzle-orm/pg-core";
// import { sql } from "drizzle-orm";
// import { createTable } from "../../utils/create-table";

// Data quality results - per-run metrics
// export const dqResults = createTable("etl.dq_results", {
//   dqResultId: serial("dq_result_id").primaryKey(),
//   loadRunId: uuid("load_run_id")
//     .notNull()
//     .references(() => loadRuns.loadRunId),
//   loadRunFileId: integer("load_run_file_id").references(
//     () => loadRunFiles.loadRunFileId
//   ),
//   metricName: text("metric_name").notNull(),
//   metricValue: decimal("metric_value", { precision: 15, scale: 4 }),
//   pass: boolean("pass").notNull(),
//   threshold: decimal("threshold", { precision: 15, scale: 4 }),
//   s3Key: text("s3_key"),
//   extractType: text("extract_type"),
//   perOrgId: text("per_org_id"),
//   practiceId: text("practice_id"),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// // Rejects tables - one per extract type
// export const rejectsPatients = createTable("etl.rejects_patients", {
//   rejectId: serial("reject_id").primaryKey(),
//   loadRunId: uuid("load_run_id")
//     .notNull()
//     .references(() => loadRuns.loadRunId),
//   loadRunFileId: integer("load_run_file_id")
//     .notNull()
//     .references(() => loadRunFiles.loadRunFileId),
//   rowNum: integer("row_num").notNull(),
//   rowText: text("row_text").notNull(),
//   fieldErrors: text("field_errors"), // JSON string
//   contractBreach: boolean("contract_breach").notNull().default(false),
//   s3Bucket: text("s3_bucket").notNull(),
//   s3Key: text("s3_key").notNull(),
//   s3VersionId: text("s3_version_id").notNull(),
//   fileHash: text("file_hash").notNull(),
//   dateExtracted: text("date_extracted").notNull(),
//   extractType: text("extract_type").notNull(),
//   perOrgId: text("per_org_id").notNull(),
//   practiceId: text("practice_id").notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// export const rejectsAppointments = createTable("etl.rejects_appointments", {
//   rejectId: serial("reject_id").primaryKey(),
//   loadRunId: uuid("load_run_id")
//     .notNull()
//     .references(() => loadRuns.loadRunId),
//   loadRunFileId: integer("load_run_file_id")
//     .notNull()
//     .references(() => loadRunFiles.loadRunFileId),
//   rowNum: integer("row_num").notNull(),
//   rowText: text("row_text").notNull(),
//   fieldErrors: text("field_errors"), // JSON string
//   contractBreach: boolean("contract_breach").notNull().default(false),
//   s3Bucket: text("s3_bucket").notNull(),
//   s3Key: text("s3_key").notNull(),
//   s3VersionId: text("s3_version_id").notNull(),
//   fileHash: text("file_hash").notNull(),
//   dateExtracted: text("date_extracted").notNull(),
//   extractType: text("extract_type").notNull(),
//   perOrgId: text("per_org_id").notNull(),
//   practiceId: text("practice_id").notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// export const rejectsImmunisations = createTable("etl.rejects_immunisations", {
//   rejectId: serial("reject_id").primaryKey(),
//   loadRunId: uuid("load_run_id")
//     .notNull()
//     .references(() => loadRuns.loadRunId),
//   loadRunFileId: integer("load_run_file_id")
//     .notNull()
//     .references(() => loadRunFiles.loadRunFileId),
//   rowNum: integer("row_num").notNull(),
//   rowText: text("row_text").notNull(),
//   fieldErrors: text("field_errors"), // JSON string
//   contractBreach: boolean("contract_breach").notNull().default(false),
//   s3Bucket: text("s3_bucket").notNull(),
//   s3Key: text("s3_key").notNull(),
//   s3VersionId: text("s3_version_id").notNull(),
//   fileHash: text("file_hash").notNull(),
//   dateExtracted: text("date_extracted").notNull(),
//   extractType: text("extract_type").notNull(),
//   perOrgId: text("per_org_id").notNull(),
//   practiceId: text("practice_id").notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// export const rejectsInvoices = createTable("etl.rejects_invoices", {
//   rejectId: serial("reject_id").primaryKey(),
//   loadRunId: uuid("load_run_id")
//     .notNull()
//     .references(() => loadRuns.loadRunId),
//   loadRunFileId: integer("load_run_file_id")
//     .notNull()
//     .references(() => loadRunFiles.loadRunFileId),
//   rowNum: integer("row_num").notNull(),
//   rowText: text("row_text").notNull(),
//   fieldErrors: text("field_errors"), // JSON string
//   contractBreach: boolean("contract_breach").notNull().default(false),
//   s3Bucket: text("s3_bucket").notNull(),
//   s3Key: text("s3_key").notNull(),
//   s3VersionId: text("s3_version_id").notNull(),
//   fileHash: text("file_hash").notNull(),
//   dateExtracted: text("date_extracted").notNull(),
//   extractType: text("extract_type").notNull(),
//   perOrgId: text("per_org_id").notNull(),
//   practiceId: text("practice_id").notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// export const rejectsInvoiceDetail = createTable("etl.rejects_invoice_detail", {
//   rejectId: serial("reject_id").primaryKey(),
//   loadRunId: uuid("load_run_id")
//     .notNull()
//     .references(() => loadRuns.loadRunId),
//   loadRunFileId: integer("load_run_file_id")
//     .notNull()
//     .references(() => loadRunFiles.loadRunFileId),
//   rowNum: integer("row_num").notNull(),
//   rowText: text("row_text").notNull(),
//   fieldErrors: text("field_errors"), // JSON string
//   contractBreach: boolean("contract_breach").notNull().default(false),
//   s3Bucket: text("s3_bucket").notNull(),
//   s3Key: text("s3_key").notNull(),
//   s3VersionId: text("s3_version_id").notNull(),
//   fileHash: text("file_hash").notNull(),
//   dateExtracted: text("date_extracted").notNull(),
//   extractType: text("extract_type").notNull(),
//   perOrgId: text("per_org_id").notNull(),
//   practiceId: text("practice_id").notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });
