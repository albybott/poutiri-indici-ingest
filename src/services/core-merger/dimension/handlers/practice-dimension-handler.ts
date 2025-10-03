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
  businessKeyFields: ["practice_id", "per_org_id"],

  // Significant fields
  significantFields: [
    "practice_name",
    "practice_category",
    "pho",
    "legal_status",
    "ownership_model",
    "is_active",
  ],

  // Non-significant fields
  nonSignificantFields: [
    "primary_phone",
    "secondary_phone",
    "primary_email",
    "secondary_email",
  ],

  fieldMappings: [
    // Core identifiers
    { sourceField: "practice_id", targetField: "practiceId", required: true },
    { sourceField: "per_org_id", targetField: "perOrgId", required: true },

    // Core practice attributes (significant)
    {
      sourceField: "practice_name",
      targetField: "practiceName",
      required: true,
    },
    {
      sourceField: "practice_category",
      targetField: "practiceCategory",
      required: false,
    },
    {
      sourceField: "practice_speciality",
      targetField: "practiceSpeciality",
      required: false,
    },
    { sourceField: "pho", targetField: "pho", required: false },
    {
      sourceField: "organization_type",
      targetField: "organizationType",
      required: false,
    },
    {
      sourceField: "org_short_name",
      targetField: "orgShortName",
      required: false,
    },
    { sourceField: "org_code", targetField: "orgCode", required: false },
    { sourceField: "edi_account", targetField: "ediAccount", required: false },

    // Legal information (significant)
    {
      sourceField: "legal_entity_title",
      targetField: "legalEntityTitle",
      required: false,
    },
    {
      sourceField: "legal_status",
      targetField: "legalStatus",
      required: false,
    },
    {
      sourceField: "incorporation_number",
      targetField: "incorporationNumber",
      required: false,
    },
    {
      sourceField: "ownership_model",
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
      sourceField: "primary_phone",
      targetField: "primaryPhone",
      required: false,
    },
    {
      sourceField: "secondary_phone",
      targetField: "secondaryPhone",
      required: false,
    },
    {
      sourceField: "primary_email",
      targetField: "primaryEmail",
      required: false,
    },
    {
      sourceField: "secondary_email",
      targetField: "secondaryEmail",
      required: false,
    },

    // Identifiers
    {
      sourceField: "health_facility_no",
      targetField: "healthFacilityNo",
      required: false,
    },
    {
      sourceField: "hpi_facility_no",
      targetField: "hpiFacilityNo",
      required: false,
    },
    { sourceField: "gst_no", targetField: "gstNo", required: false },
    { sourceField: "acc_no", targetField: "accNo", required: false },

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
 * SCD2 configuration for practice dimension
 */
const practiceSCD2Config: SCD2Config = {
  dimensionType: DimensionType.PRACTICE,
  businessKeyFields: ["practice_id", "per_org_id"],
  trackedFields: [
    "practice_name",
    "practice_category",
    "pho",
    "legal_status",
    "ownership_model",
    "is_active",
  ],
  comparisonRules: [
    // Practice name - always version
    { fieldName: "practice_name", compareType: "always_version", weight: 1.0 },

    // Category and organizational changes - significant
    { fieldName: "practice_category", compareType: "significant", weight: 0.7 },
    { fieldName: "pho", compareType: "always_version", weight: 0.8 },
    { fieldName: "legal_status", compareType: "always_version", weight: 0.9 },
    { fieldName: "ownership_model", compareType: "significant", weight: 0.6 },

    // Status - significant
    { fieldName: "is_active", compareType: "always_version", weight: 0.8 },

    // Contact info - never version
    { fieldName: "primary_phone", compareType: "never_version", weight: 0 },
    { fieldName: "secondary_phone", compareType: "never_version", weight: 0 },
    { fieldName: "primary_email", compareType: "never_version", weight: 0 },
    { fieldName: "secondary_email", compareType: "never_version", weight: 0 },
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
