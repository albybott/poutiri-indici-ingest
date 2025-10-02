import { rawSchema, stgSchema, coreSchema, etlSchema } from "../schema/schemas";
import {
  uniqueIndex,
  index,
  type PgTableExtraConfigValue,
} from "drizzle-orm/pg-core";

// Type definitions for better type safety
export type IndexBuilder<T = any> = (table: T) => PgTableExtraConfigValue[];
export type TableDefinition = Record<string, any>;

/**
 * Creates a table with the given name and definition.
 * Used as a wrapper around the drizzle-orm table function for centralizing table creation.
 * @param tableName - The name of the table to create.
 * @param tableDefinition - A drizzle-orm record of column definitions for the table.
 * @param indexBuilder - A drizzle-orm index builder function that returns an array of indexes to create for the table.
 * @returns
 */
export const createTable = (
  tableName: string,
  tableDefinition: TableDefinition,
  indexBuilder?: IndexBuilder
) => {
  const [schemaName, table] = tableName.split(".");

  if (!table) {
    throw new Error(
      `Invalid table name format. Expected 'schema.table', got '${tableName}'`
    );
  }

  switch (schemaName) {
    case "raw":
      return indexBuilder
        ? rawSchema.table(table, tableDefinition, indexBuilder)
        : rawSchema.table(table, tableDefinition);
    case "stg":
      return indexBuilder
        ? stgSchema.table(table, tableDefinition, indexBuilder)
        : stgSchema.table(table, tableDefinition);
    case "core":
      return indexBuilder
        ? coreSchema.table(table, tableDefinition, indexBuilder)
        : coreSchema.table(table, tableDefinition);
    case "etl":
      return indexBuilder
        ? etlSchema.table(table, tableDefinition, indexBuilder)
        : etlSchema.table(table, tableDefinition);
    default:
      throw new Error(`Unknown schema: ${schemaName}`);
  }
};

// Re-export commonly used index functions for convenience
export { uniqueIndex, index };
