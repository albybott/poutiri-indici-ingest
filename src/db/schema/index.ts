// Schema definitions
export * from "./schemas";

// Raw schemas - all source columns as text with lineage
export * from "./raw/patients";
export * from "./raw/providers";
export * from "./raw/practice-info";
export * from "./raw/appointments";
export * from "./raw/medicine";
export * from "./raw/vaccine";
export * from "./raw/immunisation";
export * from "./raw/next-of-kin";
export * from "./raw/diagnoses";
export * from "./raw/allergies";
export * from "./raw/appointment-medications";
export * from "./raw/invoices";
export * from "./raw/invoice-detail";
export * from "./raw/inbox";
export * from "./raw/inbox-detail";
export * from "./raw/measurements";
export * from "./raw/patient-alerts";
export * from "./raw/providers";
export * from "./raw/recalls";
export * from "./raw/vaccine";

// Staging schemas - typed columns with constraints and mapping tables
export * from "./stg/patients";
export * from "./stg/providers";
export * from "./stg/practice-info";
export * from "./stg/appointments";
export * from "./stg/medicine";
export * from "./stg/vaccine";
export * from "./stg/immunisation";
export * from "./stg/next-of-kin";
export * from "./stg/diagnoses";
export * from "./stg/allergies";
export * from "./stg/appointment-medications";
export * from "./stg/invoices";
export * from "./stg/invoice-detail";
export * from "./stg/inbox";
export * from "./stg/inbox-detail";
export * from "./stg/measurements";
export * from "./stg/patient-alerts";
export * from "./stg/providers";
export * from "./stg/recalls";
export * from "./stg/vaccine";

// Shared enums and types
export * from "./shared/enums";

// Core schemas - dimensions and facts with SCD2 and relationships
export * from "./core/dimensions";
export * from "./core/facts";

// ETL schemas - audit, config, and health management
export * from "./etl/audit";
// export * from "./etl/health";

// Extract types enum for type safety - matches filename format from S3
export const EXTRACT_TYPES = {
  PATIENT: "Patient",
  APPOINTMENTS: "Appointments",
  IMMUNISATION: "Immunisation",
  INVOICES: "Invoices",
  INVOICE_DETAIL: "InvoiceDetail",
  PROVIDER: "Provider",
  PRACTICE_INFO: "PracticeInfo",
  MEASUREMENTS: "Measurements",
  DIAGNOSIS: "Diagnosis",
  RECALLS: "Recalls",
  INBOX: "Inbox",
  INBOX_DETAIL: "InboxDetail",
  MEDICINE: "Medicine",
  NEXT_OF_KIN: "NextOfKin",
  VACCINE: "Vaccine",
  ALLERGIES: "Allergies",
  APPOINTMENT_MEDICATIONS: "AppointmentMedications",
  PATIENT_ALERTS: "PatientAlerts",
} as const;

export type ExtractType = (typeof EXTRACT_TYPES)[keyof typeof EXTRACT_TYPES];

// Schema names for easy reference
export const SCHEMA_NAMES = {
  RAW: "raw",
  STG: "stg",
  CORE: "core",
  ETL: "etl",
} as const;

export type SchemaName = (typeof SCHEMA_NAMES)[keyof typeof SCHEMA_NAMES];
