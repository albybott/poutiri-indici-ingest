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
    nzmcNo: text("nzmc_no"),
    npiNo: text("npi_no"),
    providerCode: text("provider_code"),
    accreditationNo: text("accreditation_no"),
    hpiNo: text("hpi_no"),

    // Personal details
    title: text("title"),
    firstName: text("first_name"),
    middleName: text("middle_name"),
    familyName: text("family_name").notNull(),
    fullName: text("full_name").notNull(),
    preferredName: text("preferred_name"),
    gender: text("gender"),
    dob: date("dob"),
    isAlive: boolean("is_alive"),
    deathDate: date("death_date"),

    // Practice relationship
    practiceName: text("practice_name"),
    userRole: text("user_role"),

    // Contact information
    email: text("email"),
    cellNumber: text("cell_number"),

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
