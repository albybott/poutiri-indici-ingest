import { text, integer, foreignKey } from "drizzle-orm/pg-core";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const vaccineRaw = createTable("raw.vaccine", {
  // Source columns as text (all fields from Vaccine extract)
  vaccineId: text("vaccine_id"),
  vaccineCode: text("vaccine_code"),
  vaccineName: text("vaccine_name"),
  longDescription: text("long_description"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  codingSystem: text("coding_system"),
  genderId: text("gender_id"),
  gender: text("gender"),
  isNir: text("is_nir"),
  perOrgId: text("per_org_id"),
  practiceId: text("practice_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkVaccineLoadRunFile = foreignKey({
  columns: [vaccineRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_vaccine_load_run_file",
});
