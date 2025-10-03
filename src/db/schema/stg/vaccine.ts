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

export const vaccineStg = createTable(
  "stg.vaccine",
  {
    // Typed columns with proper constraints
    vaccineId: text("vaccine_id").notNull(),
    vaccineCode: text("vaccine_code").notNull(),
    vaccineName: text("vaccine_name").notNull(),
    longDescription: text("long_description"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    codingSystem: text("coding_system"),
    genderId: text("gender_id"),
    gender: text("gender"),
    isNir: boolean("is_nir"),
    perOrgId: text("per_org_id").notNull(),
    practiceId: text("practice_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("vaccine_stg_natural_key_idx").on(
      table.vaccineId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkVaccineStgLoadRunFile = foreignKey({
  columns: [vaccineStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_vaccine_stg_load_run_file",
});
