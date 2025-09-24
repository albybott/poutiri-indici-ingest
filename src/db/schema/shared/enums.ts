import { pgEnum } from "drizzle-orm/pg-core";

// Define enum for extract types
export const extractTypeEnum = pgEnum("extract_type", [
  "patients",
  "appointments",
  "immunisations",
  "invoices",
  "invoice_detail",
  "providers",
  "practice_info",
  "measurements",
  "diagnoses",
  "recalls",
  "inbox",
  "inbox_detail",
  "medicine",
  "next_of_kin",
  "vaccine",
  "allergies",
  "appointment_medications",
  "patient_alerts",
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
