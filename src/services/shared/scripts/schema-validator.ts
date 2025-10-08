#!/usr/bin/env tsx

/**
 * Schema Validation Script
 *
 * Validates consistency between:
 * - Raw schema table definitions
 * - Staging schema table definitions
 * - Transformation configuration files
 *
 * This script helps catch issues like:
 * - Source columns in transformations that don't exist in raw schemas
 * - Target columns in transformations that don't exist in staging schemas
 * - Missing transformations for columns that exist in both schemas
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

// Types for our validation
interface SchemaColumn {
  name: string;
  dbColumnName: string;
  type: string;
}

interface TransformationColumn {
  sourceColumn: string;
  targetColumn: string;
  targetType: string;
  required: boolean;
}

interface ValidationResult {
  extractType: string;
  errors: string[];
  warnings: string[];
  missingTransformations: string[];
  unusedSourceColumns: string[];
  unusedTargetColumns: string[];
  handlerColumnErrors: string[];
  handlerColumnWarnings: string[];
  typeMismatchErrors: string[];
}

// Column name patterns for extracting from schema files
const ColumnPattern =
  /(\w+):\s*(text|integer|decimal|boolean|date|timestamp|uuid)\s*\(\s*"([^"]+)"/g;

const TableNamePattern =
  /export\s+const\s+(\w+)\s*=\s*createTable\s*\(\s*"[^"]*\.(\w+)"/;

// Pattern to extract column mapping from raw handler files
const ColumnMappingPattern = /"([^"]+)"/g;

/**
 * Extract columns from a schema file
 */
function extractColumnsFromSchema(filePath: string): SchemaColumn[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const columns: SchemaColumn[] = [];

  let match;
  while ((match = ColumnPattern.exec(content)) !== null) {
    const [, columnName, columnType, dbColumnName] = match;
    columns.push({
      name: columnName,
      dbColumnName: dbColumnName,
      type: columnType,
    });
  }

  return columns;
}

/**
 * Extract table name from schema file
 */
function extractTableName(filePath: string): string | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const match = TableNamePattern.exec(content);
  return match ? match[2] : null; // Return the table name part
}

/**
 * Load transformation configurations
 */
function loadTransformationConfig(extractType: string): TransformationColumn[] {
  try {
    const configPath = path.join(
      process.cwd(),
      "src/services/staging-transformer/configs",
      `${extractType.toLowerCase()}-transformations.ts`
    );

    // We need to parse the TypeScript file to extract the transformations
    // This is a simplified approach - in a real scenario you'd use the TypeScript compiler API
    const content = fs.readFileSync(configPath, "utf-8");

    const transformations: TransformationColumn[] = [];
    const transformPattern =
      /{\s*sourceColumn:\s*"([^"]+)",\s*targetColumn:\s*"([^"]+)",\s*targetType:\s*ColumnType\.(\w+),\s*required:\s*(\w+)(?:[^}]*)}/g;

    let match;
    while ((match = transformPattern.exec(content)) !== null) {
      transformations.push({
        sourceColumn: match[1],
        targetColumn: match[2],
        targetType: match[3],
        required: match[4] === "true",
      });
    }

    return transformations;
  } catch (error) {
    console.warn(
      `Could not load transformation config for ${extractType}:`,
      error
    );
    return [];
  }
}

/**
 * Extract column mapping from raw handler file
 * TODO: Use this to dynamically generate the column mapping for raw handlers
 */
