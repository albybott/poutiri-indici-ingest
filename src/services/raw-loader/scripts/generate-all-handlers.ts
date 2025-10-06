#!/usr/bin/env tsx

/**
 * Generate handlers for all expected entities from the data extract specification
 * Usage: pnpm tsx src/services/raw-loader/scripts/generate-all-handlers.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All expected entities from the data extract specification (kebab-case filenames)
const expectedEntities = [
  "allergies",
  "appointment-medications",
  "appointments",
  "diagnoses",
  "immunisation",
  "inbox",
  "inbox-detail",
  "invoice-detail",
  "invoices",
  "measurements",
  "medicine",
  "next-of-kin",
  "patients",
  "patient-alerts",
  "practice-info",
  "providers",
  "recalls",
  "vaccine",
];

// Entity name mappings (kebab-case to proper names)
const entityNameMappings: Record<string, string> = {
  "appointment-medications": "AppointmentMedications",
  "inbox-detail": "InboxDetail",
  "invoice-detail": "InvoiceDetail",
  "next-of-kin": "NextOfKin",
  "patient-alerts": "PatientAlerts",
  "practice-info": "PracticeInfo",
};

// Helper functions
function pascalCase(str: string): string {
  return str.replace(/(^\w|[-_]\w)/g, (m) =>
    m.replace(/[-_]/, "").toUpperCase()
  );
}

function singularize(str: string): string {
  if (str.endsWith("ies")) return str.slice(0, -3) + "y";
  if (str.endsWith("s")) return str.slice(0, -1);
  return str;
}

function getEntityDisplayName(entityName: string): string {
  return entityNameMappings[entityName] || pascalCase(entityName);
}

function generateHandlerFromSchema(entityName: string): string {
  const schemaPath = path.join(
    __dirname,
    `../../../db/schema/raw/${entityName}.ts`
  );

  if (!fs.existsSync(schemaPath)) {
    console.log(`⚠️  Schema file not found: ${schemaPath}`);
    return "";
  }

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  // Extract column names from schema - get the database column names (snake_case)
  const columnMatches = schemaContent.matchAll(
    /(\w+):\s*(text|integer|boolean|timestamp)\(["']([^"']+)["']\)/g
  );
  const columns = Array.from(columnMatches).map((match) => match[3]); // Use the DB column name (snake_case)

  // Filter out lineage columns
  const lineageColumns = [
    "s3_bucket",
    "s3_key",
    "s3_version_id",
    "file_hash",
    "date_extracted",
    "extract_type",
    "load_run_id",
    "load_ts",
  ];
  const dataColumns = columns.filter((col) => !lineageColumns.includes(col));

  // Add lineage columns back at the end (they're added automatically by the loader)
  const allColumns = [...dataColumns, ...lineageColumns];

  // Generate handler code
  const className = pascalCase(entityName) + "SchemaHandler";
  const extractType = singularize(getEntityDisplayName(entityName));
  const tableName = entityName.replace(/-/g, "_"); // Convert kebab-case to snake_case for table name

  return `import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * ${getEntityDisplayName(entityName)} handler generated from schema
 * Generated on ${new Date().toISOString()}
 */
export class ${className} extends BaseSchemaDrivenHandler {
  extractType = "${extractType}";
  tableName = "raw.${tableName}";

  // Generated from src/db/schema/raw/${entityName}.ts
  columnMapping = ${JSON.stringify(allColumns, null, 4).replace(/"/g, "'")};

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "${dataColumns[0] || "id"}",
    //   ruleType: "required",
    //   validator: (value) => /^\\d+$/.test(value),
    //   errorMessage: "${dataColumns[0] || "id"} must be numeric"
    // }
  ];
}
`;
}

function generateFactoryUpdate(entities: string[]): string {
  const imports = entities
    .map((entity) => {
      const className = pascalCase(entity) + "SchemaHandler";
      return `import { ${className} } from "./handlers/${entity}-schema-handler";`;
    })
    .join("\n");

  const registrations = entities
    .map((entity) => {
      const className = pascalCase(entity) + "SchemaHandler";
      const extractType = singularize(getEntityDisplayName(entity));
      return `    const ${entity}Handler = new ${className}();
    this.handlers.set("${extractType}", ${entity}Handler);`;
    })
    .join("\n");

  return `// Auto-generated handler registrations
${imports}

// In registerDefaultHandlers():
${registrations}
`;
}

async function main() {
  console.log("🚀 Generating handlers for all expected entities...");
  console.log("=".repeat(60));

  const handlersDir = path.join(__dirname, "../handlers");
  const results = {
    generated: [] as string[],
    skipped: [] as string[],
    errors: [] as string[],
  };

  // Create handlers directory if it doesn't exist
  try {
    fs.mkdirSync(handlersDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Generate handlers for each entity
  for (const entity of expectedEntities) {
    try {
      console.log(`\n📝 Processing ${entity}...`);

      const handlerContent = generateHandlerFromSchema(entity);

      if (!handlerContent) {
        results.skipped.push(entity);
        continue;
      }

      const handlerPath = path.join(handlersDir, `${entity}-schema-handler.ts`);
      fs.writeFileSync(handlerPath, handlerContent);

      results.generated.push(entity);
      console.log(`✅ Generated: ${handlerPath}`);
    } catch (error) {
      console.error(`❌ Error processing ${entity}:`, error);
      results.errors.push(
        `${entity}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Generate factory update
  const factoryUpdate = generateFactoryUpdate(results.generated);
  const factoryUpdatePath = path.join(handlersDir, "factory-update.txt");
  fs.writeFileSync(factoryUpdatePath, factoryUpdate);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Generation Summary:");
  console.log(`✅ Generated: ${results.generated.length} handlers`);
  console.log(`⚠️  Skipped: ${results.skipped.length} handlers`);
  console.log(`❌ Errors: ${results.errors.length} handlers`);

  if (results.generated.length > 0) {
    console.log("\n📋 Generated handlers:");
    results.generated.forEach((entity) => {
      const className = pascalCase(entity) + "SchemaHandler";
      const extractType = singularize(getEntityDisplayName(entity));
      console.log(`  - ${className} (extractType: "${extractType}")`);
    });
  }

  if (results.skipped.length > 0) {
    console.log("\n⚠️  Skipped (schema files missing):");
    results.skipped.forEach((entity) => console.log(`  - ${entity}`));
  }

  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log(`\n📝 Factory update saved to: ${factoryUpdatePath}`);
  console.log("\nNext steps:");
  console.log("1. Review generated handlers");
  console.log("2. Add custom validation rules as needed");
  console.log("3. Update ExtractHandlerFactory to use new handlers");
  console.log("4. Create staging transformation configs");
  console.log("5. Create fact handler configs");
}

// Run the generator
main().catch(console.error);
