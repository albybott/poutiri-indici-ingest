/**
 * SCD2 utility functions
 */

import type {
  DimensionRecord,
  AttributeChange,
  ComparisonRule,
} from "../types/scd2";

/**
 * Compare two attribute values based on comparison rule
 */
export function compareAttributes(
  oldValue: unknown,
  newValue: unknown,
  rule: ComparisonRule
): boolean {
  // Handle custom comparator
  if (rule.customComparator) {
    return rule.customComparator(oldValue, newValue);
  }

  // Null/undefined handling
  const oldIsEmpty = oldValue === null || oldValue === undefined;
  const newIsEmpty = newValue === null || newValue === undefined;

  if (oldIsEmpty && newIsEmpty) {
    return true; // Both empty - no change
  }

  if (oldIsEmpty !== newIsEmpty) {
    return false; // One empty, one not - change detected
  }

  // Type-specific comparison
  switch (rule.compareType) {
    case "exact":
      return exactMatch(oldValue, newValue);

    case "significant":
      return significantMatch(oldValue, newValue);

    case "always_version":
      return false; // Always create new version if this field changes

    case "never_version":
      return true; // Never create new version for this field

    default:
      return exactMatch(oldValue, newValue);
  }
}

/**
 * Exact value match
 */
function exactMatch(oldValue: unknown, newValue: unknown): boolean {
  // Dates
  if (oldValue instanceof Date && newValue instanceof Date) {
    return oldValue.getTime() === newValue.getTime();
  }

  // Simple equality
  return oldValue === newValue;
}

/**
 * Significant match (allows minor differences)
 */
function significantMatch(oldValue: unknown, newValue: unknown): boolean {
  // Numbers - allow small floating point differences
  if (typeof oldValue === "number" && typeof newValue === "number") {
    const difference = Math.abs(oldValue - newValue);
    return difference < 0.0001; // Tolerance for floating point
  }

  // Strings - case-insensitive, trimmed comparison
  if (typeof oldValue === "string" && typeof newValue === "string") {
    return oldValue.trim().toLowerCase() === newValue.trim().toLowerCase();
  }

  // Default to exact match
  return exactMatch(oldValue, newValue);
}

/**
 * Calculate significance score for changes (0-1)
 */
export function calculateSignificanceScore(
  changes: AttributeChange[],
  rules: ComparisonRule[]
): number {
  if (changes.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let significantWeight = 0;

  for (const change of changes) {
    if (!change.significant) {
      continue;
    }

    const rule = rules.find((r) => r.fieldName === change.fieldName);
    const weight = rule?.weight ?? 1;

    totalWeight += weight;
    significantWeight += weight;
  }

  return totalWeight > 0 ? significantWeight / totalWeight : 0;
}

/**
 * Detect attribute changes between two records
 */
export function detectAttributeChanges(
  oldRecord: DimensionRecord,
  newRecord: DimensionRecord,
  rules: ComparisonRule[]
): AttributeChange[] {
  const changes: AttributeChange[] = [];
  const oldAttrs = oldRecord.attributes;
  const newAttrs = newRecord.attributes;

  // Get all unique field names
  const allFields = new Set([
    ...Object.keys(oldAttrs),
    ...Object.keys(newAttrs),
  ]);

  for (const field of allFields) {
    const oldValue = oldAttrs[field];
    const newValue = newAttrs[field];

    // Find rule for this field
    const rule = rules.find((r) => r.fieldName === field);

    // If no rule, treat as non-significant exact comparison
    const hasChanged = rule
      ? !compareAttributes(oldValue, newValue, rule)
      : !exactMatch(oldValue, newValue);

    if (hasChanged) {
      // Determine change type
      const oldExists =
        field in oldAttrs &&
        oldAttrs[field] !== null &&
        oldAttrs[field] !== undefined;
      const newExists =
        field in newAttrs &&
        newAttrs[field] !== null &&
        newAttrs[field] !== undefined;

      let changeType: "added" | "modified" | "deleted";
      if (!oldExists && newExists) {
        changeType = "added";
      } else if (oldExists && !newExists) {
        changeType = "deleted";
      } else {
        changeType = "modified";
      }

      // Determine if significant based on rule
      const significant =
        rule?.compareType === "always_version" ||
        rule?.compareType === "significant" ||
        rule?.compareType === "exact";

      changes.push({
        fieldName: field,
        oldValue,
        newValue,
        changeType,
        significant: significant ?? false,
      });
    }
  }

  return changes;
}

/**
 * Check if changes meet threshold for new version
 */
export function meetsVersionThreshold(
  changes: AttributeChange[],
  rules: ComparisonRule[],
  threshold: number
): boolean {
  const significanceScore = calculateSignificanceScore(changes, rules);
  return significanceScore >= threshold;
}

/**
 * Format business key for display
 */
export function formatBusinessKey(
  businessKey: Record<string, unknown>
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(businessKey)) {
    parts.push(`${key}=${String(value)}`);
  }
  return parts.join(", ");
}

/**
 * Create effective date range string
 */
export function formatEffectiveDateRange(
  effectiveFrom: Date,
  effectiveTo?: Date | null
): string {
  const from = effectiveFrom.toISOString().split("T")[0];
  const to = effectiveTo ? effectiveTo.toISOString().split("T")[0] : "current";
  return `${from} to ${to}`;
}

/**
 * Check if a dimension version is current (active now)
 */
export function isVersionCurrent(
  effectiveFrom: Date,
  effectiveTo?: Date | null,
  asOf: Date = new Date()
): boolean {
  if (effectiveTo && asOf >= effectiveTo) {
    return false; // Version expired
  }

  if (asOf < effectiveFrom) {
    return false; // Version not yet active
  }

  return true; // Version is active
}

/**
 * Get version number from dimension history
 */
export function calculateVersionNumber(
  existingVersions: DimensionRecord[]
): number {
  if (existingVersions.length === 0) {
    return 1;
  }

  // Find max version number
  return existingVersions.length + 1;
}
