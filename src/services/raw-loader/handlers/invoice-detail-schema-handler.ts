import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * InvoiceDetail handler generated from schema
 * Generated on 2025-10-06T01:11:46.104Z
 */
export class InvoiceDetailSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "InvoiceDetail";
  tableName = "raw.invoice_detail";

  // Generated from src/db/schema/raw/invoice-detail.ts
  columnMapping = [
    'invoice_detail_id',
    'invoice_transaction_id',
    'master_service_sub_service_id',
    'appointment_service_id',
    'comments',
    'quantity',
    'claim_amount',
    'co_payment',
    'gross_claim_amount',
    'gross_co_payment',
    'is_billing_amount',
    'funder_id',
    'funder_name',
    'contract_service_id',
    'contract_service_name',
    'is_funded',
    'submission_status',
    'case_no',
    'sequence_no',
    'billing_claim_status_id',
    'master_service_name',
    'master_service_code',
    'master_service_description',
    'service_name',
    'description',
    'code',
    'fee_code',
    'service_code',
    'sub_service_description',
    'duration',
    'is_common_service',
    'service_code_for_claim',
    'is_active',
    'is_deleted',
    'inserted_by_id',
    'updated_by_id',
    'inserted_by',
    'updated_by',
    'inserted_at',
    'updated_at',
    'user_logging_id',
    'logging_user_name',
    'billing_ref_id',
    'billing_referral_id',
    'permanent_address_latitude',
    'permanent_address_longitude',
    'practice_id',
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
    //   columnName: "invoice_detail_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "invoice_detail_id must be numeric"
    // }
  ];
}
