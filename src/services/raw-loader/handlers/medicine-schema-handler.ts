import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Medicine handler generated from schema
 * Generated on 2025-10-06T01:11:46.105Z
 */
export class MedicineSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Medicine";
  tableName = "raw.medicine";

  // Generated from src/db/schema/raw/medicine.ts
  columnMapping = [
    "medicine_id",
    "medicine_name",
    "medicine_short_name",
    "sct_id",
    "type",
    "pharma_code",
    "is_active",
    "is_deleted",
    "per_org_id",
    "practice_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "medicine_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "medicine_id must be numeric"
    // }
  ];
}
