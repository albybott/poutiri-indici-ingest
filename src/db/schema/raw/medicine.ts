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

export const medicineRaw = createTable("raw.medicine", {
  // Source columns as text (all fields from medicine extract)
  medicineId: text("medicine_id"),
  medicineName: text("medicine_name"),
  medicineShortName: text("medicine_short_name"),
  sctId: text("sct_id"),
  type: text("type"),
  pharmaCode: text("pharma_code"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  perOrgId: text("per_org_id"),
  practiceId: text("practice_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkmedicineRawLoadRunFile = foreignKey({
  columns: [medicineRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_medicine_load_run_file",
});
