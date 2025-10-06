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

export const patientalertsRaw = createTable("raw.patient_alerts", {
  // Source columns as text (all fields from patient-alerts extract)
  patientAlertId: text("patient_alert_id"),
  patientId: text("patient_id"),
  typeId: text("type_id"),
  type: text("type"),
  alertId: text("alert_id"),
  alert: text("alert"),
  severityId: text("severity_id"),
  severity: text("severity"),
  alertValue: text("alert_value"),
  lastUpdatedDate: text("last_updated_date"),
  effectiveDate: text("effective_date"),
  expiryDate: text("expiry_date"),
  note: text("note"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  insertedById: text("inserted_by_id"),
  insertedBy: text("inserted_by"),
  updatedById: text("updated_by_id"),
  updatedBy: text("updated_by"),
  insertedAt: text("inserted_at"),
  updatedAt: text("updated_at"),
  medTechId: text("med_tech_id"),
  userLoggingId: text("user_logging_id"),
  loggingUserName: text("logging_user_name"),
  isGp2Gp: text("is_gp2gp"),
  permanentAddressLatitude: text("permanent_address_latitude"),
  permanentAddressLongitude: text("permanent_address_longitude"),
  alertState: text("alert_state"),
  practiceId: text("practice_id"),
  providerId: text("provider_id"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkpatientalertsRawLoadRunFile = foreignKey({
  columns: [patientalertsRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_patient-alerts_load_run_file",
});
