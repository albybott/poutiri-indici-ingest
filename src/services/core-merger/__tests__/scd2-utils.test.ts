/**
 * SCD2 Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
  compareAttributes,
  calculateSignificanceScore,
  detectAttributeChanges,
  meetsVersionThreshold,
  formatBusinessKey,
  formatEffectiveDateRange,
  isVersionCurrent,
  calculateVersionNumber,
} from "../utils/scd2-utils";
import type {
  ComparisonRule,
  AttributeChange,
  DimensionRecord,
} from "../types/scd2";

describe("SCD2 Utilities", () => {
  describe("compareAttributes", () => {
    it("should detect exact match", () => {
      const rule: ComparisonRule = {
        fieldName: "test",
        compareType: "exact",
        weight: 1.0,
      };

      expect(compareAttributes("value", "value", rule)).toBe(true);
      expect(compareAttributes("value1", "value2", rule)).toBe(false);
    });

    it("should handle null values", () => {
      const rule: ComparisonRule = {
        fieldName: "test",
        compareType: "exact",
        weight: 1.0,
      };

      expect(compareAttributes(null, null, rule)).toBe(true);
      expect(compareAttributes(null, "value", rule)).toBe(false);
      expect(compareAttributes("value", null, rule)).toBe(false);
    });

    it("should handle significant comparison (case-insensitive)", () => {
      const rule: ComparisonRule = {
        fieldName: "test",
        compareType: "significant",
        weight: 1.0,
      };

      expect(compareAttributes("John", "john", rule)).toBe(true);
      expect(compareAttributes("  John  ", "john", rule)).toBe(true);
      expect(compareAttributes("John", "Jane", rule)).toBe(false);
    });

    it("should handle always_version comparison", () => {
      const rule: ComparisonRule = {
        fieldName: "test",
        compareType: "always_version",
        weight: 1.0,
      };

      // Always returns false (always create version)
      expect(compareAttributes("value", "value", rule)).toBe(false);
    });

    it("should handle never_version comparison", () => {
      const rule: ComparisonRule = {
        fieldName: "test",
        compareType: "never_version",
        weight: 0,
      };

      // Always returns true (never create version)
      expect(compareAttributes("value1", "value2", rule)).toBe(true);
    });

    it("should use custom comparator", () => {
      const rule: ComparisonRule = {
        fieldName: "test",
        compareType: "exact",
        weight: 1.0,
        customComparator: (a, b) => a === b,
      };

      expect(compareAttributes(10, 10, rule)).toBe(true);
      expect(compareAttributes(10, 20, rule)).toBe(false);
    });
  });

  describe("calculateSignificanceScore", () => {
    it("should calculate score based on weights", () => {
      const changes: AttributeChange[] = [
        {
          fieldName: "firstName",
          oldValue: "John",
          newValue: "Jane",
          changeType: "modified",
          significant: true,
        },
        {
          fieldName: "familyName",
          oldValue: "Doe",
          newValue: "Smith",
          changeType: "modified",
          significant: true,
        },
      ];

      const rules: ComparisonRule[] = [
        { fieldName: "firstName", compareType: "significant", weight: 0.5 },
        { fieldName: "familyName", compareType: "always_version", weight: 1.0 },
      ];

      const score = calculateSignificanceScore(changes, rules);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("should return 0 for no changes", () => {
      const changes: AttributeChange[] = [];
      const rules: ComparisonRule[] = [];

      const score = calculateSignificanceScore(changes, rules);

      expect(score).toBe(0);
    });

    it("should only count significant changes", () => {
      const changes: AttributeChange[] = [
        {
          fieldName: "firstName",
          oldValue: "John",
          newValue: "Jane",
          changeType: "modified",
          significant: true,
        },
        {
          fieldName: "email",
          oldValue: "old@example.com",
          newValue: "new@example.com",
          changeType: "modified",
          significant: false, // Not significant
        },
      ];

      const rules: ComparisonRule[] = [
        { fieldName: "firstName", compareType: "significant", weight: 1.0 },
        { fieldName: "email", compareType: "never_version", weight: 0 },
      ];

      const score = calculateSignificanceScore(changes, rules);

      expect(score).toBeGreaterThan(0);
    });
  });

  describe("meetsVersionThreshold", () => {
    it("should return true when score meets threshold", () => {
      const changes: AttributeChange[] = [
        {
          fieldName: "familyName",
          oldValue: "Doe",
          newValue: "Smith",
          changeType: "modified",
          significant: true,
        },
      ];

      const rules: ComparisonRule[] = [
        { fieldName: "familyName", compareType: "always_version", weight: 1.0 },
      ];

      const meetsThreshold = meetsVersionThreshold(changes, rules, 0.5);

      expect(meetsThreshold).toBe(true);
    });

    it("should return false when score below threshold", () => {
      const changes: AttributeChange[] = [
        {
          fieldName: "email",
          oldValue: "old@example.com",
          newValue: "new@example.com",
          changeType: "modified",
          significant: false,
        },
      ];

      const rules: ComparisonRule[] = [
        { fieldName: "email", compareType: "never_version", weight: 0 },
      ];

      const meetsThreshold = meetsVersionThreshold(changes, rules, 0.5);

      expect(meetsThreshold).toBe(false);
    });
  });

  describe("formatBusinessKey", () => {
    it("should format business key for display", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const formatted = formatBusinessKey(businessKey);

      expect(formatted).toContain("patientId=P001");
      expect(formatted).toContain("practiceId=PR001");
      expect(formatted).toContain("perOrgId=ORG001");
    });
  });

  describe("formatEffectiveDateRange", () => {
    it("should format current version", () => {
      const effectiveFrom = new Date("2024-01-01");
      const formatted = formatEffectiveDateRange(effectiveFrom, null);

      expect(formatted).toContain("2024-01-01");
      expect(formatted).toContain("current");
    });

    it("should format historical version", () => {
      const effectiveFrom = new Date("2024-01-01");
      const effectiveTo = new Date("2024-06-01");
      const formatted = formatEffectiveDateRange(effectiveFrom, effectiveTo);

      expect(formatted).toContain("2024-01-01");
      expect(formatted).toContain("2024-06-01");
    });
  });

  describe("isVersionCurrent", () => {
    it("should return true for current version", () => {
      const effectiveFrom = new Date("2024-01-01");
      const effectiveTo = null;
      const asOf = new Date("2024-06-01");

      const isCurrent = isVersionCurrent(effectiveFrom, effectiveTo, asOf);

      expect(isCurrent).toBe(true);
    });

    it("should return false for expired version", () => {
      const effectiveFrom = new Date("2024-01-01");
      const effectiveTo = new Date("2024-03-01");
      const asOf = new Date("2024-06-01");

      const isCurrent = isVersionCurrent(effectiveFrom, effectiveTo, asOf);

      expect(isCurrent).toBe(false);
    });

    it("should return false for future version", () => {
      const effectiveFrom = new Date("2024-06-01");
      const effectiveTo = null;
      const asOf = new Date("2024-01-01");

      const isCurrent = isVersionCurrent(effectiveFrom, effectiveTo, asOf);

      expect(isCurrent).toBe(false);
    });
  });

  describe("calculateVersionNumber", () => {
    it("should return 1 for first version", () => {
      const existingVersions: DimensionRecord[] = [];
      const versionNumber = calculateVersionNumber(existingVersions);

      expect(versionNumber).toBe(1);
    });

    it("should increment version number", () => {
      const existingVersions: DimensionRecord[] = [
        {} as DimensionRecord,
        {} as DimensionRecord,
        {} as DimensionRecord,
      ];

      const versionNumber = calculateVersionNumber(existingVersions);

      expect(versionNumber).toBe(4);
    });
  });
});
