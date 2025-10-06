import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  date,
  check,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const inboxdetailRaw = createTable("raw.inbox_detail", {
  // Source columns as text (all fields from inbox-detail extract)
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
  showOnPortal: text("show_on_portal"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkinboxdetailRawLoadRunFile = foreignKey({
  columns: [inboxdetailRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_inbox-detail_load_run_file",
});
