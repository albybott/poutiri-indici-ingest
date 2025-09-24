import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createTable } from "../../../utils/create-table.js";

export const nextOfKinRaw = createTable("raw.next_of_kin", {
  // Source columns as text (all fields from NextofKin extract)
  nexttoKinId: text("nextto_kin_id"),
  patientId: text("patient_id"),
  nokProfileId: text("nok_profile_id"),
  nhiNumber: text("nhi_number"),
  name: text("name"),
  fullAddress: text("full_address"),
  cellNumber: text("cell_number"),
  dayPhone: text("day_phone"),
  nightPhone: text("night_phone"),
  isEmergency: text("is_emergency"),
  relationshipTypeId: text("relationship_type_id"),
  relationshipType: text("relationship_type"),
  isActive: text("is_active"),
  isDeleted: text("is_deleted"),
  insertedById: text("inserted_by_id"),
  insertedBy: text("inserted_by"),
  updatedById: text("updated_by_id"),
  updatedBy: text("updated_by"),
  insertedAt: text("inserted_at"),
  updatedAt: text("updated_at"),
  userLoggingId: text("user_logging_id"),
  loggingUserName: text("logging_user_name"),
  isGp2Gp: text("is_gp2gp"),
  permanentAddressLatitude: text("permanent_address_latitude"),
  permanentAddressLongitude: text("permanent_address_longitude"),
  practiceId: text("practice_id"),
  perOrgId: text("per_org_id"),
  loadedDateTime: text("loaded_date_time"),

  // Lineage columns
  s3Bucket: text("s3_bucket").notNull(),
  s3Key: text("s3_key").notNull(),
  s3VersionId: text("s3_version_id").notNull(),
  fileHash: text("file_hash").notNull(),
  dateExtracted: text("date_extracted").notNull(),
  extractType: text("extract_type").notNull(),
  loadRunId: uuid("load_run_id").notNull(),
  loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
});
