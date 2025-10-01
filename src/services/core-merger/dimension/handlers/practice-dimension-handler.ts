/**
 * Practice Dimension Handler
 * Handles loading of practice dimension with SCD2
 */

import { BaseDimensionHandler } from "./base-dimension-handler";
import type { DimensionHandlerConfig } from "../../types/dimension";
import type { SCD2Config } from "../../types/scd2";
import { DimensionType } from "../../types/scd2";

/**
 * Practice dimension handler configuration
 */
const practiceConfig: DimensionHandlerConfig = {
  dimensionType: DimensionType.PRACTICE,
  sourceTable: "stg.practice_info",
  targetTable: "core.practice",
  businessKeyFields: ["practiceId", "perOrgId"],

  // Significant fields
  significantFields: [
    "practiceName",
    "practiceCategory",
    "pho",
    "legalStatus",
    "ownershipModel",
    "isActive",
  ],

  // Non-significant fields
  nonSignificantFields: [
    "primaryPhone",
    "secondaryPhone",
    "primaryEmail",
    "secondaryEmail",
  ],

  fieldMappings: [
    // Core identifiers
    { sourceField: "practiceId", targetField: "practiceId", required: true },
    { sourceField: "perOrgId", targetField: "perOrgId", required: true },

    // Core practice attributes (significant)
    {
      sourceField: "practiceName",
      targetField: "practiceName",
      required: true,
    },
    {
      sourceField: "practiceCategory",
      targetField: "practiceCategory",
      required: false,
    },
    {
      sourceField: "practiceSpeciality",
      targetField: "practiceSpeciality",
      required: false,
    },
    { sourceField: "pho", targetField: "pho", required: false },
    {
      sourceField: "organizationType",
      targetField: "organizationType",
      required: false,
    },
    {
      sourceField: "orgShortName",
      targetField: "orgShortName",
      required: false,
    },
    { sourceField: "orgCode", targetField: "orgCode", required: false },
    { sourceField: "ediAccount", targetField: "ediAccount", required: false },

    // Legal information (significant)
    {
      sourceField: "legalEntityTitle",
      targetField: "legalEntityTitle",
      required: false,
    },
    { sourceField: "legalStatus", targetField: "legalStatus", required: false },
    {
      sourceField: "incorporationNumber",
      targetField: "incorporationNumber",
      required: false,
    },
    {
      sourceField: "ownershipModel",
      targetField: "ownershipModel",
      required: false,
    },
    {
      sourceField: "rural",
      targetField: "rural",
      required: false,
      defaultValue: false,
    },

    // Contact information (non-significant)
    {
      sourceField: "primaryPhone",
      targetField: "primaryPhone",
      required: false,
    },
    {
      sourceField: "secondaryPhone",
      targetField: "secondaryPhone",
      required: false,
    },
    {
      sourceField: "primaryEmail",
      targetField: "primaryEmail",
      required: false,
    },
    {
      sourceField: "secondaryEmail",
      targetField: "secondaryEmail",
      required: false,
    },

    // Identifiers
    {
      sourceField: "healthFacilityNo",
      targetField: "healthFacilityNo",
      required: false,
    },
    {
      sourceField: "hpiFacilityNo",
      targetField: "hpiFacilityNo",
      required: false,
    },
    { sourceField: "gstNo", targetField: "gstNo", required: false },
    { sourceField: "accNo", targetField: "accNo", required: false },

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
 * SCD2 configuration for practice dimension
 */
const practiceSCD2Config: SCD2Config = {
  dimensionType: DimensionType.PRACTICE,
  businessKeyFields: ["practiceId", "perOrgId"],
  trackedFields: [
    "practiceName",
    "practiceCategory",
    "pho",
    "legalStatus",
    "ownershipModel",
    "isActive",
  ],
  comparisonRules: [
    // Practice name - always version
    { fieldName: "practiceName", compareType: "always_version", weight: 1.0 },

    // Category and organizational changes - significant
    { fieldName: "practiceCategory", compareType: "significant", weight: 0.7 },
    { fieldName: "pho", compareType: "always_version", weight: 0.8 },
    { fieldName: "legalStatus", compareType: "always_version", weight: 0.9 },
    { fieldName: "ownershipModel", compareType: "significant", weight: 0.6 },

    // Status - significant
    { fieldName: "isActive", compareType: "always_version", weight: 0.8 },

    // Contact info - never version
    { fieldName: "primaryPhone", compareType: "never_version", weight: 0 },
    { fieldName: "secondaryPhone", compareType: "never_version", weight: 0 },
    { fieldName: "primaryEmail", compareType: "never_version", weight: 0 },
    { fieldName: "secondaryEmail", compareType: "never_version", weight: 0 },
  ],
  changeThreshold: 0.5,
};

/**
 * Practice dimension handler
 */
export class PracticeDimensionHandler extends BaseDimensionHandler {
  constructor() {
    super(practiceConfig, practiceSCD2Config);
  }

  getDimensionType(): DimensionType {
    return DimensionType.PRACTICE;
  }
}
