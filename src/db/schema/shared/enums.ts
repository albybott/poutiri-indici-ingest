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
] as const);

// Export the TypeScript type from the enum - converts tuple to union type
export type ExtractType = (typeof extractTypeEnum.enumValues)[number];

// Export the runtime array for use in application code (e.g., validation, iteration)
export const extractTypeValues = extractTypeEnum.enumValues;

// Export an object-like interface for easy property access (e.g., extractTypes.Patient)
export const extractTypes = Object.fromEntries(
  extractTypeEnum.enumValues.map((value) => [value, value])
) as Record<ExtractType, ExtractType>;

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
] as const);

// Export the TypeScript type from the enum - converts tuple to union type
export type AppointmentStatus =
  (typeof appointmentStatusEnum.enumValues)[number];

// Export an object-like interface for easy property access
export const appointmentStatuses = Object.fromEntries(
  appointmentStatusEnum.enumValues.map((value) => [value, value])
) as Record<AppointmentStatus, AppointmentStatus>;

// Define enum for appointment status group
export const statusGroupEnum = pgEnum("status_group", [
  "active",
  "completed",
  "cancelled",
  "no_show",
] as const);

// Export the TypeScript type from the enum - converts tuple to union type
export type StatusGroup = (typeof statusGroupEnum.enumValues)[number];

// Export an object-like interface for easy property access
export const statusGroups = Object.fromEntries(
  statusGroupEnum.enumValues.map((value) => [value, value])
) as Record<StatusGroup, StatusGroup>;

// Define enum for immunisation status
export const immunisationStatusEnum = pgEnum("immunisation_status", [
  "completed",
  "pending",
  "overdue",
  "cancelled",
  "not_required",
] as const);

// Export the TypeScript type from the enum - converts tuple to union type
export type ImmunisationStatus =
  (typeof immunisationStatusEnum.enumValues)[number];

// Export an object-like interface for easy property access
export const immunisationStatuses = Object.fromEntries(
  immunisationStatusEnum.enumValues.map((value) => [value, value])
) as Record<ImmunisationStatus, ImmunisationStatus>;
