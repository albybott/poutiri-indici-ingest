/**
 * Business Key Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
  getFactBusinessKeyFields,
  getDimensionBusinessKeyFields,
  extractFactBusinessKey,
  extractDimensionBusinessKey,
  businessKeyToString,
  stringToBusinessKey,
  validateBusinessKey,
  businessKeysEqual,
} from "../utils/business-key-utils";
import { FactType } from "../types/fact";
import { DimensionType } from "../types/scd2";

describe("Business Key Utilities", () => {
  describe("getFactBusinessKeyFields", () => {
    it("should return correct fields for appointment fact", () => {
      const fields = getFactBusinessKeyFields(FactType.APPOINTMENT);

      expect(fields).toEqual(["appointmentId", "practiceId", "perOrgId"]);
    });

    it("should return correct fields for invoice fact", () => {
      const fields = getFactBusinessKeyFields(FactType.INVOICE);

      expect(fields).toEqual([
        "invoiceTransactionId",
        "practiceId",
        "perOrgId",
      ]);
    });
  });

  describe("getDimensionBusinessKeyFields", () => {
    it("should return correct fields for patient dimension", () => {
      const fields = getDimensionBusinessKeyFields(DimensionType.PATIENT);

      expect(fields).toEqual(["patientId", "practiceId", "perOrgId"]);
    });

    it("should return correct fields for practice dimension", () => {
      const fields = getDimensionBusinessKeyFields(DimensionType.PRACTICE);

      expect(fields).toEqual(["practiceId", "perOrgId"]);
    });
  });

  describe("extractFactBusinessKey", () => {
    it("should extract appointment business key", () => {
      const record = {
        appointmentId: "APT001",
        practiceId: "PR001",
        perOrgId: "ORG001",
        patientId: "P001",
        scheduleDate: "2024-01-01",
      };

      const businessKey = extractFactBusinessKey(record, FactType.APPOINTMENT);

      expect(businessKey).toEqual({
        appointmentId: "APT001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      });
    });
  });

  describe("extractDimensionBusinessKey", () => {
    it("should extract patient business key", () => {
      const record = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
        firstName: "John",
        email: "john@example.com",
      };

      const businessKey = extractDimensionBusinessKey(
        record,
        DimensionType.PATIENT
      );

      expect(businessKey).toEqual({
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      });
    });
  });

  describe("businessKeyToString", () => {
    it("should convert business key to string", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const str = businessKeyToString(businessKey);

      expect(str).toContain("patientId=P001");
      expect(str).toContain("practiceId=PR001");
      expect(str).toContain("perOrgId=ORG001");
    });

    it("should be consistent for same keys", () => {
      const businessKey = {
        patientId: "P001",
        practiceId: "PR001",
      };

      const str1 = businessKeyToString(businessKey);
      const str2 = businessKeyToString(businessKey);

      expect(str1).toBe(str2);
    });
  });

  describe("stringToBusinessKey", () => {
    it("should parse business key string", () => {
      const keyString = "patientId=P001|practiceId=PR001|perOrgId=ORG001";

      const businessKey = stringToBusinessKey(keyString);

      expect(businessKey.patientId).toBe("P001");
      expect(businessKey.practiceId).toBe("PR001");
      expect(businessKey.perOrgId).toBe("ORG001");
    });

    it("should round-trip with businessKeyToString", () => {
      const original = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const str = businessKeyToString(original);
      const parsed = stringToBusinessKey(str);

      expect(parsed.patientId).toBe(original.patientId);
      expect(parsed.practiceId).toBe(original.practiceId);
      expect(parsed.perOrgId).toBe(original.perOrgId);
    });
  });

  describe("validateBusinessKey", () => {
    it("should validate complete business key", () => {
      const businessKey = {
        appointmentId: "APT001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const requiredFields = ["appointmentId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
      expect(validation.nullFields).toHaveLength(0);
    });

    it("should detect missing fields", () => {
      const businessKey = {
        appointmentId: "APT001",
        practiceId: "PR001",
      };

      const requiredFields = ["appointmentId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields).toContain("perOrgId");
    });

    it("should detect null values", () => {
      const businessKey = {
        appointmentId: "APT001",
        practiceId: null,
        perOrgId: "ORG001",
      };

      const requiredFields = ["appointmentId", "practiceId", "perOrgId"];

      const validation = validateBusinessKey(businessKey, requiredFields);

      expect(validation.valid).toBe(false);
      expect(validation.nullFields).toContain("practiceId");
    });
  });

  describe("businessKeysEqual", () => {
    it("should return true for equal business keys", () => {
      const key1 = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const key2 = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      expect(businessKeysEqual(key1, key2)).toBe(true);
    });

    it("should return false for different business keys", () => {
      const key1 = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const key2 = {
        patientId: "P002",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      expect(businessKeysEqual(key1, key2)).toBe(false);
    });

    it("should handle different field orders", () => {
      const key1 = {
        patientId: "P001",
        practiceId: "PR001",
        perOrgId: "ORG001",
      };

      const key2 = {
        perOrgId: "ORG001",
        patientId: "P001",
        practiceId: "PR001",
      };

      expect(businessKeysEqual(key1, key2)).toBe(true);
    });
  });
});
