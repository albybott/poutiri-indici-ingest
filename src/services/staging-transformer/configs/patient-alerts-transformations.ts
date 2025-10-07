import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * PatientAlerts staging transformations
 * Converts raw text columns to typed staging columns
 */
export const patientAlertsTransformations: ColumnTransformation[] = [
  // IDs - Keep as text
  {
    sourceColumn: "patient_alert_id",
    targetColumn: "patientAlertId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "type_id",
    targetColumn: "typeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "type",
    targetColumn: "type",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "alert_id",
    targetColumn: "alertId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "alert",
    targetColumn: "alert",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "severity_id",
    targetColumn: "severityId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "severity",
    targetColumn: "severity",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "alert_value",
    targetColumn: "alertValue",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "last_updated_date",
    targetColumn: "lastUpdatedDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "effective_date",
    targetColumn: "effectiveDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "expiry_date",
    targetColumn: "expiryDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "note",
    targetColumn: "note",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: true,
  },
  {
    sourceColumn: "is_deleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "inserted_by_id",
    targetColumn: "insertedById",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updated_by_id",
    targetColumn: "updatedById",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "inserted_at",
    targetColumn: "insertedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "updated_at",
    targetColumn: "updatedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "med_tech_id",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "user_logging_id",
    targetColumn: "userLoggingId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "logging_user_name",
    targetColumn: "loggingUserName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "is_gp2gp",
    targetColumn: "isGp2Gp",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "permanent_address_latitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "permanent_address_longitude",
    targetColumn: "permanentAddressLongitude",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "alert_state",
    targetColumn: "alertState",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "provider_id",
    targetColumn: "providerId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "loaded_date_time",
    targetColumn: "loadedDateTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
];
