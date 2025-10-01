/**
 * Business key utilities for fact and dimension tables
 */

import { FactType } from "../types/fact";
import { DimensionType } from "../types/scd2";

/**
 * Business key field definitions for each fact type
 */
export const factBusinessKeyFields: Record<FactType, string[]> = {
  [FactType.APPOINTMENT]: ["appointmentId", "practiceId", "perOrgId"],
  [FactType.IMMUNISATION]: [
    "appointmentImmunisationId",
    "practiceId",
    "perOrgId",
  ],
  [FactType.INVOICE]: ["invoiceTransactionId", "practiceId", "perOrgId"],
  [FactType.INVOICE_DETAIL]: ["invoiceDetailId", "practiceId", "perOrgId"],
  [FactType.DIAGNOSIS]: ["diagnosisId", "practiceId", "perOrgId"],
  [FactType.MEASUREMENT]: ["patientId", "practiceId", "perOrgId"],
};

/**
 * Business key field definitions for each dimension type
 */
export const dimensionBusinessKeyFields: Record<DimensionType, string[]> = {
  [DimensionType.PATIENT]: ["patientId", "practiceId", "perOrgId"],
  [DimensionType.PROVIDER]: ["providerId", "practiceId", "perOrgId"],
  [DimensionType.PRACTICE]: ["practiceId", "perOrgId"],
  [DimensionType.VACCINE]: ["vaccineId", "practiceId", "perOrgId"],
  [DimensionType.MEDICINE]: ["medicineId", "practiceId", "perOrgId"],
};

/**
 * Get business key fields for a fact type
 */
export function getFactBusinessKeyFields(factType: FactType): string[] {
  const fields = factBusinessKeyFields[factType];
  if (!fields) {
    throw new Error(`Unknown fact type: ${factType}`);
  }
  return fields;
}

/**
 * Get business key fields for a dimension type
 */
export function getDimensionBusinessKeyFields(
  dimensionType: DimensionType
): string[] {
  const fields = dimensionBusinessKeyFields[dimensionType];
  if (!fields) {
    throw new Error(`Unknown dimension type: ${dimensionType}`);
  }
  return fields;
}

/**
 * Extract business key from fact record
 */
export function extractFactBusinessKey(
  record: Record<string, unknown>,
  factType: FactType
): Record<string, unknown> {
  const keyFields = getFactBusinessKeyFields(factType);
  const businessKey: Record<string, unknown> = {};

  for (const field of keyFields) {
    if (!(field in record)) {
      throw new Error(
        `Business key field '${field}' not found in ${factType} record`
      );
    }
    businessKey[field] = record[field];
  }

  return businessKey;
}

/**
 * Extract business key from dimension record
 */
export function extractDimensionBusinessKey(
  record: Record<string, unknown>,
  dimensionType: DimensionType
): Record<string, unknown> {
  const keyFields = getDimensionBusinessKeyFields(dimensionType);
  const businessKey: Record<string, unknown> = {};

  for (const field of keyFields) {
    if (!(field in record)) {
      throw new Error(
        `Business key field '${field}' not found in ${dimensionType} record`
      );
    }
    businessKey[field] = record[field];
  }

  return businessKey;
}

/**
 * Generate a string representation of business key for logging/caching
 */
export function businessKeyToString(
  businessKey: Record<string, unknown>
): string {
  const parts: string[] = [];
  // Sort keys for consistency
  const sortedKeys = Object.keys(businessKey).sort();

  for (const key of sortedKeys) {
    parts.push(`${key}=${String(businessKey[key])}`);
  }

  return parts.join("|");
}

/**
 * Parse business key string back to object
 */
export function stringToBusinessKey(
  keyString: string
): Record<string, unknown> {
  const businessKey: Record<string, unknown> = {};
  const parts = keyString.split("|");

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value !== undefined) {
      businessKey[key] = value;
    }
  }

  return businessKey;
}

/**
 * Validate business key has all required fields and no null values
 */
export function validateBusinessKey(
  businessKey: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[]; nullFields: string[] } {
  const missingFields: string[] = [];
  const nullFields: string[] = [];

  for (const field of requiredFields) {
    if (!(field in businessKey)) {
      missingFields.push(field);
    } else {
      const value = businessKey[field];
      if (value === null || value === undefined || value === "") {
        nullFields.push(field);
      }
    }
  }

  return {
    valid: missingFields.length === 0 && nullFields.length === 0,
    missingFields,
    nullFields,
  };
}

/**
 * Compare two business keys for equality
 */
export function businessKeysEqual(
  key1: Record<string, unknown>,
  key2: Record<string, unknown>
): boolean {
  const keys1 = Object.keys(key1).sort();
  const keys2 = Object.keys(key2).sort();

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) {
      return false;
    }

    if (key1[keys1[i]] !== key2[keys2[i]]) {
      return false;
    }
  }

  return true;
}
