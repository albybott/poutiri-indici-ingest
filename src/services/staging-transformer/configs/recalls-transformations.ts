import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Recalls staging transformations
 * Converts raw text columns to typed staging columns
 */
export const recallsTransformations: ColumnTransformation[] = [
  // IDs - Keep as text
  {
    sourceColumn: "re_call_id",
    targetColumn: "reCallId",
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
    sourceColumn: "patient_med_tech_id",
    targetColumn: "patientMedTechId",
    targetType: ColumnType.TEXT,
    required: false,
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

  // Date and timestamp fields
  {
    sourceColumn: "re_call_date",
    targetColumn: "reCallDate",
    targetType: ColumnType.DATE,
    required: false,
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
    sourceColumn: "loaded_date_time",
    targetColumn: "loadedDateTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },

  // Boolean fields
  {
    sourceColumn: "is_contacted",
    targetColumn: "isContacted",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_deleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_confidential",
    targetColumn: "isConfidential",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "show_on_patient_portal",
    targetColumn: "showOnPatientPortal",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_canceled",
    targetColumn: "isCanceled",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },

  // Numeric fields
  {
    sourceColumn: "re_call_attempts",
    targetColumn: "reCallAttempts",
    targetType: ColumnType.INTEGER,
    required: false,
  },

  // Decimal fields (coordinates)
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

  // Text fields
  {
    sourceColumn: "notes",
    targetColumn: "notes",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "recall_reason",
    targetColumn: "recallReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "screening_type",
    targetColumn: "screeningType",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "code",
    targetColumn: "code",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "vaccine",
    targetColumn: "vaccine",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "vaccine_group",
    targetColumn: "vaccineGroup",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "re_call_group",
    targetColumn: "reCallGroup",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "practice",
    targetColumn: "practice",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "scn_code",
    targetColumn: "scnCode",
    targetType: ColumnType.TEXT,
    required: false,
  },
];
