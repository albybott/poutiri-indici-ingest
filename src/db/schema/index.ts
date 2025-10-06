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

// Staging schemas - typed columns with constraints and mapping tables
export * from "./stg/patients";
export * from "./stg/providers";
export * from "./stg/practice_info";
export * from "./stg/appointments";
export * from "./stg/medicine";
export * from "./stg/vaccine";
export * from "./stg/immunisation";

// Shared enums and types
export * from "./shared/enums";

// Core schemas - dimensions and facts with SCD2 and relationships
export * from "./core/dimensions";
export * from "./core/facts";

// ETL schemas - audit, config, and health management
export * from "./etl/audit";
// export * from "./etl/health";

// Schema collections for dynamic loading
// These enable loading schemas on-demand and provide a clean API
// for dynamic schema management scenarios
export const rawSchemas = {
  patients: () => import("./raw/patients"),
  providers: () => import("./raw/providers"),
  practice_info: () => import("./raw/practice-info"),
  appointments: () => import("./raw/appointments"),
  medicine: () => import("./raw/medicine"),
  vaccine: () => import("./raw/vaccine"),
  immunisation: () => import("./raw/immunisation"),
};

export const stgSchemas = {
  patients: () => import("./stg/patients"),
  providers: () => import("./stg/providers"),
  practice_info: () => import("./stg/practice_info"),
  appointments: () => import("./stg/appointments"),
  medicine: () => import("./stg/medicine"),
  vaccine: () => import("./stg/vaccine"),
  immunisation: () => import("./stg/immunisation"),
};

export const coreSchemas = {
  dimensions: () => import("./core/dimensions"),
  facts: () => import("./core/facts"),
};

export const etlSchemas = {
  audit: () => import("./etl/audit"),
};

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
