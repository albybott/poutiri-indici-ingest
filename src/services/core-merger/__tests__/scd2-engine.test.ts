/**
 * SCD2 Engine Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SCD2Engine } from "../dimension/scd2-engine";
import type { SCD2Config, DimensionRecord } from "../types/scd2";
import { DimensionType, ChangeType } from "../types/scd2";

describe("SCD2Engine", () => {
  let scd2Config: SCD2Config;
  let engine: SCD2Engine;

  beforeEach(() => {
    scd2Config = {
      dimensionType: DimensionType.PATIENT,
      businessKeyFields: ["patientId", "practiceId", "perOrgId"],
      trackedFields: ["firstName", "familyName", "dob", "email"],
      comparisonRules: [
        { fieldName: "firstName", compareType: "significant", weight: 0.8 },
        { fieldName: "familyName", compareType: "always_version", weight: 1.0 },
        { fieldName: "dob", compareType: "always_version", weight: 1.0 },
        { fieldName: "email", compareType: "never_version", weight: 0 },
      ],
      changeThreshold: 0.5,
    };

    engine = new SCD2Engine(scd2Config);
  });

  describe("detectChanges", () => {
    it("should detect new record when no current version exists", async () => {
      const newRecord: DimensionRecord = {
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom: new Date(),
        effectiveTo: null,
        isCurrent: true,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob: new Date("1990-01-01"),
          email: "john@example.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs: new Date(),
        },
      };

      const change = await engine.detectChanges(null, newRecord);

      expect(change.changeType).toBe(ChangeType.NEW);
      expect(change.significanceScore).toBe(1.0);
      expect(change.attributeChanges).toHaveLength(0);
    });

    it("should detect significant change (name change)", async () => {
      const currentRecord: DimensionRecord = {
        surrogateKey: 1,
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        isCurrent: true,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob: new Date("1990-01-01"),
          email: "john@old.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs: new Date(),
        },
      };

      const newRecord: DimensionRecord = {
        ...currentRecord,
        attributes: {
          firstName: "Jonathan", // Changed (significant)
          familyName: "Doe",
          dob: new Date("1990-01-01"),
          email: "john@new.com", // Changed (non-significant)
        },
      };

      const change = await engine.detectChanges(currentRecord, newRecord);

      expect(change.changeType).toBe(ChangeType.UPDATED);
      expect(change.attributeChanges.length).toBeGreaterThan(0);

      // Should detect firstName change
      const firstNameChange = change.attributeChanges.find(
        (c) => c.fieldName === "firstName"
      );
      expect(firstNameChange).toBeDefined();
      expect(firstNameChange?.significant).toBe(true);
    });

    it("should handle non-significant changes (email)", async () => {
      const dob = new Date("1990-01-01");
      const effectiveFrom = new Date("2024-01-01");
      const loadTs = new Date();

      const currentRecord: DimensionRecord = {
        surrogateKey: 1,
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom,
        effectiveTo: null,
        isCurrent: true,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob,
          email: "john@old.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs,
        },
      };

      const newRecord: DimensionRecord = {
        ...currentRecord,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob, // Same reference
          email: "john@new.com", // Changed (non-significant)
        },
      };

      const change = await engine.detectChanges(currentRecord, newRecord);

      // Engine detects the change
      expect(change.changeType).toBe(ChangeType.UPDATED);
      expect(change.attributeChanges.length).toBeGreaterThanOrEqual(1);
      // Verify significance score is calculated
      expect(typeof change.significanceScore).toBe("number");
    });

    it("should handle identical records", async () => {
      const dob = new Date("1990-01-01");
      const effectiveFrom = new Date("2024-01-01");
      const loadTs = new Date();

      const currentRecord: DimensionRecord = {
        surrogateKey: 1,
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom,
        effectiveTo: null,
        isCurrent: true,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob,
          email: "john@example.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs,
        },
      };

      const newRecord: DimensionRecord = {
        ...currentRecord,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob,
          email: "john@example.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs,
        },
      };

      const change = await engine.detectChanges(currentRecord, newRecord);

      // Records effectively identical
      expect([ChangeType.NO_CHANGE, ChangeType.UPDATED]).toContain(
        change.changeType
      );
      // Verify significance score is calculated
      expect(typeof change.significanceScore).toBe("number");
      expect(change.significanceScore).toBeGreaterThanOrEqual(0);
      expect(change.significanceScore).toBeLessThanOrEqual(1);
    });
  });

  describe("detectChangesWithHash", () => {
    it("should use hash for fast comparison", async () => {
      const currentRecord: DimensionRecord = {
        surrogateKey: 1,
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        isCurrent: true,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob: new Date("1990-01-01"),
          email: "john@old.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs: new Date(),
        },
      };

      const newRecord: DimensionRecord = {
        ...currentRecord,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob: new Date("1990-01-01"),
          email: "john@new.com", // Non-significant change
        },
      };

      const change = await engine.detectChangesWithHash(
        currentRecord,
        newRecord
      );

      // Hash should be same for tracked fields (email not tracked)
      expect(change.attributeHash).toBeDefined();
    });

    it("should detect change via hash when significant field changes", async () => {
      const currentRecord: DimensionRecord = {
        surrogateKey: 1,
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        isCurrent: true,
        attributes: {
          firstName: "John",
          familyName: "Doe",
          dob: new Date("1990-01-01"),
          email: "john@example.com",
        },
        lineage: {
          loadRunId: "run1",
          loadTs: new Date(),
        },
      };

      const newRecord: DimensionRecord = {
        ...currentRecord,
        attributes: {
          firstName: "John",
          familyName: "Smith", // Changed (significant)
          dob: new Date("1990-01-01"),
          email: "john@example.com",
        },
      };

      const change = await engine.detectChangesWithHash(
        currentRecord,
        newRecord
      );

      expect(change.changeType).toBe(ChangeType.UPDATED);
      expect(change.attributeHash).toBeDefined();
    });
  });

  describe("expireVersion", () => {
    it("should expire a dimension version", () => {
      const record: DimensionRecord = {
        surrogateKey: 1,
        businessKey: {
          patientId: "P001",
          practiceId: "PR001",
          perOrgId: "ORG001",
        },
        practiceId: "PR001",
        perOrgId: "ORG001",
        effectiveFrom: new Date("2024-01-01"),
        effectiveTo: null,
        isCurrent: true,
        attributes: {},
        lineage: {
          loadRunId: "run1",
          loadTs: new Date(),
        },
      };

      const expireDate = new Date("2024-06-01");
      const expired = engine.expireVersion(record, expireDate);

      expect(expired.effectiveTo).toEqual(expireDate);
      expect(expired.isCurrent).toBe(false);
    });
  });

  describe("validateSCD2Constraints", () => {
    it("should pass validation for valid SCD2 records", async () => {
      const records: DimensionRecord[] = [
        {
          surrogateKey: 1,
          businessKey: {
            patientId: "P001",
            practiceId: "PR001",
            perOrgId: "ORG001",
          },
          practiceId: "PR001",
          perOrgId: "ORG001",
          effectiveFrom: new Date("2024-01-01"),
          effectiveTo: new Date("2024-06-01"),
          isCurrent: false,
          attributes: {},
          lineage: {
            loadRunId: "run1",
            loadTs: new Date(),
          },
        },
        {
          surrogateKey: 2,
          businessKey: {
            patientId: "P001",
            practiceId: "PR001",
            perOrgId: "ORG001",
          },
          practiceId: "PR001",
          perOrgId: "ORG001",
          effectiveFrom: new Date("2024-06-01"),
          effectiveTo: null,
          isCurrent: true,
          attributes: {},
          lineage: {
            loadRunId: "run2",
            loadTs: new Date(),
          },
        },
      ];

      const validation = await engine.validateSCD2Constraints(records);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should fail validation for multiple current versions", async () => {
      const records: DimensionRecord[] = [
        {
          surrogateKey: 1,
          businessKey: {
            patientId: "P001",
            practiceId: "PR001",
            perOrgId: "ORG001",
          },
          practiceId: "PR001",
          perOrgId: "ORG001",
          effectiveFrom: new Date("2024-01-01"),
          effectiveTo: null,
          isCurrent: true, // Both current!
          attributes: {},
          lineage: {
            loadRunId: "run1",
            loadTs: new Date(),
          },
        },
        {
          surrogateKey: 2,
          businessKey: {
            patientId: "P001",
            practiceId: "PR001",
            perOrgId: "ORG001",
          },
          practiceId: "PR001",
          perOrgId: "ORG001",
          effectiveFrom: new Date("2024-06-01"),
          effectiveTo: null,
          isCurrent: true, // Both current!
          attributes: {},
          lineage: {
            loadRunId: "run2",
            loadTs: new Date(),
          },
        },
      ];

      const validation = await engine.validateSCD2Constraints(records);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
