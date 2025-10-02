import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";

export const appointmentsStg = createTable(
  "stg.appointments",
  {
    // Typed columns with proper constraints
    appointmentId: text("appointment_id").notNull(),
    patientId: text("patient_id"),
    appointmentType: text("appointment_type"),
    appointmentStatus: text("appointment_status"),
    scheduleDate: timestamp("schedule_date", { withTimezone: true }),
    notes: text("notes"),
    arrived: boolean("arrived"),
    waitingForPayment: boolean("waiting_for_payment"),
    appointmentCompleted: boolean("appointment_completed"),
    consultTime: integer("consult_time"), // minutes
    booked: timestamp("booked", { withTimezone: true }),
    medTechId: text("med_tech_id"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    insertedBy: text("inserted_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    updatedBy: text("updated_by"),
    practice: text("practice"),
    practiceId: text("practice_id").notNull(),
    providerId: text("provider_id"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    provider: text("provider"),
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    practiceLocationId: text("practice_location_id"),
    locationName: text("location_name"),
    reasonForVisit: text("reason_for_visit"),
    statusGroup: text("status_group"),
    duration: integer("duration"), // minutes
    appointmentOutcomeId: text("appointment_outcome_id"),
    appointmentOutcome: text("appointment_outcome"),
    appointmentTypeId: text("appointment_type_id"),
    bookingSourceId: text("booking_source_id"),
    bookingSource: text("booking_source"),
    consultEndTime: timestamp("consult_end_time", { withTimezone: true }),
    consultStartTime: timestamp("consult_start_time", { withTimezone: true }),
    consultTimerStatusId: text("consult_timer_status_id"),
    description: text("description"),
    endTime: timestamp("end_time", { withTimezone: true }),
    generatedTime: timestamp("generated_time", { withTimezone: true }),
    gpQueueTime: integer("gp_queue_time"), // minutes
    isArrived: boolean("is_arrived"),
    isConsultParked: boolean("is_consult_parked"),
    isDummy: boolean("is_dummy"),
    lastAppointmentStatusDate: timestamp("last_appointment_status_date", {
      withTimezone: true,
    }),
    lastAppointmentStatusId: text("last_appointment_status_id"),
    cancelReason: text("cancel_reason"),
    parkedReason: text("parked_reason"),
    priorityId: text("priority_id"),
    arrivedTime: timestamp("arrived_time", { withTimezone: true }),
    cancelledTime: timestamp("cancelled_time", { withTimezone: true }),
    notArrivedTime: timestamp("not_arrived_time", { withTimezone: true }),
    nurseQueueTime: integer("nurse_queue_time"), // minutes
    onHoldTime: integer("on_hold_time"), // minutes
    readOnlyTime: integer("read_only_time"), // minutes
    selfAssessmentCompletedTime: timestamp("self_assessment_completed_time", {
      withTimezone: true,
    }),
    selfAssessmentQueueTime: integer("self_assessment_queue_time"), // minutes
    startTime: timestamp("start_time", { withTimezone: true }),
    triageQueueTime: integer("triage_queue_time"), // minutes
    virtualQueueTime: integer("virtual_queue_time"), // minutes
    isConfidential: boolean("is_confidential"),
    isConsentToShare: boolean("is_consent_to_share"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("appointments_stg_natural_key_idx").on(
      table.appointmentId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);
