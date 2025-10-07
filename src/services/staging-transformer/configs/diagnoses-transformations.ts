import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Diagnosis staging transformations
 * Converts raw text columns to typed staging columns
 */
export const diagnosisTransformations: ColumnTransformation[] = [
  // Core identifiers
  {
    sourceColumn: "diagnosis_id",
    targetColumn: "diagnosisId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
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
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  // Diagnosis details
  {
    sourceColumn: "appointment_id",
    targetColumn: "appointmentId",
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
    sourceColumn: "disease",
    targetColumn: "disease",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "diagnosis_date",
    targetColumn: "diagnosisDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "diagnosis_by_id",
    targetColumn: "diagnosisById",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "diagnosis_by",
    targetColumn: "diagnosisBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "summary",
    targetColumn: "summary",
    targetType: ColumnType.TEXT,
    required: false,
  },
  // Booleans
  {
    sourceColumn: "is_long_term",
    targetColumn: "isLongTerm",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "add_to_problem",
    targetColumn: "addToProblem",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_highlighted",
    targetColumn: "isHighlighted",
    targetType: ColumnType.BOOLEAN,
    required: false,
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
    sourceColumn: "is_confidential",
    targetColumn: "isConfidential",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_mapped",
    targetColumn: "isMapped",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "show_on_portal",
    targetColumn: "showOnPortal",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  // Integers
  {
    sourceColumn: "sequence_no",
    targetColumn: "sequenceNo",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  // Text fields
  {
    sourceColumn: "diagnosis_type_id",
    targetColumn: "diagnosisTypeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "diagnosis_type",
    targetColumn: "diagnosisType",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "classification_record",
    targetColumn: "classificationRecord",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_id",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_read_code",
    targetColumn: "medTechReadCode",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_read_term",
    targetColumn: "medTechReadTerm",
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
  },
  {
    sourceColumn: "recall_id",
    targetColumn: "recallId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "recall",
    targetColumn: "recall",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "ext_appointment_id",
    targetColumn: "extAppointmentId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "patient_med_tech_id",
    targetColumn: "patientMedTechId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  // Location fields
  {
    sourceColumn: "permanent_address_latitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "permanent_address_longitude",
    targetColumn: "permanentAddressLongitude",
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
    sourceColumn: "location_name",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
  },
  // SNOMED fields
  {
    sourceColumn: "snomed_id",
    targetColumn: "snomedId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "snomed_term",
    targetColumn: "snomedTerm",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "concept_id",
    targetColumn: "conceptId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  // Dates
  {
    sourceColumn: "on_set_date",
    targetColumn: "onSetDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "exclusion_start_date",
    targetColumn: "exclusionStartDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "exclusion_end_date",
    targetColumn: "exclusionEndDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  // Timestamps
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
  // Text fields from audit
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
  },
];
