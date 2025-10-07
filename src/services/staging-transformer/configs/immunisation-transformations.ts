import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Immunisation staging transformations
 * Converts raw text columns to typed staging columns
 */
export const immunisationTransformations: ColumnTransformation[] = [
  // IDs - Keep as text
  {
    sourceColumn: "appointment_immunisation_id",
    targetColumn: "appointmentImmunisationId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "appointment_id",
    targetColumn: "appointmentId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "patient_schedule_id",
    targetColumn: "patientScheduleId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "vaccine_id",
    targetColumn: "vaccineId",
    targetType: ColumnType.TEXT,
    required: false,
  },

  // Text fields - Trim and clean
  {
    sourceColumn: "vaccine_name",
    targetColumn: "vaccineName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_code",
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
    sourceColumn: "dose_number",
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
    sourceColumn: "administration_site_id",
    targetColumn: "administrationSiteId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "administration_site",
    targetColumn: "administrationSite",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "route_id",
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
    sourceColumn: "batch_number",
    targetColumn: "batchNumber",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },

  // Dates - Parse to Date type
  {
    sourceColumn: "expiry_date",
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
    sourceColumn: "diluent_expiry_date",
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
    sourceColumn: "administration_time",
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
    sourceColumn: "inserted_at",
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
    sourceColumn: "updated_at",
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
    sourceColumn: "nir_sent_date",
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
    sourceColumn: "loaded_date_time",
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
    sourceColumn: "is_nir_ack",
    targetColumn: "isNirAck",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      if (value === null || value === undefined) return false;
      const str = String(value).toLowerCase();
      return str === "1" || str === "true" || str === "yes";
    },
  },
  {
    sourceColumn: "has_diluent",
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
    sourceColumn: "is_confidential",
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
    sourceColumn: "is_active",
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
    sourceColumn: "is_deleted",
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
    sourceColumn: "is_parked",
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
    sourceColumn: "is_auto_bill",
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
    sourceColumn: "show_on_portal",
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
    sourceColumn: "immunisation_status_id",
    targetColumn: "immunisationStatusId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "immunisation_status",
    targetColumn: "immunisationStatus",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_out_come_id",
    targetColumn: "vaccineOutComeId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_out_come",
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
    sourceColumn: "provider_id",
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
    sourceColumn: "vaccine_indication_id",
    targetColumn: "vaccineIndicationId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_indication",
    targetColumn: "vaccineIndication",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_indication_code",
    targetColumn: "vaccineIndicationCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "needle_length",
    targetColumn: "needleLength",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "diluent_batch_no",
    targetColumn: "diluentBatchNo",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "costing_code_id",
    targetColumn: "costingCodeId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "costing_code",
    targetColumn: "costingCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "brand_id",
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
    sourceColumn: "inserted_by_id",
    targetColumn: "insertedById",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updated_by_id",
    targetColumn: "updatedById",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "med_tech_id",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practice_id",
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
    sourceColumn: "vaccinator_id",
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
    sourceColumn: "user_logging_id",
    targetColumn: "userLoggingId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "logging_user_name",
    targetColumn: "loggingUserName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccinator_code",
    targetColumn: "vaccinatorCode",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "permanent_address_latitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "permanent_address_longitude",
    targetColumn: "permanentAddressLongitude",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practice_location_id",
    targetColumn: "practiceLocationId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "location_name",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_group_id",
    targetColumn: "vaccineGroupId",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "vaccine_group",
    targetColumn: "vaccineGroup",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "per_org_id",
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
