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

export const vaccineRaw = createTable("raw.vaccine", {
  // CSV columns from data extract
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

  // Lineage columns (added by ETL)
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Foreign key constraint to etl.load_run_files
export const fkVaccineRawLoadRunFile = foreignKey({
  columns: [vaccineRaw.loadRunId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_vaccine_raw_load_run_file",
});
