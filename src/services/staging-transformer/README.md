## Staging Transformer Service

The **Staging Transformer Service** transforms data from raw tables (`raw.*`) to staging tables (`stg.*`), applying type conversions, validation, and data quality rules.

## 🎯 Purpose

This service is responsible for the second layer of the ETL pipeline:

```
S3 CSV Files → [Raw Loader] → raw.* tables → [Staging Transformer] → stg.* tables → [Core Merger] → core.* tables
                                                    ↑ YOU ARE HERE
```

## 🔄 What It Does

1. **Reads** from `raw.*` tables (text columns)
2. **Transforms** text → typed columns (dates, booleans, decimals, etc.)
3. **Validates** data against business rules
4. **Rejects** invalid rows to rejection tables
5. **Loads** valid data to `stg.*` tables (with proper constraints)

## 📦 Components

### Core Services

1. **`StagingTransformerService`** - Main orchestrator
2. **`TransformationEngine`** - Type conversion logic
3. **`ValidationEngine`** - Business rule validation
4. **`RejectionHandler`** - Invalid row management
5. **`StagingTableLoader`** - Database loading with upsert
6. **`RawQueryBuilder`** - SQL query generation

### Supporting Infrastructure

- Uses **shared components**: `DatabasePool`, `BatchLoader`
- Leverages existing `ErrorHandler` from raw-loader

## 🚀 Usage

### Basic Example

```typescript
import {
  StagingTransformerContainer,
  type StagingExtractHandler,
  ColumnType,
} from "./services/staging-transformer";

// Create service
const transformer = StagingTransformerContainer.create({
  transformation: {
    batchSize: 1000,
    enableTypeCoercion: true,
  },
  validation: {
    enableValidation: true,
    rejectInvalidRows: true,
  },
});

// Define transformation handler
const patientHandler: StagingExtractHandler = {
  extractType: "Patient",
  sourceTable: "raw.patients",
  targetTable: "stg.patients",
  naturalKeys: ["patient_id", "practice_id", "per_org_id"],
  transformations: [
    {
      sourceColumn: "patient_id",
      targetColumn: "patient_id",
      targetType: ColumnType.TEXT,
      required: true,
    },
    {
      sourceColumn: "dob",
      targetColumn: "dob",
      targetType: ColumnType.DATE,
      required: false,
    },
    {
      sourceColumn: "is_active",
      targetColumn: "is_active",
      targetType: ColumnType.BOOLEAN,
      required: false,
      defaultValue: true,
    },
  ],
};

// Transform
const result = await transformer.transformExtract(patientHandler, {
  loadRunId: "123e4567-e89b-12d3-a456-426614174000",
});

console.log(`Transformed: ${result.totalRowsTransformed}`);
console.log(`Rejected: ${result.totalRowsRejected}`);
```

### With Custom Validation

```typescript
import { ValidationRuleBuilders } from "./services/staging-transformer";

const patientHandler: StagingExtractHandler = {
  // ... other config
  transformations: [
    {
      sourceColumn: "nhi_number",
      targetColumn: "nhi_number",
      targetType: ColumnType.TEXT,
      required: false,
      validationRules: [
        ValidationRuleBuilders.nhiFormat("nhi_number"),
        ValidationRuleBuilders.length("nhi_number", 7, 7),
      ],
    },
    {
      sourceColumn: "email",
      targetColumn: "email",
      targetType: ColumnType.TEXT,
      required: false,
      validationRules: [ValidationRuleBuilders.email("email")],
    },
  ],
};
```

### With Custom Transformation

```typescript
const handler: StagingExtractHandler = {
  // ... other config
  transformations: [
    {
      sourceColumn: "full_name",
      targetColumn: "full_name",
      targetType: ColumnType.TEXT,
      required: true,
      transformFunction: (value) => {
        // Custom transformation: uppercase
        return String(value).toUpperCase();
      },
    },
  ],
};
```

### With Upsert

```typescript
const result = await transformer.transformExtract(patientHandler, {
  loadRunId: "...",
  upsertMode: true, // Enable upsert
  conflictColumns: ["patient_id", "practice_id"], // ON CONFLICT columns
});
```

