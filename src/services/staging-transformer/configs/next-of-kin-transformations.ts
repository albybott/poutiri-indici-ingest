import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * NextOfKin staging transformations
 * Converts raw text columns to typed staging columns
 */
export const nextOfKinTransformations: ColumnTransformation[] = [
  // IDs - Keep as text
  {
    sourceColumn: "next_to_kin_id",
    targetColumn: "nextToKinId",
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
    sourceColumn: "nok_profile_id",
    targetColumn: "nokProfileId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "nhi_number",
    targetColumn: "nhiNumber",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "name",
    targetColumn: "name",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "full_address",
    targetColumn: "fullAddress",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "cell_number",
    targetColumn: "cellNumber",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "day_phone",
    targetColumn: "dayPhone",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "night_phone",
    targetColumn: "nightPhone",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "is_emergency",
    targetColumn: "isEmergency",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "relationship_type_id",
    targetColumn: "relationshipTypeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "relationship_type",
    targetColumn: "relationshipType",
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
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
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
