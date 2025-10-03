import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  serial,
  unique,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createTable } from "../../utils/create-table";
import {
  dimPatient,
  dimProvider,
  dimPractice,
  dimMedicine,
  dimVaccine,
} from "./dimensions";

// Appointment fact table
export const factAppointment = createTable(
  "core.fact_appointment",
  {
    appointmentKey: serial("appointment_key").primaryKey(),
    appointmentId: text("appointment_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Foreign keys to dimensions
    patientKey: integer("patient_key").references(() => dimPatient.patientKey),
    providerKey: integer("provider_key").references(
      () => dimProvider.providerKey
    ),
    practiceKey: integer("practice_key").references(
      () => dimPractice.practiceKey
    ),

    // Measures and attributes
    appointmentType: text("appointment_type"),
    appointmentStatus: text("appointment_status"),
    scheduleDate: timestamp("schedule_date"),
    duration: integer("duration"), // minutes
    consultTime: integer("consult_time"), // minutes

    // Status flags
    arrived: boolean("arrived").notNull().default(false),
    appointmentCompleted: boolean("appointment_completed")
      .notNull()
      .default(false),
    isConfidential: boolean("is_confidential").notNull().default(false),

    // Additional metadata
    appointmentNotes: text("appointment_notes"),
    reasonForVisit: text("reason_for_visit"),
    followUpRequired: boolean("follow_up_required").notNull().default(false),

    // Lineage
    s3VersionId: text("s3_version_id").notNull(),
    loadRunId: uuid("load_run_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Business key constraint
    uniqueIndex("fact_appointment_business_key_idx").on(
      table.appointmentId,
      table.practiceId,
      table.perOrgId
    ),

    // Performance indexes
    index("fact_appointment_patient_key_idx").on(table.patientKey),
    index("fact_appointment_provider_key_idx").on(table.providerKey),
    index("fact_appointment_schedule_date_idx").on(table.scheduleDate),
  ]
);

// Immunisation fact table
export const factImmunisation = createTable(
  "core.fact_immunisation",
  {
    immunisationKey: serial("immunisation_key").primaryKey(),
    immunisationId: text("immunisation_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Foreign keys to dimensions
    patientKey: integer("patient_key").references(() => dimPatient.patientKey),
    providerKey: integer("provider_key").references(
      () => dimProvider.providerKey
    ),
    vaccineKey: integer("vaccine_key").references(() => dimVaccine.vaccineKey),

    // Immunisation details
    immunisationDate: date("immunisation_date"),
    batchNumber: text("batch_number"),
    expiryDate: date("expiry_date"),
    dose: decimal("dose", { precision: 10, scale: 2 }),
    doseUnit: text("dose_unit"),
    route: text("route"),
    site: text("site"),
    sequence: integer("sequence"),

    // Status and validation
    isValid: boolean("is_valid").notNull().default(true),
    validationError: text("validation_error"),
    isHistorical: boolean("is_historical").notNull().default(false),

    // Lineage
    s3VersionId: text("s3_version_id").notNull(),
    loadRunId: uuid("load_run_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Business key constraint
    uniqueIndex("fact_immunisation_business_key_idx").on(
      table.immunisationId,
      table.practiceId,
      table.perOrgId
    ),

    // Performance indexes
    index("fact_immunisation_patient_key_idx").on(table.patientKey),
    index("fact_immunisation_vaccine_key_idx").on(table.vaccineKey),
    index("fact_immunisation_date_idx").on(table.immunisationDate),
  ]
);

// Invoice fact table
export const factInvoice = createTable(
  "core.fact_invoice",
  {
    invoiceKey: serial("invoice_key").primaryKey(),
    invoiceId: text("invoice_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Foreign keys to dimensions
    patientKey: integer("patient_key").references(() => dimPatient.patientKey),
    providerKey: integer("provider_key").references(
      () => dimProvider.providerKey
    ),

    // Invoice details
    invoiceDate: date("invoice_date"),
    dueDate: date("due_date"),
    paidDate: date("paid_date"),

    // Financial measures
    grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
    netAmount: decimal("net_amount", { precision: 10, scale: 2 }),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
    outstandingAmount: decimal("outstanding_amount", {
      precision: 10,
      scale: 2,
    }),

    // Invoice status
    status: text("status"),
    paymentMethod: text("payment_method"),
    isOverdue: boolean("is_overdue").notNull().default(false),

    // Lineage
    s3VersionId: text("s3_version_id").notNull(),
    loadRunId: uuid("load_run_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Business key constraint
    unique("fact_invoice_business_key_idx").on(
      table.invoiceId,
      table.practiceId,
      table.perOrgId
    ),

    // Performance indexes
    index("fact_invoice_patient_key_idx").on(table.patientKey),
    index("fact_invoice_date_idx").on(table.invoiceDate),
    index("fact_invoice_status_idx").on(table.status),
  ]
);

// Invoice detail fact table (line items)
export const factInvoiceDetail = createTable(
  "core.fact_invoice_detail",
  {
    invoiceDetailKey: serial("invoice_detail_key").primaryKey(),
    invoiceDetailId: text("invoice_detail_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Foreign keys to dimensions
    patientKey: integer("patient_key").references(() => dimPatient.patientKey),
    providerKey: integer("provider_key").references(
      () => dimProvider.providerKey
    ),
    medicineKey: integer("medicine_key").references(
      () => dimMedicine.medicineKey
    ),

    // Detail information
    serviceDate: date("service_date"),
    serviceCode: text("service_code"),
    serviceDescription: text("service_description"),
    quantity: decimal("quantity", { precision: 10, scale: 2 }),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }),

    // Status
    isRefunded: boolean("is_refunded").notNull().default(false),
    refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),

    // Lineage
    s3VersionId: text("s3_version_id").notNull(),
    loadRunId: uuid("load_run_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Business key constraint
    uniqueIndex("fact_invoice_detail_business_key_idx").on(
      table.invoiceDetailId,
      table.practiceId,
      table.perOrgId
    ),

    // Foreign key to parent invoice
    foreignKey({
      columns: [
        factInvoiceDetail.invoiceId,
        factInvoiceDetail.practiceId,
        factInvoiceDetail.perOrgId,
      ],
      foreignColumns: [
        factInvoice.invoiceId,
        factInvoice.practiceId,
        factInvoice.perOrgId,
      ],
      name: "fk_invoice_detail_invoice",
    }),

    // Performance indexes
    index("fact_invoice_detail_invoice_id_idx").on(table.invoiceId),
    index("fact_invoice_detail_medicine_key_idx").on(table.medicineKey),
  ]
);

// Diagnosis fact table
export const factDiagnosis = createTable(
  "core.fact_diagnosis",
  {
    diagnosisKey: serial("diagnosis_key").primaryKey(),
    diagnosisId: text("diagnosis_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Foreign keys to dimensions
    patientKey: integer("patient_key").references(() => dimPatient.patientKey),
    providerKey: integer("provider_key").references(
      () => dimProvider.providerKey
    ),

    // Diagnosis details
    diagnosisDate: date("diagnosis_date"),
    icd10Code: text("icd10_code"),
    diagnosisDescription: text("diagnosis_description"),
    diagnosisType: text("diagnosis_type"),
    certainty: text("certainty"),
    isChronic: boolean("is_chronic").notNull().default(false),
    isResolved: boolean("is_resolved").notNull().default(false),

    // Status tracking
    onsetDate: date("onset_date"),
    resolvedDate: date("resolved_date"),

    // Lineage
    s3VersionId: text("s3_version_id").notNull(),
    loadRunId: uuid("load_run_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Business key constraint
    uniqueIndex("fact_diagnosis_business_key_idx").on(
      table.diagnosisId,
      table.practiceId,
      table.perOrgId
    ),

    // Performance indexes
    index("fact_diagnosis_patient_key_idx").on(table.patientKey),
    index("fact_diagnosis_icd10_code_idx").on(table.icd10Code),
    index("fact_diagnosis_date_idx").on(table.diagnosisDate),
  ]
);

// Measurement fact table
export const factMeasurement = createTable(
  "core.fact_measurement",
  {
    measurementKey: serial("measurement_key").primaryKey(),
    measurementId: text("measurement_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Foreign keys to dimensions
    patientKey: integer("patient_key").references(() => dimPatient.patientKey),
    providerKey: integer("provider_key").references(
      () => dimProvider.providerKey
    ),

    // Measurement details
    measurementDate: timestamp("measurement_date"),
    measurementType: text("measurement_type"),
    measurementCode: text("measurement_code"),
    measurementValue: decimal("measurement_value", { precision: 10, scale: 4 }),
    unit: text("unit"),
    normalRangeLow: decimal("normal_range_low", { precision: 10, scale: 4 }),
    normalRangeHigh: decimal("normal_range_high", { precision: 10, scale: 4 }),

    // Status and interpretation
    isAbnormal: boolean("is_abnormal").notNull().default(false),
    interpretation: text("interpretation"),
    notes: text("notes"),

    // Lineage
    s3VersionId: text("s3_version_id").notNull(),
    loadRunId: uuid("load_run_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Business key constraint
    uniqueIndex("fact_measurement_business_key_idx").on(
      table.measurementId,
      table.practiceId,
      table.perOrgId
    ),

    // Performance indexes
    index("fact_measurement_patient_key_idx").on(table.patientKey),
    index("fact_measurement_type_idx").on(table.measurementType),
    index("fact_measurement_date_idx").on(table.measurementDate),
  ]
);
