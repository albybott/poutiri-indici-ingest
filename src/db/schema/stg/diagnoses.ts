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

export const diagnosesStg = createTable(
  "stg.diagnoses",
  {
    // Typed columns with proper constraints
    diagnosisId: text("diagnosis_id").notNull(),
    appointmentId: text("appointment_id"),
    patientId: text("patient_id"),
    practiceId: text("practice_id").notNull(),
    perOrgId: text("per_org_id").notNull(),

    // Diagnosis details
    diseaseId: text("disease_id"),
    disease: text("disease"),
    diagnosisDate: date("diagnosis_date"),
    diagnosisById: text("diagnosis_by_id"),
    diagnosisBy: text("diagnosis_by"),
    summary: text("summary"),
    isLongTerm: boolean("is_long_term"),
    addToProblem: boolean("add_to_problem"),
    isHighlighted: boolean("is_highlighted"),
    sequenceNo: integer("sequence_no"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    insertedBy: text("inserted_by"),
    updatedById: text("updated_by_id"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    isConfidential: boolean("is_confidential"),
    diagnosisTypeId: text("diagnosis_type_id"),
    diagnosisType: text("diagnosis_type"),
    classificationRecord: text("classification_record"),
    medTechId: text("med_tech_id"),
    medTechReadCode: text("med_tech_read_code"),
    medTechReadTerm: text("med_tech_read_term"),
    isMapped: boolean("is_mapped"),
    practice: text("practice"),
    onSetDate: date("on_set_date"),
    userLoggingId: text("user_logging_id"),
    loggingUserName: text("logging_user_name"),
    recallId: text("recall_id"),
    recall: text("recall"),
    exclusionStartDate: date("exclusion_start_date"),
    exclusionEndDate: date("exclusion_end_date"),
    showOnPortal: boolean("show_on_portal"),
    extAppointmentId: text("ext_appointment_id"),
    patientMedTechId: text("patient_med_tech_id"),
    permanentAddressLatitude: text("permanent_address_latitude"),
    permanentAddressLongitude: text("permanent_address_longitude"),
    practiceLocationId: text("practice_location_id"),
    locationName: text("location_name"),
    snomedId: text("snomed_id"),
    snomedTerm: text("snomed_term"),
    conceptId: text("concept_id"),

    // Audit fields
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    // Natural key for deduplication
    uniqueIndex("diagnoses_stg_natural_key").on(
      table.diagnosisId,
      table.practiceId,
      table.perOrgId
    ),

    // Foreign key to load_run_files
    foreignKey({
      columns: [table.loadRunFileId],
      foreignColumns: [loadRunFiles.loadRunFileId],
      name: "fk_diagnoses_stg_load_run_file",
    }),

    // Check constraints
    check(
      "diagnoses_stg_active_check",
      sql`${table.isActive} IN (true, false)`
    ),
    check(
      "diagnoses_stg_deleted_check",
      sql`${table.isDeleted} IN (true, false)`
    ),
  ]
);
