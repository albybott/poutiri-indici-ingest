// Raw schemas - all source columns as text with lineage
export * from "./raw/patients";
export * from "./raw/appointments";
export * from "./raw/immunisations";
export * from "./raw/invoices";
export * from "./raw/invoice_detail";
export * from "./raw/providers";
export * from "./raw/practice_info";
export * from "./raw/measurements";
export * from "./raw/diagnoses";
export * from "./raw/recalls";
export * from "./raw/inbox";
export * from "./raw/inbox_detail";
export * from "./raw/medicine";
export * from "./raw/next_of_kin";
export * from "./raw/vaccine";
export * from "./raw/allergies";
export * from "./raw/appointment_medications";
export * from "./raw/patient_alerts";

// Staging schemas - typed columns with constraints and mapping tables
export * from "./stg/patients";
export * from "./stg/appointments";
export * from "./stg/immunisations";
export * from "./stg/invoices";
export * from "./stg/invoice_detail";
export * from "./stg/providers";
export * from "./stg/practice_info";
export * from "./stg/diagnoses";
export * from "./stg/mappings";

// Shared enums and types
export * from "./shared/enums";

// Core schemas - dimensions and facts with SCD2 and relationships
export * from "./core/dimensions";
export * from "./core/facts";

// ETL schemas - audit, config, and health management
export * from "./etl/audit";
export * from "./etl/health";

// Schema collections for dynamic loading
// These enable loading schemas on-demand and provide a clean API
// for dynamic schema management scenarios
export const rawSchemas = {
  patients: () => import("./raw/patients"),
  appointments: () => import("./raw/appointments"),
  immunisations: () => import("./raw/immunisations"),
  invoices: () => import("./raw/invoices"),
  invoiceDetail: () => import("./raw/invoice_detail"),
  providers: () => import("./raw/providers"),
  practiceInfo: () => import("./raw/practice_info"),
  measurements: () => import("./raw/measurements"),
  diagnoses: () => import("./raw/diagnoses"),
  recalls: () => import("./raw/recalls"),
  inbox: () => import("./raw/inbox"),
  inboxDetail: () => import("./raw/inbox_detail"),
  medicine: () => import("./raw/medicine"),
  nextOfKin: () => import("./raw/next_of_kin"),
  vaccine: () => import("./raw/vaccine"),
  allergies: () => import("./raw/allergies"),
  appointmentMedications: () => import("./raw/appointment_medications"),
  patientAlerts: () => import("./raw/patient_alerts"),
};

export const stgSchemas = {
  patients: () => import("./stg/patients"),
  appointments: () => import("./stg/appointments"),
  immunisations: () => import("./stg/immunisations"),
  invoices: () => import("./stg/invoices"),
  invoiceDetail: () => import("./stg/invoice_detail"),
  providers: () => import("./stg/providers"),
  practiceInfo: () => import("./stg/practice_info"),
  diagnoses: () => import("./stg/diagnoses"),
  mappings: () => import("./stg/mappings"),
};

export const coreSchemas = {
  dimensions: () => import("./core/dimensions"),
  facts: () => import("./core/facts"),
};

export const etlSchemas = {
  audit: () => import("./etl/audit"),
  health: () => import("./etl/health"),
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
