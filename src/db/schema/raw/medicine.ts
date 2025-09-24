import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createTable } from "../../../utils/create-table.js";

export const medicineRaw = createTable("raw.medicine", {
  // Source columns as text (all fields from Medicine extract)
  medicineId: text("medicine_id"),
  medicineName: text("medicine_name"),
  medicineShortName: text("medicine_short_name"),
  sctid: text("sctid"),
  type: text("type"),
  pharmaCode: text("pharma_code"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  perOrgId: text("per_org_id"),
  practiceId: text("practice_id"),
  loadedDateTime: text("loaded_date_time"),

  // Lineage columns
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});
