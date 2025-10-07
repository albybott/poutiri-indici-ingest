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
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const medicineStg = createTable(
  "stg.medicine",
  {
    // Typed columns with proper constraints
    medicineId: text("medicine_id").notNull(),
    medicineName: text("medicine_name").notNull(),
    medicineShortName: text("medicine_short_name"),
    sctId: text("sct_id"),
    type: text("type"),
    pharmaCode: text("pharma_code"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    perOrgId: text("per_org_id").notNull(),
    practiceId: text("practice_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("medicine_stg_natural_key_idx").on(
      table.medicineId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkMedicineStgLoadRunFile = foreignKey({
  columns: [medicineStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_medicine_stg_load_run_file",
});
