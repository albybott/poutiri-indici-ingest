/**
 * Immunisation Fact Handler
 * Handles loading of immunisation facts with FK resolution
 */

import type { FactHandlerConfig } from "../../types/fact";
import { FactType } from "../../types/fact";
import { DimensionType } from "../../types/scd2";

/**
 * Immunisation fact handler configuration
 */
export const immunisationFactConfig: FactHandlerConfig = {
  factType: FactType.IMMUNISATION,
  sourceTable: "stg.immunisation",
  targetTable: "core.fact_immunisation",
  businessKeyFields: ["appointmentImmunisationId", "practiceId", "perOrgId"],

  // Foreign key relationships
  foreignKeyRelationships: [
    {
      dimensionType: DimensionType.PATIENT,
      factColumn: "patient_key",
      lookupFields: ["patientId", "practiceId", "perOrgId"],
      required: true,
      missingStrategy: "skip", // Skip immunisation if patient not found
      nullable: false,
    },
    {
      dimensionType: DimensionType.PROVIDER,
      factColumn: "provider_key",
      lookupFields: ["providerId", "practiceId", "perOrgId"],
      required: false,
      missingStrategy: "null", // Allow NULL provider
      nullable: true,
    },
    {
      dimensionType: DimensionType.PRACTICE,
      factColumn: "practice_key",
      lookupFields: ["practiceId", "perOrgId"],
      required: true,
      missingStrategy: "error", // Practice should always exist
      nullable: false,
    },
    {
      dimensionType: DimensionType.VACCINE,
      factColumn: "vaccine_key",
      lookupFields: ["vaccineId", "practiceId", "perOrgId"],
      required: false,
      missingStrategy: "skip", // Skip if vaccine not found
      nullable: true,
    },
  ],

  // Field mappings
  fieldMappings: [
    // Business keys
    {
      sourceField: "appointmentImmunisationId",
      targetField: "appointment_immunisation_id",
      required: true,
    },
    {
      sourceField: "patientId",
      targetField: "patient_id",
      required: true,
    },
    {
      sourceField: "practiceId",
      targetField: "practice_id",
      required: true,
    },
    {
      sourceField: "perOrgId",
      targetField: "per_org_id",
      required: true,
    },

    // Immunisation details
    {
      sourceField: "appointmentId",
      targetField: "appointment_id",
      required: false,
    },
    {
      sourceField: "patientScheduleId",
      targetField: "patient_schedule_id",
      required: false,
    },
    {
      sourceField: "vaccineId",
      targetField: "vaccine_id",
      required: false,
    },
    {
      sourceField: "vaccineName",
      targetField: "vaccine_name",
      required: false,
    },
    {
      sourceField: "vaccineCode",
      targetField: "vaccine_code",
      required: false,
    },
    {
      sourceField: "dose",
      targetField: "dose",
      required: false,
    },
    {
      sourceField: "doseNumber",
      targetField: "dose_number",
      required: false,
    },
    {
      sourceField: "administrationSiteId",
      targetField: "administration_site_id",
      required: false,
    },
    {
      sourceField: "administrationSite",
      targetField: "administration_site",
      required: false,
    },
    {
      sourceField: "routeId",
      targetField: "route_id",
      required: false,
    },
    {
      sourceField: "route",
      targetField: "route",
      required: false,
    },
    {
      sourceField: "batchNumber",
      targetField: "batch_number",
      required: false,
    },
    {
      sourceField: "expiryDate",
      targetField: "expiry_date",
      required: false,
    },
    {
      sourceField: "immunisationStatusId",
      targetField: "immunisation_status_id",
      required: false,
    },
    {
      sourceField: "immunisationStatus",
      targetField: "immunisation_status",
      required: false,
    },
    {
      sourceField: "vaccineOutComeId",
      targetField: "vaccine_out_come_id",
      required: false,
    },
    {
      sourceField: "vaccineOutCome",
      targetField: "vaccine_out_come",
      required: false,
    },
    {
      sourceField: "isNirAck",
      targetField: "is_nir_ack",
      required: false,
    },
    {
      sourceField: "reason",
      targetField: "reason",
      required: false,
    },
    {
      sourceField: "providerId",
      targetField: "provider_id",
      required: false,
    },
    {
      sourceField: "comments",
      targetField: "comments",
      required: false,
    },
    {
      sourceField: "administrationTime",
      targetField: "administration_time",
      required: false,
    },
    {
      sourceField: "vaccineIndicationId",
      targetField: "vaccine_indication_id",
      required: false,
    },
    {
      sourceField: "vaccineIndication",
      targetField: "vaccine_indication",
      required: false,
    },
    {
      sourceField: "vaccineIndicationCode",
      targetField: "vaccine_indication_code",
      required: false,
    },
    {
      sourceField: "needleLength",
      targetField: "needle_length",
      required: false,
    },
    {
      sourceField: "hasDiluent",
      targetField: "has_diluent",
      required: false,
    },
    {
      sourceField: "diluentBatchNo",
      targetField: "diluent_batch_no",
      required: false,
    },
    {
      sourceField: "diluentExpiryDate",
      targetField: "diluent_expiry_date",
      required: false,
    },
    {
      sourceField: "isConfidential",
      targetField: "is_confidential",
      required: false,
    },
    {
      sourceField: "costingCodeId",
      targetField: "costing_code_id",
      required: false,
    },
    {
      sourceField: "costingCode",
      targetField: "costing_code",
      required: false,
    },
    {
      sourceField: "brandId",
      targetField: "brand_id",
      required: false,
    },
    {
      sourceField: "brand",
      targetField: "brand",
      required: false,
    },
    {
      sourceField: "isActive",
      targetField: "is_active",
      required: false,
    },
    {
      sourceField: "isDeleted",
      targetField: "is_deleted",
      required: false,
    },
    {
      sourceField: "insertedById",
      targetField: "inserted_by_id",
      required: false,
    },
    {
      sourceField: "insertedBy",
      targetField: "inserted_by",
      required: false,
    },
    {
      sourceField: "updatedById",
      targetField: "updated_by_id",
      required: false,
    },
    {
      sourceField: "updated_by",
      targetField: "updated_by",
      required: false,
    },
    {
      sourceField: "insertedAt",
      targetField: "inserted_at",
      required: false,
    },
    {
      sourceField: "updatedAt",
      targetField: "updated_at",
      required: false,
    },
    {
      sourceField: "isParked",
      targetField: "is_parked",
      required: false,
    },
    {
      sourceField: "medTechId",
      targetField: "med_tech_id",
      required: false,
    },
    {
      sourceField: "practiceId",
      targetField: "practice_id",
      required: false,
    },
    {
      sourceField: "isAutoBill",
      targetField: "is_auto_bill",
      required: false,
    },
    {
      sourceField: "vaccinatorId",
      targetField: "vaccinator_id",
      required: false,
    },
    {
      sourceField: "vaccinator",
      targetField: "vaccinator",
      required: false,
    },
    {
      sourceField: "userLoggingId",
      targetField: "user_logging_id",
      required: false,
    },
    {
      sourceField: "loggingUserName",
      targetField: "logging_user_name",
      required: false,
    },
    {
      sourceField: "nirSentDate",
      targetField: "nir_sent_date",
      required: false,
    },
    {
      sourceField: "showOnPortal",
      targetField: "show_on_portal",
      required: false,
    },
    {
      sourceField: "vaccinatorCode",
      targetField: "vaccinator_code",
      required: false,
    },
    {
      sourceField: "permanentAddressLatitude",
      targetField: "permanent_address_latitude",
      required: false,
    },
    {
      sourceField: "permanentAddressLongitude",
      targetField: "permanent_address_longitude",
      required: false,
    },
    {
      sourceField: "practiceLocationId",
      targetField: "practice_location_id",
      required: false,
    },
    {
      sourceField: "locationName",
      targetField: "location_name",
      required: false,
    },
    {
      sourceField: "vaccineGroupId",
      targetField: "vaccine_group_id",
      required: false,
    },
    {
      sourceField: "vaccineGroup",
      targetField: "vaccine_group",
      required: false,
    },
  ],
};
