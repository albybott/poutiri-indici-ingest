import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Invoices handler generated from schema
 * Generated on 2025-10-06T01:11:46.104Z
 */
export class InvoicesSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Invoice";
  tableName = "raw.invoices";

  // Generated from src/db/schema/raw/invoices.ts
  columnMapping = [
    "invoice_transaction_id",
    "patient_id",
    "ac_date",
    "medtech_id",
    "payment_mode",
    "total_amount",
    "unpaid_amount",
    "claim_notes",
    "description",
    "income_provider",
    "invoice_payment_no",
    "provider",
    "domicile_code",
    "inserted_at",
    "inserted_by",
    "updated_at",
    "updated_by",
    "is_active",
    "transaction_type",
    "provider_id",
    "practice_id",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "practice_location_id",
    "location_name",
    "notes",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "invoice_transaction_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "invoice_transaction_id must be numeric"
    // }
  ];
}
