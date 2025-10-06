import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Medicine staging transformations
 * Converts raw text columns to typed staging columns
 */
export const medicineTransformations: ColumnTransformation[] = [
  {
    sourceColumn: "medicine_id",
    targetColumn: "medicineId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "medicine_name",
    targetColumn: "medicineName",
    targetType: ColumnType.TEXT,
    required: true,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "medicine_short_name",
    targetColumn: "medicineShortName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "sct_id",
    targetColumn: "sctid",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "type",
    targetColumn: "type",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "pharma_code",
    targetColumn: "pharmaCode",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: true,
  },
  {
    sourceColumn: "is_deleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
  },
];
