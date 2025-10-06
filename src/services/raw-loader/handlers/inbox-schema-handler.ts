import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Inbox handler generated from schema
 * Generated on 2025-10-06T01:11:46.104Z
 */
export class InboxSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Inbox";
  tableName = "raw.inbox";

  // Generated from src/db/schema/raw/inbox.ts
  columnMapping = [
    "inbox_folder_item_id",
    "folder_id",
    "folder_name",
    "is_system_folder",
    "order_no",
    "item_type_id",
    "item_type",
    "patient_id",
    "provider_id",
    "practice_id",
    "patient_name",
    "provider",
    "practice_name",
    "from_org_id",
    "from_organization_name",
    "assign_to_id",
    "assign_to",
    "result_date",
    "message_subject_id",
    "message_subject",
    "comments",
    "mark_as_read",
    "is_confidential",
    "show_on_portal",
    "is_reviewed",
    "show_on_time_line",
    "is_active",
    "is_deleted",
    "inserted_by_id",
    "inserted_by",
    "updated_by_id",
    "updated_by",
    "inserted_at",
    "updated_at",
    "med_tech_id",
    "dms_id",
    "is_repeat_rx",
    "is_replied_rx",
    "external_ref",
    "abnorm_result",
    "is_deactivated",
    "folder_group",
    "document_code",
    "is_gp2gp",
    "informat_id",
    "informat",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "filed_at",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "inbox_folder_item_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "inbox_folder_item_id must be numeric"
    // }
  ];
}
