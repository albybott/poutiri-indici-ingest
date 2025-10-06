import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Appointments handler generated from schema
 * Generated on 2025-10-06T01:11:46.103Z
 */
export class AppointmentsSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Appointment";
  tableName = "raw.appointments";

  // Generated from src/db/schema/raw/appointments.ts
  columnMapping = [
    "appointment_id",
    "patient_id",
    "appointment_type",
    "appointment_status",
    "schedule_date",
    "notes",
    "arrived",
    "waiting_forpayment",
    "appointment_completed",
    "consult_time",
    "booked",
    "med_tech_id",
    "inserted_at",
    "inserted_by",
    "updated_at",
    "updated_by",
    "practice",
    "practice_id",
    "provider_id",
    "is_active",
    "is_deleted",
    "provider",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "practice_location_id",
    "location_name",
    "reasonfor_visit",
    "status_group",
    "duration",
    "appointment_out_come_id",
    "appointment_out_come",
    "appointment_type_id",
    "booking_source_id",
    "booking_source",
    "consult_end_time",
    "consult_start_time",
    "consult_timer_status_id",
    "description",
    "end_time",
    "generated_time",
    "gp_queue_time",
    "is_arrived",
    "is_consult_parked",
    "is_dummy",
    "last_appointment_status_date",
    "last_appointment_status_id",
    "cancel_reason",
    "parked_reason",
    "priority_id",
    "arrived_time",
    "cancelled_time",
    "not_arrived_time",
    "nurse_queue_time",
    "on_hold_time",
    "read_only_time",
    "self_assessment_completed_time",
    "self_assessment_queue_time",
    "start_time",
    "triage_queue_time",
    "virtual_queue_time",
    "is_confidential",
    "is_consentto_share",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "appointment_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "appointment_id must be numeric"
    // }
  ];
}
