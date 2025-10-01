/**
 * Hash utilities for SCD2 change detection
 */

import { createHash } from "crypto";

/**
 * Generate a hash from an object's tracked attributes
 * Used for efficient change detection in SCD2
 */
export function generateAttributeHash(
  attributes: Record<string, unknown>,
  trackedFields: string[]
): string {
  // Extract only tracked fields in sorted order for consistency
  const trackedValues: Record<string, unknown> = {};

  for (const field of trackedFields.sort()) {
    const value = attributes[field];

    // Normalize value for hashing
    trackedValues[field] = normalizeValueForHash(value);
  }

  // Convert to JSON and hash
  const jsonString = JSON.stringify(trackedValues);
  return createHash("sha256").update(jsonString).digest("hex");
}

/**
 * Normalize a value for consistent hashing
 */
function normalizeValueForHash(value: unknown): unknown {
  // Null and undefined treated the same
  if (value === null || value === undefined) {
    return null;
  }

  // Dates converted to ISO string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Numbers: handle special cases
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    if (!Number.isFinite(value)) return null;
    // Round decimals to avoid floating point issues
    return Math.round(value * 1000000) / 1000000;
  }

  // Strings: trim and lowercase
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  // Booleans: pass through
  if (typeof value === "boolean") {
    return value;
  }

  // Objects/Arrays: recursively normalize (for nested structures)
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map(normalizeValueForHash);
    }
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      normalized[k] = normalizeValueForHash(v);
    }
    return normalized;
  }

  return value;
}

/**
 * Compare two attribute hashes
 */
export function hashesMatch(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}

/**
 * Generate business key string for lookups
 */
export function generateBusinessKeyString(
  businessKey: Record<string, unknown>
): string {
  // Sort keys for consistency
  const sortedKeys = Object.keys(businessKey).sort();
  const keyParts: string[] = [];

  for (const key of sortedKeys) {
    const value = businessKey[key];
    const normalized = normalizeValueForHash(value);
    keyParts.push(`${key}:${JSON.stringify(normalized)}`);
  }

  return keyParts.join("|");
}

/**
 * Extract business key from record
 */
export function extractBusinessKey(
  record: Record<string, unknown>,
  businessKeyFields: string[]
): Record<string, unknown> {
  const businessKey: Record<string, unknown> = {};

  for (const field of businessKeyFields) {
    if (!(field in record)) {
      throw new Error(`Business key field '${field}' not found in record`);
    }
    businessKey[field] = record[field];
  }

  return businessKey;
}

/**
 * Validate business key completeness
 */
export function validateBusinessKey(
  businessKey: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = businessKey[field];
    if (value === null || value === undefined || value === "") {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
