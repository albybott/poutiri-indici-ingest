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

export const immunisationStg = createTable(
  "stg.immunisation",
  {
    // Typed columns with proper constraints
    appointmentImmunisationId: text("appointment_immunisation_id").notNull(),
    patientId: text("patient_id"),
    appointmentId: text("appointment_id"),
    patientScheduleId: text("patient_schedule_id"),
    vaccineId: text("vaccine_id"),
    vaccineName: text("vaccine_name"),
    vaccineCode: text("vaccine_code"),
    dose: text("dose"),
    doseNumber: integer("dose_number"),
    administrationSiteId: text("administration_site_id"),
    administrationSite: text("administration_site"),
    routeId: text("route_id"),
    route: text("route"),
    batchNumber: text("batch_number"),
    expiryDate: date("expiry_date"),
    immunisationStatusId: text("immunisation_status_id"),
    immunisationStatus: text("immunisation_status"),
    vaccineOutComeId: text("vaccine_out_come_id"),
    vaccineOutCome: text("vaccine_out_come"),
    isNirAck: boolean("is_nir_ack"),
    reason: text("reason"),
    providerId: text("provider_id"),
    provider: text("provider"),
    comments: text("comments"),
    administrationTime: timestamp("administration_time"),
    vaccineIndicationId: text("vaccine_indication_id"),
    vaccineIndication: text("vaccine_indication"),
    vaccineIndicationCode: text("vaccine_indication_code"),
    needleLength: text("needle_length"),
    hasDiluent: boolean("has_diluent"),
    diluentBatchNo: text("diluent_batch_no"),
    diluentExpiryDate: date("diluent_expiry_date"),
    isConfidential: boolean("is_confidential"),
    costingCodeId: text("costing_code_id"),
    costingCode: text("costing_code"),
    brandId: text("brand_id"),
    brand: text("brand"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    insertedBy: text("inserted_by"),
    updatedById: text("updated_by_id"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    isParked: boolean("is_parked"),
    medTechId: text("med_tech_id"),
    practiceId: text("practice_id").notNull(),
    practice: text("practice"),
    isAutoBill: boolean("is_auto_bill"),
    vaccinatorId: text("vaccinator_id"),
    vaccinator: text("vaccinator"),
    userLoggingId: text("user_logging_id"),
    loggingUserName: text("logging_user_name"),
    nirSentDate: timestamp("nir_sent_date"),
    showOnPortal: boolean("show_on_portal"),
    vaccinatorCode: text("vaccinator_code"),
    permanentAddressLatitude: text("permanent_address_latitude"),
    permanentAddressLongitude: text("permanent_address_longitude"),
    practiceLocationId: text("practice_location_id"),
    locationName: text("location_name"),
    vaccineGroupId: text("vaccine_group_id"),
    vaccineGroup: text("vaccine_group"),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("immunisation_stg_natural_key_idx").on(
      table.appointmentImmunisationId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkImmunisationStgLoadRunFile = foreignKey({
  columns: [immunisationStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_immunisation_stg_load_run_file",
});
