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
  businessKeyFields: ["patientId", "practiceId", "perOrgId"],

  // Significant fields that trigger SCD2 versioning
  significantFields: [
    "nhiNumber",
    "firstName",
    "middleName",
    "familyName",
    "fullName",
    "dob",
    "gender",
    "isAlive",
    "deathDate",
    "ethnicity",
    "maritalStatus",
  ],

  // Non-significant fields (updated in place)
  nonSignificantFields: [
    "email",
    "cellNumber",
    "dayPhone",
    "nightPhone",
    "balance",
    "permanentAddressCity",
    "permanentAddressSuburb",
    "permanentAddressPostalCode",
  ],

  fieldMappings: [
    // Core identifiers
    { sourceField: "patientId", targetField: "patientId", required: true },
    { sourceField: "practiceId", targetField: "practiceId", required: true },
    { sourceField: "perOrgId", targetField: "perOrgId", required: true },

    // NHI (hashed for privacy in core)
    {
      sourceField: "nhiNumber",
      targetField: "nhiNumberHash",
      required: false,
      transform: (value: unknown) => {
        if (!value) return null;
        // In production, this should use proper salted hashing
        // For now, just pass through (hashing will be added later)
        return value;
      },
    },

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
    { sourceField: "age", targetField: "age", required: false },
    {
      sourceField: "isAlive",
      targetField: "isAlive",
      required: false,
      defaultValue: true,
    },
    { sourceField: "deathDate", targetField: "deathDate", required: false },
    {
      sourceField: "maritalStatus",
      targetField: "maritalStatus",
      required: false,
    },
    { sourceField: "ethnicity", targetField: "ethnicity", required: false },
    {
      sourceField: "residentialStatus",
      targetField: "residentialStatus",
      required: false,
    },

    // Contact info (non-significant)
    { sourceField: "email", targetField: "email", required: false },
    { sourceField: "cellNumber", targetField: "cellNumber", required: false },
    { sourceField: "dayPhone", targetField: "dayPhone", required: false },
    { sourceField: "nightPhone", targetField: "nightPhone", required: false },

    // Address (non-significant - generalized for privacy)
    {
      sourceField: "permanentAddressCity",
      targetField: "permanentAddressCity",
      required: false,
    },
    {
      sourceField: "permanentAddressSuburb",
      targetField: "permanentAddressSuburb",
      required: false,
    },
    {
      sourceField: "permanentAddressPostalCode",
      targetField: "permanentAddressPostalCode",
      required: false,
    },
    {
      sourceField: "permanentAddressDhbCode",
      targetField: "permanentAddressDhbCode",
      required: false,
    },
    {
      sourceField: "permanentAddressDeprivationQuintile",
      targetField: "permanentAddressDeprivationQuintile",
      required: false,
    },

    // Provider relationship
    { sourceField: "providerId", targetField: "providerId", required: false },
    {
      sourceField: "practiceName",
      targetField: "practiceName",
      required: false,
    },

    // Status flags
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

    // Financial (non-significant)
    {
      sourceField: "balance",
      targetField: "balance",
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * SCD2 configuration for patient dimension
 */
const patientSCD2Config: SCD2Config = {
  dimensionType: DimensionType.PATIENT,
  businessKeyFields: ["patientId", "practiceId", "perOrgId"],
  trackedFields: [
    "nhiNumber",
    "firstName",
    "middleName",
    "familyName",
    "fullName",
    "dob",
    "gender",
    "isAlive",
    "deathDate",
    "ethnicity",
    "maritalStatus",
  ],
  comparisonRules: [
    // Demographics - always version
    { fieldName: "nhiNumber", compareType: "always_version", weight: 1.0 },
    { fieldName: "firstName", compareType: "significant", weight: 0.8 },
    { fieldName: "middleName", compareType: "significant", weight: 0.3 },
    { fieldName: "familyName", compareType: "always_version", weight: 1.0 },
    { fieldName: "fullName", compareType: "significant", weight: 0.9 },
    { fieldName: "dob", compareType: "always_version", weight: 1.0 },
    { fieldName: "gender", compareType: "significant", weight: 0.6 },
    { fieldName: "isAlive", compareType: "always_version", weight: 1.0 },
    { fieldName: "deathDate", compareType: "always_version", weight: 1.0 },
    { fieldName: "ethnicity", compareType: "significant", weight: 0.5 },
    { fieldName: "maritalStatus", compareType: "significant", weight: 0.3 },

    // Contact info - never version (updated in place)
    { fieldName: "email", compareType: "never_version", weight: 0 },
    { fieldName: "cellNumber", compareType: "never_version", weight: 0 },
    { fieldName: "balance", compareType: "never_version", weight: 0 },
  ],
  changeThreshold: 0.5, // 50% weighted significance to create new version
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
