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

// Patient dimension with SCD2
export const dimPatient = createTable("core.dim_patient", {
  // Surrogate key
  patientKey: serial("patient_key").primaryKey(),

  // Business keys
  patientId: text("patient_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Hashed/salted NHI for privacy
  nhiNumberHash: text("nhi_number_hash"),

  // SCD2 attributes
  effectiveFrom: timestamp("effective_from", {
    withTimezone: true,
  }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  isCurrent: boolean("is_current").notNull().default(true),

  // Core patient attributes (minimal PII exposure)
  title: text("title"),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  familyName: text("family_name"),
  fullName: text("full_name"),
  preferredName: text("preferred_name"),
  gender: text("gender"),
  dob: date("dob"),
  age: integer("age"),
  ageGroup: text("age_group"),
  isAlive: boolean("is_alive"),
  deathDate: date("death_date"),
  maritalStatus: text("marital_status"),
  ethnicity: text("ethnicity"),
  residentialStatus: text("residential_status"),
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Contact information (anonymized where possible)
  cellNumber: text("cell_number"),
  dayPhone: text("day_phone"),
  nightPhone: text("night_phone"),
  email: text("email"),

  // Address information (generalized)
  permanentAddressCity: text("permanent_address_city"),
  permanentAddressSuburb: text("permanent_address_suburb"),
  permanentAddressPostalCode: text("permanent_address_postal_code"),
  permanentAddressDhbCode: text("permanent_address_dhb_code"),
  permanentAddressDeprivationQuintile: integer(
    "permanent_address_deprivation_quintile"
  ),

  // Practice and provider relationships
  providerId: text("provider_id"),
  practiceName: text("practice_name"),

  // Lineage columns for traceability
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Provider dimension with SCD2
export const dimProvider = createTable("core.dim_provider", {
  // Surrogate key
  providerKey: serial("provider_key").primaryKey(),

  // Business keys
  providerId: text("provider_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // SCD2 attributes
  effectiveFrom: timestamp("effective_from", {
    withTimezone: true,
  }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  isCurrent: boolean("is_current").notNull().default(true),

  // Core provider attributes
  nhiNumber: text("nhi_number"),
  title: text("title"),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  familyName: text("family_name"),
  fullName: text("full_name"),
  preferredName: text("preferred_name"),
  gender: text("gender"),
  dob: date("dob"),
  isAlive: boolean("is_alive"),
  deathDate: date("death_date"),

  // Professional identifiers
  nzmcNo: text("nzmc_no"),
  npiNo: text("npi_no"),
  providerCode: text("provider_code"),
  accreditationNo: text("accreditation_no"),
  hpiNo: text("hpi_no"),

  // Practice relationships
  practiceName: text("practice_name"),
  userRole: text("user_role"),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Practice dimension with SCD1/2 as needed
export const dimPractice = createTable("core.dim_practice", {
  // Surrogate key
  practiceKey: serial("practice_key").primaryKey(),

  // Business keys
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // SCD2 attributes
  effectiveFrom: timestamp("effective_from", {
    withTimezone: true,
  }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  isCurrent: boolean("is_current").notNull().default(true),

  // Core practice attributes
  practiceName: text("practice_name").notNull(),
  practiceCategory: text("practice_category"),
  practiceSpeciality: text("practice_speciality"),
  pho: text("pho"),
  organizationType: text("organization_type"),
  orgShortName: text("org_short_name"),
  orgCode: text("org_code"),
  ediAccount: text("edi_account"),
  legalEntityTitle: text("legal_entity_title"),
  legalStatus: text("legal_status"),
  incorporationNumber: text("incorporation_number"),
  ownershipModel: text("ownership_model"),
  rural: boolean("rural"),

  // Contact information
  primaryPhone: text("primary_phone"),
  secondaryPhone: text("secondary_phone"),
  primaryEmail: text("primary_email"),
  secondaryEmail: text("secondary_email"),

  // Identifiers
  healthFacilityNo: text("health_facility_no"),
  hpiFacilityNo: text("hpi_facility_no"),
  gstNo: text("gst_no"),
  accNo: text("acc_no"),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Medicine dimension with SCD1
export const dimMedicine = createTable("core.dim_medicine", {
  // Surrogate key
  medicineKey: serial("medicine_key").primaryKey(),

  // Natural/business keys
  medicineId: text("medicine_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Core medicine attributes
  medicineName: text("medicine_name").notNull(),
  medicineShortName: text("medicine_short_name"),
  sctid: text("sctid"),
  type: text("type"),
  pharmaCode: text("pharma_code"),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Vaccine dimension with SCD1
export const dimVaccine = createTable("core.dim_vaccine", {
  // Surrogate key
  vaccineKey: serial("vaccine_key").primaryKey(),

  // Natural/business keys
  vaccineId: text("vaccine_id").notNull(),
  practiceId: text("practice_id").notNull(),
  perOrgId: text("per_org_id").notNull(),

  // Core vaccine attributes
  vaccineCode: text("vaccine_code").notNull(),
  vaccineName: text("vaccine_name").notNull(),
  longDescription: text("long_description"),
  codingSystem: text("coding_system"),
  gender: text("gender"),
  isNir: boolean("is_nir"),

  // Status
  isActive: boolean("is_active"),
  isDeleted: boolean("is_deleted"),

  // Lineage columns
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});

// Add unique constraints for SCD2
export const dimPatientUniqueConstraint = check(
  "dim_patient_unique_constraint",
  sql`patient_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const dimProviderUniqueConstraint = check(
  "dim_provider_unique_constraint",
  sql`provider_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const dimPracticeUniqueConstraint = check(
  "dim_practice_unique_constraint",
  sql`practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const dimMedicineUniqueConstraint = check(
  "dim_medicine_unique_constraint",
  sql`medicine_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);

export const dimVaccineUniqueConstraint = check(
  "dim_vaccine_unique_constraint",
  sql`vaccine_id IS NOT NULL AND practice_id IS NOT NULL AND per_org_id IS NOT NULL`
);
