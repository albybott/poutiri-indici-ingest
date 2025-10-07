import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  check,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const inboxDetailStg = createTable(
  "stg.inbox_detail",
  {
    // Typed columns with proper constraints
    inBoxFolderItemInLineId: text("in_box_folder_item_in_line_id").notNull(),
    inboxFolderItemId: text("inbox_folder_item_id").notNull(),
    patientId: text("patient_id"),
    practiceId: text("practice_id").notNull(),
    practiceName: text("practice_name"),
    prompt: text("prompt"),
    result: text("result"),
    abNorm: text("ab_norm"),
    unit: text("unit"),
    resultCode: text("result_code"),
    referenceRanges: text("reference_ranges"),
    lineNumber: integer("line_number"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    isConfidential: boolean("is_confidential"),
    showOnPortal: boolean("show_on_portal"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("inbox_detail_stg_natural_key_idx").on(
      table.inBoxFolderItemInLineId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkInboxDetailStgLoadRunFile = foreignKey({
  columns: [inboxDetailStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_inbox_detail_stg_load_run_file",
});
