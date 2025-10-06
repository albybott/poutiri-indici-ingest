import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Vaccine staging transformations
 * Converts raw text columns to typed staging columns
 */
export const vaccineTransformations: ColumnTransformation[] = [
  {
    sourceColumn: "vaccine_id",
    targetColumn: "vaccineId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "vaccine_code",
    targetColumn: "vaccineCode",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "vaccine_name",
    targetColumn: "vaccineName",
    targetType: ColumnType.TEXT,
    required: true,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "long_description",
    targetColumn: "longDescription",
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
    sourceColumn: "is_deleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "coding_system",
    targetColumn: "codingSystem",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "gender_id",
    targetColumn: "genderId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "gender",
    targetColumn: "gender",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "is_nir",
    targetColumn: "isNir",
    targetType: ColumnType.BOOLEAN,
    required: false,
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
