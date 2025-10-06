import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * PracticeInfo handler generated from schema
 * Generated on 2025-10-06T01:11:46.106Z
 */
export class PracticeInfoSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "PracticeInfo";
  tableName = "raw.practice_info";

  // Generated from src/db/schema/raw/practice-info.ts
  columnMapping = [
    "practice_id",
    "practice_name",
    "practice_category",
    "practice_speciality",
    "pho",
    "organization_type",
    "org_short_name",
    "org_code",
    "edi_account",
    "legal_entity_title",
    "legal_status",
    "incorporation_number",
    "legal_date",
    "comments",
    "formula",
    "ownership_model",
    "rural",
    "primary_phone",
    "secondary_phone",
    "other_phone",
    "primary_email",
    "secondary_email",
    "other_email",
    "pager",
    "fax1",
    "fax2",
    "health_facility_no",
    "hpi_facility_no",
    "hpi_facility_ext",
    "hpi_organization_id",
    "hpi_organization_ext",
    "gst_no",
    "acc_no",
    "bank_account_no",
    "moh_sending_practice_id",
    "after_hours_number",
    "emergency_number",
    "is_active",
    "is_deleted",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "practice_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "practice_id must be numeric"
    // }
  ];
}
