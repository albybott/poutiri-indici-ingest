#!/usr/bin/env tsx

/**
 * Script to generate extract handlers from Drizzle schema definitions
 * This demonstrates how handlers can be automatically generated from schema
 *
 * Usage: npx tsx src/services/raw-loader/scripts/generate-handlers.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// This would import all schema definitions
// import { patientsRaw } from '../../db/schema/raw/patients';
// import { appointmentsRaw } from '../../db/schema/raw/appointments';
// etc...

interface SchemaInfo {
  extractType: string;
  tableName: string;
  schemaPath: string;
  handlerPath: string;
}

const schemas: SchemaInfo[] = [
  {
    extractType: "Patient",
    tableName: "raw.patients",
    schemaPath: "src/db/schema/raw/patients.ts",
    handlerPath: "src/services/raw-loader/handlers/patients-schema-handler.ts",
  },
  {
    extractType: "Appointments",
    tableName: "raw.appointments",
    schemaPath: "src/db/schema/raw/appointments.ts",
    handlerPath:
      "src/services/raw-loader/handlers/appointments-schema-handler.ts",
  },
  // Add more schemas as needed
];

//TODO: complete this, it needs to be updated to use the new schema definitions
function generateHandlerFromSchema(schemaInfo: SchemaInfo): string {
  const { extractType, tableName } = schemaInfo;

  return `import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * ${extractType} handler generated from schema
 * This is automatically generated from the ${extractType.toLowerCase()} schema definition
 * 
 * Generated from: ${schemaInfo.schemaPath}
 * Table: ${tableName}
 */
export class ${extractType}SchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "${extractType}";
  tableName = "${tableName}";
  
  // TODO: This should be generated from the actual schema definition
  // For now, this is a placeholder that needs to be manually updated
  columnMapping = [
    // Source columns from ${extractType} extract
    // These should be extracted from the schema definition
    "id",
    "name", 
    "created_at",
    "updated_at",
    // Lineage columns (added automatically by loader)
    "s3_bucket",
    "s3_key",
    "s3_version_id", 
    "file_hash",
    "date_extracted",
    "extract_type",
    "load_run_id",
    "load_ts",
  ];

  validationRules: ValidationRule[] = [
    // Add validation rules specific to ${extractType}
    {
      columnName: "id",
      ruleType: "required",
      validator: (value) => /^\\d+$/.test(value),
      errorMessage: "id must be numeric",
    },
  ];
}
`;
}

function generateHandlerFactoryUpdate(schemas: SchemaInfo[]): string {
  const imports = schemas
    .map(
      (s) =>
        `import { ${s.extractType}SchemaHandler } from "./handlers/${s.extractType.toLowerCase()}-schema-handler";`
    )
    .join("\n");

  const registrations = schemas
    .map(
      (s) =>
        `    this.handlers.set("${s.extractType}", new ${s.extractType}SchemaHandler());`
    )
    .join("\n");

  return `// Auto-generated handler registrations
${imports}

// In registerDefaultHandlers():
${registrations}
`;
}

function main() {
  console.log("🚀 Generating extract handlers from schema definitions...");

  // Create handlers directory if it doesn't exist
  const handlersDir = join(process.cwd(), "src/services/raw-loader/handlers");
  try {
    mkdirSync(handlersDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Generate handlers for each schema
  for (const schema of schemas) {
    const handlerContent = generateHandlerFromSchema(schema);
    const handlerPath = join(process.cwd(), schema.handlerPath);

    console.log(`📝 Generating handler: ${schema.handlerPath}`);
    writeFileSync(handlerPath, handlerContent);
  }

  // Generate factory update
  const factoryUpdate = generateHandlerFactoryUpdate(schemas);
  const factoryUpdatePath = join(
    process.cwd(),
    "src/services/raw-loader/handlers/factory-update.txt"
  );
  writeFileSync(factoryUpdatePath, factoryUpdate);

  console.log("✅ Handler generation complete!");
  console.log(`📋 Factory update saved to: ${factoryUpdatePath}`);
  console.log("\nNext steps:");
  console.log("1. Review generated handlers");
  console.log("2. Update column mappings to match actual schema");
  console.log("3. Add custom validation rules as needed");
  console.log("4. Update ExtractHandlerFactory to use new handlers");
}

if (require.main === module) {
  main();
}

export { generateHandlerFromSchema, generateHandlerFactoryUpdate };
