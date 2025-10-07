import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  check,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createTable } from "../../utils/create-table";
import { loadRunFiles } from "../etl/audit";

export const nextOfKinStg = createTable(
  "stg.next_of_kin",
  {
    // Typed columns with proper constraints
    nextToKinId: text("next_to_kin_id").notNull(),
    patientId: text("patient_id").notNull(),
    nokProfileId: text("nok_profile_id"),
    nhiNumber: text("nhi_number"),
    name: text("name"),
    fullAddress: text("full_address"),
    cellNumber: text("cell_number"),
    dayPhone: text("day_phone"),
    nightPhone: text("night_phone"),
    isEmergency: boolean("is_emergency"),
    relationshipTypeId: text("relationship_type_id"),
    relationshipType: text("relationship_type"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    insertedBy: text("inserted_by"),
    updatedById: text("updated_by_id"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    userLoggingId: text("user_logging_id"),
    loggingUserName: text("logging_user_name"),
    isGp2Gp: boolean("is_gp2gp"),
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("next_of_kin_stg_natural_key_idx").on(
      table.nextToKinId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkNextOfKinStgLoadRunFile = foreignKey({
  columns: [nextOfKinStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_next_of_kin_stg_load_run_file",
});




