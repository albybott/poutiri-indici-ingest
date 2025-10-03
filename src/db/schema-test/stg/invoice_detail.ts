import {
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  integer,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";

export const invoiceDetailStg = createTable(
  "stg.invoice_detail",
  {
    // Typed columns with proper constraints
    invoiceDetailId: text("invoice_detail_id").notNull(),
    invoiceTransactionId: text("invoice_transaction_id"),
    masterServiceSubServiceId: text("master_service_sub_service_id"),
    appointmentServiceId: text("appointment_service_id"),
    comments: text("comments"),
    quantity: decimal("quantity", { precision: 10, scale: 3 }),
    claimAmount: decimal("claim_amount", { precision: 10, scale: 2 }),
    coPayment: decimal("co_payment", { precision: 10, scale: 2 }),
    grossClaimAmount: decimal("gross_claim_amount", {
      precision: 10,
      scale: 2,
    }),
    grossCoPayment: decimal("gross_co_payment", { precision: 10, scale: 2 }),
    isBillingAmount: boolean("is_billing_amount"),
    funderId: text("funder_id"),
    funderName: text("funder_name"),
    contractServiceId: text("contract_service_id"),
    contractServiceName: text("contract_service_name"),
    isFunded: boolean("is_funded"),
    submissionStatus: text("submission_status"),
    caseNo: text("case_no"),
    sequenceNo: integer("sequence_no"),
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
    duration: integer("duration"), // minutes
    isCommonService: boolean("is_common_service"),
    serviceCodeForClaim: text("service_code_for_claim"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    updatedById: text("updated_by_id"),
    insertedBy: text("inserted_by"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    userLoggingId: text("user_logging_id"),
    loggingUserName: text("logging_user_name"),
    billingRefId: text("billing_ref_id"),
    billingReferralId: text("billing_referral_id"),
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("invoice_detail_stg_natural_key_idx").on(
      table.invoiceDetailId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);
