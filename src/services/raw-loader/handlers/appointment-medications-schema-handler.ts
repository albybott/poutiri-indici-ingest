import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * AppointmentMedications handler generated from schema
 * Generated on 2025-10-06T01:11:46.103Z
 */
export class AppointmentMedicationsSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "AppointmentMedication";
  tableName = "raw.appointment_medications";

  // Generated from src/db/schema/raw/appointment-medications.ts
  columnMapping = [
    'medication_id',
    'appointment_id',
    'patient_id',
    'sctid',
    'medicine_id',
    'medicine_name',
    'strength',
    'form',
    'take',
    'frequency',
    'dailyfreq',
    'route',
    'duration',
    'duration_type',
    'start_date',
    'end_date',
    'stop_date',
    'repeats',
    'sa_status',
    'sa_number',
    'expiry_date',
    'subsidy_amount',
    'price',
    'provider_id',
    'provider',
    'task_id',
    'directions',
    'is_confidential',
    'is_long_term',
    'is_prescribed_externally',
    'is_stopped',
    'is_highlighted',
    'is_practicein_admin',
    'is_trial',
    'stopped_reason',
    'medication_stop_reason',
    'rx_scid',
    'rx_date',
    'rx_status',
    'is_dispense',
    'printed_by',
    'printed_at',
    'comments',
    'is_active',
    'is_deleted',
    'inserted_by',
    'updated_by',
    'inserted_at',
    'updated_at',
    'med_tech_id',
    'is_mapped',
    'med_tech_drug_code',
    'med_tech_generic_name',
    'practice_id',
    'prescibed_externlay_id',
    'prescibed_externlay_desc',
    'quantity',
    'is_generic_substitution',
    'is_frequent_dispensed',
    'initial_dispense_period',
    'initial_dispense_period_type',
    'trial_period',
    'trial_type',
    'is_specalist_recomended',
    'specalist_name',
    'recomendation_date',
    'is_endorsement_criteria',
    'is_provider_eligible_co_payment',
    'user_logging_id',
    'is_override',
    'override_reason',
    'is_task_generated',
    'show_on_portal',
    'patient_sa_record_id',
    'stopped_by',
    'mapped_by',
    'mapped_date',
    'recomendation_override_reason',
    'is_variable_dose',
    'is_dose_change',
    'reference_medication',
    'mimscode',
    'permanent_address_latitude',
    'permanent_address_longitude',
    'practice_location_id',
    'location_name',
    'prescription_print_date',
    'prescription_no',
    'substance_name',
    'per_org_id',
    'loaded_date_time',
];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "medication_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "medication_id must be numeric"
    // }
  ];
}
