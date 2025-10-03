/**
 * Vaccine Dimension Handler
 * Handles loading of vaccine dimension with SCD2
 */

import { BaseDimensionHandler } from "./base-dimension-handler";
import type { DimensionHandlerConfig } from "../../types/dimension";
import type { SCD2Config } from "../../types/scd2";
import { DimensionType } from "../../types/scd2";

/**
 * Vaccine dimension handler configuration
 */
const vaccineConfig: DimensionHandlerConfig = {
  dimensionType: DimensionType.VACCINE,
  sourceTable: "stg.vaccine",
  targetTable: "core.vaccine",
  businessKeyFields: ["vaccine_id", "practice_id", "per_org_id"],

  // Significant fields
  significantFields: [
    "vaccine_name",
    "vaccine_code",
    "coding_system",
    "gender",
    "is_nir",
    "is_active",
  ],

  // Non-significant fields (updated in place)
  nonSignificantFields: ["long_description"],

  fieldMappings: [
    // Core identifiers
    { sourceField: "vaccine_id", targetField: "vaccineId", required: true },
    { sourceField: "practice_id", targetField: "practiceId", required: true },
    { sourceField: "per_org_id", targetField: "perOrgId", required: true },

    // Core vaccine attributes (significant)
    {
      sourceField: "vaccine_code",
      targetField: "vaccineCode",
      required: true,
    },
    {
      sourceField: "vaccine_name",
      targetField: "vaccineName",
      required: true,
    },
    {
      sourceField: "long_description",
      targetField: "longDescription",
      required: false,
    },
    {
      sourceField: "coding_system",
      targetField: "codingSystem",
      required: false,
    },
    { sourceField: "gender", targetField: "gender", required: false },
    {
      sourceField: "is_nir",
      targetField: "isNir",
      required: false,
      defaultValue: false,
    },

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
 * SCD2 configuration for vaccine dimension
 */
const vaccineSCD2Config: SCD2Config = {
  dimensionType: DimensionType.VACCINE,
  businessKeyFields: ["vaccine_id", "practice_id", "per_org_id"],
  trackedFields: [
    "vaccine_name",
    "vaccine_code",
    "coding_system",
    "gender",
    "is_nir",
    "is_active",
  ],
  comparisonRules: [
    // Vaccine identifiers - always version
    { fieldName: "vaccine_name", compareType: "always_version", weight: 1.0 },
    { fieldName: "vaccine_code", compareType: "always_version", weight: 1.0 },

    // Classification changes - significant
    { fieldName: "coding_system", compareType: "significant", weight: 0.7 },
    { fieldName: "gender", compareType: "significant", weight: 0.6 },
    { fieldName: "is_nir", compareType: "significant", weight: 0.5 },

    // Status - significant
    { fieldName: "is_active", compareType: "always_version", weight: 0.8 },

    // Non-significant fields
    { fieldName: "long_description", compareType: "never_version", weight: 0 },
  ],
  changeThreshold: 0.5,
};

/**
 * Vaccine dimension handler
 */
export class VaccineDimensionHandler extends BaseDimensionHandler {
  constructor() {
    super(vaccineConfig, vaccineSCD2Config);
  }

  getDimensionType(): DimensionType {
    return DimensionType.VACCINE;
  }
}
