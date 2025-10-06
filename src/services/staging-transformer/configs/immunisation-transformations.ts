import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Immunisation staging transformations
 * Converts raw text columns to typed staging columns
 */
export const immunisationTransformations: ColumnTransformation[] = [
  // IDs - Convert to integer
  {
    sourceColumn: "appointmentImmunisationId",
    targetColumn: "appointmentImmunisationId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "patientId",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "appointmentId",
    targetColumn: "appointmentId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "patientScheduleId",
    targetColumn: "patientScheduleId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "vaccineId",
    targetColumn: "vaccineId",
    targetType: ColumnType.TEXT,
    required: false,
  },

  // Text fields - Trim and clean
  {
    sourceColumn: "vaccineName",
    targetColumn: "vaccineName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineCode",
    targetColumn: "vaccineCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "dose",
    targetColumn: "dose",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "doseNumber",
    targetColumn: "doseNumber",
    targetType: ColumnType.INTEGER,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const num = parseInt(value, 10);
      return isNaN(num) ? null : num;
    },
  },
  {
    sourceColumn: "administrationSiteId",
    targetColumn: "administrationSiteId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "administrationSite",
    targetColumn: "administrationSite",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "routeId",
    targetColumn: "routeId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "route",
    targetColumn: "route",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "batchNumber",
    targetColumn: "batchNumber",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },

  // Dates - Parse to Date type
  {
    sourceColumn: "expiryDate",
    targetColumn: "expiryDate",
    targetType: ColumnType.DATE,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },
  {
    sourceColumn: "diluentExpiryDate",
    targetColumn: "diluentExpiryDate",
    targetType: ColumnType.DATE,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },

  // Timestamps - Parse to Timestamp type
  {
    sourceColumn: "administrationTime",
    targetColumn: "administrationTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },
  {
    sourceColumn: "insertedAt",
    targetColumn: "insertedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },
  {
    sourceColumn: "updatedAt",
    targetColumn: "updatedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },
  {
    sourceColumn: "nirSentDate",
    targetColumn: "nirSentDate",
    targetType: ColumnType.TIMESTAMP,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },
  {
    sourceColumn: "loadedDateTime",
    targetColumn: "loadedDateTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
    transformFunction: (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
  },

  // Booleans - Convert from text/numeric
  {
    sourceColumn: "isNiraCk",
    targetColumn: "isNiraCk",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "hasDiluent",
    targetColumn: "hasDiluent",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "isConfidential",
    targetColumn: "isConfidential",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "isActive",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return true; // Default
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "isDeleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false; // Default
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "isParked",
    targetColumn: "isParked",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "isAutoBill",
    targetColumn: "isAutoBill",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "showOnPortal",
    targetColumn: "showOnPortal",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },

  // Text fields with trimming
  {
    sourceColumn: "immunisationStatusId",
    targetColumn: "immunisationStatusId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "immunisationStatus",
    targetColumn: "immunisationStatus",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineOutComeId",
    targetColumn: "vaccineOutComeId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineOutCome",
    targetColumn: "vaccineOutCome",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "reason",
    targetColumn: "reason",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "providerId",
    targetColumn: "providerId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "provider",
    targetColumn: "provider",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "comments",
    targetColumn: "comments",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineIndicationId",
    targetColumn: "vaccineIndicationId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineIndication",
    targetColumn: "vaccineIndication",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineIndicationCode",
    targetColumn: "vaccineIndicationCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "needleLength",
    targetColumn: "needleLength",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "diluentBatchNo",
    targetColumn: "diluentBatchNo",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "costingCodeId",
    targetColumn: "costingCodeId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "costingCode",
    targetColumn: "costingCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "brandId",
    targetColumn: "brandId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "brand",
    targetColumn: "brand",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "insertedById",
    targetColumn: "insertedById",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "insertedBy",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updatedById",
    targetColumn: "updatedById",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updatedBy",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "medTechId",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practiceId",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practice",
    targetColumn: "practice",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccinatorId",
    targetColumn: "vaccinatorId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccinator",
    targetColumn: "vaccinator",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "userLoggingId",
    targetColumn: "userLoggingId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "loggingUserName",
    targetColumn: "loggingUserName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccinatorCode",
    targetColumn: "vaccinatorCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "permanentAddressLatitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "permanentAddressLongitude",
    targetColumn: "permanentAddressLongitude",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practiceLocationId",
    targetColumn: "practiceLocationId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "locationName",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineGroupId",
    targetColumn: "vaccineGroupId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccineGroup",
    targetColumn: "vaccineGroup",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "perOrgId",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
    transformFunction: (value) => value?.trim() ?? null,
  },
];

/**
 * Natural keys for deduplication
 */
export const immunisationNaturalKeys = [
  "appointmentImmunisationId",
  "practiceId",
  "perOrgId",
];