## 🔧 Configuration

### Default Configuration

```typescript
const config: StagingTransformerConfig = {
  transformation: {
    batchSize: 1000,
    maxConcurrentTransforms: 3,
    enableTypeCoercion: true,
    dateFormat: "YYYY-MM-DD",
    trimStrings: true,
    nullifyEmptyStrings: true,
  },
  validation: {
    enableValidation: true,
    failOnValidationError: false,
    maxErrorsPerBatch: 100,
    maxTotalErrors: 1000,
    rejectInvalidRows: true,
  },
  errorHandling: {
    continueOnError: true,
    maxRetries: 3,
    captureRawRow: true,
  },
};
```

### Override Configuration

```typescript
const transformer = StagingTransformerContainer.create({
  transformation: {
    batchSize: 500, // Smaller batches
    enableTypeCoercion: false, // Strict typing
  },
  validation: {
    failOnValidationError: true, // Fail fast
  },
});
```

## 📊 Type Conversions

Supported type transformations:

| Target Type | Source Examples                  | Output                |
| ----------- | -------------------------------- | --------------------- |
| `TEXT`      | Any value                        | String                |
| `INTEGER`   | "123", "456.78"                  | 123, 456              |
| `DECIMAL`   | "123.45", "99.9"                 | 123.45, 99.9          |
| `BOOLEAN`   | "true", "1", "yes", "false", "0" | true, false           |
| `DATE`      | "2024-01-15", "2024/01/15"       | Date object           |
| `TIMESTAMP` | "2024-01-15 10:30:00"            | Date object           |
| `UUID`      | "123e4567-e89b-12d3-..."         | UUID string           |
| `JSON`      | '{"key": "value"}'               | Parsed JSON object    |

### Automatic Type Coercion

When `enableTypeCoercion: true`:

- Strings are trimmed
- Empty strings → `NULL`
- Common boolean representations handled
- Flexible date parsing

## ✅ Validation Rules

### Built-in Validators

```typescript
// Required field
ValidationRuleBuilders.required("field_name");

// Pattern matching
ValidationRuleBuilders.pattern("nhi_number", /^[A-Z]{3}\d{4}$/, "NHI format");

// Numeric range
ValidationRuleBuilders.range("age", 0, 150);

// Enum values
ValidationRuleBuilders.enum("status", ["active", "inactive", "pending"]);

// String length
ValidationRuleBuilders.length("postal_code", 4, 10);

// NHI format (NZ-specific)
ValidationRuleBuilders.nhiFormat("nhi_number");

// Email
ValidationRuleBuilders.email("email_address");
```

### Custom Validators

```typescript
const customRule: ValidationRule = {
  name: "future_date",
  type: "custom",
  validator: (value) => {
    if (!value) return true;
    return new Date(value) > new Date();
  },
  errorMessage: "Date must be in the future",
  severity: "error",
};
```

## 🚫 Rejection Handling

### Rejection Table Schema

Invalid rows are stored in `etl.staging_rejections`:

```sql
CREATE TABLE etl.staging_rejections (
  rejection_id SERIAL PRIMARY KEY,
  load_run_id UUID NOT NULL,
  extract_type TEXT NOT NULL,
  row_number INTEGER,
  source_row_id TEXT,
  rejection_reason TEXT NOT NULL,
  validation_failures JSONB,
  raw_data JSONB,
  rejected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Analyzing Rejections

```typescript
// Get rejection summary
const summary = rejectionHandler.buildRejectionSummary(result.rejections);

console.log(`Total rejections: ${summary.totalRejections}`);
console.log("Top reasons:", summary.topReasons);
console.log("By column:", summary.byColumn);
```

### Querying Rejections

```sql
-- Get recent rejections
SELECT *
FROM etl.staging_rejections
WHERE extract_type = 'Patient'
  AND rejected_at > NOW() - INTERVAL '1 day'
ORDER BY rejected_at DESC
LIMIT 100;

