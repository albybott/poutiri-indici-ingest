import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createTable } from "../../../utils/create-table.js";

export const invoicesRaw = createTable("raw.invoices", {
  // Source columns as text (all fields from Invoices extract)
  invoiceTransactionId: text("invoice_transaction_id"),
  patientId: text("patient_id"),
  acdate: text("acdate"),
  medtechId: text("medtech_id"),
  paymentMode: text("payment_mode"),
  totalAmount: text("total_amount"),
  unpaidAmount: text("unpaid_amount"),
  claimNotes: text("claim_notes"),
  description: text("description"),
  incomeProvider: text("income_provider"),
  invoicePaymentNo: text("invoice_payment_no"),
  provider: text("provider"),
  domicileCode: text("domicile_code"),
  insertedAt: text("inserted_at"),
  insertedBy: text("inserted_by"),
  updatedAt: text("updated_at"),
  updatedBy: text("updated_by"),
  isActive: text("is_active"),
  transactionType: text("transaction_type"),
  providerId: text("provider_id"),
  practiceId: text("practice_id"),
  permanentAddressLatitude: text("permanent_address_latitude"),
  permanentAddressLongitude: text("permanent_address_longitude"),
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  notes: text("notes"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

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
