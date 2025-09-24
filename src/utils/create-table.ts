import {
  rawSchema,
  stgSchema,
  coreSchema,
  etlSchema,
} from "../db/schema/schemas";

// Schema-aware table creator
export const createTable = (tableName: string, tableDefinition: any) => {
  const [schemaName, table] = tableName.split(".");

  switch (schemaName) {
    case "raw":
      return rawSchema.table(table, tableDefinition);
    case "stg":
      return stgSchema.table(table, tableDefinition);
    case "core":
      return coreSchema.table(table, tableDefinition);
    case "etl":
      return etlSchema.table(table, tableDefinition);
    default:
      throw new Error(`Unknown schema: ${schemaName}`);
  }
};
