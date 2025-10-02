import { text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createTable } from "../../utils/create-table";

// Mapping table for appointment status
export const mapAppointmentStatus = createTable("stg.map_appointment_status", {
  sourceValue: text("source_value").notNull(),
  coreValue: text("core_value").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Mapping table for status group
export const mapStatusGroup = createTable("stg.map_status_group", {
  sourceValue: text("source_value").notNull(),
  coreValue: text("core_value").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Mapping table for immunisation status
export const mapImmunisationStatus = createTable(
  "stg.map_immunisation_status",
  {
    sourceValue: text("source_value").notNull(),
    coreValue: text("core_value").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);
