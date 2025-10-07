import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  date,
  check,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const appointmentsStg = createTable(
  "stg.appointments",
  {
    // Typed columns with proper constraints
    appointmentId: text("appointment_id").notNull(),
    patientId: text("patient_id"),
    appointmentType: text("appointment_type"),
    appointmentStatus: text("appointment_status"),
    scheduleDate: timestamp("schedule_date"),
    notes: text("notes"),
    arrived: boolean("arrived"),
    waitingForpayment: boolean("waiting_forpayment"),
    appointmentCompleted: boolean("appointment_completed"),
    consultTime: integer("consult_time"),
    booked: timestamp("booked"),
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
    permanentAddressLatitude: text("permanent_address_latitude"),
    permanentAddressLongitude: text("permanent_address_longitude"),
    practiceLocationId: text("practice_location_id"),
    locationName: text("location_name"),
    reasonforVisit: text("reasonfor_visit"),
    statusGroup: text("status_group"),
    duration: integer("duration"),
    appointmentOutComeId: text("appointment_out_come_id"),
    appointmentOutCome: text("appointment_out_come"),
    appointmentTypeId: text("appointment_type_id"),
    bookingSourceId: text("booking_source_id"),
    bookingSource: text("booking_source"),
    consultEndTime: timestamp("consult_end_time"),
    consultStartTime: timestamp("consult_start_time"),
    consultTimerStatusId: text("consult_timer_status_id"),
    description: text("description"),
    endTime: timestamp("end_time"),
    generatedTime: timestamp("generated_time"),
    gpQueueTime: integer("gp_queue_time"),
    isArrived: boolean("is_arrived"),
    isConsultParked: boolean("is_consult_parked"),
    isDummy: boolean("is_dummy"),
    lastAppointmentStatusDate: timestamp("last_appointment_status_date"),
    lastAppointmentStatusId: text("last_appointment_status_id"),
    cancelReason: text("cancel_reason"),
    parkedReason: text("parked_reason"),
    priorityId: text("priority_id"),
    arrivedTime: timestamp("arrived_time"),
    cancelledTime: timestamp("cancelled_time"),
    notArrivedTime: timestamp("not_arrived_time"),
    nurseQueueTime: integer("nurse_queue_time"),
    onHoldTime: timestamp("on_hold_time"),
    readOnlyTime: timestamp("read_only_time"),
    selfAssessmentCompletedTime: timestamp("self_assessment_completed_time"),
    selfAssessmentQueueTime: integer("self_assessment_queue_time"),
    startTime: timestamp("start_time"),
    triageQueueTime: timestamp("triage_queue_time"),
    virtualQueueTime: timestamp("virtual_queue_time"),
    isConfidential: boolean("is_confidential"),
    isConsenttoShare: boolean("is_consentto_share"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files
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

// Foreign key constraint to etl.load_run_files
export const fkAppointmentsStgLoadRunFile = foreignKey({
  columns: [appointmentsStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_appointments_stg_load_run_file",
});
