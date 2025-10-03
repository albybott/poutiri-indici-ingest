/**
 * Patient Dimension Handler
 * Handles loading of patient dimension with SCD2
 */

import { BaseDimensionHandler } from "./base-dimension-handler";
import type { DimensionHandlerConfig } from "../../types/dimension";
import type { SCD2Config } from "../../types/scd2";
import { DimensionType } from "../../types/scd2";

/**
 * Patient dimension handler configuration
 */
const patientConfig: DimensionHandlerConfig = {
  dimensionType: DimensionType.PATIENT,
  sourceTable: "stg.patients",
  targetTable: "core.patient",
  businessKeyFields: ["patient_id", "practice_id", "per_org_id"],

  // Significant fields that trigger SCD2 versioning (core demographics)
  significantFields: [
    "nhi_number",
    "first_name",
    "middle_name",
    "family_name",
    "full_name",
    "preferred_name",
    "dob",
    "gender",
    "is_alive",
    "death_date",
    "ethnicity",
    "marital_status",
    "residential_status",
    "age_group",
  ],

  // Non-significant fields (contact & location info - updated in place)
  nonSignificantFields: [
    "title",
    "age",
    "email",
    "cell_number",
    "day_phone",
    "night_phone",
    "permanent_address_city",
    "permanent_address_suburb",
    "permanent_address_postal_code",
    "permanent_address_dhb_code",
    "permanent_address_deprivation_quintile",
    "provider_id",
    "practice_name",
    "is_active",
    "is_deleted",
  ],

  fieldMappings: [
    // Core identifiers
    // { sourceField: "patient_id", targetField: "patient_id", required: true },
    // { sourceField: "practice_id", targetField: "practice_id", required: true },
    // { sourceField: "per_org_id", targetField: "per_org_id", required: true },

    // Personal details (significant)
    {
      sourceField: "nhi_number",
      targetField: "nhi_number",
      required: false,
    },
    { sourceField: "title", targetField: "title", required: false },
    { sourceField: "first_name", targetField: "first_name", required: false },
    { sourceField: "middle_name", targetField: "middle_name", required: false },
    { sourceField: "family_name", targetField: "family_name", required: false },
    { sourceField: "full_name", targetField: "full_name", required: false },
    {
      sourceField: "preferred_name",
      targetField: "preferred_name",
      required: false,
    },
    { sourceField: "gender", targetField: "gender", required: false },
    { sourceField: "dob", targetField: "dob", required: false },
    { sourceField: "age", targetField: "age", required: false },
    { sourceField: "age_group", targetField: "age_group", required: false },
    {
      sourceField: "is_alive",
      targetField: "is_alive",
      required: false,
      defaultValue: true,
    },
    { sourceField: "death_date", targetField: "death_date", required: false },
    {
      sourceField: "marital_status",
      targetField: "marital_status",
      required: false,
    },
    { sourceField: "ethnicity", targetField: "ethnicity", required: false },
    {
      sourceField: "residential_status",
      targetField: "residential_status",
      required: false,
    },

    // Status flags
    {
      sourceField: "is_active",
      targetField: "is_active",
      required: false,
      defaultValue: true,
    },
    {
      sourceField: "is_deleted",
      targetField: "is_deleted",
      required: false,
      defaultValue: false,
    },

    // Contact info (non-significant)
    { sourceField: "cell_number", targetField: "cell_number", required: false },
    { sourceField: "day_phone", targetField: "day_phone", required: false },
    { sourceField: "night_phone", targetField: "night_phone", required: false },
    { sourceField: "email", targetField: "email", required: false },

    // Address (non-significant - generalized for privacy)
    {
      sourceField: "permanent_address_city",
      targetField: "permanent_address_city",
      required: false,
    },
    {
      sourceField: "permanent_address_suburb",
      targetField: "permanent_address_suburb",
      required: false,
    },
    {
      sourceField: "permanent_address_postal_code",
      targetField: "permanent_address_postal_code",
      required: false,
    },
    {
      sourceField: "permanent_address_dhb_code",
      targetField: "permanent_address_dhb_code",
      required: false,
    },
    {
      sourceField: "permanent_address_deprivation_quintile",
      targetField: "permanent_address_deprivation_quintile",
      required: false,
    },

    // Provider relationship
    { sourceField: "provider_id", targetField: "provider_id", required: false },
    {
      sourceField: "practice_name",
      targetField: "practice_name",
      required: false,
    },
  ],
};

