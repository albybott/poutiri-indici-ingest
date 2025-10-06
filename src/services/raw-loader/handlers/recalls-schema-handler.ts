import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Recalls handler generated from schema
 * Generated on 2025-10-06T01:11:46.106Z
 */
export class RecallsSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Recall";
  tableName = "raw.recalls";

  // Generated from src/db/schema/raw/recalls.ts
  columnMapping = [
    "re_call_id",
    "patient_id",
    "re_call_date",
    "is_contacted",
    "notes",
    "patient_med_tech_id",
    "recall_reason",
    "screening_type",
    "code",
    "vaccine",
    "vaccine_group",
    "re_call_group",
    "inserted_at",
    "inserted_by",
    "updated_at",
    "updated_by",
    "is_active",
    "practice",
    "practice_id",
    "provider_id",
    "is_deleted",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "is_confidential",
    "show_on_patient_portal",
    "is_canceled",
    "re_call_attempts",
    "scn_code",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "re_call_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "re_call_id must be numeric"
    // }
  ];
}
