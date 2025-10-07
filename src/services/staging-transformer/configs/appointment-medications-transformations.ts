import type { ColumnTransformation } from "../types/transformer";
import { ColumnType } from "../types/transformer";

/**
 * Appointment medications staging transformations
 * Converts raw text columns to typed staging columns
 */
export const appointmentMedicationsTransformations: ColumnTransformation[] = [
  // Primary key - medication ID
  {
    sourceColumn: "medication_id",
    targetColumn: "medicationId",
    targetType: ColumnType.TEXT,
    required: true,
  },

  // IDs - Keep as text
  {
    sourceColumn: "appointment_id",
    targetColumn: "appointmentId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "sctid",
    targetColumn: "sctid",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "medicine_id",
    targetColumn: "medicineId",
    targetType: ColumnType.TEXT,
    required: false,
  },

  // Text fields - Medicine information
  {
    sourceColumn: "medicine_name",
    targetColumn: "medicineName",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "strength",
    targetColumn: "strength",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "form",
    targetColumn: "form",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "take",
    targetColumn: "take",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "frequency",
    targetColumn: "frequency",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "dailyfreq",
    targetColumn: "dailyfreq",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "route",
    targetColumn: "route",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "duration_type",
    targetColumn: "durationType",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "sa_status",
    targetColumn: "saStatus",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "sa_number",
    targetColumn: "saNumber",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "provider",
    targetColumn: "provider",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "task_id",
    targetColumn: "taskId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "directions",
    targetColumn: "directions",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "stopped_reason",
    targetColumn: "stoppedReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "medication_stop_reason",
    targetColumn: "medicationStopReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "rx_scid",
    targetColumn: "rxScid",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "rx_status",
    targetColumn: "rxStatus",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "printed_by",
    targetColumn: "printedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "comments",
    targetColumn: "comments",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "inserted_by",
    targetColumn: "insertedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "updated_by",
    targetColumn: "updatedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_id",
    targetColumn: "medTechId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_drug_code",
    targetColumn: "medTechDrugCode",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "med_tech_generic_name",
    targetColumn: "medTechGenericName",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "prescibed_externlay_id",
    targetColumn: "prescibedExternlayId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "prescibed_externlay_desc",
    targetColumn: "prescibedExternlayDesc",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "initial_dispense_period_type",
    targetColumn: "initialDispensePeriodType",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "trial_type",
    targetColumn: "trialType",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "specalist_name",
    targetColumn: "specalistName",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "user_logging_id",
    targetColumn: "userLoggingId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "override_reason",
    targetColumn: "overrideReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "patient_sa_record_id",
    targetColumn: "patientSaRecordId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "stopped_by",
    targetColumn: "stoppedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "mapped_by",
    targetColumn: "mappedBy",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "recomendation_override_reason",
    targetColumn: "recomendationOverrideReason",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "reference_medication",
    targetColumn: "referenceMedication",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "mimscode",
    targetColumn: "mimscode",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "practice_location_id",
    targetColumn: "practiceLocationId",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "location_name",
    targetColumn: "locationName",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "prescription_no",
    targetColumn: "prescriptionNo",
    targetType: ColumnType.TEXT,
    required: false,
  },
  {
    sourceColumn: "substance_name",
    targetColumn: "substanceName",
    targetType: ColumnType.TEXT,
    required: false,
  },

  // Practice and organization IDs
  {
    sourceColumn: "practice_id",
    targetColumn: "practiceId",
    targetType: ColumnType.TEXT,
    required: true,
  },
  {
    sourceColumn: "per_org_id",
    targetColumn: "perOrgId",
    targetType: ColumnType.TEXT,
    required: true,
  },

  // Provider information
  {
    sourceColumn: "provider_id",
    targetColumn: "providerId",
    targetType: ColumnType.TEXT,
    required: false,
  },

  // Integer fields
  {
    sourceColumn: "duration",
    targetColumn: "duration",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "repeats",
    targetColumn: "repeats",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "initial_dispense_period",
    targetColumn: "initialDispensePeriod",
    targetType: ColumnType.INTEGER,
    required: false,
  },
  {
    sourceColumn: "trial_period",
    targetColumn: "trialPeriod",
    targetType: ColumnType.INTEGER,
    required: false,
  },

  // Decimal fields
  {
    sourceColumn: "subsidy_amount",
    targetColumn: "subsidyAmount",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "price",
    targetColumn: "price",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "quantity",
    targetColumn: "quantity",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "permanent_address_latitude",
    targetColumn: "permanentAddressLatitude",
    targetType: ColumnType.DECIMAL,
    required: false,
  },
  {
    sourceColumn: "permanent_address_longitude",
    targetColumn: "permanentAddressLongitude",
    targetType: ColumnType.DECIMAL,
    required: false,
  },

  // Date fields
  {
    sourceColumn: "start_date",
    targetColumn: "startDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "end_date",
    targetColumn: "endDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "stop_date",
    targetColumn: "stopDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "expiry_date",
    targetColumn: "expiryDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "rx_date",
    targetColumn: "rxDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "recomendation_date",
    targetColumn: "recomendationDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "mapped_date",
    targetColumn: "mappedDate",
    targetType: ColumnType.DATE,
    required: false,
  },
  {
    sourceColumn: "prescription_print_date",
    targetColumn: "prescriptionPrintDate",
    targetType: ColumnType.DATE,
    required: false,
  },

  // Boolean fields with defaults
  {
    sourceColumn: "is_confidential",
    targetColumn: "isConfidential",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_long_term",
    targetColumn: "isLongTerm",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_prescribed_externally",
    targetColumn: "isPrescribedExternally",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_stopped",
    targetColumn: "isStopped",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_highlighted",
    targetColumn: "isHighlighted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_practicein_admin",
    targetColumn: "isPracticeinAdmin",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_trial",
    targetColumn: "isTrial",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_dispense",
    targetColumn: "isDispense",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: true,
  },
  {
    sourceColumn: "is_deleted",
    targetColumn: "isDeleted",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_mapped",
    targetColumn: "isMapped",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_generic_substitution",
    targetColumn: "isGenericSubstitution",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_frequent_dispensed",
    targetColumn: "isFrequentDispensed",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_specalist_recomended",
    targetColumn: "isSpecalistRecomended",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_endorsement_criteria",
    targetColumn: "isEndorsementCriteria",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_provider_eligible_co_payment",
    targetColumn: "isProviderEligibleCoPayment",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_override",
    targetColumn: "isOverride",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_task_generated",
    targetColumn: "isTaskGenerated",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "show_on_portal",
    targetColumn: "showOnPortal",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_variable_dose",
    targetColumn: "isVariableDose",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },
  {
    sourceColumn: "is_dose_change",
    targetColumn: "isDoseChange",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: false,
  },

  // Timestamp fields
  {
    sourceColumn: "printed_at",
    targetColumn: "printedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "inserted_at",
    targetColumn: "insertedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "updated_at",
    targetColumn: "updatedAt",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
  {
    sourceColumn: "loaded_date_time",
    targetColumn: "loadedDateTime",
    targetType: ColumnType.TIMESTAMP,
    required: false,
  },
];



