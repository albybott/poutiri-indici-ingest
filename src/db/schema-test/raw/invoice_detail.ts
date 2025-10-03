import { text, integer, foreignKey } from "drizzle-orm/pg-core";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../../schema/etl/audit";

export const invoiceDetailRaw = createTable("raw.invoice_detail", {
  // Source columns as text (all fields from InvoiceDetail extract)
  invoiceDetailId: text("invoice_detail_id"),
  invoiceTransactionId: text("invoice_transaction_id"),
  masterServiceSubServiceId: text("master_service_sub_service_id"),
  appointmentServiceId: text("appointment_service_id"),
  comments: text("comments"),
  quantity: text("quantity"),
  claimAmount: text("claim_amount"),
  coPayment: text("co_payment"),
  grossClaimAmount: text("gross_claim_amount"),
  grossCoPayment: text("gross_co_payment"),
  isBillingAmount: text("is_billing_amount"),
  funderId: text("funder_id"),
  funderName: text("funder_name"),
  contractServiceId: text("contract_service_id"),
  contractServiceName: text("contract_service_name"),
  isFunded: text("is_funded"),
  submissionStatus: text("submission_status"),
  caseNo: text("case_no"),
  sequenceNo: text("sequence_no"),
  billingClaimStatusId: text("billing_claim_status_id"),
  masterServiceName: text("master_service_name"),
  masterServiceCode: text("master_service_code"),
  masterServiceDescription: text("master_service_description"),
  serviceName: text("service_name"),
  description: text("description"),
  code: text("code"),
  feeCode: text("fee_code"),
  serviceCode: text("service_code"),
  subServiceDescription: text("sub_service_description"),
  duration: text("duration"),
  isCommonService: text("is_common_service"),
  serviceCodeForClaim: text("service_code_for_claim"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  insertedById: text("inserted_by_id"),
  updatedById: text("updated_by_id"),
  insertedBy: text("inserted_by"),
  updatedBy: text("updated_by"),
  insertedAt: text("inserted_at"),
  updatedAt: text("updated_at"),
  userLoggingId: text("user_logging_id"),
  loggingUserName: text("logging_user_name"),
  billingRefId: text("billing_ref_id"),
  billingReferralId: text("billing_referral_id"),
  permanentAddressLatitude: text("permanent_address_latitude"),
  permanentAddressLongitude: text("permanent_address_longitude"),
  practiceId: text("practice_id"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkInvoiceDetailLoadRunFile = foreignKey({
  columns: [invoiceDetailRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_invoice_detail_load_run_file",
});
