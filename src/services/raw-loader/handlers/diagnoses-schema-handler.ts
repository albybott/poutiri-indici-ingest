import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Diagnoses handler generated from schema
 * Generated on 2025-10-06T01:11:46.103Z
 */
export class DiagnosesSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Diagnose";
  tableName = "raw.diagnoses";

  // Generated from src/db/schema/raw/diagnoses.ts
  columnMapping = [
    "diagnosis_id",
    "appointment_id",
    "patient_id",
    "disease_id",
    "disease",
    "diagnosis_date",
    "diagnosis_by_id",
    "diagnosis_by",
    "summary",
    "is_long_term",
    "add_to_problem",
    "is_highlighted",
    "sequence_no",
    "is_active",
    "is_deleted",
    "inserted_by_id",
    "inserted_by",
    "updated_by_id",
    "updated_by",
    "inserted_at",
    "updated_at",
    "is_confidential",
    "diagnosis_type_id",
    "diagnosis_type",
    "classification_record",
    "med_tech_id",
    "med_tech_read_code",
    "med_tech_read_term",
    "is_mapped",
    "practice_id",
    "practice",
    "on_set_date",
    "user_logging_id",
    "logging_user_name",
    "recall_id",
    "recall",
    "exclusion_start_date",
    "exclusion_end_date",
    "show_on_portal",
    "ext_appointment_id",
    "patient_med_tech_id",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "practice_location_id",
    "location_name",
    "snomed_id",
    "snomed_term",
    "concept_id",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "diagnosis_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "diagnosis_id must be numeric"
    // }
  ];
}
