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

export const allergiesStg = createTable(
  "stg.allergies",
  {
    // Typed columns with proper constraints
    allergyId: text("allergy_id").notNull(),
    appointmentId: text("appointment_id"),
    allergyTypeId: text("allergy_type_id"),
    allergyType: text("allergy_type"),
    onsetDate: date("onset_date"),
    deactivationReason: text("deactivation_reason"),
    medicineId: text("medicine_id"),
    medicine: text("medicine"),
    reactionId: text("reaction_id"),
    reactions: text("reactions"),
    reactionTypeId: text("reaction_type_id"),
    reactionType: text("reaction_type"),
    severityId: text("severity_id"),
    severity: text("severity"),
    reactionNotes: text("reaction_notes"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    insertedBy: text("inserted_by"),
    updatedById: text("updated_by_id"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    patientId: text("patient_id").notNull(),
    patient: text("patient"),
    isConfidential: boolean("is_confidential"),
    practiceId: text("practice_id").notNull(),
    practice: text("practice"),
    mgencode: text("mgencode"),
    mclacode: text("mclacode"),
    medTechId: text("med_tech_id"),
    medicineClassificationId: text("medicine_classification_id"),
    allergyCategoryId: text("allergy_category_id"),
    allergyCategory: text("allergy_category"),
    comment: text("comment"),
    substanceTypeId: text("substance_type_id"),
    substanceType: text("substance_type"),
    favouriteSubstanceId: text("favourite_substance_id"),
    favouriteSubstance: text("favourite_substance"),
    diseaseId: text("disease_id"),
    disease: text("disease"),
    otherSubstance: text("other_substance"),
    medicineTypeId: text("medicine_type_id"),
    medicineType: text("medicine_type"),
    userLoggingId: text("user_logging_id"),
    loggingUserName: text("logging_user_name"),
    showOnPortal: boolean("show_on_portal"),
    warningType: text("warning_type"),
    rowinactive: boolean("rowinactive"),
    isReviewed: boolean("is_reviewed"),
    providerId: text("provider_id"),
    provider: text("provider"),
    practiceLocationId: text("practice_location_id"),
    locationName: text("location_name"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("allergies_stg_natural_key_idx").on(
      table.allergyId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkAllergiesStgLoadRunFile = foreignKey({
  columns: [allergiesStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_allergies_stg_load_run_file",
});
