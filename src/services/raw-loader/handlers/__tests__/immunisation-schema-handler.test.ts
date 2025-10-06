import { describe, it, expect, beforeEach } from "vitest";
import { ImmunisationSchemaHandler } from "../immunisation-schema-handler";

describe("ImmunisationSchemaHandler", () => {
  let handler: ImmunisationSchemaHandler;

  beforeEach(() => {
    handler = new ImmunisationSchemaHandler();
  });

  describe("basic properties", () => {
    it("should have correct extract type", () => {
      expect(handler.extractType).toBe("Immunisation");
    });

    it("should have correct table name", () => {
      expect(handler.tableName).toBe("raw.immunisation");
    });

    it("should have column mapping with expected columns", () => {
      expect(handler.columnMapping).toContain("appointmentImmunisationId");
      expect(handler.columnMapping).toContain("patientId");
      expect(handler.columnMapping).toContain("vaccineId");
      expect(handler.columnMapping).toContain("administrationTime");
      expect(handler.columnMapping).toContain("dose");
    });

    it("should include lineage columns", () => {
      expect(handler.columnMapping).toContain("s3_bucket");
      expect(handler.columnMapping).toContain("s3_key");
      expect(handler.columnMapping).toContain("load_run_id");
      expect(handler.columnMapping).toContain("load_ts");
    });
  });

  describe("validation", () => {
    it("should validate required appointment_immunisation_id", () => {
      const rule = handler.validationRules.find(
        (r) => r.columnName === "appointmentImmunisationId"
      );

      expect(rule).toBeDefined();
      expect(rule!.ruleType).toBe("required");
      expect(rule!.validator("12345")).toBe(true);
      expect(rule!.validator("")).toBe(false);
      expect(rule!.validator("abc")).toBe(false);
    });

    it("should validate required patient_id", () => {
      const rule = handler.validationRules.find(
        (r) => r.columnName === "patientId"
      );

      expect(rule).toBeDefined();
      expect(rule!.ruleType).toBe("required");
      expect(rule!.validator("67890")).toBe(true);
      expect(rule!.validator("")).toBe(false);
      expect(rule!.validator("abc")).toBe(false);
    });

    it("should validate required vaccine_id", () => {
      const rule = handler.validationRules.find(
        (r) => r.columnName === "vaccineId"
      );

      expect(rule).toBeDefined();
      expect(rule!.ruleType).toBe("required");
      expect(rule!.validator("101")).toBe(true);
      expect(rule!.validator("")).toBe(false);
      expect(rule!.validator("abc")).toBe(false);
    });

    it("should validate administration_time format", () => {
      const rule = handler.validationRules.find(
        (r) => r.columnName === "administrationTime"
      );

      expect(rule).toBeDefined();
      expect(rule!.ruleType).toBe("format");
      expect(rule!.validator("2024-06-15 10:30:00")).toBe(true);
      expect(rule!.validator("2024-06-15")).toBe(true);
      expect(rule!.validator("")).toBe(true); // Empty allowed
      expect(rule!.validator("invalid-date")).toBe(false);
    });

    it("should validate expiry_date format", () => {
      const rule = handler.validationRules.find(
        (r) => r.columnName === "expiryDate"
      );

      expect(rule).toBeDefined();
      expect(rule!.ruleType).toBe("format");
      expect(rule!.validator("2025-12-31")).toBe(true);
      expect(rule!.validator("")).toBe(true); // Empty allowed
      expect(rule!.validator("invalid-date")).toBe(false);
    });

    it("should validate dose format", () => {
      const rule = handler.validationRules.find((r) => r.columnName === "dose");

      expect(rule).toBeDefined();
      expect(rule!.ruleType).toBe("format");
      expect(rule!.validator("1.0")).toBe(true);
      expect(rule!.validator("0.5")).toBe(true);
      expect(rule!.validator("")).toBe(true); // Empty allowed
      expect(rule!.validator("abc")).toBe(false);
    });
  });

  describe("transformation", () => {
    it("should pass through data unchanged", async () => {
      const row = {
        appointmentImmunisationId: "12345",
        patientId: "67890",
        vaccineId: "101",
        vaccineName: "MMR Vaccine",
        dose: "1.0",
        administrationTime: "2024-06-15 10:30:00",
        batchNumber: "BATCH123",
        expiryDate: "2025-12-31",
        providerId: "Provider1",
        practiceId: "535",
        perOrgId: "685146",
      };

      const result = await handler.transformRow(row);
      expect(result).toEqual(row);
    });

    it("should handle empty values", async () => {
      const row = {
        appointmentImmunisationId: "12345",
        patientId: "67890",
        vaccineId: "101",
        vaccineName: "",
        dose: "",
        administrationTime: "",
        batchNumber: "",
        expiryDate: "",
        providerId: "",
        practiceId: "535",
        perOrgId: "685146",
      };

      const result = await handler.transformRow(row);
      expect(result).toEqual(row);
    });
  });

  describe("error messages", () => {
    it("should have descriptive error messages", () => {
      const appointmentRule = handler.validationRules.find(
        (r) => r.columnName === "appointmentImmunisationId"
      );
      expect(appointmentRule!.errorMessage).toBe(
        "appointment_immunisation_id must be numeric"
      );

      const patientRule = handler.validationRules.find(
        (r) => r.columnName === "patientId"
      );
      expect(patientRule!.errorMessage).toBe("patient_id must be numeric");

      const vaccineRule = handler.validationRules.find(
        (r) => r.columnName === "vaccineId"
      );
      expect(vaccineRule!.errorMessage).toBe("vaccine_id must be numeric");

      const adminTimeRule = handler.validationRules.find(
        (r) => r.columnName === "administrationTime"
      );
      expect(adminTimeRule!.errorMessage).toBe(
        "administration_time must be valid date or empty"
      );
    });
  });
});