/**
 * SCD2 configuration for patient dimension
 */
const patientSCD2Config: SCD2Config = {
  dimensionType: DimensionType.PATIENT,
  businessKeyFields: ["patient_id", "practice_id", "per_org_id"],
  trackedFields: [
    "nhi_number",
    "first_name",
    "middle_name",
    "family_name",
    "full_name",
    "preferred_name",
    "dob",
    "gender",
    "is_alive",
    "death_date",
    "ethnicity",
    "marital_status",
    "residential_status",
    "age_group",
  ],
  comparisonRules: [
    // Critical identifiers - always create new version
    { fieldName: "nhi_number", compareType: "always_version", weight: 1.0 },
    { fieldName: "dob", compareType: "always_version", weight: 1.0 },
    { fieldName: "is_alive", compareType: "always_version", weight: 1.0 },
    { fieldName: "death_date", compareType: "always_version", weight: 1.0 },

    // Core name fields - high significance
    { fieldName: "family_name", compareType: "always_version", weight: 1.0 },
    { fieldName: "full_name", compareType: "significant", weight: 0.9 },
    { fieldName: "first_name", compareType: "significant", weight: 0.8 },
    { fieldName: "preferred_name", compareType: "significant", weight: 0.7 },

    // Demographics - medium significance
    { fieldName: "middle_name", compareType: "significant", weight: 0.3 },
    { fieldName: "gender", compareType: "significant", weight: 0.6 },
    { fieldName: "ethnicity", compareType: "significant", weight: 0.5 },
    { fieldName: "marital_status", compareType: "significant", weight: 0.3 },
    {
      fieldName: "residential_status",
      compareType: "significant",
      weight: 0.4,
    },
    { fieldName: "age_group", compareType: "significant", weight: 0.2 },

    // Contact & location - never version (updated in place)
    { fieldName: "title", compareType: "never_version", weight: 0 },
    { fieldName: "age", compareType: "never_version", weight: 0 },
    { fieldName: "email", compareType: "never_version", weight: 0 },
    { fieldName: "cell_number", compareType: "never_version", weight: 0 },
    { fieldName: "day_phone", compareType: "never_version", weight: 0 },
    { fieldName: "night_phone", compareType: "never_version", weight: 0 },
    {
      fieldName: "permanent_address_city",
      compareType: "never_version",
      weight: 0,
    },
    {
      fieldName: "permanent_address_suburb",
      compareType: "never_version",
      weight: 0,
    },
    {
      fieldName: "permanent_address_postal_code",
      compareType: "never_version",
      weight: 0,
    },
    {
      fieldName: "permanent_address_dhb_code",
      compareType: "never_version",
      weight: 0,
    },
    {
      fieldName: "permanent_address_deprivation_quintile",
      compareType: "never_version",
      weight: 0,
    },
    { fieldName: "provider_id", compareType: "never_version", weight: 0 },
    { fieldName: "practice_name", compareType: "never_version", weight: 0 },
    { fieldName: "is_active", compareType: "never_version", weight: 0 },
    { fieldName: "is_deleted", compareType: "never_version", weight: 0 },
  ],
  changeThreshold: 0.4, // Lower threshold - 40% weighted significance to create new version
};

/**
 * Patient dimension handler
 */
export class PatientDimensionHandler extends BaseDimensionHandler {
  constructor() {
    super(patientConfig, patientSCD2Config);
  }

  getDimensionType(): DimensionType {
    return DimensionType.PATIENT;
  }
}