function extractColumnMappingFromHandler(extractType: string): string[] {
  try {
    const handlerPath = path.join(
      process.cwd(),
      "src/services/raw-loader/handlers",
      `${extractType.toLowerCase()}-schema-handler.ts`
    );

    const content = fs.readFileSync(handlerPath, "utf-8");

    const columnMapping: string[] = [];
    const mappingPattern = /columnMapping\s*=\s*\[\s*([^]+?)\s*\];/s;

    const match = mappingPattern.exec(content);
    if (match && match[1]) {
      let mappingContent = match[1];
      // Extract quoted strings from the column mapping (support both single and double quotes)
      const columnPattern = /(['"])([^'"]+)\1/g;
      let columnMatch;
      while ((columnMatch = columnPattern.exec(mappingContent)) !== null) {
        columnMapping.push(columnMatch[2]);
      }
    }

    return columnMapping;
  } catch (error) {
    console.warn(
      `Could not load column mapping from handler for ${extractType}:`,
      error
    );
    return [];
  }
}

/**
 * Validate a single extract type
 */
function validateExtractType(extractType: string): ValidationResult {
  const result: ValidationResult = {
    extractType,
    errors: [],
    warnings: [],
    missingTransformations: [],
    unusedSourceColumns: [],
    unusedTargetColumns: [],
    handlerColumnErrors: [],
    handlerColumnWarnings: [],
    typeMismatchErrors: [],
  };

  // Find schema files
  const rawSchemaPath = path.join(
    process.cwd(),
    "src/db/schema/raw",
    `${extractType.toLowerCase()}.ts`
  );
  const stgSchemaPath = path.join(
    process.cwd(),
    "src/db/schema/stg",
    `${extractType.toLowerCase()}.ts`
  );

  if (!fs.existsSync(rawSchemaPath)) {
    result.errors.push(`Raw schema file not found: ${rawSchemaPath}`);
    return result;
  }

  if (!fs.existsSync(stgSchemaPath)) {
    result.errors.push(`Staging schema file not found: ${stgSchemaPath}`);
    return result;
  }

  // Extract columns from schemas
  const rawColumns = extractColumnsFromSchema(rawSchemaPath);
  const stgColumns = extractColumnsFromSchema(stgSchemaPath);

  if (rawColumns.length === 0) {
    result.warnings.push(`No columns found in raw schema: ${rawSchemaPath}`);
  }

  if (stgColumns.length === 0) {
    result.warnings.push(
      `No columns found in staging schema: ${stgSchemaPath}`
    );
  }

  // Load transformation config
  const transformations = loadTransformationConfig(extractType);

  if (transformations.length === 0) {
    result.warnings.push(`No transformations found for ${extractType}`);
    return result;
  }

  // Extract column mapping from handler
  const handlerColumns = extractColumnMappingFromHandler(extractType);

  if (handlerColumns.length === 0) {
    result.warnings.push(
      `No column mapping found in handler for ${extractType}`
    );
  }

  // Create lookup maps
  const rawColumnMap = new Map(
    rawColumns.map((col) => [col.dbColumnName, col])
  );
  const stgColumnMap = new Map(stgColumns.map((col) => [col.name, col]));

  // Validate transformations
  for (const transform of transformations) {
    // Check if source column exists in raw schema
    if (!rawColumnMap.has(transform.sourceColumn)) {
      result.errors.push(
        `Source column '${transform.sourceColumn}' not found in raw schema (transformation targets '${transform.targetColumn}')`
      );
    }

    // Check if target column exists in staging schema
    if (!stgColumnMap.has(transform.targetColumn)) {
      result.errors.push(
        `Target column '${transform.targetColumn}' not found in staging schema (source: '${transform.sourceColumn}')`
      );
    }

    // Check if target type matches staging schema column type
    if (stgColumnMap.has(transform.targetColumn)) {
      const stgColumn = stgColumnMap.get(transform.targetColumn)!;
      if (stgColumn.type !== transform.targetType.toLowerCase()) {
        result.typeMismatchErrors.push(
          `Target column '${transform.targetColumn}' type mismatch: transformation specifies '${transform.targetType}' but staging schema defines '${stgColumn.type}'`
        );
      }
    }
  }

  // Define audit/ETL columns that should NOT be in staging transformations
  const excludedFromStaging = new Set([
    "load_run_file_id", // ETL lineage foreign key
    "loaded_date_time", // ETL load timestamp
    "inserted_by", // Audit: who inserted
    "updated_by", // Audit: who last updated
    "inserted_at", // Audit: when inserted
    "updated_at", // Audit: when last updated
  ]);

  // Find missing transformations (columns that exist in both schemas but have no transformation)
  // Excluding audit/ETL columns that should NOT be in staging
  const transformedSourceColumns = new Set(
    transformations.map((t) => t.sourceColumn)
  );
  const transformedTargetColumns = new Set(
    transformations.map((t) => t.targetColumn)
  );

  // Track intentionally excluded columns for reporting
  const intentionallyExcluded: string[] = [];

  for (const rawCol of rawColumns) {
    // Track audit/ETL columns that are intentionally excluded from staging
    if (excludedFromStaging.has(rawCol.dbColumnName)) {
      intentionallyExcluded.push(
        `Raw column '${rawCol.dbColumnName}' (${rawCol.name}) intentionally excluded from staging (audit/ETL)`
      );
      continue;
    }

    if (!transformedSourceColumns.has(rawCol.dbColumnName)) {
      result.missingTransformations.push(
        `Raw column '${rawCol.dbColumnName}' (${rawCol.name}) has no transformation`
      );
    }
  }

  // Add intentionally excluded columns to warnings for transparency
  result.warnings.push(...intentionallyExcluded);

  for (const stgCol of stgColumns) {
    if (!transformedTargetColumns.has(stgCol.name)) {
      result.unusedTargetColumns.push(
        `Staging column '${stgCol.name}' is not used in any transformation`
      );
    }
  }

  // Validate handler column mappings against raw schema (excluding audit/ETL columns)
  const rawColumnNames = new Set(rawColumns.map((col) => col.dbColumnName));

  for (const handlerColumn of handlerColumns) {
    if (
      !rawColumnNames.has(handlerColumn) &&
      !excludedFromStaging.has(handlerColumn)
    ) {
      result.handlerColumnErrors.push(
        `Handler column '${handlerColumn}' not found in raw schema`
      );
    }
  }

  // Check for raw schema columns not in handler mapping (excluding audit/ETL columns)
  const handlerColumnSet = new Set(handlerColumns);
  for (const rawCol of rawColumns) {
    if (
      !handlerColumnSet.has(rawCol.dbColumnName) &&
      !excludedFromStaging.has(rawCol.dbColumnName)
    ) {
      result.handlerColumnWarnings.push(
        `Raw schema column '${rawCol.dbColumnName}' (${rawCol.name}) not found in handler mapping`
      );
    }
  }

  return result;
}

/**
 * Main validation function
 */
async function validateAllSchemas() {
  console.log("🔍 Starting schema validation...\n");

  // Find all extract types by looking at transformation config files
  const configFiles = await glob(
    "src/services/staging-transformer/configs/*-transformations.ts"
  );

  const extractTypes = configFiles.map((file) => {
    const basename = path.basename(file, "-transformations.ts");
    return basename.charAt(0).toUpperCase() + basename.slice(1);
  });

  console.log(`Found ${extractTypes.length} extract types to validate:`);
  extractTypes.forEach((type) => console.log(`  - ${type}`));
  console.log("");

  const allResults: ValidationResult[] = [];

  for (const extractType of extractTypes) {
    console.log(`Validating ${extractType}...`);
    const result = validateExtractType(extractType);
    allResults.push(result);

    // Print immediate results for this extract type
    if (result.errors.length > 0) {
      console.log(`  ❌ ${result.errors.length} errors:`);
      result.errors.forEach((error) => console.log(`     - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log(`  ⚠️  ${result.warnings.length} warnings:`);
      result.warnings.forEach((warning) => console.log(`     - ${warning}`));
    }

    if (result.missingTransformations.length > 0) {
      console.log(
        `  📋 ${result.missingTransformations.length} missing transformations:`
      );
      result.missingTransformations
        .slice(0, 5)
        .forEach((missing) => console.log(`     - ${missing}`));
      if (result.missingTransformations.length > 5) {
        console.log(
          `     ... and ${result.missingTransformations.length - 5} more`
        );
      }
    }

    if (result.handlerColumnErrors.length > 0) {
      console.log(
        `  🔗 ${result.handlerColumnErrors.length} handler column errors:`
      );
      result.handlerColumnErrors.forEach((error) =>
        console.log(`     - ${error}`)
      );
    }

    if (result.handlerColumnWarnings.length > 0) {
      console.log(
        `  🔗 ${result.handlerColumnWarnings.length} handler column warnings:`
      );
      result.handlerColumnWarnings
        .slice(0, 5)
        .forEach((warning) => console.log(`     - ${warning}`));
      if (result.handlerColumnWarnings.length > 5) {
        console.log(
          `     ... and ${result.handlerColumnWarnings.length - 5} more`
        );
      }
    }

    if (result.typeMismatchErrors.length > 0) {
      console.log(
        `  🔍 ${result.typeMismatchErrors.length} type mismatch errors:`
      );
      result.typeMismatchErrors.forEach((error) =>
        console.log(`     - ${error}`)
      );
    }

    console.log("");
  }

  // Summary
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = allResults.reduce(
    (sum, r) => sum + r.warnings.length,
    0
  );
  const totalMissing = allResults.reduce(
    (sum, r) => sum + r.missingTransformations.length,
    0
  );
  const totalHandlerErrors = allResults.reduce(
    (sum, r) => sum + r.handlerColumnErrors.length,
    0
  );
  const totalHandlerWarnings = allResults.reduce(
    (sum, r) => sum + r.handlerColumnWarnings.length,
    0
  );
  const totalTypeMismatchErrors = allResults.reduce(
    (sum, r) => sum + r.typeMismatchErrors.length,
    0
  );

  console.log("📊 Validation Summary:");
  console.log(`  ❌ Total errors: ${totalErrors}`);
  console.log(`  ⚠️  Total warnings: ${totalWarnings}`);
  console.log(`  📋 Total missing transformations: ${totalMissing}`);
  console.log(`  🔗 Total handler column errors: ${totalHandlerErrors}`);
  console.log(`  🔗 Total handler column warnings: ${totalHandlerWarnings}`);
  console.log(`  🔍 Total type mismatch errors: ${totalTypeMismatchErrors}`);

  if (
    totalErrors > 0 ||
    totalHandlerErrors > 0 ||
    totalTypeMismatchErrors > 0
  ) {
    console.log("\n❌ Validation failed! Please fix the errors above.");
    process.exit(1);
  } else if (
    totalWarnings > 0 ||
    totalMissing > 0 ||
    totalHandlerWarnings > 0
  ) {
    console.log(
      "\n⚠️  Validation completed with warnings. Consider reviewing the issues above."
    );
    process.exit(0);
  } else {
    console.log("\n✅ All validations passed!");
    process.exit(0);
  }
}

/**
 * Run validation for a specific extract type
 */
async function validateSpecificExtractType(extractType: string) {
  console.log(`🔍 Validating ${extractType}...\n`);

  const result = validateExtractType(extractType);

  if (result.errors.length > 0) {
    console.log(`❌ ${result.errors.length} errors:`);
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log(`⚠️  ${result.warnings.length} warnings:`);
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  if (result.missingTransformations.length > 0) {
    console.log(
      `📋 ${result.missingTransformations.length} missing transformations:`
    );
    result.missingTransformations.forEach((missing) =>
      console.log(`  - ${missing}`)
    );
  }

  if (result.handlerColumnErrors.length > 0) {
    console.log(
      `🔗 ${result.handlerColumnErrors.length} handler column errors:`
    );
    result.handlerColumnErrors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.handlerColumnWarnings.length > 0) {
    console.log(
      `🔗 ${result.handlerColumnWarnings.length} handler column warnings:`
    );
    result.handlerColumnWarnings.forEach((warning) =>
      console.log(`  - ${warning}`)
    );
  }

  if (result.typeMismatchErrors.length > 0) {
    console.log(`🔍 ${result.typeMismatchErrors.length} type mismatch errors:`);
    result.typeMismatchErrors.forEach((error) => console.log(`  - ${error}`));
  }

  if (
    result.errors.length === 0 &&
    result.warnings.length === 0 &&
    result.missingTransformations.length === 0 &&
    result.handlerColumnErrors.length === 0 &&
    result.handlerColumnWarnings.length === 0 &&
    result.typeMismatchErrors.length === 0
  ) {
    console.log("✅ Validation passed!");
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  validateSpecificExtractType(args[0]);
} else {
  validateAllSchemas();
}
