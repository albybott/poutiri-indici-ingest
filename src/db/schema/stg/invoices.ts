import {
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  date,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../../utils/create-table.js";

export const invoicesStg = createTable("stg.invoices_stg", {
  // Typed columns with proper constraints
  invoiceTransactionId: text("invoice_transaction_id").notNull(),
  patientId: text("patient_id"),
  acdate: date("acdate"),
  medtechId: text("medtech_id"),
  paymentMode: text("payment_mode"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  unpaidAmount: decimal("unpaid_amount", { precision: 10, scale: 2 }),
  claimNotes: text("claim_notes"),
  description: text("description"),
  incomeProvider: text("income_provider"),
  invoicePaymentNo: text("invoice_payment_no"),
  provider: text("provider"),
  domicileCode: text("domicile_code"),
  insertedAt: timestamp("inserted_at", { withTimezone: true }),
  insertedBy: text("inserted_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  updatedBy: text("updated_by"),
  isActive: boolean("is_active"),
  transactionType: text("transaction_type"),
  providerId: text("provider_id"),
  practiceId: text("practice_id").notNull(),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  notes: text("notes"),
  perOrgId: text("per_org_id").notNull(),
  loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

  // Lineage columns
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Add unique constraint on natural key
export const invoicesStgUniqueConstraint = check(
  "invoices_stg_unique_constraint",
  sql`invoice_transaction_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);
