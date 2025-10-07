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

export const practiceInfoStg = createTable(
  "stg.practice_info",
  {
    // Typed columns with proper constraints
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Core practice attributes
    practiceName: text("practice_name").notNull(),
    practiceCategory: text("practice_category"),
    practiceSpeciality: text("practice_speciality"),
    pho: text("pho"),
    organizationType: text("organization_type"),
    orgShortName: text("org_short_name"),
    orgCode: text("org_code"),
    ediAccount: text("edi_account"),

    // Legal information
    legalEntityTitle: text("legal_entity_title"),
    legalStatus: text("legal_status"),
    incorporationNumber: text("incorporation_number"),
    legalDate: text("legal_date"),
    comments: text("comments"),
    formula: text("formula"),
    ownershipModel: text("ownership_model"),
    rural: boolean("rural"),

    // Contact information
    primaryPhone: text("primary_phone"),
    secondaryPhone: text("secondary_phone"),
    otherPhone: text("other_phone"),
    afterHoursNumber: text("after_hours_number"),
    emergencyNumber: text("emergency_number"),
    pager: text("pager"),
    fax1: text("fax1"),
    fax2: text("fax2"),
    primaryEmail: text("primary_email"),
    secondaryEmail: text("secondary_email"),
    otherEmail: text("other_email"),

    // Identifiers
    healthFacilityNo: text("health_facility_no"),
    hpiFacilityNo: text("hpi_facility_no"),
    hpiFacilityExt: text("hpi_facility_ext"),
    hpiOrganizationId: text("hpi_organization_id"),
    hpiOrganizationExt: text("hpi_organization_ext"),
    gstNo: text("gst_no"),
    accNo: text("acc_no"),
    bankAccountNo: text("bank_account_no"),
    mohSendingPracticeId: text("moh_sending_practice_id"),

    // Status
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),

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
    uniqueIndex("practice_info_stg_natural_key_idx").on(
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkPracticeInfoStgLoadRunFile = foreignKey({
  columns: [practiceInfoStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_practice_info_stg_load_run_file",
});
