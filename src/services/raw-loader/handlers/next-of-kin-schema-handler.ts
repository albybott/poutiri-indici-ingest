import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * NextOfKin handler generated from schema
 * Generated on 2025-10-06T01:11:46.105Z
 */
export class NextOfKinSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "NextOfKin";
  tableName = "raw.next_of_kin";

  // Generated from src/db/schema/raw/next-of-kin.ts
  columnMapping = [
    "next_to_kin_id",
    "patient_id",
    "nok_profile_id",
    "nhi_number",
    "name",
    "full_address",
    "cell_number",
    "day_phone",
    "night_phone",
    "is_emergency",
    "relationship_type_id",
    "relationship_type",
    "is_active",
    "is_deleted",
    "inserted_by_id",
    "inserted_by",
    "updated_by_id",
    "updated_by",
    "inserted_at",
    "updated_at",
    "user_logging_id",
    "logging_user_name",
    "is_gp2gp",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "practice_id",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "next_to_kin_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "next_to_kin_id must be numeric"
    // }
  ];
}
