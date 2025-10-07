import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Appointments staging transformations
 * Converts raw text columns to typed staging columns
 */
export const appointmentsTransformations: ColumnTransformation[] = [
  // IDs
  {
    sourceColumn: "appointment_id",
    targetColumn: "appointmentId",
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
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "provider_id",
    targetColumn: "providerId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },

  // Text fields
  {
    sourceColumn: "appointment_type",
    targetColumn: "appointmentType",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "appointment_status",
    targetColumn: "appointmentStatus",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "notes",
    targetColumn: "notes",
    targetType: ColumnType.TEXT,
    required: false,
    transformFunction: (value) => value?.trim() ?? null,
  },
  {
    sourceColumn: "practice",
    targetColumn: "practice",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "provider",
    targetColumn: "provider",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "location_name",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "reasonfor_visit",
    targetColumn: "reasonforVisit",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "status_group",
    targetColumn: "statusGroup",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "appointment_out_come_id",
    targetColumn: "appointmentOutComeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "appointment_out_come",
    targetColumn: "appointmentOutCome",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "appointment_type_id",
    targetColumn: "appointmentTypeId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "booking_source_id",
    targetColumn: "bookingSourceId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "booking_source",
    targetColumn: "bookingSource",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "cancel_reason",
    targetColumn: "cancelReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "parked_reason",
    targetColumn: "parkedReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "description",
    targetColumn: "description",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_id",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
  },

  // Date/Timestamp fields
  {
    sourceColumn: "schedule_date",
    targetColumn: "scheduleDate",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "booked",
    targetColumn: "booked",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "inserted_at",
    targetColumn: "insertedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "updated_at",
    targetColumn: "updatedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "consult_end_time",
    targetColumn: "consultEndTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "consult_start_time",
    targetColumn: "consultStartTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "end_time",
    targetColumn: "endTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "generated_time",
    targetColumn: "generatedTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "start_time",
    targetColumn: "startTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "last_appointment_status_date",
    targetColumn: "lastAppointmentStatusDate",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "arrived_time",
    targetColumn: "arrivedTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "cancelled_time",
    targetColumn: "cancelledTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "not_arrived_time",
    targetColumn: "notArrivedTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "on_hold_time",
    targetColumn: "onHoldTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "read_only_time",
    targetColumn: "readOnlyTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "self_assessment_completed_time",
    targetColumn: "selfAssessmentCompletedTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "self_assessment_queue_time",
    targetColumn: "selfAssessmentQueueTime",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "triage_queue_time",
    targetColumn: "triageQueueTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "virtual_queue_time",
    targetColumn: "virtualQueueTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },

  // Integer fields
  {
    sourceColumn: "consult_time",
    targetColumn: "consultTime",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "duration",
    targetColumn: "duration",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "last_appointment_status_id",
    targetColumn: "lastAppointmentStatusId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "priority_id",
    targetColumn: "priorityId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "consult_timer_status_id",
    targetColumn: "consultTimerStatusId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "nurse_queue_time",
    targetColumn: "nurseQueueTime",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "gp_queue_time",
    targetColumn: "gpQueueTime",
    targetType: ColumnType.INTEGER,
    required: false,
  },

  // Boolean fields - handle timestamp values as true if present
  {
    sourceColumn: "arrived",
    targetColumn: "arrived",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      // If it's a timestamp string, treat as true (event occurred)
      if (typeof value === "string" && value.trim() !== "") {
        return true;
      }
      // Otherwise use standard boolean conversion
      return Boolean(value);
    },
  },
  {
    sourceColumn: "waiting_forpayment",
    targetColumn: "waitingForpayment",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      // If it's a timestamp string, treat as true (event occurred)
      if (typeof value === "string" && value.trim() !== "") {
        return true;
      }
      // Otherwise use standard boolean conversion
      return Boolean(value);
    },
  },
  {
    sourceColumn: "appointment_completed",
    targetColumn: "appointmentCompleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    transformFunction: (value) => {
      // If it's a timestamp string, treat as true (event occurred)
      if (typeof value === "string" && value.trim() !== "") {
        return true;
      }
      // Otherwise use standard boolean conversion
      return Boolean(value);
    },
  },
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: true,
  },
  {
    sourceColumn: "is_deleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_arrived",
    targetColumn: "isArrived",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_consult_parked",
    targetColumn: "isConsultParked",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_dummy",
    targetColumn: "isDummy",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_confidential",
    targetColumn: "isConfidential",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },
  {
    sourceColumn: "is_consentto_share",
    targetColumn: "isConsenttoShare",
    targetType: ColumnType.BOOLEAN,
    required: false,
  },

  // Location fields (keep as text for now)
  {
    sourceColumn: "permanent_address_latitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "permanent_address_longitude",
    targetColumn: "permanentAddressLongitude",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "practice_location_id",
    targetColumn: "practiceLocationId",
    targetType: ColumnType.TEXT,
    required: false,
  },
];
