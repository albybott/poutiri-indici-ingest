import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * Immunisation handler generated from schema
 * Generated on 2025-10-06T01:11:46.104Z
 */
export class ImmunisationSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Immunisation";
  tableName = "raw.immunisation";

  // Generated from src/db/schema/raw/immunisation.ts
  columnMapping = [
    "appointment_immunisation_id",
    "patient_id",
    "appointment_id",
    "patient_schedule_id",
    "vaccine_id",
    "vaccine_name",
    "vaccine_code",
    "dose",
    "dose_number",
    "administration_site_id",
    "administration_site",
    "route_id",
    "route",
    "batch_number",
    "expiry_date",
    "immunisation_status_id",
    "immunisation_status",
    "vaccine_out_come_id",
    "vaccine_out_come",
    "is_nir_ack",
    "reason",
    "provider_id",
    "provider",
    "comments",
    "administration_time",
    "vaccine_indication_id",
    "vaccine_indication",
    "vaccine_indication_code",
    "needle_length",
    "has_diluent",
    "diluent_batch_no",
    "diluent_expiry_date",
    "is_confidential",
    "costing_code_id",
    "costing_code",
    "brand_id",
    "brand",
    "is_active",
    "is_deleted",
    "inserted_by_id",
    "inserted_by",
    "updated_by_id",
    "updated_by",
    "inserted_at",
    "updated_at",
    "is_parked",
    "med_tech_id",
    "practice_id",
    "practice",
    "is_auto_bill",
    "vaccinator_id",
    "vaccinator",
    "user_logging_id",
    "logging_user_name",
    "nir_sent_date",
    "show_on_portal",
    "vaccinator_code",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "practice_location_id",
    "location_name",
    "vaccine_group_id",
    "vaccine_group",
    "per_org_id",
    "loaded_date_time",
  ];

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "appointment_immunisation_id",
    //   ruleType: "required",
    //   validator: (value) => /^\d+$/.test(value),
    //   errorMessage: "appointment_immunisation_id must be numeric"
    // }
  ];
}
