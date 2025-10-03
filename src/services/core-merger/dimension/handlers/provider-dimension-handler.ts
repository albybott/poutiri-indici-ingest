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
  businessKeyFields: ["provider_id", "practice_id", "per_org_id"],

  // Significant fields
  significantFields: [
    "nhi_number",
    "first_name",
    "middle_name",
    "family_name",
    "full_name",
    "dob",
    "gender",
    "provider_code",
    "nzmc_no",
    "hpi_no",
    "is_active",
  ],

  // Non-significant fields
  nonSignificantFields: ["email", "cell_number", "user_role"],

  fieldMappings: [
    // Core identifiers
    { sourceField: "provider_id", targetField: "providerId", required: true },
    { sourceField: "practice_id", targetField: "practiceId", required: true },
    { sourceField: "per_org_id", targetField: "perOrgId", required: true },

    // Professional identifiers (significant)
    { sourceField: "nhi_number", targetField: "nhiNumber", required: false },
    { sourceField: "nzmc_no", targetField: "nzmcNo", required: false },
    { sourceField: "npi_no", targetField: "npiNo", required: false },
    {
      sourceField: "provider_code",
      targetField: "providerCode",
      required: false,
    },
    {
      sourceField: "accreditation_no",
      targetField: "accreditationNo",
      required: false,
    },
    { sourceField: "hpi_no", targetField: "hpiNo", required: false },

    // Personal details (significant)
    { sourceField: "first_name", targetField: "firstName", required: false },
    { sourceField: "middle_name", targetField: "middleName", required: false },
    { sourceField: "family_name", targetField: "familyName", required: true },
    { sourceField: "full_name", targetField: "fullName", required: true },
    {
      sourceField: "preferred_name",
      targetField: "preferredName",
      required: false,
    },
    { sourceField: "title", targetField: "title", required: false },
    { sourceField: "gender", targetField: "gender", required: false },
    { sourceField: "dob", targetField: "dob", required: false },
    {
      sourceField: "is_alive",
      targetField: "isAlive",
      required: false,
      defaultValue: true,
    },
    { sourceField: "death_date", targetField: "deathDate", required: false },

    // Practice relationship (non-significant)
    {
      sourceField: "practice_name",
      targetField: "practiceName",
      required: false,
    },
    { sourceField: "user_role", targetField: "userRole", required: false },

    // Contact information
    { sourceField: "email", targetField: "email", required: false },
    { sourceField: "cell_number", targetField: "cellNumber", required: false },

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
 * SCD2 configuration for provider dimension
 */
const providerSCD2Config: SCD2Config = {
  dimensionType: DimensionType.PROVIDER,
  businessKeyFields: ["provider_id", "practice_id", "per_org_id"],
  trackedFields: [
    "nhi_number",
    "first_name",
    "middle_name",
    "family_name",
    "full_name",
    "dob",
    "gender",
    "provider_code",
    "nzmc_no",
    "hpi_no",
    "is_active",
  ],
  comparisonRules: [
    // Professional identifiers - always version
    { fieldName: "nhi_number", compareType: "always_version", weight: 1.0 },
    { fieldName: "provider_code", compareType: "always_version", weight: 1.0 },
    { fieldName: "nzmc_no", compareType: "always_version", weight: 0.9 },
    { fieldName: "hpi_no", compareType: "always_version", weight: 0.9 },

    // Name changes - significant
    { fieldName: "first_name", compareType: "significant", weight: 0.7 },
    { fieldName: "middle_name", compareType: "significant", weight: 0.3 },
    { fieldName: "family_name", compareType: "always_version", weight: 1.0 },
    { fieldName: "full_name", compareType: "significant", weight: 0.8 },

    // Demographics
    { fieldName: "dob", compareType: "always_version", weight: 1.0 },
    { fieldName: "gender", compareType: "significant", weight: 0.5 },

    // Status - significant
    { fieldName: "is_active", compareType: "always_version", weight: 0.8 },

    // Non-significant fields
    { fieldName: "email", compareType: "never_version", weight: 0 },
    { fieldName: "cell_number", compareType: "never_version", weight: 0 },
    { fieldName: "user_role", compareType: "never_version", weight: 0 },
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
