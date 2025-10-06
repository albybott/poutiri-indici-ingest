import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * InboxDetail handler generated from schema
 * Generated on 2025-10-06T01:11:46.104Z
 */
export class InboxDetailSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "InboxDetail";
  tableName = "raw.inbox_detail";

  // Generated from src/db/schema/raw/inbox-detail.ts
  columnMapping = [
    'in_box_folder_item_in_line_id',
    'inbox_folder_item_id',
    'patient_id',
    'practice_id',
    'practice_name',
    'prompt',
    'result',
    'ab_norm',
    'unit',
    'result_code',
    'reference_ranges',
    'line_number',
    'inserted_at',
    'is_confidential',
    'showon_portal',
    'is_active',
    'is_deleted',
    'per_org_id',
    'loaded_date_time',
    'load_run_file_id',
    's3_bucket',
    's3_key',
    's3_version_id',
    'file_hash',
    'date_extracted',
    'extract_type',
    'load_run_id',
    'load_ts'
];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "in_box_folder_item_in_line_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "in_box_folder_item_in_line_id must be numeric"
    // }
  ];
}
