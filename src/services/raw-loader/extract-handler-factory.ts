import type { ExtractHandler, ValidationRule } from "./types/raw-loader";
import type { CSVRow } from "./indici-csv-parser";
import { PatientsSchemaHandler } from "./handlers/patients-schema-handler";

/**
 * Base Extract Handler - provides common functionality for all extract types
 */
export abstract class BaseExtractHandler implements ExtractHandler {
  abstract extractType: string;
  abstract tableName: string;
  abstract columnMapping: string[];
  abstract validationRules: ValidationRule[];

  async validateRow(row: CSVRow): Promise<any> {
    // Base validation logic
    return { isValid: true, errors: [], warnings: [] };
  }

  async transformRow(row: CSVRow): Promise<any> {
    // Base transformation logic
    return { ...row };
  }

  preProcess?(row: CSVRow): CSVRow {
    // Optional preprocessing
    return row;
  }

  postProcess?(row: any): any {
    // Optional postprocessing
    return row;
  }
}

/**
 * Patients Extract Handler
 */
export class PatientsHandler extends BaseExtractHandler {
  extractType = "Patient";
  tableName = "raw.patients";
  columnMapping = [
    // Source columns from Patient extract
    "patient_id",
    "nhi_number",
    "is_nhi_validate",
    "title",
    "first_name",
    "middle_name",
    "family_name",
    "full_name",
    "preferred_name",
    "other_maiden_name",
    "marital_status_id",
    "marital_status",
    "gender_id",
    "gender",
    "dob",
    "age",
    "age_type",
    "age_group",
    "is_alive",
    "death_date",
    "dob_source",
    "picture_path",
    "consented_to_share",
    "place_of_birth",
    "country_of_birth_id",
    "country_of_birth",
    "cell_number",
    "day_phone",
    "night_phone",
    "email",
    "secondary_email",
    "preferred_contact_method",
    "consent_text_messaging",
    "is_portal_user",
    "is_active",
    "is_deleted",
    "inserted_by",
    "updated_by",
    "inserted_at",
    "updated_at",
    "notes",
    "is_gender_self_identified",
    "sex_related_gender",
    "is_worked_visa_required",
    "balance",
    "med_tech_balance",
    "med_tech_date_last_pay",
    "med_tech_date_last_stmt",
    "register_status_id",
    "register_status",
    "med_tech_nok",
    "practice_name",
    "calculated_balance",
    "last_statement_date",
    "last_invoice_date",
    "last_payment_date",
    "provider_name",
    "chart_number",
    "extention",
    "practice_remarks",
    "is_insured",
    "insured_remarks",
    "smoking_type",
    "account_holder",
    "account_holder_employer",
    "is_community_service_card",
    "community_service_card_no",
    "community_service_card_exipry_date",
    "community_service_card_sighted",
    "is_health_card",
    "health_card_no",
    "health_card_expiry_date",
    "health_card_sighted",
    "winz",
    "is_transfer_of_records",
    "transfer_of_records_remarks",
    "enrolment_type",
    "enrolment_status_id",
    "enrolment_status",
    "enrolment_date",
    "enrolment_method",
    "enrolment_verifier",
    "funding_status_id",
    "funding_status",
    "rejection_reason",
    "funding_from",
    "funding_to",
    "account_group",
    "gms_code",
    "residential_status",
    "is_nka",
    "is_high_care",
    "high_care_reason",
    "is_care_plan",
    "is_new_registeration",
    "is_opt_off",
    "is_bp_graph",
    "is_bmi_graph",
    "is_inr_graph",
    "is_hba1c_graph",
    "asr_mark_status",
    "is_height_graph",
    "is_weight_graph",
    "is_hc_graph",
    "nes_status",
    "nes_comments",
    "med_tech_balance_date",
    "is_heart_rate",
    "is_premature",
    "premature_week",
    "patient_pho_id",
    "consult_updated_at",
    "occupation",
    "emergency_contact",
    "emergency_contact_name",
    "secondary_contact",
    "secondary_contact_name",
    "provider_id",
    "practice_id",
    "portal_registration_status",
    "registration_date",
    "med_tech_id",
    "permanent_address_house_number",
    "permanent_address_building_number",
    "permanent_address_street_number",
    "permanent_address_suburb_town_id",
    "permanent_address_suburb",
    "permanent_address_city_area_id",
    "permanent_address_city",
    "permanent_address_postal_code",
    "permanent_address_latitude",
    "permanent_address_longitude",
    "permanent_address_country_id",
    "permanent_address_country",
    "permanent_address",
    "permanent_address_dhb_code",
    "permanent_address_domicile_code",
    "permanent_address_deprivation_quintile",
    "permanent_address_deprivation_decile",
    "permanent_address_meshblock",
    "permanent_address_match_score",
    "permanent_address_uncertainty_code",
    "temporary_address",
    "postal_address_house_number",
    "postal_address_building_number",
    "postal_address_street_number",
    "postal_address_suburb_town_id",
    "postal_address_suburb",
    "postal_address_city_area_id",
    "postal_address_city",
    "postal_address_postal_code",
    "postal_address_latitude",
    "postal_address_longitude",
    "postal_address_country_id",
    "postal_address_country",
    "postal_address",
    "postal_address_dhb_code",
    "postal_address_domicile_code",
    "postal_address_deprivation_quintile",
    "postal_address_deprivation_decile",
    "postal_address_meshblock",
    "postal_address_match_score",
    "postal_address_uncertainty_code",
    "ethnicity_id",
    "ethnicity",
    "ethcode",
    "ethcode2",
    "secondary_ethnicity_id",
    "secondary_ethnicity",
    "ethcode3",
    "other_ethnicity_id",
    "other_ethnicity",
    "enrolment_id",
    "pho_name",
    "enrolment_expiry_date",
    "is_consent_to_share",
    "is_work_visa",
    "work_visa_start_date",
    "work_visa_expiry_date",
    "enrolment_quarter",
    "practice_location",
    "account_holder_type_id",
    "patient_type",
    "breast_screen_id",
    "breast_screen",
    "is_pregnant",
    "apply_charges",
    "include_in_print",
    "is_careplus",
    "care_plus_start_date",
    "care_plus_enddate",
    "care_plus_linc_status_id",
    "care_plus_linc_status",
    "nhi_status_id",
    "nhi_status",
    "per_org_id",
    "loaded_date_time",
    "account_holder_profile_id",
    "comunity_service_effective_date",
    "default_gpmc_no",
    "default_gp_name",
    "default_practice_edi",
    "default_practice_name",
    "enrolment_end_date",
    "is_capitated",
    "is_consent_auto_reminder_text_messaging",
    "is_consent_for_experience_survey",
    "is_consent_to_import_clinical_records",
    "is_consent_to_private_email_address",
    "is_consent_to_share_clinical_records",
    "is_consent_to_share_health1",
    "is_consent_to_share_my_record_on_sehr",
    "is_consent_to_share_pho_data_collection",
    "is_include_account_fee",
    "is_include_statement_fee",
    "is_linked_csc_exists",
    "is_test_record",
    "pharmacy_id",
    "residential_status_id",
    "visa_expiry",
    // Lineage columns (these are added automatically by the loader)
    "s3_bucket",
    "s3_key",
    "s3_version_id",
    "file_hash",
    "date_extracted",
    "extract_type",
    "load_run_id",
    "load_ts",
  ];
  validationRules: ValidationRule[] = [
    {
      columnName: "patient_id",
      ruleType: "required",
      validator: (value) => /^\d+$/.test(value),
      errorMessage: "patient_id must be numeric",
    },
    {
      columnName: "nhi_number",
      ruleType: "format",
      validator: (value) => /^[A-Z]{3}\d{4}$/.test(value),
      errorMessage: "nhi_number must be in format XXX1234",
    },
  ];
}

