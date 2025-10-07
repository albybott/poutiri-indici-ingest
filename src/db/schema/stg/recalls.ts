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

export const recallsStg = createTable(
  "stg.recalls",
  {
    // Typed columns with proper constraints
    reCallId: text("re_call_id").notNull(),
    patientId: text("patient_id").notNull(),
    reCallDate: date("re_call_date"),
    isContacted: boolean("is_contacted"),
    notes: text("notes"),
    patientMedTechId: text("patient_med_tech_id"),
    recallReason: text("recall_reason"),
    screeningType: text("screening_type"),
    code: text("code"),
    vaccine: text("vaccine"),
    vaccineGroup: text("vaccine_group"),
    reCallGroup: text("re_call_group"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    insertedBy: text("inserted_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    updatedBy: text("updated_by"),
    isActive: boolean("is_active"),
    practice: text("practice"),
    practiceId: text("practice_id").notNull(),
    providerId: text("provider_id"),
    isDeleted: boolean("is_deleted"),
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    isConfidential: boolean("is_confidential"),
    showOnPatientPortal: boolean("show_on_patient_portal"),
    isCanceled: boolean("is_canceled"),
    reCallAttempts: integer("re_call_attempts"),
    scnCode: text("scn_code"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("recalls_stg_natural_key_idx").on(
      table.reCallId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkRecallsStgLoadRunFile = foreignKey({
  columns: [recallsStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_recalls_stg_load_run_file",
});

