import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Invoices staging transformations
 * Converts raw text columns to typed staging columns
 */
export const invoicesTransformations: ColumnTransformation[] = [
  // IDs - Keep as text
  {
    sourceColumn: "invoice_transaction_id",
    targetColumn: "invoiceTransactionId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "ac_date",
    targetColumn: "acDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "medtech_id",
    targetColumn: "medtechId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "payment_mode",
    targetColumn: "paymentMode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "total_amount",
    targetColumn: "totalAmount",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "unpaid_amount",
    targetColumn: "unpaidAmount",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "claim_notes",
    targetColumn: "claimNotes",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "description",
    targetColumn: "description",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "income_provider",
    targetColumn: "incomeProvider",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "invoice_payment_no",
    targetColumn: "invoicePaymentNo",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "provider",
    targetColumn: "provider",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "domicile_code",
    targetColumn: "domicileCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "inserted_at",
    targetColumn: "insertedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updated_at",
    targetColumn: "updatedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: true,
  },
  {
    sourceColumn: "transaction_type",
    targetColumn: "transactionType",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "provider_id",
    targetColumn: "providerId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "permanent_address_latitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "permanent_address_longitude",
    targetColumn: "permanentAddressLongitude",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "practice_location_id",
    targetColumn: "practiceLocationId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "location_name",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "notes",
    targetColumn: "notes",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "loaded_date_time",
    targetColumn: "loadedDateTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
];
