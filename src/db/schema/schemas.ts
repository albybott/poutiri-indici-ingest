import { pgSchema } from "drizzle-orm/pg-core";

// Define all schemas used in the application
export const rawSchema = pgSchema("raw");
export const stgSchema = pgSchema("stg");
export const coreSchema = pgSchema("core");
export const etlSchema = pgSchema("etl");
