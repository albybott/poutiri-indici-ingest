import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  check,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const invoicesStg = createTable(
  "stg.invoices",
  {
    // Typed columns with proper constraints
    invoiceTransactionId: text("invoice_transaction_id").notNull(),
    patientId: text("patient_id").notNull(),
    acDate: date("ac_date"),
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

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("invoices_stg_natural_key_idx").on(
      table.invoiceTransactionId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkInvoicesStgLoadRunFile = foreignKey({
  columns: [invoicesStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_invoices_stg_load_run_file",
});




