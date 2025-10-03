ALTER TABLE "etl"."load_runs" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "etl"."load_runs" DROP COLUMN "finished_at";