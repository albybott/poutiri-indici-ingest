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

export const patientAlertsStg = createTable(
  "stg.patient_alerts",
  {
    // Typed columns with proper constraints
    patientAlertId: text("patient_alert_id").notNull(),
    patientId: text("patient_id").notNull(),
    typeId: text("type_id"),
    type: text("type"),
    alertId: text("alert_id"),
    alert: text("alert"),
    severityId: text("severity_id"),
    severity: text("severity"),
    alertValue: text("alert_value"),
    lastUpdatedDate: date("last_updated_date"),
    effectiveDate: date("effective_date"),
    expiryDate: date("expiry_date"),
    note: text("note"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    insertedBy: text("inserted_by"),
    updatedById: text("updated_by_id"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    medTechId: text("med_tech_id"),
    userLoggingId: text("user_logging_id"),
    loggingUserName: text("logging_user_name"),
    isGp2Gp: boolean("is_gp2gp"),
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    alertState: text("alert_state"),
    practiceId: text("practice_id").notNull(),
    providerId: text("provider_id"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("patient_alerts_stg_natural_key_idx").on(
      table.patientAlertId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkPatientAlertsStgLoadRunFile = foreignKey({
  columns: [patientAlertsStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_patient_alerts_stg_load_run_file",
});




