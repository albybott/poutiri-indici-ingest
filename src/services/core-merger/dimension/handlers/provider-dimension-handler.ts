/**
 * Provider Dimension Handler
 * Handles loading of provider dimension with SCD2
 */

import { BaseDimensionHandler } from "./base-dimension-handler";
import type { DimensionHandlerConfig } from "../../types/dimension";
import type { SCD2Config } from "../../types/scd2";
import { DimensionType } from "../../types/scd2";

/**
 * Provider dimension handler configuration
 */
const providerConfig: DimensionHandlerConfig = {
  dimensionType: DimensionType.PROVIDER,
  sourceTable: "stg.providers",
  targetTable: "core.provider",
  businessKeyFields: ["providerId", "practiceId", "perOrgId"],

  // Significant fields
  significantFields: [
    "nhiNumber",
    "firstName",
    "middleName",
    "familyName",
    "fullName",
    "dob",
    "gender",
    "providerCode",
    "nzmcNo",
    "hpiNo",
    "isActive",
  ],

  // Non-significant fields
  nonSignificantFields: ["email", "cellNumber", "userRole"],

  fieldMappings: [
    // Core identifiers
    { sourceField: "providerId", targetField: "providerId", required: true },
    { sourceField: "practiceId", targetField: "practiceId", required: true },
    { sourceField: "perOrgId", targetField: "perOrgId", required: true },

    // Professional identifiers (significant)
    { sourceField: "nhiNumber", targetField: "nhiNumber", required: false },
    { sourceField: "nzmcNo", targetField: "nzmcNo", required: false },
    { sourceField: "npiNo", targetField: "npiNo", required: false },
    {
      sourceField: "providerCode",
      targetField: "providerCode",
      required: false,
    },
    {
      sourceField: "accreditationNo",
      targetField: "accreditationNo",
      required: false,
    },
    { sourceField: "hpiNo", targetField: "hpiNo", required: false },

    // Personal details (significant)
    { sourceField: "firstName", targetField: "firstName", required: false },
    { sourceField: "middleName", targetField: "middleName", required: false },
    { sourceField: "familyName", targetField: "familyName", required: true },
    { sourceField: "fullName", targetField: "fullName", required: true },
    {
      sourceField: "preferredName",
      targetField: "preferredName",
      required: false,
    },
    { sourceField: "title", targetField: "title", required: false },
    { sourceField: "gender", targetField: "gender", required: false },
    { sourceField: "dob", targetField: "dob", required: false },
    {
      sourceField: "isAlive",
      targetField: "isAlive",
      required: false,
      defaultValue: true,
    },
    { sourceField: "deathDate", targetField: "deathDate", required: false },

    // Practice relationship (non-significant)
    {
      sourceField: "practiceName",
      targetField: "practiceName",
      required: false,
    },
    { sourceField: "userRole", targetField: "userRole", required: false },

    // Status
    {
      sourceField: "isActive",
      targetField: "isActive",
      required: false,
      defaultValue: true,
    },
    {
      sourceField: "isDeleted",
      targetField: "isDeleted",
      required: false,
      defaultValue: false,
    },
  ],
};

/**
 * SCD2 configuration for provider dimension
 */
const providerSCD2Config: SCD2Config = {
  dimensionType: DimensionType.PROVIDER,
  businessKeyFields: ["providerId", "practiceId", "perOrgId"],
  trackedFields: [
    "nhiNumber",
    "firstName",
    "middleName",
    "familyName",
    "fullName",
    "dob",
    "gender",
    "providerCode",
    "nzmcNo",
    "hpiNo",
    "isActive",
  ],
  comparisonRules: [
    // Professional identifiers - always version
    { fieldName: "nhiNumber", compareType: "always_version", weight: 1.0 },
    { fieldName: "providerCode", compareType: "always_version", weight: 1.0 },
    { fieldName: "nzmcNo", compareType: "always_version", weight: 0.9 },
    { fieldName: "hpiNo", compareType: "always_version", weight: 0.9 },

    // Name changes - significant
    { fieldName: "firstName", compareType: "significant", weight: 0.7 },
    { fieldName: "middleName", compareType: "significant", weight: 0.3 },
    { fieldName: "familyName", compareType: "always_version", weight: 1.0 },
    { fieldName: "fullName", compareType: "significant", weight: 0.8 },

    // Demographics
    { fieldName: "dob", compareType: "always_version", weight: 1.0 },
    { fieldName: "gender", compareType: "significant", weight: 0.5 },

    // Status - significant
    { fieldName: "isActive", compareType: "always_version", weight: 0.8 },

    // Non-significant fields
    { fieldName: "userRole", compareType: "never_version", weight: 0 },
  ],
  changeThreshold: 0.5,
};

/**
 * Provider dimension handler
 */
export class ProviderDimensionHandler extends BaseDimensionHandler {
  constructor() {
    super(providerConfig, providerSCD2Config);
  }

  getDimensionType(): DimensionType {
    return DimensionType.PROVIDER;
  }
}
