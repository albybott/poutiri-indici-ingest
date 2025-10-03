import { pgEnum } from "drizzle-orm/pg-core";

//TODO: Update these types so that they match the actual extract types in code i.e. lowercase and snake_case
// Define enum for extract types - matches filename format from S3
export const extractTypeEnum = pgEnum("extract_type", [
  "Patient",
  "Appointments",
  "Immunisation",
  "Invoices",
  "InvoiceDetail",
  "Provider",
  "PracticeInfo",
  "Measurements",
  "Diagnosis",
  "Recalls",
  "Inbox",
  "InboxDetail",
  "Medicine",
  "NextOfKin",
  "Vaccine",
  "Allergies",
  "AppointmentMedications",
  "PatientAlerts",
]);

// Define enum for appointment status mapping
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
]);

// Define enum for appointment status group
export const statusGroupEnum = pgEnum("status_group", [
  "active",
  "completed",
  "cancelled",
  "no_show",
]);

// Define enum for immunisation status
export const immunisationStatusEnum = pgEnum("immunisation_status", [
  "completed",
  "pending",
  "overdue",
  "cancelled",
  "not_required",
]);
