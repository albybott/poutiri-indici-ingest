/**
 * Medicine Dimension Handler
 * Handles loading of medicine dimension with SCD2
 */

import { BaseDimensionHandler } from "./base-dimension-handler";
import type { DimensionHandlerConfig } from "../../types/dimension";
import type { SCD2Config } from "../../types/scd2";
import { DimensionType } from "../../types/scd2";

/**
 * Medicine dimension handler configuration
 */
const medicineConfig: DimensionHandlerConfig = {
  dimensionType: DimensionType.MEDICINE,
  sourceTable: "stg.medicine",
  targetTable: "core.medicine",
  businessKeyFields: ["medicine_id", "practice_id", "per_org_id"],

  // Significant fields
  significantFields: [
    "medicine_name",
    "sctid",
    "type",
    "pharma_code",
    "is_active",
  ],

  // Non-significant fields (updated in place)
  nonSignificantFields: ["medicine_short_name"],

  fieldMappings: [
    // Core identifiers
    { sourceField: "medicine_id", targetField: "medicineId", required: true },
    { sourceField: "practice_id", targetField: "practiceId", required: true },
    { sourceField: "per_org_id", targetField: "perOrgId", required: true },

    // Core medicine attributes (significant)
    {
      sourceField: "medicine_name",
      targetField: "medicineName",
      required: true,
    },
    {
      sourceField: "medicine_short_name",
      targetField: "medicineShortName",
      required: false,
    },
    { sourceField: "sctid", targetField: "sctid", required: false },
    { sourceField: "type", targetField: "type", required: false },
    { sourceField: "pharma_code", targetField: "pharmaCode", required: false },

    // Status
    {
      sourceField: "is_active",
      targetField: "isActive",
      required: false,
      defaultValue: true,
    },
    {
      sourceField: "is_deleted",
      targetField: "isDeleted",
      required: false,
      defaultValue: false,
    },
  ],
};

/**
 * SCD2 configuration for medicine dimension
 */
const medicineSCD2Config: SCD2Config = {
  dimensionType: DimensionType.MEDICINE,
  businessKeyFields: ["medicine_id", "practice_id", "per_org_id"],
  trackedFields: ["medicine_name", "sctid", "type", "pharma_code", "is_active"],
  comparisonRules: [
    // Medicine name - always version
    { fieldName: "medicine_name", compareType: "always_version", weight: 1.0 },

    // Classification changes - significant
    { fieldName: "sctid", compareType: "always_version", weight: 0.9 },
    { fieldName: "type", compareType: "significant", weight: 0.7 },
    { fieldName: "pharma_code", compareType: "significant", weight: 0.6 },

    // Status - significant
    { fieldName: "is_active", compareType: "always_version", weight: 0.8 },

    // Non-significant fields
    {
      fieldName: "medicine_short_name",
      compareType: "never_version",
      weight: 0,
    },
  ],
  changeThreshold: 0.5,
};

/**
 * Medicine dimension handler
 */
export class MedicineDimensionHandler extends BaseDimensionHandler {
  constructor() {
    super(medicineConfig, medicineSCD2Config);
  }

  getDimensionType(): DimensionType {
    return DimensionType.MEDICINE;
  }
}
