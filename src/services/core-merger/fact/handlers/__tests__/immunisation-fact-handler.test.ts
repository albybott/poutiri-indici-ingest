import { describe, it, expect } from "vitest";
import { immunisationFactConfig } from "../immunisation-fact-handler";
import { DimensionType } from "../../../types/scd2";
import { FactType } from "../../../types/fact";

describe("ImmunisationFactHandler", () => {
  describe("configuration", () => {
    it("should have correct fact type", () => {
      expect(immunisationFactConfig.factType).toBe(FactType.IMMUNISATION);
    });

    it("should have correct source and target tables", () => {
      expect(immunisationFactConfig.sourceTable).toBe("stg.immunisation");
      expect(immunisationFactConfig.targetTable).toBe("core.fact_immunisation");
    });

    it("should define correct business key fields", () => {
      expect(immunisationFactConfig.businessKeyFields).toEqual([
        "appointmentImmunisationId",
        "practiceId",
        "perOrgId",
      ]);
    });

    it("should define required FK relationships", () => {
      const fks = immunisationFactConfig.foreignKeyRelationships;

      // Should have patient, vaccine, provider, practice FKs
      expect(fks).toHaveLength(4);

      const patientFK = fks.find(
        (fk) => fk.dimensionType === DimensionType.PATIENT
      );
      expect(patientFK).toBeDefined();
      expect(patientFK!.factColumn).toBe("patient_key");
      expect(patientFK!.lookupFields).toEqual([
        "patientId",
        "practiceId",
        "perOrgId",
      ]);
      expect(patientFK!.required).toBe(true);
      expect(patientFK!.missingStrategy).toBe("skip");
      expect(patientFK!.nullable).toBe(false);

      const vaccineFK = fks.find(
        (fk) => fk.dimensionType === DimensionType.VACCINE
      );
      expect(vaccineFK).toBeDefined();
      expect(vaccineFK!.factColumn).toBe("vaccine_key");
      expect(vaccineFK!.lookupFields).toEqual([
        "vaccineId",
        "practiceId",
        "perOrgId",
      ]);
      expect(vaccineFK!.required).toBe(true);
      expect(vaccineFK!.missingStrategy).toBe("skip");
      expect(vaccineFK!.nullable).toBe(false);

      const providerFK = fks.find(
        (fk) => fk.dimensionType === DimensionType.PROVIDER
      );
      expect(providerFK).toBeDefined();
      expect(providerFK!.factColumn).toBe("provider_key");
      expect(providerFK!.lookupFields).toEqual([
        "providerId",
        "practiceId",
        "perOrgId",
      ]);
      expect(providerFK!.required).toBe(false);
      expect(providerFK!.missingStrategy).toBe("null");
      expect(providerFK!.nullable).toBe(true);

      const practiceFK = fks.find(
        (fk) => fk.dimensionType === DimensionType.PRACTICE
      );
      expect(practiceFK).toBeDefined();
      expect(practiceFK!.factColumn).toBe("practice_key");
      expect(practiceFK!.lookupFields).toEqual(["practiceId", "perOrgId"]);
      expect(practiceFK!.required).toBe(true);
      expect(practiceFK!.missingStrategy).toBe("error");
      expect(practiceFK!.nullable).toBe(false);
    });

    it("should define field mappings", () => {
      const mappings = immunisationFactConfig.fieldMappings;

      // Should have business key mappings
      const businessKeyMappings = mappings.filter((m) =>
        ["appointmentImmunisationId", "practiceId", "perOrgId"].includes(
          m.sourceField
        )
      );
      expect(businessKeyMappings).toHaveLength(3);

      // Check specific mappings
      const immunisationIdMapping = mappings.find(
        (m) => m.sourceField === "appointmentImmunisationId"
      );
      expect(immunisationIdMapping).toBeDefined();
      expect(immunisationIdMapping!.targetField).toBe("immunisationId");
      expect(immunisationIdMapping!.required).toBe(true);

      const doseMapping = mappings.find((m) => m.sourceField === "dose");
      expect(doseMapping).toBeDefined();
      expect(doseMapping!.targetField).toBe("dose");
      expect(doseMapping!.required).toBe(false);
      expect(doseMapping!.transform).toBeDefined();

      const batchNumberMapping = mappings.find(
        (m) => m.sourceField === "batchNumber"
      );
      expect(batchNumberMapping).toBeDefined();
      expect(batchNumberMapping!.targetField).toBe("batchNumber");
      expect(batchNumberMapping!.required).toBe(false);
    });

    it("should have transform functions for date fields", () => {
      const adminTimeMapping = immunisationFactConfig.fieldMappings.find(
        (m) => m.sourceField === "administrationTime"
      );
      expect(adminTimeMapping).toBeDefined();
      expect(adminTimeMapping!.targetField).toBe("immunisationDate");
      expect(adminTimeMapping!.transform).toBeDefined();

      // Test the transform function
      const transform = adminTimeMapping!.transform!;
      expect(transform("2024-06-15 10:30:00")).toEqual(
        new Date("2024-06-15 10:30:00")
      );
      expect(transform("")).toBeNull();
      expect(transform(null)).toBeNull();
      expect(transform("invalid-date")).toBeNull();
    });

    it("should have transform functions for numeric fields", () => {
      const doseMapping = immunisationFactConfig.fieldMappings.find(
        (m) => m.sourceField === "dose"
      );
      expect(doseMapping).toBeDefined();
      expect(doseMapping!.transform).toBeDefined();

      // Test the transform function
      const transform = doseMapping!.transform!;
      expect(transform("1.0")).toBe(1.0);
      expect(transform("0.5")).toBe(0.5);
      expect(transform("")).toBeNull();
      expect(transform(null)).toBeNull();
      expect(transform("abc")).toBeNull();
    });

    it("should have transform functions for boolean fields", () => {
      const isValidMapping = immunisationFactConfig.fieldMappings.find(
        (m) => m.sourceField === "immunisationStatus"
      );
      expect(isValidMapping).toBeDefined();
      expect(isValidMapping!.targetField).toBe("isValid");
      expect(isValidMapping!.transform).toBeDefined();

      // Test the transform function
      const transform = isValidMapping!.transform!;
      expect(transform("completed")).toBe(true);
      expect(transform("success")).toBe(true);
      expect(transform("valid")).toBe(true);
      expect(transform("failed")).toBe(false);
      expect(transform("invalid")).toBe(false);
      expect(transform("")).toBe(true); // Default to valid
      expect(transform(null)).toBe(true); // Default to valid
    });

    it("should have transform functions for historical flag", () => {
      const isHistoricalMapping = immunisationFactConfig.fieldMappings.find(
        (m) =>
          m.sourceField === "administrationTime" &&
          m.targetField === "isHistorical"
      );
      expect(isHistoricalMapping).toBeDefined();
      expect(isHistoricalMapping!.transform).toBeDefined();

      // Test the transform function
      const transform = isHistoricalMapping!.transform!;
      const now = new Date();
      const oneYearAgo = new Date(
        now.getFullYear() - 1,
        now.getMonth() - 1, // Make it more than 1 year old
        now.getDate()
      );
      const twoYearsAgo = new Date(
        now.getFullYear() - 2,
        now.getMonth(),
        now.getDate()
      );

      expect(transform(oneYearAgo.toISOString())).toBe(true);
      expect(transform(twoYearsAgo.toISOString())).toBe(true);
      expect(transform(now.toISOString())).toBe(false);
      expect(transform("")).toBe(false);
      expect(transform(null)).toBe(false);
    });
  });
});
