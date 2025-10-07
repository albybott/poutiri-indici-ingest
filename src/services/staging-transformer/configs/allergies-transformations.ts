import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Allergies staging transformations
 * Converts raw text columns to typed staging columns
 */
export const allergiesTransformations: ColumnTransformation[] = [
  // Primary key
  {
    sourceColumn: "allergy_id",
    targetColumn: "allergyId",
    targetType: ColumnType.TEXT,
    required: true,
  },

  // IDs - Keep as text
  {
    sourceColumn: "appointment_id",
    targetColumn: "appointmentId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "allergy_type_id",
    targetColumn: "allergyTypeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "medicine_id",
    targetColumn: "medicineId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "reaction_id",
    targetColumn: "reactionId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "reaction_type_id",
    targetColumn: "reactionTypeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "severity_id",
    targetColumn: "severityId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "inserted_by_id",
    targetColumn: "insertedById",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "updated_by_id",
    targetColumn: "updatedById",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "medicine_classification_id",
    targetColumn: "medicineClassificationId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "allergy_category_id",
    targetColumn: "allergyCategoryId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "substance_type_id",
    targetColumn: "substanceTypeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "favourite_substance_id",
    targetColumn: "favouriteSubstanceId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "disease_id",
    targetColumn: "diseaseId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "medicine_type_id",
    targetColumn: "medicineTypeId",
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
    sourceColumn: "provider_id",
    targetColumn: "providerId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "practice_location_id",
    targetColumn: "practiceLocationId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },

  // Text fields - Allergy details
  {
    sourceColumn: "allergy_type",
    targetColumn: "allergyType",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "medicine",
    targetColumn: "medicine",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "reactions",
    targetColumn: "reactions",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "reaction_type",
    targetColumn: "reactionType",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "severity",
    targetColumn: "severity",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "reaction_notes",
    targetColumn: "reactionNotes",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },

  // Text fields - Patient and practice details
  {
    sourceColumn: "patient",
    targetColumn: "patient",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practice",
    targetColumn: "practice",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },

  // Text fields - Classification and coding
  {
    sourceColumn: "mgencode",
    targetColumn: "mgencode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "mclacode",
    targetColumn: "mclacode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "med_tech_id",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "allergy_category",
    targetColumn: "allergyCategory",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "comment",
    targetColumn: "comment",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "substance_type",
    targetColumn: "substanceType",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "favourite_substance",
    targetColumn: "favouriteSubstance",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "disease",
    targetColumn: "disease",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "other_substance",
    targetColumn: "otherSubstance",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "medicine_type",
    targetColumn: "medicineType",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "logging_user_name",
    targetColumn: "loggingUserName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "warning_type",
    targetColumn: "warningType",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "provider",
    targetColumn: "provider",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "location_name",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },

  // Boolean fields
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
    sourceColumn: "is_confidential",
    targetColumn: "isConfidential",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "show_on_portal",
    targetColumn: "showOnPortal",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "rowinactive",
    targetColumn: "rowinactive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_reviewed",
    targetColumn: "isReviewed",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },

  // Date field
  {
    sourceColumn: "onset_date",
    targetColumn: "onsetDate",
    targetType: ColumnType.DATE,
    required: false,
  },

  // Text fields - Additional details
  {
    sourceColumn: "deactivation_reason",
    targetColumn: "deactivationReason",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },

  // Timestamp fields
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
];
