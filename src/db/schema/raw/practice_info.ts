import { text, integer, foreignKey } from "drizzle-orm/pg-core";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const practiceInfoRaw = createTable("raw.practice_info", {
  // Source columns as text (all fields from PracticeInfo extract)
  practiceId: text("practice_id"),
  practiceName: text("practice_name"),
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
  legalDate: text("legal_date"),
  comments: text("comments"),
  formula: text("formula"),
  ownershipModel: text("ownership_model"),
  rural: text("rural"),
  primaryPhone: text("primary_phone"),
  secondaryPhone: text("secondary_phone"),
  otherPhone: text("other_phone"),
  primaryEmail: text("primary_email"),
  secondaryEmail: text("secondary_email"),
  otherEmail: text("other_email"),
  pager: text("pager"),
  fax1: text("fax1"),
  fax2: text("fax2"),
  healthFacilityNo: text("health_facility_no"),
  hpiFacilityNo: text("hpi_facility_no"),
  hpiFacilityExt: text("hpi_facility_ext"),
  hpiOrganizationId: text("hpi_organization_id"),
  hpiOrganizationExt: text("hpi_organization_ext"),
  gstNo: text("gst_no"),
  accNo: text("acc_no"),
  bankAccountNo: text("bank_account_no"),
  mohSendingPracticeId: text("moh_sending_practice_id"),
  afterHoursNumber: text("after_hours_number"),
  emergencyNumber: text("emergency_number"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

  // Foreign key to load_run_files for lineage data
  loadRunFileId: integer("load_run_file_id").notNull(),
});

// Foreign key constraint to etl.load_run_files
export const fkPracticeInfoLoadRunFile = foreignKey({
  columns: [practiceInfoRaw.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_practice_info_load_run_file",
});
