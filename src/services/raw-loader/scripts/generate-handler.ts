import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Simple handler generator from schema
 * Usage: pnpm tsx src/services/raw-loader/scripts/generate-handler.ts immunisation
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entityName = process.argv[2];
if (!entityName) {
  console.error("Usage: tsx generate-handler.ts <entity-name>");
  process.exit(1);
}

// Load the schema file to extract columns
const schemaPath = path.join(
  __dirname,
  `../../../db/schema/raw/${entityName}.ts`
);
const schemaContent = fs.readFileSync(schemaPath, "utf-8");

// Extract column names (simple regex-based extraction)
const columnMatches = schemaContent.matchAll(
  /(\w+):\s*(text|integer|boolean|timestamp)/g
);
const columns = Array.from(columnMatches).map((match) => match[1]);

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
const extractType = singularize(pascalCase(entityName));

const handlerCode = `import { BaseSchemaDrivenHandler } from "../schema-driven-handler";
import type { ValidationRule } from "../types/raw-loader";

/**
 * ${pascalCase(entityName)} handler generated from schema
 * Generated on ${new Date().toISOString()}
 */
export class ${className} extends BaseSchemaDrivenHandler {
  extractType = "${extractType}";
  tableName = "raw.${entityName}";

  // Generated from src/db/schema/raw/${entityName}.ts
  columnMapping = ${JSON.stringify(allColumns, null, 4).replace(/"/g, "'")};

  validationRules: ValidationRule[] = [
    // TODO: Add entity-specific validation rules
    // Example:
    // {
    //   columnName: "${dataColumns[0]}",
    //   ruleType: "required",
    //   validator: (value) => /^\\d+$/.test(value),
    //   errorMessage: "${dataColumns[0]} must be numeric"
    // }
  ];
}
`;

// Write handler file
const handlerPath = path.join(
  __dirname,
  `../handlers/${entityName}-schema-handler.ts`
);
fs.writeFileSync(handlerPath, handlerCode);

console.log(`✅ Generated handler: ${handlerPath}`);
console.log(`📝 Next steps:`);
console.log(`   1. Review and customize validation rules`);
console.log(`   2. Add to extract-handler-factory.ts`);
console.log(`   3. Create test file`);

// Helper functions
function pascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (m) => m.replace("_", "").toUpperCase());
}

function singularize(str: string): string {
  if (str.endsWith("ies")) return str.slice(0, -3) + "y";
  if (str.endsWith("s")) return str.slice(0, -1);
  return str;
}
