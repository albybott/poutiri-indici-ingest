import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Vaccine handler generated from schema
 * Generated on 2025-10-06T01:11:46.106Z
 */
export class VaccineSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Vaccine";
  tableName = "raw.vaccine";

  // Generated from src/db/schema/raw/vaccine.ts
  columnMapping = [
    'vaccine_id',
    'vaccine_code',
    'vaccine_name',
    'long_description',
    'is_active',
    'is_deleted',
    'coding_system',
    'gender_id',
    'gender',
    'is_nir',
    'per_org_id',
    'practice_id',
    'loaded_date_time',
];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "vaccine_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "vaccine_id must be numeric"
    // }
  ];
}
