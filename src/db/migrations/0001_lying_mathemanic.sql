CREATE TABLE "etl"."staging_runs" (
	"staging_run_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"load_run_id" uuid NOT NULL,
	"extract_type" text NOT NULL,
	"source_table" text NOT NULL,
	"target_table" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" text NOT NULL,
	"total_rows_read" integer DEFAULT 0,
	"total_rows_transformed" integer DEFAULT 0,
	"total_rows_rejected" integer DEFAULT 0,
	"total_rows_deduplicated" integer DEFAULT 0,
	"successful_batches" integer DEFAULT 0,
	"failed_batches" integer DEFAULT 0,
	"duration_ms" integer,
	"rows_per_second" integer,
	"memory_usage_mb" integer,
	"error" text,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etl"."staging_runs" ADD CONSTRAINT "staging_runs_load_run_id_load_runs_load_run_id_fk" FOREIGN KEY ("load_run_id") REFERENCES "etl"."load_runs"("load_run_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staging_runs_load_run_completed_idx" ON "etl"."staging_runs" USING btree ("load_run_id","extract_type") WHERE "etl"."staging_runs"."status" = 'completed';--> statement-breakpoint
CREATE INDEX "staging_runs_status_idx" ON "etl"."staging_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staging_runs_load_run_idx" ON "etl"."staging_runs" USING btree ("load_run_id");