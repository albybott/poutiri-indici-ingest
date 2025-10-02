import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createTable } from "../../../utils/create-table";

export const diagnosesStg = createTable(
  "stg.diagnoses",
  {
    // Typed columns with proper constraints
    diagnosisId: text("diagnosis_id").notNull(),
    appointmentId: text("appointment_id"),
    patientId: text("patient_id"),
    diseaseId: text("disease_id"),
    disease: text("disease"),
    diagnosisDate: date("diagnosis_date"),
    diagnosisById: text("diagnosis_by_id"),
    diagnosisBy: text("diagnosis_by"),
    summary: text("summary"),
    isLongTerm: boolean("is_long_term"),
    addtoProblem: boolean("addto_problem"),
    isHighlighted: boolean("is_highlighted"),
    sequenceNo: integer("sequence_no"),
    isActive: boolean("is_active").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
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
    practiceId: text("practice_id").notNull(),
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
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    practiceLocationId: text("practice_location_id"),
    locationName: text("location_name"),
    snomedId: text("snomed_id"),
    snomedTerm: text("snomed_term"),
    conceptId: text("concept_id"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("diagnoses_stg_natural_key_idx").on(
      table.diagnosisId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);
