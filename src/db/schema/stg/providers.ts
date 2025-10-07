import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  date,
  check,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const providersStg = createTable(
  "stg.providers",
  {
    // Typed columns with proper constraints
    providerId: text("provider_id").notNull(),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Professional identifiers
    nhiNumber: text("nhi_number"),
    isNhiValidate: text("is_nhi_validate"),
    nzmcNo: text("nzmc_no"),
    npiNo: text("npi_no"),
    providerCode: text("provider_code"),
    accreditationNo: text("accreditation_no"),
    hpiNo: text("hpi_no"),
    registrationNo: text("registration_no"),
    labNo: text("lab_no"),
    labTestsDrId: text("lab_tests_dr_id"),
    colorCode: text("color_code"),
    acc45Prefix: text("acc45_prefix"),
    nextAcc45No: text("next_acc45_no"),
    maximumAcc45No: text("maximum_acc45_no"),
    aitcPrefix: text("aitc_prefix"),
    nextAitcNo: text("next_aitc_no"),
    maximumAitcNo: text("maximum_aitc_no"),
    arc18NextAccFormNo: text("arc_18_next_acc_form_no"),
    m45Prefix: text("m_45_prefix"),
    nextM45No: text("next_m_45_no"),
    maximumM45No: text("maximum_m_45_no"),

    // Personal details
    title: text("title"),
    firstName: text("first_name"),
    middleName: text("middle_name"),
    familyName: text("family_name"),
    fullName: text("full_name").notNull(),
    preferredName: text("preferred_name"),
    otherMaidenName: text("other_maiden_name"),
    maritalStatus: text("marital_status"),
    gender: text("gender"),
    dob: date("dob"),
    age: integer("age"),
    ageType: text("age_type"),
    ageGroup: text("age_group"),
    isAlive: boolean("is_alive"),
    deathDate: date("death_date"),
    dobSource: text("dob_source"),
    picturePath: text("picture_path"),
    consentedtoShare: text("consentedto_share"),
    placeofBirth: text("placeof_birth"),
    countryOfBirth: text("country_of_birth"),
    cellNumber: text("cell_number"),
    dayPhone: text("day_phone"),
    nightPhone: text("night_phone"),
    email: text("email"),
    secondaryEmail: text("secondary_email"),
    preferredContactMethod: text("preferred_contact_method"),
    consentTextMessaging: text("consent_text_messaging"),

    // Status and boolean flags
    isPortalUser: boolean("is_portal_user"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    isSameAddress: text("is_same_address"),
    notes: text("notes"),
    isGenderSelfIdentified: boolean("is_gender_self_identified"),
    sexRelatedGender: text("sex_related_gender"),
    isWorkedVisaRequired: boolean("is_worked_visa_required"),
    balance: text("balance"),
    registerStatus: text("register_status"),
    medTechNok: text("med_tech_nok"),
    calculatedBalance: text("calculated_balance"),
    isDoctor: boolean("is_doctor"),
    isInvoicingDiary: boolean("is_invoicing_diary"),
    isGp2Gp: boolean("is_gp2gp"),
    isNzfAvoid: boolean("is_nzf_avoid"),
    isNzfAdjust: boolean("is_nzf_adjust"),
    isNzfInformation: boolean("is_nzf_information"),
    isNzfNoAction: boolean("is_nzf_no_action"),
    isNzfMonitor: boolean("is_nzf_monitor"),

    // Address information
    permanentAddress: text("permanent_address"),
    deprivationQuintile: text("deprivation_quintile"),
    uncertaintyCode: text("uncertainty_code"),
    postalAddress: text("postal_address"),
    temporaryAddress: text("temporary_address"),
    city: text("city"),
    suburb: text("suburb"),
    portalRegistrationStatus: text("portal_registration_status"),
    ethnicity: text("ethnicity"),
    affiliationId: text("affiliation_id"),
    affiliation: text("affiliation"),
    affiliationCode: text("affiliation_code"),

    // Financial and contract information
    hblMatPayeeNo: text("hbl_mat_payee_no"),
    hblMatAgreeNo: text("hbl_mat_agree_no"),
    hpacMatAgreeNo: text("hpac_mat_agree_no"),
    hpacMatAgreeVer: text("hpac_mat_agree_ver"),
    hblPayeeNo: text("hbl_payee_no"),
    hblGpaAgreeNo: text("hbl_gpa_agree_no"),
    hblGpaAgreeVer: text("hbl_gpa_agree_ver"),
    phoContractNo: text("pho_contract_no"),
    phoContractVer: text("pho_contract_ver"),
    groupId: text("group_id"),
    groupName: text("group_name"),
    accProviderCode: text("acc_provider_code"),
    healthFacilityNo: text("health_facility_no"),
    unloadRef: text("unload_ref"),
    accProviderNo: text("acc_provider_no"),
    accVendorId: text("acc_vendor_id"),
    pinPanNo: text("pin_pan_no"),
    memberNo: text("member_no"),
    rhaPayeeNo: text("rha_payee_no"),
    budgetNo: text("budget_no"),
    ipa: text("ipa"),

    // Additional provider information
    genericProfileTypeId: text("generic_profile_type_id"),
    currentAppointmentId: text("current_appointment_id"),
    sureMedUserName: text("sure_med_user_name"),
    fromDatePractice: text("from_date_practice"),
    apcExpiryDate: text("apc_expiry_date"),
    mpsExpiryDate: text("mps_expiry_date"),
    apcName: text("apc_name"),
    practiceLocation: text("practice_location"),
    providerPermanentAddressLatitude: text(
      "provider_permanent_address_latitude"
    ),
    providerPermanentAddressLongitude: text(
      "provider_permanent_address_longitude"
    ),

    // Practice relationship
    practiceName: text("practice_name"),
    userRole: text("user_role"),

    // Audit fields
    insertedBy: text("inserted_by"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),

    // Lineage - FK to load_run_files
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("providers_stg_natural_key_idx").on(
      table.providerId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkProvidersStgLoadRunFile = foreignKey({
  columns: [providersStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_providers_stg_load_run_file",
});
