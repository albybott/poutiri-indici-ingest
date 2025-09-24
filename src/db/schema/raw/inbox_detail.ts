import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createTable } from "../../../utils/create-table.js";

export const inboxDetailRaw = createTable("raw.inbox_detail_raw", {
  // Source columns as text (all fields from InboxDetail extract)
  inBoxFolderItemInLineId: text("in_box_folder_item_in_line_id"),
  inboxFolderItemId: text("inbox_folder_item_id"),
  patientId: text("patient_id"),
  practiceId: text("practice_id"),
  practiceName: text("practice_name"),
  prompt: text("prompt"),
  result: text("result"),
  abNorm: text("ab_norm"),
  unit: text("unit"),
  resultCode: text("result_code"),
  referenceRanges: text("reference_ranges"),
  lineNumber: text("line_number"),
  insertedAt: text("inserted_at"),
  isConfidential: text("is_confidential"),
  showonPortal: text("showon_portal"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  perOrgId: text("per_org_id"),
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
