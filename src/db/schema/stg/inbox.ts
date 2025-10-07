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

export const inboxStg = createTable(
  "stg.inbox",
  {
    // Typed columns with proper constraints
    inboxFolderItemId: text("inbox_folder_item_id").notNull(),
    folderId: text("folder_id"),
    folderName: text("folder_name"),
    isSystemFolder: boolean("is_system_folder"),
    orderNo: integer("order_no"),
    itemTypeId: text("item_type_id"),
    itemType: text("item_type"),
    patientId: text("patient_id"),
    providerId: text("provider_id"),
    practiceId: text("practice_id").notNull(),
    patientName: text("patient_name"),
    provider: text("provider"),
    practiceName: text("practice_name"),
    fromOrgId: text("from_org_id"),
    fromOrganizationName: text("from_organization_name"),
    assignToId: text("assign_to_id"),
    assignTo: text("assign_to"),
    resultDate: date("result_date"),
    messageSubjectId: text("message_subject_id"),
    messageSubject: text("message_subject"),
    comments: text("comments"),
    markAsRead: boolean("mark_as_read"),
    isConfidential: boolean("is_confidential"),
    showOnPortal: boolean("show_on_portal"),
    isReviewed: boolean("is_reviewed"),
    showOnTimeLine: boolean("show_on_time_line"),
    isActive: boolean("is_active"),
    isDeleted: boolean("is_deleted"),
    insertedById: text("inserted_by_id"),
    insertedBy: text("inserted_by"),
    updatedById: text("updated_by_id"),
    updatedBy: text("updated_by"),
    insertedAt: timestamp("inserted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    medTechId: text("med_tech_id"),
    dmsId: text("dms_id"),
    isRepeatRx: boolean("is_repeat_rx"),
    isRepliedRx: boolean("is_replied_rx"),
    externalRef: text("external_ref"),
    abnormResult: boolean("abnorm_result"),
    isDeactivated: boolean("is_deactivated"),
    folderGroup: text("folder_group"),
    documentCode: text("document_code"),
    isGp2Gp: boolean("is_gp2gp"),
    informatId: text("informat_id"),
    informat: text("informat"),
    permanentAddressLatitude: decimal("permanent_address_latitude", {
      precision: 10,
      scale: 8,
    }),
    permanentAddressLongitude: decimal("permanent_address_longitude", {
      precision: 11,
      scale: 8,
    }),
    filedAt: timestamp("filed_at", { withTimezone: true }),
    perOrgId: text("per_org_id").notNull(),
    loadedDateTime: timestamp("loaded_date_time", { withTimezone: true }),

    // Lineage - FK to load_run_files (same as raw tables)
    loadRunFileId: integer("load_run_file_id").notNull(),
    loadTs: timestamp("load_ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on natural key
    uniqueIndex("inbox_stg_natural_key_idx").on(
      table.inboxFolderItemId,
      table.practiceId,
      table.perOrgId
    ),
  ]
);

// Foreign key constraint to etl.load_run_files
export const fkInboxStgLoadRunFile = foreignKey({
  columns: [inboxStg.loadRunFileId],
  foreignColumns: [loadRunFiles.loadRunFileId],
  name: "fk_inbox_stg_load_run_file",
});




