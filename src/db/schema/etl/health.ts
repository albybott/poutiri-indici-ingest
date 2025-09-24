import {
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  serial,
} from "drizzle-orm/pg-core";
import { createTable } from "../../../utils/create-table";

// Health monitoring - last successful run per extract
export const health = createTable("etl.health", {
  healthId: serial("health_id").primaryKey(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),
  lastSuccessfulRunAt: timestamp("last_successful_run_at", {
    withTimezone: true,
  }),
  lastSuccessfulLoadRunId: uuid("last_successful_load_run_id"),
  lastSuccessfulDateExtracted: text("last_successful_date_extracted"),
  lastSuccessfulS3VersionId: text("last_successful_s3_version_id"),
  lastSuccessfulFileHash: text("last_successful_file_hash"),

  // Recent metrics for health endpoint
  avgRowsPerRun: integer("avg_rows_per_run"),
  avgProcessingTimeMinutes: decimal("avg_processing_time_minutes", {
    precision: 8,
    scale: 2,
  }),
  lastRunRowsIngested: integer("last_run_rows_ingested"),
  lastRunRowsRejected: integer("last_run_rows_rejected"),
  lastRunProcessingTimeMinutes: decimal("last_run_processing_time_minutes", {
    precision: 8,
    scale: 2,
  }),

  // Alert thresholds
  maxRejectRate: decimal("max_reject_rate", { precision: 5, scale: 4 }), // 0.05 = 5%
  maxProcessingTimeMinutes: decimal("max_processing_time_minutes", {
    precision: 8,
    scale: 2,
  }),
  minRowsPerRun: integer("min_rows_per_run"),

  // Status indicators
  isHealthy: boolean("is_healthy").notNull().default(true),
  lastAlertAt: timestamp("last_alert_at", { withTimezone: true }),
  alertReason: text("alert_reason"),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Configuration - feature flags and operational settings
export const config = createTable("etl.config", {
  configId: serial("config_id").primaryKey(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),

  // Feature flags
  enableFullLoad: boolean("enable_full_load").notNull().default(true),
  enableDeltaLoad: boolean("enable_delta_load").notNull().default(true),
  enableDataQualityChecks: boolean("enable_data_quality_checks")
    .notNull()
    .default(true),
  enableRejectHandling: boolean("enable_reject_handling")
    .notNull()
    .default(true),
  enableScdProcessing: boolean("enable_scd_processing").notNull().default(true),

  // Thresholds
  maxRejectRate: decimal("max_reject_rate", {
    precision: 5,
    scale: 4,
  }).default("0.05"), // 5%
  maxProcessingTimeMinutes: decimal("max_processing_time_minutes", {
    precision: 8,
    scale: 2,
  }).default("60"),
  minRowsPerRun: integer("min_rows_per_run").default(1),
  maxRetries: integer("max_retries").default(3),

  // Source schema versions
  sourceSchemaVersion: text("source_schema_version"),
  expectedColumnCount: integer("expected_column_count"),

  // Operational settings
  concurrencyLimit: integer("concurrency_limit").default(5),
  batchSize: integer("batch_size").default(1000),
  timeoutMinutes: integer("timeout_minutes").default(30),

  // Data retention
  rawDataRetentionDays: integer("raw_data_retention_days").default(90),
  stagingDataRetentionDays: integer("staging_data_retention_days").default(30),
  auditDataRetentionDays: integer("audit_data_retention_days").default(365),

  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by"),
});

// Extract-specific configuration overrides
export const extractConfig = createTable("etl.extract_config", {
  extractConfigId: serial("extract_config_id").primaryKey(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),

  // Extract-specific settings
  configKey: text("config_key").notNull(),
  configValue: text("config_value").notNull(),
  configType: text("config_type").notNull(), // 'string', 'number', 'boolean', 'json'
  description: text("description"),

  // Override settings
  isOverride: boolean("is_override").notNull().default(false),
  overrideReason: text("override_reason"),
  overrideExpiresAt: timestamp("override_expires_at", { withTimezone: true }),

  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by"),
});

// Data quality thresholds per extract
export const dqThresholds = createTable("etl.dq_thresholds", {
  thresholdId: serial("threshold_id").primaryKey(),
  extractType: text("extract_type").notNull(),
  perOrgId: text("per_org_id").notNull(),
  practiceId: text("practice_id").notNull(),

  // Threshold definitions
  metricName: text("metric_name").notNull(),
  thresholdValue: decimal("threshold_value", {
    precision: 15,
    scale: 4,
  }).notNull(),
  thresholdType: text("threshold_type").notNull(), // 'min', 'max', 'exact', 'range'
  minValue: decimal("min_value", { precision: 15, scale: 4 }),
  maxValue: decimal("max_value", { precision: 15, scale: 4 }),

  // Alert settings
  severity: text("severity").notNull(), // 'info', 'warning', 'error', 'critical'
  alertOnBreach: boolean("alert_on_breach").notNull().default(true),
  alertMessage: text("alert_message"),

  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by"),
});
