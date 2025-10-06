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

export const recallsRaw = createTable("raw.recalls", {
  // Source columns as text (all fields from recalls extract)
  reCallId: text("re_call_id"),
  patientId: text("patient_id"),
  reCallDate: text("re_call_date"),
  isContacted: text("is_contacted"),
  notes: text("notes"),
  patientMedTechId: text("patient_medtech_id"),
  recallReason: text("recall_reason"),
  screeningType: text("screening_type"),
  code: text("code"),
  vaccine: text("vaccine"),
  vaccineGroup: text("vaccine_group"),
  reCallGroup: text("re_call_group"),
  insertedAt: text("inserted_at"),
  insertedBy: text("inserted_by"),
  updatedAt: text("updated_at"),
  updatedBy: text("updated_by"),
  isActive: text("is_active"),
  practice: text("practice"),
  practiceId: text("practice_id"),
  providerId: text("provider_id"),
  isDeleted: text("is_deleted"),
  permanentAddressLatitude: text("permanent_address_latitude"),
  permanentAddressLongitude: text("permanent_address_longitude"),
  isConfidential: text("is_confidential"),
  showOnPatientPortal: text("show_on_patient_portal"),
  isCanceled: text("is_canceled"),
  reCallAttempts: text("re_call_attempts"),
  scnCode: text("scn_code"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkrecallsRawLoadRunFile = foreignKey({
  columns: [recallsRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_recalls_load_run_file",
});
