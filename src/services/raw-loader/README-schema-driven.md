# Schema-Driven Extract Handlers

This document explains the new schema-driven approach for generating extract handlers automatically from Drizzle schema definitions.

## Problem

Previously, extract handlers were manually maintained with hardcoded column mappings that often got out of sync with the actual database schema, leading to errors like:

```
❌ Database error: column "created_date" of relation "patients" does not exist
```

## Solution

The new schema-driven approach automatically generates handlers from the actual database schema definitions, ensuring they stay in sync.

## Architecture

### 1. Schema-Driven Handler Generator

`src/services/raw-loader/schema-driven-handler.ts` provides utilities to generate handlers dynamically from Drizzle schema definitions.

### 2. Generated Handlers

Handlers are generated in `src/services/raw-loader/handlers/` and extend `BaseSchemaDrivenHandler`:

```typescript
export class PatientsSchemaHandler extends BaseSchemaDrivenHandler {
  extractType = "Patient";
  tableName = "raw.patients";
  columnMapping = [
    // Generated from actual schema
    "patient_id",
    "nhi_number",
    // ... all columns from schema
  ];
  validationRules = [
    // Custom validation rules
  ];
}
```

### 3. Handler Factory Integration

The `ExtractHandlerFactory` now uses schema-driven handlers by default:

```typescript
private registerDefaultHandlers(): void {
  // Schema-driven handlers (preferred)
  this.handlers.set("Patient", new PatientsSchemaHandler());
  
  // Legacy handlers for backward compatibility
  this.handlers.set("Appointments", new AppointmentsHandler());
}
```

## Usage

### Current Implementation

The system now uses the updated `PatientsSchemaHandler` which has the correct column mappings from the actual database schema.

### Future: Automatic Generation

Use the generation script to create handlers for new schemas:

```bash
npx tsx src/services/raw-loader/scripts/generate-handlers.ts
```

This will:
1. Generate handler files for each schema
2. Create factory update instructions
3. Ensure column mappings match the actual schema

## Benefits

1. **Automatic Sync**: Handlers stay in sync with schema changes
2. **Reduced Errors**: No more "column does not exist" errors
3. **Maintainability**: Less manual maintenance required
4. **Consistency**: All handlers follow the same pattern
5. **Type Safety**: Better TypeScript support

## Migration Path

1. ✅ **Phase 1**: Updated `PatientsHandler` with correct column mappings
2. ✅ **Phase 2**: Created schema-driven handler infrastructure
3. 🔄 **Phase 3**: Generate handlers for remaining extract types
4. 🔄 **Phase 4**: Fully automated generation from schema

## File Structure

```
src/services/raw-loader/
├── schema-driven-handler.ts          # Base classes and utilities
├── handlers/
│   ├── patients-schema-handler.ts    # Generated patient handler
│   └── appointments-schema-handler.ts # Generated appointment handler
├── scripts/
│   └── generate-handlers.ts          # Generation script
└── README-schema-driven.md           # This documentation
```

## Next Steps

1. **Generate remaining handlers**: Use the script to create handlers for all extract types
2. **Update factory**: Register all new schema-driven handlers
3. **Remove legacy handlers**: Once all are migrated, remove old handlers
4. **Add CI integration**: Automatically regenerate handlers on schema changes
5. **Add validation**: Ensure generated handlers match actual database schema

## Example: Adding a New Extract Type

1. Create the schema in `src/db/schema/raw/new-extract.ts`
2. Add it to the schemas list in `generate-handlers.ts`
3. Run the generation script
4. Update the factory to register the new handler
5. Test with actual data

This approach ensures that extract handlers are always in sync with the database schema, preventing the column mismatch errors you experienced.