-- Group by rejection reason
SELECT rejection_reason, COUNT(*)
FROM etl.staging_rejections
WHERE load_run_id = '...'
GROUP BY rejection_reason
ORDER BY COUNT(*) DESC;
```

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                StagingTransformerService                   │
│                  (Main Orchestrator)                       │
└─────┬──────────────────┬─────────────────┬────────────────┘
      │                  │                 │
      ▼                  ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│RawQuery     │  │Transformation│  │ Validation  │
│Builder      │  │Engine        │  │ Engine      │
│             │  │              │  │             │
│• SQL queries│  │• Type conv   │  │• Rules      │
│• Pagination │  │• Coercion    │  │• Thresholds │
└─────────────┘  └──────────────┘  └─────────────┘
      │                  │                 │
      │                  ▼                 │
      │          ┌──────────────┐          │
      │          │  Rejection   │          │
      │          │  Handler     │          │
      │          │              │          │
      │          │• Store       │          │
      │          │• Analyze     │          │
      │          └──────────────┘          │
      │                                    │
      ▼                                    ▼
┌─────────────────────────────────────────────────┐
│         StagingTableLoader                      │
│         (Uses BatchLoader)                      │
│                                                 │
│ • Upsert logic                                  │
│ • Lineage embedding                             │
│ • Conflict resolution                           │
└─────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│           Shared Infrastructure                 │
│                                                 │
│ • DatabasePool                                  │
│ • BatchLoader                                   │
│ • ErrorHandler                                  │
└─────────────────────────────────────────────────┘
```

## 📝 Best Practices

### 1. Define Clear Transformations

```typescript
// Good: Explicit transformations
const transformations: ColumnTransformation[] = [
  {
    sourceColumn: "patient_id",
    targetColumn: "patient_id",
    targetType: ColumnType.TEXT,
    required: true,
  },
  // ... all columns explicitly defined
];

// Bad: Assuming defaults
// Missing transformations will cause issues
```

### 2. Use Appropriate Validation

```typescript
// Good: Validate critical fields
{
  sourceColumn: "nhi_number",
  validationRules: [
    ValidationRuleBuilders.required("nhi_number"),
    ValidationRuleBuilders.nhiFormat("nhi_number"),
  ],
}

// Good: Skip validation for non-critical fields
{
  sourceColumn: "notes",
  targetType: ColumnType.TEXT,
  validationRules: [], // No validation needed
}
```

### 3. Handle Natural Keys Properly

```typescript
// Good: Define natural keys for upsert
const handler: StagingExtractHandler = {
  naturalKeys: ["patient_id", "practice_id", "per_org_id"],
  // These will be used for ON CONFLICT resolution
};
```

### 4. Monitor Rejection Rates

```typescript
const result = await transformer.transformExtract(handler, options);

const rejectionRate =
  (result.totalRowsRejected / result.totalRowsRead) * 100;

if (rejectionRate > 5) {
  console.warn(
    `⚠️ High rejection rate: ${rejectionRate.toFixed(2)}%`
  );
  // Investigate rejections
}
```

### 5. Batch Size Tuning

```typescript
// For wide tables (many columns)
const transformer = StagingTransformerContainer.create({
  transformation: {
    batchSize: 500, // Smaller batches
  },
});

// For narrow tables (few columns)
const transformer = StagingTransformerContainer.create({
  transformation: {
    batchSize: 5000, // Larger batches
  },
});
```

## 🧪 Testing

Example test structure:

```typescript
import { StagingTransformerContainer } from "./staging-transformer";

describe("StagingTransformerService", () => {
  it("should transform valid rows", async () => {
    const transformer = StagingTransformerContainer.create({
      /* test config */
    });

    const result = await transformer.transformExtract(handler, options);

    expect(result.totalRowsTransformed).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid rows", async () => {
    // Test rejection handling
  });

  it("should handle upserts", async () => {
    // Test upsert logic
  });
});
```

## 📚 Related Documentation

- [Staging Transformer Plan](../../../docs/development/c-phase-1-staging-transformer.md)
- [ETL Architecture](../../../docs/etl/etl-guide.md)
- [Schema Guide](../../../docs/schema/schema-guide.md)
- [Shared Services](../shared/README.md)
- [Raw Loader Service](../raw-loader/README.md)

