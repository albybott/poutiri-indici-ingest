/**
 * Hash Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
  generateAttributeHash,
  hashesMatch,
  generateBusinessKeyString,
  extractBusinessKey,
  validateBusinessKey,
} from "../utils/hash-utils";

describe("Hash Utilities", () => {
  describe("generateAttributeHash", () => {
    it("should generate consistent hash for same attributes", () => {
      const attributes = {
        firstName: "John",
        familyName: "Doe",
        dob: "1990-01-01",
      };

      const trackedFields = ["firstName", "familyName", "dob"];

      const hash1 = generateAttributeHash(attributes, trackedFields);
      const hash2 = generateAttributeHash(attributes, trackedFields);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
    });

    it("should generate different hash for different attributes", () => {
      const attributes1 = {
        firstName: "John",
        familyName: "Doe",
      };

      const attributes2 = {
        firstName: "Jane",
        familyName: "Doe",
      };

      const trackedFields = ["firstName", "familyName"];

      const hash1 = generateAttributeHash(attributes1, trackedFields);
      const hash2 = generateAttributeHash(attributes2, trackedFields);

      expect(hash1).not.toBe(hash2);
    });

    it("should only hash tracked fields", () => {
      const attributes1 = {
        firstName: "John",
        familyName: "Doe",
        email: "john@old.com",
      };

      const attributes2 = {
        firstName: "John",
        familyName: "Doe",
        email: "john@new.com",
      };

      // Only track name fields, not email
      const trackedFields = ["firstName", "familyName"];

      const hash1 = generateAttributeHash(attributes1, trackedFields);
      const hash2 = generateAttributeHash(attributes2, trackedFields);

      // Hashes should be same since email not tracked
      expect(hash1).toBe(hash2);
    });

    it("should handle null values consistently", () => {
      const attributes = {
        firstName: "John",
        middleName: null,
        familyName: "Doe",
      };

      const trackedFields = ["firstName", "middleName", "familyName"];

      const hash = generateAttributeHash(attributes, trackedFields);
      expect(hash).toBeTruthy();
    });
  });

  describe("hashesMatch", () => {
    it("should return true for identical hashes", () => {
      const hash1 = "abc123";
      const hash2 = "abc123";

      expect(hashesMatch(hash1, hash2)).toBe(true);
    });

    it("should return false for different hashes", () => {
      const hash1 = "abc123";
      const hash2 = "def456";

      expect(hashesMatch(hash1, hash2)).toBe(false);
    });
  });

  describe("generateBusinessKeyString", () => {
    it("should generate consistent string representation", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const str1 = generateBusinessKeyString(businessKey);
      const str2 = generateBusinessKeyString(businessKey);

      expect(str1).toBe(str2);
      expect(str1).toContain("patientId");
      // Note: values are normalized (lowercased) in the string
      expect(str1).toBeTruthy();
    });

    it("should handle different field orders consistently", () => {
      const businessKey1 = {
        patientId: "P001",
        practiceId: "PR001",
      };

      const businessKey2 = {
        practiceId: "PR001",
        patientId: "P001",
      };

      const str1 = generateBusinessKeyString(businessKey1);
      const str2 = generateBusinessKeyString(businessKey2);

      // Should be same because keys are sorted
      expect(str1).toBe(str2);
    });
  });

  describe("extractBusinessKey", () => {
    it("should extract business key fields from record", () => {
      const record = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
        firstName: "John",
        email: "john@example.com",
      };

      const businessKeyFields = ["patientId", "practiceId", "perOrgId"];

      const businessKey = extractBusinessKey(record, businessKeyFields);

      expect(businessKey).toEqual({
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      });
      expect(businessKey.firstName).toBeUndefined();
    });

    it("should throw error if business key field missing", () => {
      const record = {
        patientId: "P001",
        practiceId: "PR001",
      };

      const businessKeyFields = ["patientId", "practiceId", "perOrgId"];

      expect(() => extractBusinessKey(record, businessKeyFields)).toThrow();
    });
  });

  describe("validateBusinessKey", () => {
    it("should validate complete business key", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const requiredFields = ["patientId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
    });

    it("should detect missing fields", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "PR001",
      };

      const requiredFields = ["patientId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields).toContain("perOrgId");
    });

    it("should detect null values", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: null,
        perOrgId: "ORG001",
      };

      const requiredFields = ["patientId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields.length).toBeGreaterThan(0);
    });

    it("should detect empty strings", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "",
        perOrgId: "ORG001",
      };

      const requiredFields = ["patientId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(false);
    });
  });
});
