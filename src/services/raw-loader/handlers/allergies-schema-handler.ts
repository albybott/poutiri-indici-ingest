import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Allergies handler generated from schema
 * Generated on 2025-10-06T01:11:46.102Z
 */
export class AllergiesSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Allergies";
  tableName = "raw.allergies";

  // Generated from src/db/schema/raw/allergies.ts
  columnMapping = [
    "allergy_id",
    "appointment_id",
    "allergy_type_id",
    "allergy_type",
    "onset_date",
    "deactivation_reason",
    "medicine_id",
    "medicine",
    "reaction_id",
    "reactions",
    "reaction_type_id",
    "reaction_type",
    "severity_id",
    "severity",
    "reaction_notes",
    "is_active",
    "is_deleted",
    "inserted_by_id",
    "inserted_by",
    "updated_by_id",
    "updated_by",
    "inserted_at",
    "updated_at",
    "patient_id",
    "patient",
    "is_confidential",
    "practice_id",
    "practice",
    "mgencode",
    "mclacode",
    "med_tech_id",
    "medicine_classification_id",
    "allergy_category_id",
    "allergy_category",
    "comment",
    "substance_type_id",
    "substance_type",
    "favourite_substance_id",
    "favourite_substance",
    "disease_id",
    "disease",
    "other_substance",
    "medicine_type_id",
    "medicine_type",
    "user_logging_id",
    "logging_user_name",
    "show_on_portal",
    "warning_type",
    "rowinactive",
    "is_reviewed",
    "provider_id",
    "provider",
    "practice_location_id",
    "location_name",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "allergy_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "allergy_id must be numeric"
    // }
  ];
}