/**
 * Appointments Extract Handler
 */
export class AppointmentsHandler extends BaseExtractHandler {
  extractType = "appointments";
  tableName = "raw.appointments";
  columnMapping = [
    "appointment_id",
    "patient_id",
    "provider_id",
    "appointment_date",
    "appointment_time",
    "duration",
    "type",
    "status",
    "notes",
    "created_date",
    "modified_date",
  ];
  validationRules: ValidationRule[] = [
    {
      columnName: "appointment_id",
      ruleType: "required",
      validator: (value) => /^\d+$/.test(value),
      errorMessage: "appointment_id must be numeric",
    },
    {
      columnName: "appointment_date",
      ruleType: "format",
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      errorMessage: "appointment_date must be in YYYY-MM-DD format",
    },
  ];
}

/**
 * Extract Handler Factory - creates handlers for different extract types
 */
export class ExtractHandlerFactory {
  private handlers: Map<string, ExtractHandler> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Get handler for specific extract type
   */
  async getHandler(extractType: string): Promise<ExtractHandler> {
    console.log(`🔍 Looking for handler for extract type: "${extractType}"`);
    console.log(
      `📋 Available handlers: [${Array.from(this.handlers.keys()).join(", ")}]`
    );

    const handler = this.handlers.get(extractType);

    if (!handler) {
      console.error(`❌ No handler found for extract type: "${extractType}"`);
      throw new Error(`No handler registered for extract type: ${extractType}`);
    }

    console.log(`✅ Found handler: ${handler.extractType}`);
    return handler;
  }

  /**
   * Register a custom handler
   */
  async registerHandler(handler: ExtractHandler): Promise<void> {
    this.handlers.set(handler.extractType.toLowerCase(), handler);
  }

  /**
   * Get all registered handlers
   */
  async getAllHandlers(): Promise<ExtractHandler[]> {
    return Array.from(this.handlers.values());
  }

  /**
   * Validate handler configuration
   */
  async validateHandler(handler: ExtractHandler): Promise<boolean> {
    // Validate handler has required properties
    if (!handler.extractType || !handler.tableName || !handler.columnMapping) {
      return false;
    }

    // Validate column mapping matches expected schema
    // This would check against actual database schema
    return true;
  }

  /**
   * Register all default handlers
   */
  private registerDefaultHandlers(): void {
    // Register schema-driven handlers (preferred)
    const patientsHandler = new PatientsSchemaHandler();
    this.handlers.set("Patient", patientsHandler);

    // Register legacy handlers for backward compatibility
    const appointmentsHandler = new AppointmentsHandler();
    this.handlers.set("Appointments", appointmentsHandler);

    // Register other handlers as they're implemented
    // this.handlers.set("providers", new ProvidersHandler());
    // this.handlers.set("practice_info", new PracticeInfoHandler());
    // etc...
  }
}
