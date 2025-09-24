import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  serial,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../../utils/create-table.js";

// Appointment fact table
export const factAppointment = createTable("core.fact_appointment", {
  // Surrogate key
  appointmentKey: serial("appointment_key").primaryKey(),

  // Business keys
  appointmentId: text("appointment_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Foreign keys to dimensions
  patientKey: integer("patient_key"), // FK to dim_patient
  providerKey: integer("provider_key"), // FK to dim_provider
  practiceKey: integer("practice_key"), // FK to dim_practice

  // Appointment attributes
  appointmentType: text("appointment_type"),
  appointmentStatus: text("appointment_status"),
  statusGroup: text("status_group"),
  scheduleDate: timestamp("schedule_date", { withTimezone: true }),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  consultStartTime: timestamp("consult_start_time", { withTimezone: true }),
  consultEndTime: timestamp("consult_end_time", { withTimezone: true }),
  duration: integer("duration"), // minutes
  consultTime: integer("consult_time"), // minutes

  // Status flags
  arrived: boolean("arrived"),
  isArrived: boolean("is_arrived"),
  waitingForPayment: boolean("waiting_for_payment"),
  appointmentCompleted: boolean("appointment_completed"),
  isConsultParked: boolean("is_consult_parked"),
  isDummy: boolean("is_dummy"),
  isConfidential: boolean("is_confidential"),
  isConsentToShare: boolean("is_consent_to_share"),

  // Queue times (minutes)
  gpQueueTime: integer("gp_queue_time"),
  nurseQueueTime: integer("nurse_queue_time"),
  triageQueueTime: integer("triage_queue_time"),
  virtualQueueTime: integer("virtual_queue_time"),
  selfAssessmentQueueTime: integer("self_assessment_queue_time"),
  onHoldTime: integer("on_hold_time"),
  readOnlyTime: integer("read_only_time"),

  // Timestamps
  arrivedTime: timestamp("arrived_time", { withTimezone: true }),
  cancelledTime: timestamp("cancelled_time", { withTimezone: true }),
  notArrivedTime: timestamp("not_arrived_time", { withTimezone: true }),
  booked: timestamp("booked", { withTimezone: true }),
  generatedTime: timestamp("generated_time", { withTimezone: true }),
  selfAssessmentCompletedTime: timestamp("self_assessment_completed_time", {
    withTimezone: true,
  }),

  // Additional attributes
  reasonForVisit: text("reason_for_visit"),
  notes: text("notes"),
  description: text("description"),
  cancelReason: text("cancel_reason"),
  parkedReason: text("parked_reason"),
  priorityId: text("priority_id"),
  appointmentOutcomeId: text("appointment_outcome_id"),
  appointmentOutcome: text("appointment_outcome"),
  appointmentTypeId: text("appointment_type_id"),
  bookingSourceId: text("booking_source_id"),
  bookingSource: text("booking_source"),
  consultTimerStatusId: text("consult_timer_status_id"),
  lastAppointmentStatusDate: timestamp("last_appointment_status_date", {
    withTimezone: true,
  }),
  lastAppointmentStatusId: text("last_appointment_status_id"),

  // Location
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Immunisation fact table
export const factImmunisation = createTable("core.fact_immunisation", {
  // Surrogate key
  immunisationKey: serial("immunisation_key").primaryKey(),

  // Business keys
  appointmentImmunisationId: text("appointment_immunisation_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Foreign keys to dimensions
  patientKey: integer("patient_key"), // FK to dim_patient
  providerKey: integer("provider_key"), // FK to dim_provider
  practiceKey: integer("practice_key"), // FK to dim_practice
  vaccineKey: integer("vaccine_key"), // FK to dim_vaccine

  // Immunisation attributes
  appointmentId: text("appointment_id"),
  patientScheduleId: text("patient_schedule_id"),
  vaccineId: text("vaccine_id"),
  vaccineName: text("vaccine_name"),
  vaccineCode: text("vaccine_code"),
  dose: decimal("dose", { precision: 8, scale: 2 }),
  doseNumber: integer("dose_number"),
  administrationSiteId: text("administration_site_id"),
  administrationSite: text("administration_site"),
  routeId: text("route_id"),
  route: text("route"),
  batchNumber: text("batch_number"),
  expiryDate: date("expiry_date"),
  immunisationStatusId: text("immunisation_status_id"),
  immunisationStatus: text("immunisation_status"),
  vaccineOutcomeId: text("vaccine_outcome_id"),
  vaccineOutcome: text("vaccine_outcome"),
  isNirAck: boolean("is_nir_ack"),
  reason: text("reason"),
  comments: text("comments"),
  administrationTime: timestamp("administration_time", {
    withTimezone: true,
  }),
  vaccineIndicationId: text("vaccine_indication_id"),
  vaccineIndication: text("vaccine_indication"),
  vaccineIndicationCode: text("vaccine_indication_code"),
  needleLength: decimal("needle_length", { precision: 5, scale: 2 }),
  hasDiluent: boolean("has_diluent"),
  diluentBatchNo: text("diluent_batch_no"),
  diluentExpiryDate: date("diluent_expiry_date"),
  isConfidential: boolean("is_confidential"),
  costingCodeId: text("costing_code_id"),
  costingCode: text("costing_code"),
  brandId: text("brand_id"),
  brand: text("brand"),
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),
  isParked: boolean("is_parked"),
  isAutoBill: boolean("is_auto_bill"),
  vaccinatorId: text("vaccinator_id"),
  vaccinator: text("vaccinator"),
  vaccinatorCode: text("vaccinator_code"),
  nirSentDate: date("nir_sent_date"),
  showOnPortal: boolean("show_on_portal"),
  vaccineGroupId: text("vaccine_group_id"),
  vaccineGroup: text("vaccine_group"),

  // Location
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Invoice fact table
export const factInvoice = createTable("core.fact_invoice", {
  // Surrogate key
  invoiceKey: serial("invoice_key").primaryKey(),

  // Business keys
  invoiceTransactionId: text("invoice_transaction_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Foreign keys to dimensions
  patientKey: integer("patient_key"), // FK to dim_patient
  providerKey: integer("provider_key"), // FK to dim_provider
  practiceKey: integer("practice_key"), // FK to dim_practice

  // Invoice attributes
  patientId: text("patient_id"),
  acdate: date("acdate"),
  medtechId: text("medtech_id"),
  paymentMode: text("payment_mode"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  unpaidAmount: decimal("unpaid_amount", { precision: 10, scale: 2 }),
  claimNotes: text("claim_notes"),
  description: text("description"),
  incomeProvider: text("income_provider"),
  invoicePaymentNo: text("invoice_payment_no"),
  provider: text("provider"),
  domicileCode: text("domicile_code"),
  transactionType: text("transaction_type"),
  notes: text("notes"),

  // Status
  isActive: boolean("is_active"),

  // Location
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),

  // Timestamps
  insertedAt: timestamp("inserted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  insertedBy: text("inserted_by"),
  updatedBy: text("updated_by"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Invoice detail fact table
export const factInvoiceDetail = createTable("core.fact_invoice_detail", {
  // Surrogate key
  invoiceDetailKey: serial("invoice_detail_key").primaryKey(),

  // Business keys
  invoiceDetailId: text("invoice_detail_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Foreign keys
  invoiceKey: integer("invoice_key"), // FK to fact_invoice
  invoiceTransactionId: text("invoice_transaction_id"),

  // Invoice detail attributes
  masterServiceSubServiceId: text("master_service_sub_service_id"),
  appointmentServiceId: text("appointment_service_id"),
  comments: text("comments"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
  claimAmount: decimal("claim_amount", { precision: 10, scale: 2 }),
  coPayment: decimal("co_payment", { precision: 10, scale: 2 }),
  grossClaimAmount: decimal("gross_claim_amount", {
    precision: 10,
    scale: 2,
  }),
  grossCoPayment: decimal("gross_co_payment", { precision: 10, scale: 2 }),
  isBillingAmount: boolean("is_billing_amount"),
  funderId: text("funder_id"),
  funderName: text("funder_name"),
  contractServiceId: text("contract_service_id"),
  contractServiceName: text("contract_service_name"),
  isFunded: boolean("is_funded"),
  submissionStatus: text("submission_status"),
  caseNo: text("case_no"),
  sequenceNo: integer("sequence_no"),
  billingClaimStatusId: text("billing_claim_status_id"),
  masterServiceName: text("master_service_name"),
  masterServiceCode: text("master_service_code"),
  masterServiceDescription: text("master_service_description"),
  serviceName: text("service_name"),
  description: text("description"),
  code: text("code"),
  feeCode: text("fee_code"),
  serviceCode: text("service_code"),
  subServiceDescription: text("sub_service_description"),
  duration: integer("duration"), // minutes
  isCommonService: boolean("is_common_service"),
  serviceCodeForClaim: text("service_code_for_claim"),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Location
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),

  // Timestamps
  insertedAt: timestamp("inserted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  insertedById: text("inserted_by_id"),
  updatedById: text("updated_by_id"),
  insertedBy: text("inserted_by"),
  updatedBy: text("updated_by"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Diagnosis fact table
export const factDiagnosis = createTable("core.fact_diagnosis", {
  // Surrogate key
  diagnosisKey: serial("diagnosis_key").primaryKey(),

  // Business keys
  diagnosisId: text("diagnosis_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Foreign keys to dimensions
  patientKey: integer("patient_key"), // FK to dim_patient
  providerKey: integer("provider_key"), // FK to dim_provider
  practiceKey: integer("practice_key"), // FK to dim_practice

  // Diagnosis attributes
  appointmentId: text("appointment_id"),
  patientId: text("patient_id"),
  diseaseId: text("disease_id"),
  disease: text("disease"),
  diagnosisDate: date("diagnosis_date"),
  diagnosisById: text("diagnosis_by_id"),
  diagnosisBy: text("diagnosis_by"),
  summary: text("summary"),
  isLongTerm: boolean("is_long_term"),
  addtoProblem: boolean("addto_problem"),
  isHighlighted: boolean("is_highlighted"),
  sequenceNo: integer("sequence_no"),
  isConfidential: boolean("is_confidential"),
  diagnosisTypeId: text("diagnosis_type_id"),
  diagnosisType: text("diagnosis_type"),
  classificationRecord: text("classification_record"),
  medTechId: text("med_tech_id"),
  medTechReadCode: text("med_tech_read_code"),
  medTechReadTerm: text("med_tech_read_term"),
  isMapped: boolean("is_mapped"),
  onSetDate: date("on_set_date"),
  recallId: text("recall_id"),
  recall: text("recall"),
  exclusionStartDate: date("exclusion_start_date"),
  exclusionEndDate: date("exclusion_end_date"),
  showOnPortal: boolean("show_on_portal"),
  extAppointmentId: text("ext_appointment_id"),
  patientMedTechId: text("patient_med_tech_id"),
  snomedId: text("snomed_id"),
  snomedTerm: text("snomed_term"),
  conceptId: text("concept_id"),

  // Location
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Timestamps
  insertedAt: timestamp("inserted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  insertedById: text("inserted_by_id"),
  updatedById: text("updated_by_id"),
  insertedBy: text("inserted_by"),
  updatedBy: text("updated_by"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Measurement fact table
export const factMeasurement = createTable("core.fact_measurement", {
  // Surrogate key
  measurementKey: serial("measurement_key").primaryKey(),

  // Business keys
  patientId: text("patient_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Foreign keys to dimensions
  patientKey: integer("patient_key"), // FK to dim_patient
  practiceKey: integer("practice_key"), // FK to dim_practice

  // Measurement attributes
  screaningId: text("screaning_id"),
  appointmentId: text("appointment_id"),
  screeningDate: date("screening_date"),
  scncode: text("scncode"),
  screeningType: text("screening_type"),
  screeningGroup: text("screening_group"),
  outcome: text("outcome"),
  outcomeDescription: text("outcome_description"),
  notes: text("notes"),
  patientMedTechId: text("patient_med_tech_id"),
  providerId: text("provider_id"),
  providerCode: text("provider_code"),
  providerName: text("provider_name"),
  hbaic: decimal("hbaic", { precision: 5, scale: 2 }),
  carePlanId: text("care_plan_id"),
  carePlaneName: text("care_plane_name"),
  isConfidential: boolean("is_confidential"),
  isGp2Gp: boolean("is_gp2gp"),
  isPatientPortal: boolean("is_patient_portal"),
  isShowonTimeLine: boolean("is_showon_time_line"),
  medTechId: text("med_tech_id"),
  screeningSourceTypeId: text("screening_source_type_id"),
  serviceTemplateId: text("service_template_id"),
  serviceTemplateName: text("service_template_name"),
  score: decimal("score", { precision: 8, scale: 2 }),
  screeningTypeId: text("screening_type_id"),

  // Dynamic fields (Field1-Field100) - stored as JSON or separate columns
  // For now, including a few key ones
  field1: text("field1"),
  field2: text("field2"),
  field3: text("field3"),
  // ... (additional fields as needed)

  // Location
  practiceLocationId: text("practice_location_id"),
  locationName: text("location_name"),
  permanentAddressLatitude: decimal("permanent_address_latitude", {
    precision: 10,
    scale: 8,
  }),
  permanentAddressLongitude: decimal("permanent_address_longitude", {
    precision: 11,
    scale: 8,
  }),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Timestamps
  insertedAt: timestamp("inserted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  insertedById: text("inserted_by_id"),
  updatedById: text("updated_by_id"),
  insertedBy: text("inserted_by"),
  updatedBy: text("updated_by"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Add unique constraints for facts
export const factAppointmentUniqueConstraint = check(
  "fact_appointment_unique_constraint",
  sql`appointment_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const factImmunisationUniqueConstraint = check(
  "fact_immunisation_unique_constraint",
  sql`appointment_immunisation_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const factInvoiceUniqueConstraint = check(
  "fact_invoice_unique_constraint",
  sql`invoice_transaction_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const factInvoiceDetailUniqueConstraint = check(
  "fact_invoice_detail_unique_constraint",
  sql`invoice_detail_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const factDiagnosisUniqueConstraint = check(
  "fact_diagnosis_unique_constraint",
  sql`diagnosis_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const factMeasurementUniqueConstraint = check(
  "fact_measurement_unique_constraint",
  sql`patient_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);
