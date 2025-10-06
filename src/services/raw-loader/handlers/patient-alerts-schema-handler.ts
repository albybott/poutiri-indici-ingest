import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * PatientAlerts handler generated from schema
 * Generated on 2025-10-06T01:11:46.106Z
 */
export class PatientAlertsSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "PatientAlert";
  tableName = "raw.patient_alerts";

  // Generated from src/db/schema/raw/patient-alerts.ts
  columnMapping = [
    'patient_alert_id',
    'patient_id',
    'type_id',
    'type',
    'alert_id',
    'alert',
    'severity_id',
    'severity',
    'alert_value',
    'last_updated_date',
    'effective_date',
    'expiry_date',
    'note',
    'is_active',
    'is_deleted',
    'inserted_by_id',
    'inserted_by',
    'updated_by_id',
    'updated_by',
    'inserted_at',
    'updated_at',
    'med_tech_id',
    'user_logging_id',
    'logging_user_name',
    'is_gp_2_gp',
    'permanent_address_latitude',
    'permanent_address_longitude',
    'alert_state',
    'practice_id',
    'provider_id',
    'per_org_id',
    'loaded_date_time',
    'load_run_file_id',
    's3_bucket',
    's3_key',
    's3_version_id',
    'file_hash',
    'date_extracted',
    'extract_type',
    'load_run_id',
    'load_ts'
];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "patient_alert_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "patient_alert_id must be numeric"
    // }
  ];
}
