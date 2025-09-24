// Raw schemas - all source columns as text with lineage
export * from "./raw/patients.js";
export * from "./raw/appointments.js";
export * from "./raw/immunisations.js";
export * from "./raw/invoices.js";
export * from "./raw/invoice_detail.js";
export * from "./raw/providers.js";
export * from "./raw/practice_info.js";
export * from "./raw/measurements.js";
export * from "./raw/diagnoses.js";
export * from "./raw/recalls.js";
export * from "./raw/inbox.js";
export * from "./raw/inbox_detail.js";
export * from "./raw/medicine.js";
export * from "./raw/next_of_kin.js";
export * from "./raw/vaccine.js";
export * from "./raw/allergies.js";
export * from "./raw/appointment_medications.js";
export * from "./raw/patient_alerts.js";

// Staging schemas - typed columns with constraints and mapping tables
export * from "./stg/patients.js";
export * from "./stg/appointments.js";
export * from "./stg/immunisations.js";
export * from "./stg/invoices.js";
export * from "./stg/invoice_detail.js";
export * from "./stg/mappings.js";

// Shared enums and types
export * from "./shared/enums.js";

// Core schemas - dimensions and facts with SCD2 and relationships
export * from "./core/dimensions.js";
export * from "./core/facts.js";

// ETL schemas - audit, config, and health management
export * from "./etl/audit.js";
export * from "./etl/health.js";

// Schema collections for dynamic loading
// These enable loading schemas on-demand and provide a clean API
// for dynamic schema management scenarios
export const rawSchemas = {
  patients: () => import("./raw/patients.js"),
  appointments: () => import("./raw/appointments.js"),
  immunisations: () => import("./raw/immunisations.js"),
  invoices: () => import("./raw/invoices.js"),
  invoiceDetail: () => import("./raw/invoice_detail.js"),
  providers: () => import("./raw/providers.js"),
  practiceInfo: () => import("./raw/practice_info.js"),
  measurements: () => import("./raw/measurements.js"),
  diagnoses: () => import("./raw/diagnoses.js"),
  recalls: () => import("./raw/recalls.js"),
  inbox: () => import("./raw/inbox.js"),
  inboxDetail: () => import("./raw/inbox_detail.js"),
  medicine: () => import("./raw/medicine.js"),
  nextOfKin: () => import("./raw/next_of_kin.js"),
  vaccine: () => import("./raw/vaccine.js"),
  allergies: () => import("./raw/allergies.js"),
  appointmentMedications: () => import("./raw/appointment_medications.js"),
  patientAlerts: () => import("./raw/patient_alerts.js"),
};

export const stgSchemas = {
  patients: () => import("./stg/patients.js"),
  appointments: () => import("./stg/appointments.js"),
  immunisations: () => import("./stg/immunisations.js"),
  invoices: () => import("./stg/invoices.js"),
  invoiceDetail: () => import("./stg/invoice_detail.js"),
  mappings: () => import("./stg/mappings.js"),
};

export const coreSchemas = {
  dimensions: () => import("./core/dimensions.js"),
  facts: () => import("./core/facts.js"),
};

export const etlSchemas = {
  audit: () => import("./etl/audit.js"),
  health: () => import("./etl/health.js"),
};

// Extract types enum for type safety
export const EXTRACT_TYPES = {
  PATIENTS: "patients",
  APPOINTMENTS: "appointments",
  IMMUNISATIONS: "immunisations",
  INVOICES: "invoices",
  INVOICE_DETAIL: "invoice_detail",
  PROVIDERS: "providers",
  PRACTICE_INFO: "practice_info",
  MEASUREMENTS: "measurements",
  DIAGNOSES: "diagnoses",
  RECALLS: "recalls",
  INBOX: "inbox",
  INBOX_DETAIL: "inbox_detail",
  MEDICINE: "medicine",
  NEXT_OF_KIN: "next_of_kin",
  VACCINE: "vaccine",
  ALLERGIES: "allergies",
  APPOINTMENT_MEDICATIONS: "appointment_medications",
  PATIENT_ALERTS: "patient_alerts",
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
