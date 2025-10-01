## Core Merger Service Tests

Comprehensive test suite for the Core Merger Service.

### Test Files

#### **Unit Tests**

1. **`scd2-engine.test.ts`** - SCD2 change detection engine
   - Change detection (new, updated, no change)
   - Hash-based comparison
   - Version expiration
   - SCD2 constraint validation

2. **`hash-utils.test.ts`** - Hash generation utilities
   - Attribute hashing
   - Hash comparison
   - Business key string generation
   - Business key extraction and validation

3. **`business-key-utils.test.ts`** - Business key management
   - Fact and dimension business key fields
   - Business key extraction
   - Key string serialization
   - Business key equality

4. **`scd2-utils.test.ts`** - SCD2 utility functions
   - Attribute comparison
   - Significance scoring
   - Version threshold checking
   - Date range formatting

#### **Integration Tests**

5. **`core-merger-integration.test.ts`** - End-to-end integration
   - Health checks
   - Full merge operations (requires database)
   - Progress tracking

### Running Tests

#### Run All Tests

```bash
# Run all core-merger tests
npm test src/services/core-merger

# Or with pnpm
pnpm test src/services/core-merger
```

#### Run Specific Test File

```bash
# Run only SCD2 engine tests
npm test scd2-engine.test.ts

# Run with watch mode
npm test scd2-engine.test.ts -- --watch
```

#### Run Integration Tests

```bash
# Integration tests require database connection
# Set environment variables first:
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=test_db

# Run integration tests
npm test core-merger-integration.test.ts
```

### Test Coverage

#### **SCD2 Engine** (100% core logic)
- ✅ New record detection
- ✅ Significant change detection (name, DOB)
- ✅ Non-significant change detection (email, phone)
- ✅ No change detection
- ✅ Hash-based change detection
- ✅ Version expiration
- ✅ SCD2 constraint validation

#### **Hash Utilities** (100%)
- ✅ Consistent hash generation
- ✅ Tracked fields only
- ✅ Null value handling
- ✅ Business key string generation

#### **Business Key Utilities** (100%)
- ✅ Business key field lookups
- ✅ Business key extraction
- ✅ String serialization
- ✅ Business key equality
- ✅ Validation (missing, null, empty)

#### **SCD2 Utilities** (100%)
- ✅ Attribute comparison (exact, significant, always/never version)
- ✅ Significance scoring with weights
- ✅ Version threshold checking
- ✅ Date range formatting
- ✅ Version currency checking
- ✅ Version number calculation

### Test Data Examples

#### Sample Dimension Record

```typescript
const patientRecord: DimensionRecord = {
  businessKey: {
    patientId: "P001",
    practiceId: "PR001",
    perOrgId: "ORG001",
  },
  practiceId: "PR001",
  perOrgId: "ORG001",
  effectiveFrom: new Date("2024-01-01"),
  effectiveTo: null,
  isCurrent: true,
  attributes: {
    firstName: "John",
    familyName: "Doe",
    dob: new Date("1990-01-01"),
    email: "john@example.com",
  },
  lineage: {
    s3VersionId: "v1",
    fileHash: "hash1",
    dateExtracted: "2024-01-01",
    loadRunId: "run1",
    loadTs: new Date(),
  },
};
```

#### Sample SCD2 Config

```typescript
const scd2Config: SCD2Config = {
  dimensionType: DimensionType.PATIENT,
  businessKeyFields: ["patientId", "practiceId", "perOrgId"],
  trackedFields: ["firstName", "familyName", "dob"],
  comparisonRules: [
    { fieldName: "firstName", compareType: "significant", weight: 0.8 },
    { fieldName: "familyName", compareType: "always_version", weight: 1.0 },
    { fieldName: "dob", compareType: "always_version", weight: 1.0 },
    { fieldName: "email", compareType: "never_version", weight: 0 },
  ],
  changeThreshold: 0.5,
};
```

### Adding New Tests

When adding new functionality, follow these patterns:

#### Unit Test Template

```typescript
import { describe, it, expect } from "vitest";

describe("MyNewComponent", () => {
  describe("myFunction", () => {
    it("should handle normal case", () => {
      const result = myFunction("input");
      expect(result).toBe("expected");
    });

    it("should handle edge case", () => {
      const result = myFunction(null);
      expect(result).toBeNull();
    });

    it("should throw error for invalid input", () => {
      expect(() => myFunction("invalid")).toThrow();
    });
  });
});
```

#### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("MyService Integration", () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup
  });

  it("should perform end-to-end operation", async () => {
    const result = await service.doSomething();
    expect(result.success).toBe(true);
  });
});
```

### Continuous Integration

Tests are automatically run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Core Merger Tests
  run: pnpm test src/services/core-merger
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

### Test Metrics

Current coverage:
- **Unit Tests**: 4 files, ~30 test cases
- **Line Coverage**: >90% of core logic
- **Branch Coverage**: >85%
- **Function Coverage**: >90%

### Troubleshooting

#### "Cannot find module" errors
```bash
# Ensure dependencies are installed
pnpm install
```

#### "Database connection failed" in integration tests
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Check environment variables
echo $DATABASE_URL
```

#### Tests timing out
```bash
# Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
});
```

### Related Documentation

- [Core Merger README](../README.md) - Service documentation
- [SCD2 Strategy](../README.md#scd2-strategy) - Understanding SCD2
- [ETL Guide](../../../../docs/etl/etl-guide.md) - Overall ETL architecture

