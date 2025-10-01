/**
 * Appointment Fact Handler
 * Handles loading of appointment facts with FK resolution
 */

import type { FactHandlerConfig } from "../../types/fact";
import { FactType } from "../../types/fact";
import { DimensionType } from "../../types/scd2";

/**
 * Appointment fact handler configuration
 */
export const appointmentFactConfig: FactHandlerConfig = {
  factType: FactType.APPOINTMENT,
  sourceTable: "stg.appointments",
  targetTable: "core.fact_appointment",
  businessKeyFields: ["appointmentId", "practiceId", "perOrgId"],

  // Foreign key relationships
  foreignKeyRelationships: [
    {
      dimensionType: DimensionType.PATIENT,
      factColumn: "patient_key",
      lookupFields: ["patientId", "practiceId", "perOrgId"],
      required: true,
      missingStrategy: "skip", // Skip appointment if patient not found
      nullable: false,
    },
    {
      dimensionType: DimensionType.PROVIDER,
      factColumn: "provider_key",
      lookupFields: ["providerId", "practiceId", "perOrgId"],
      required: false,
      missingStrategy: "null", // Allow NULL provider (external providers)
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
  ],

  // Field mappings
  fieldMappings: [
    // Business keys
    {
      sourceField: "appointmentId",
      targetField: "appointmentId",
      required: true,
    },
    { sourceField: "practiceId", targetField: "practiceId", required: true },
    { sourceField: "perOrgId", targetField: "perOrgId", required: true },

    // Appointment attributes
    {
      sourceField: "appointmentType",
      targetField: "appointmentType",
      required: false,
    },
    {
      sourceField: "appointmentStatus",
      targetField: "appointmentStatus",
      required: false,
    },
    { sourceField: "statusGroup", targetField: "statusGroup", required: false },
    {
      sourceField: "scheduleDate",
      targetField: "scheduleDate",
      required: false,
    },
    { sourceField: "startTime", targetField: "startTime", required: false },
    { sourceField: "endTime", targetField: "endTime", required: false },
    {
      sourceField: "consultStartTime",
      targetField: "consultStartTime",
      required: false,
    },
    {
      sourceField: "consultEndTime",
      targetField: "consultEndTime",
      required: false,
    },
    { sourceField: "duration", targetField: "duration", required: false },
    { sourceField: "consultTime", targetField: "consultTime", required: false },

    // Status flags
    {
      sourceField: "arrived",
      targetField: "arrived",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "isArrived",
      targetField: "isArrived",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "waitingForPayment",
      targetField: "waitingForPayment",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "appointmentCompleted",
      targetField: "appointmentCompleted",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "isConsultParked",
      targetField: "isConsultParked",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "isDummy",
      targetField: "isDummy",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "isConfidential",
      targetField: "isConfidential",
      required: false,
      defaultValue: false,
    },
    {
      sourceField: "isConsentToShare",
      targetField: "isConsentToShare",
      required: false,
      defaultValue: false,
    },

    // Queue times
    { sourceField: "gpQueueTime", targetField: "gpQueueTime", required: false },
    {
      sourceField: "nurseQueueTime",
      targetField: "nurseQueueTime",
      required: false,
    },
    {
      sourceField: "triageQueueTime",
      targetField: "triageQueueTime",
      required: false,
    },

    // Additional fields
    {
      sourceField: "reasonForVisit",
      targetField: "reasonForVisit",
      required: false,
    },
    { sourceField: "notes", targetField: "notes", required: false },
    { sourceField: "description", targetField: "description", required: false },
    {
      sourceField: "cancelReason",
      targetField: "cancelReason",
      required: false,
    },

    // Timestamps
    { sourceField: "arrivedTime", targetField: "arrivedTime", required: false },
    {
      sourceField: "cancelledTime",
      targetField: "cancelledTime",
      required: false,
    },
    { sourceField: "booked", targetField: "booked", required: false },

    // Location
    {
      sourceField: "practiceLocationId",
      targetField: "practiceLocationId",
      required: false,
    },
    {
      sourceField: "locationName",
      targetField: "locationName",
      required: false,
    },
  ],
};
