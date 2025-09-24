# Phase 1 - Staging Transformer Implementation Plan

## 🎯 **Component Overview**

The **Staging Transformer** is responsible for transforming raw text data into properly typed and validated staging tables. It performs data quality validation, type conversion, and applies business rules before data reaches the core business logic layer.

### **Core Responsibilities**

- Transform raw text data to properly typed columns
- Apply data validation and quality checks
- Handle data type conversions (text to dates, numbers, booleans)
- Implement enum mapping and validation
- Route invalid data to rejection tables with detailed error tracking
- Maintain data lineage and audit trails
- Support all 18 Indici extract types with extract-specific transformations

---

## 📁 **Related Files**

### **Database Schema - Staging Layer**

- [`src/db/schema/stg/patients.ts`](../../src/db/schema/stg/patients.ts) - Staging patients table definition
- [`src/db/schema/stg/appointments.ts`](../../src/db/schema/stg/appointments.ts) - Staging appointments table definition
- [`src/db/schema/stg/providers.ts`](../../src/db/schema/stg/providers.ts) - Staging providers table definition
- [`src/db/schema/stg/practice_info.ts`](../../src/db/schema/stg/practice_info.ts) - Staging practice info table definition
- [`src/db/schema/stg/invoices.ts`](../../src/db/schema/stg/invoices.ts) - Staging invoices table definition
- [`src/db/schema/schemas.ts`](../../src/db/schema/schemas.ts) - Staging schema setup and configuration
- [`src/db/schema/shared/enums.ts`](../../src/db/schema/shared/enums.ts) - Extract type enums and mappings

### **Database Schema - ETL Layer**

- [`src/db/schema/etl/audit.ts`](../../src/db/schema/etl/audit.ts) - Load run and file tracking tables
- [`src/db/schema/etl/health.ts`](../../src/db/schema/etl/health.ts) - Health monitoring tables
- [`src/db/schema/etl/config.ts`](../../src/db/schema/etl/config.ts) - Configuration and thresholds tables

### **Utilities**

- [`src/utils/create-table.ts`](../../src/utils/create-table.ts) - Database table creation utilities
- [`src/utils/logger.ts`](../../src/utils/logger.ts) - Logging utilities for transformation operations

### **Database Connection**

- [`src/db/client.ts`](../../src/db/client.ts) - Database client setup and configuration

### **Project Documentation**

- [`docs/project-files/data-extract-Info.md`](../project-files/data-extract-Info.md) - CSV format specifications and column definitions
- [`docs/schema/schema-guide.md`](../schema/schema-guide.md) - Comprehensive schema documentation
- [`docs/schema/schema-todo.md`](../schema/schema-todo.md) - Schema implementation tracking

---

## 📋 **Detailed Implementation Tasks**

### **Task 1: Data Type Conversion Engine**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create comprehensive type conversion utilities
- [ ] Implement date/timestamp parsing with multiple format support
- [ ] Add numeric conversion with validation and range checking
- [ ] Create boolean conversion from text values
- [ ] Handle NULL/empty string conversion logic

#### **Type Conversion System:**

```typescript
interface TypeConversionOptions {
  strictMode: boolean; // Fail on invalid conversions
  allowNulls: boolean; // Convert empty strings to NULL
  timezone: string; // Default timezone for dates
  dateFormats: string[]; // Supported date formats
  numericPrecision: number; // Decimal places for numbers
}

interface ConversionResult<T> {
  value: T | null;
  success: boolean;
  errorMessage?: string;
  originalValue: string;
}

class TypeConverter {
  async convertToDate(
    textValue: string,
    options: TypeConversionOptions
  ): Promise<ConversionResult<Date>>;

  async convertToTimestamp(
    textValue: string,
    options: TypeConversionOptions
  ): Promise<ConversionResult<Date>>;

  async convertToInteger(
    textValue: string,
    options: TypeConversionOptions
  ): Promise<ConversionResult<number>>;

  async convertToDecimal(
    textValue: string,
    options: TypeConversionOptions
  ): Promise<ConversionResult<number>>;

  async convertToBoolean(
    textValue: string,
    options: TypeConversionOptions
  ): Promise<ConversionResult<boolean>>;

  async convertToText(
    textValue: string,
    options: TypeConversionOptions
  ): Promise<ConversionResult<string>>;
}

interface FieldMapping {
  rawColumnName: string;
  stagingColumnName: string;
  dataType: "text" | "integer" | "decimal" | "date" | "timestamp" | "boolean";
  required: boolean;
  nullable: boolean;
  defaultValue?: any;
  validationRules: ValidationRule[];
  transformationRules: TransformationRule[];
}
```

#### **Date/Time Parsing:**

```typescript
interface DateFormat {
  pattern: string;           // e.g., "YYYY-MM-DD HH:mm:ss"
  regex: RegExp;
  parser: (value: string) => Date;
  priority: number;          // 1 = highest priority
}

class DateParser {
  static readonly COMMON_FORMATS: DateFormat[] = [
    { pattern: "YYYY-MM-DD HH:mm:ss", regex: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, ... },
    { pattern: "DD/MM/YYYY HH:mm:ss", regex: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/, ... },
    { pattern: "YYYY-MM-DD", regex: /^\d{4}-\d{2}-\d{2}$/, ... },
    // Additional formats as needed
  ];

  async parseDate(
    textValue: string,
    formats?: DateFormat[]
  ): Promise<ConversionResult<Date>>;

  async parseTimestamp(
    textValue: string,
    timezone?: string
  ): Promise<ConversionResult<Date>>;
}
```

---

### **Task 2: Data Validation Framework**

**Duration**: 7 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create validation rule engine
- [ ] Implement field-level validation
- [ ] Add record-level validation
- [ ] Create validation result aggregation
- [ ] Support custom validation rules per extract type

#### **Validation System:**

```typescript
interface ValidationRule {
  ruleType: "required" | "format" | "range" | "enum" | "custom" | "cross_field";
  fieldName: string;
  validator: (value: any, record: Record<string, any>) => ValidationResult;
  errorMessage: string;
  severity: "error" | "warning" | "info";
  enabled: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  severity: "error" | "warning" | "info";
  ruleType: string;
  fieldName?: string;
  suggestedValue?: any;
}

interface ValidationSummary {
  totalFields: number;
  validFields: number;
  invalidFields: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  canProceed: boolean;
  rejectReason?: string;
}

class ValidationEngine {
  async validateRecord(
    record: Record<string, any>,
    rules: ValidationRule[]
  ): Promise<ValidationSummary>;

  async validateField(
    fieldName: string,
    value: any,
    rules: ValidationRule[]
  ): Promise<ValidationResult[]>;

  async applyBusinessRules(
    record: Record<string, any>,
    extractType: ExtractType
  ): Promise<ValidationResult[]>;
}

class ValidationRuleFactory {
  static createRequiredRule(fieldName: string): ValidationRule;
  static createFormatRule(fieldName: string, pattern: RegExp): ValidationRule;
  static createRangeRule(
    fieldName: string,
    min: number,
    max: number
  ): ValidationRule;
  static createEnumRule(
    fieldName: string,
    allowedValues: any[]
  ): ValidationRule;
  static createCustomRule(
    fieldName: string,
    validator: Function
  ): ValidationRule;
}
```

#### **Extract-Specific Validation:**

```typescript
class PatientsValidator {
  static readonly VALIDATION_RULES: ValidationRule[] = [
    {
      ruleType: 'required',
      fieldName: 'patient_id',
      validator: (value) => ({ isValid: !!value, errorMessage: 'Patient ID is required' }),
      ...
    },
    {
      ruleType: 'format',
      fieldName: 'nhi_number',
      validator: (value) => {
        const nhiPattern = /^[A-Z]{3}\d{4}$/; // Example NHI format
        return { isValid: nhiPattern.test(value || ''), errorMessage: 'Invalid NHI format' };
      },
      ...
    },
    // Additional patient-specific validation rules
  ];

  async validatePatientRecord(patient: Record<string, any>): Promise<ValidationSummary>;
}
```

---

### **Task 3: Enum Mapping and Normalization**

**Duration**: 5 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create enum mapping system for categorical data
- [ ] Implement lookup table management
- [ ] Add fuzzy matching for similar values
- [ ] Support enum validation and rejection
- [ ] Create enum value normalization

#### **Enum Mapping System:**

```typescript
interface EnumMapping {
  sourceValue: string;
  mappedValue: string;
  category: string; // e.g., 'appointment_status', 'gender'
  isActive: boolean;
  confidence: number; // 0-1 confidence score
  lastUsed: Date;
  usageCount: number;
}

interface EnumCategory {
  categoryName: string;
  description: string;
  allowedValues: string[];
  requiresExactMatch: boolean;
  fuzzyMatchThreshold: number;
  autoCreateNew: boolean;
}

class EnumMapper {
  async mapValue(
    sourceValue: string,
    category: string,
    options?: EnumMappingOptions
  ): Promise<MappingResult>;

  async getMapping(
    sourceValue: string,
    category: string
  ): Promise<EnumMapping | null>;

  async createMapping(
    sourceValue: string,
    mappedValue: string,
    category: string
  ): Promise<EnumMapping>;

  async getCategoryMappings(category: string): Promise<EnumMapping[]>;
  async validateEnumValue(value: string, category: string): Promise<boolean>;
}

interface MappingResult {
  mappedValue: string;
  confidence: number;
  wasExactMatch: boolean;
  wasAutoMapped: boolean;
  suggestions?: string[];
  shouldReject: boolean;
}

interface EnumMappingOptions {
  enableFuzzyMatching: boolean;
  fuzzyThreshold: number;
  autoCreateMappings: boolean;
  maxSuggestions: number;
}
```

#### **Common Enum Categories:**

```typescript
enum EnumCategories {
  APPOINTMENT_STATUS = "appointment_status",
  GENDER = "gender",
  MARITAL_STATUS = "marital_status",
  ETHNICITY = "ethnicity",
  PROVIDER_TYPE = "provider_type",
  PRACTICE_TYPE = "practice_type",
  APPOINTMENT_TYPE = "appointment_type",
  IMMUNISATION_STATUS = "immunisation_status",
  DIAGNOSIS_TYPE = "diagnosis_type",
  MEDICATION_STATUS = "medication_status",
}
```

---

### **Task 4: Rejection Handling System**

**Duration**: 4 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create rejection tracking and storage
- [ ] Implement rejection categorization
- [ ] Add rejection analysis and reporting
- [ ] Support rejection threshold management
- [ ] Create rejection recovery mechanisms

#### **Rejection Management:**

```typescript
interface RejectionRecord {
  rejectionId: string;
  extractType: ExtractType;
  loadRunId: string;
  s3Key: string;
  s3VersionId: string;
  fileHash: string;
  rowNumber: number;
  rawRowData: string; // Original CSV row for debugging
  rejectionReasons: RejectionReason[];
  rejectionCategory: RejectionCategory;
  severity: "low" | "medium" | "high" | "critical";
  canRecover: boolean;
  suggestedFix?: string;
  rejectedAt: Date;
}

interface RejectionReason {
  fieldName?: string;
  errorType: string;
  message: string;
  ruleName?: string;
  confidence: number;
}

enum RejectionCategory {
  DATA_QUALITY = "DATA_QUALITY",
  TYPE_CONVERSION = "TYPE_CONVERSION",
  MISSING_REQUIRED = "MISSING_REQUIRED",
  INVALID_FORMAT = "INVALID_FORMAT",
  BUSINESS_RULE = "BUSINESS_RULE",
  DUPLICATE_RECORD = "DUPLICATE_RECORD",
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

class RejectionHandler {
  async recordRejection(rejection: RejectionRecord): Promise<void>;

  async getRejectionsByLoadRun(loadRunId: string): Promise<RejectionRecord[]>;

  async getRejectionsByCategory(
    category: RejectionCategory,
    extractType?: ExtractType
  ): Promise<RejectionRecord[]>;

  async analyzeRejectionPatterns(
    extractType: ExtractType,
    timeRange?: { from: Date; to: Date }
  ): Promise<RejectionAnalysis>;

  async shouldRejectLoadRun(
    loadRunId: string,
    thresholds: RejectionThresholds
  ): Promise<boolean>;
}

interface RejectionThresholds {
  maxRejectionRate: number; // 0.05 = 5%
  maxCriticalRejections: number;
  maxBusinessRuleViolations: number;
  timeWindowMinutes: number;
}
```

---

### **Task 5: Transformation Pipeline Orchestrator**

**Duration**: 6 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Create transformation pipeline management
- [ ] Implement stage orchestration
- [ ] Add error recovery and rollback
- [ ] Support parallel processing of transformations
- [ ] Create transformation progress tracking

#### **Pipeline Architecture:**

```typescript
interface TransformationStage {
  stageName: string;
  order: number;
  required: boolean;
  processor: (record: Record<string, any>) => Promise<StageResult>;
  rollback?: (record: Record<string, any>) => Promise<void>;
}

interface StageResult {
  success: boolean;
  transformedRecord: Record<string, any>;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  metadata: Record<string, any>;
}

class TransformationPipeline {
  async processRecord(
    rawRecord: Record<string, any>,
    extractType: ExtractType,
    loadRunId: string
  ): Promise<PipelineResult>;

  async processBatch(
    rawRecords: Record<string, any>[],
    extractType: ExtractType,
    loadRunId: string
  ): Promise<BatchResult>;

  async addStage(stage: TransformationStage): Promise<void>;
  async removeStage(stageName: string): Promise<void>;
  async reorderStages(): Promise<void>;
  async validatePipeline(extractType: ExtractType): Promise<boolean>;
}

interface PipelineResult {
  stagingRecord: Record<string, any>;
  validationSummary: ValidationSummary;
  rejectionRecord?: RejectionRecord;
  lineageData: LineageData;
  processingTimeMs: number;
  stageResults: StageResult[];
}

interface BatchResult {
  successfulRecords: Record<string, any>[];
  rejectedRecords: RejectionRecord[];
  totalProcessed: number;
  totalSuccessful: number;
  totalRejected: number;
  batchProcessingTimeMs: number;
}
```

#### **Standard Pipeline Stages:**

```typescript
class StandardTransformationStages {
  static readonly TYPE_CONVERSION: TransformationStage = {
    stageName: "type_conversion",
    order: 1,
    required: true,
    processor: async (record) => {
      // Convert text to appropriate data types
      return await typeConverter.convertRecord(record);
    },
  };

  static readonly VALIDATION: TransformationStage = {
    stageName: "validation",
    order: 2,
    required: true,
    processor: async (record) => {
      // Apply validation rules
      return await validationEngine.validateRecord(record);
    },
  };

  static readonly ENUM_MAPPING: TransformationStage = {
    stageName: "enum_mapping",
    order: 3,
    required: true,
    processor: async (record) => {
      // Map categorical values to standard enums
      return await enumMapper.mapRecord(record);
    },
  };

  static readonly BUSINESS_RULES: TransformationStage = {
    stageName: "business_rules",
    order: 4,
    required: false,
    processor: async (record) => {
      // Apply extract-specific business rules
      return await businessRulesEngine.applyRules(record);
    },
  };

  static readonly LINEAGE: TransformationStage = {
    stageName: "lineage",
    order: 5,
    required: true,
    processor: async (record) => {
      // Add lineage and audit information
      return await lineageService.addLineageData(record);
    },
  };
}
```

---

### **Task 6: Extract-Specific Transformation Logic**

**Duration**: 8 hours
**Priority**: Must Have

#### **Subtasks:**

- [ ] Implement transformation logic for each extract type
- [ ] Create extract-specific validation rules
- [ ] Add business rule engines per extract
- [ ] Support custom transformation pipelines
- [ ] Enable extract-specific configuration

#### **Extract-Specific Transformers:**

```typescript
interface ExtractTransformer {
  extractType: ExtractType;
  fieldMappings: FieldMapping[];
  validationRules: ValidationRule[];
  businessRules: BusinessRule[];
  customTransformations: TransformationFunction[];
  rejectionThresholds: RejectionThresholds;
}

class PatientsTransformer implements ExtractTransformer {
  extractType = "patients";

  async transform(
    rawRecord: Record<string, any>
  ): Promise<TransformationResult> {
    // Patient-specific transformations
    const transformed = { ...rawRecord };

    // NHI number validation and formatting
    if (transformed.nhi_number) {
      transformed.nhi_number = this.normalizeNHINumber(transformed.nhi_number);
    }

    // Date of birth validation
    if (transformed.dob) {
      transformed.dob = await this.validateAndParseDate(transformed.dob);
    }

    // Age calculation if DOB and no age provided
    if (transformed.dob && !transformed.age) {
      transformed.age = this.calculateAge(transformed.dob);
    }

    return { success: true, transformedRecord: transformed };
  }

  private normalizeNHINumber(nhi: string): string {
    // NHI normalization logic
    return nhi.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  private async validateAndParseDate(dateStr: string): Promise<Date> {
    // Date validation and parsing logic
    return await dateParser.parse(dateStr);
  }

  private calculateAge(dob: Date): number {
    // Age calculation logic
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
}
```

---

### **Task 7: Quality Metrics and Monitoring**

**Duration**: 4 hours
**Priority**: Should Have

#### **Subtasks:**

- [ ] Implement data quality metrics collection
- [ ] Add transformation performance monitoring
- [ ] Create quality threshold management
- [ ] Support real-time quality reporting
- [ ] Add alerting for quality issues

#### **Quality Monitoring:**

```typescript
interface QualityMetrics {
  totalRecordsProcessed: number;
  successfulTransformations: number;
  failedTransformations: number;
  rejectionRate: number;
  averageProcessingTimeMs: number;
  typeConversionSuccessRate: number;
  validationSuccessRate: number;
  enumMappingSuccessRate: number;
  topRejectionReasons: RejectionReasonSummary[];
  qualityScore: number; // 0-100
}

interface RejectionReasonSummary {
  reason: string;
  count: number;
  percentage: number;
  trend: "increasing" | "decreasing" | "stable";
  severity: "low" | "medium" | "high";
}

class QualityMonitor {
  async collectMetrics(
    loadRunId: string,
    extractType: ExtractType
  ): Promise<QualityMetrics>;

  async updateQualityThresholds(
    extractType: ExtractType,
    thresholds: QualityThresholds
  ): Promise<void>;

  async generateQualityReport(
    extractType: ExtractType,
    timeRange: { from: Date; to: Date }
  ): Promise<QualityReport>;

  async shouldAlert(
    metrics: QualityMetrics,
    thresholds: QualityThresholds
  ): Promise<AlertRecommendation>;

  async getQualityTrend(
    extractType: ExtractType,
    days: number
  ): Promise<QualityTrend>;
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

- [ ] Type conversion functions with various input formats
- [ ] Validation rule engines with edge cases
- [ ] Enum mapping with fuzzy matching
- [ ] Rejection handling and categorization
- [ ] Individual extract transformers

### **Integration Tests**

- [ ] End-to-end transformation pipeline testing
- [ ] Batch processing with mixed quality data
- [ ] Rejection threshold testing
- [ ] Performance testing with large datasets
- [ ] Cross-extract type validation

### **Test Data Requirements**

- [ ] Sample data for each extract type with various quality levels
- [ ] Invalid data samples for rejection testing
- [ ] Edge cases (nulls, empty strings, malformed dates)
- [ ] Historical data for trend analysis

---

## 🏗️ **Implementation Architecture**

### **Core Classes and Structure**

```typescript
// Main service orchestrator
export class StagingTransformerService {
  private typeConverter: TypeConverter;
  private validationEngine: ValidationEngine;
  private enumMapper: EnumMapper;
  private rejectionHandler: RejectionHandler;
  private pipeline: TransformationPipeline;
  private qualityMonitor: QualityMonitor;

  async transformRecords(
    rawRecords: Record<string, any>[],
    extractType: ExtractType,
    loadRunId: string
  ): Promise<TransformationResult>;

  async transformFile(
    rawRecords: Record<string, any>[],
    extractType: ExtractType,
    loadRunId: string,
    options?: TransformationOptions
  ): Promise<FileTransformationResult>;
}

// Factory for creating extract-specific transformers
export class ExtractTransformerFactory {
  static getTransformer(extractType: ExtractType): ExtractTransformer;
}
```

### **File Structure**

```
src/services/staging-transformer/
├── index.ts                              # Main exports
├── StagingTransformerService.ts          # Main service class
├── TypeConverter.ts                      # Data type conversion
├── ValidationEngine.ts                   # Validation framework
├── EnumMapper.ts                         # Enum mapping system
├── RejectionHandler.ts                   # Rejection management
├── TransformationPipeline.ts             # Pipeline orchestration
├── QualityMonitor.ts                     # Quality monitoring
├── types/
│   ├── transformer.ts                    # Service types
│   ├── validation.ts                     # Validation types
│   ├── enums.ts                          # Enum types
│   └── quality.ts                        # Quality types
├── transformers/
│   ├── BaseExtractTransformer.ts         # Base transformer
│   ├── PatientsTransformer.ts            # Patients logic
│   ├── AppointmentsTransformer.ts         # Appointments logic
│   └── [Other extract transformers]
├── validation/
│   ├── ValidationRuleFactory.ts          # Rule creation
│   ├── BusinessRulesEngine.ts            # Business rules
│   └── ValidationUtils.ts                 # Utilities
├── utils/
│   ├── DateParser.ts                     # Date parsing
│   ├── DataQualityUtils.ts               # Quality utilities
│   └── PerformanceUtils.ts               # Performance utilities
└── __tests__/
    ├── unit/                             # Unit tests
    ├── integration/                      # Integration tests
    └── fixtures/                         # Test data
```

---

## 📊 **Performance Requirements**

### **Scalability Targets**

- **Small Batches (<1K records)**: Transform within 30 seconds
- **Medium Batches (1K-100K records)**: Transform within 5 minutes
- **Large Batches (100K+ records)**: Transform within 15 minutes
- **Concurrent Processing**: Handle up to 3 extract types simultaneously
- **Memory Usage**: Keep under 1GB for 100K record batches

### **Optimization Strategies**

- Streaming processing for large datasets
- Batch validation and transformation
- Caching of enum mappings and validation rules
- Parallel processing of independent records
- Intelligent error handling to avoid cascading failures

---

## ✅ **Success Criteria**

### **Functional Requirements**

- [ ] Successfully transform all 18 Indici extract types
- [ ] Handle all data type conversions accurately
- [ ] Maintain data quality through comprehensive validation
- [ ] Properly categorize and track all rejections
- [ ] Support extract-specific business rules and transformations

### **Non-Functional Requirements**

- [ ] Process 100K+ records within 15 minutes
- [ ] Maintain <5% rejection rate for clean data
- [ ] Provide detailed quality metrics and reporting
- [ ] Support resumable transformation processes
- [ ] Handle concurrent extract type processing

### **Integration Requirements**

- [ ] Receive raw data from Raw Loader component
- [ ] Provide transformed data to Core Merger
- [ ] Supply rejection data to Audit Manager
- [ ] Support monitoring by Health Monitor

---

## 🔄 **Integration Points**

### **Upstream Dependencies**

- **Raw Loader**: Provides raw text data for transformation
- **Configuration Service**: Supplies transformation rules and thresholds

### **Downstream Dependencies**

- **Core Merger**: Consumes validated and transformed staging data
- **Audit Manager**: Receives rejection records and quality metrics
- **Health Monitor**: Receives transformation status and quality indicators

---

## 📖 **Usage Examples**

### **Basic Transformation**

```typescript
const transformer = new StagingTransformerService();
const result = await transformer.transformRecords(
  rawRecords,
  "patients",
  loadRunId
);

console.log(`Transformed ${result.successfulRecords.length} records`);
console.log(`Rejected ${result.rejectedRecords.length} records`);
```

### **With Quality Monitoring**

```typescript
const result = await transformer.transformFile(
  rawRecords,
  "appointments",
  loadRunId,
  { enableQualityTracking: true }
);

if (result.qualityMetrics.rejectionRate > 0.05) {
  console.log("High rejection rate detected:", result.qualityMetrics);
}
```

### **Custom Transformation Pipeline**

```typescript
const customPipeline = new TransformationPipeline();
customPipeline.addStage(StandardTransformationStages.TYPE_CONVERSION);
customPipeline.addStage(new CustomValidationStage());
customPipeline.addStage(StandardTransformationStages.BUSINESS_RULES);

await transformer.setCustomPipeline("patients", customPipeline);
```

---

## 🚀 **Implementation Timeline**

### **Week 2 - Days 1-3 (20 hours total)**

- **Day 1 (7 hours)**:
  - Task 1: Data Type Conversion Engine (6 hours)
  - Task 2: Data Validation Framework (1 hour)

- **Day 2 (7 hours)**:
  - Task 2: Complete Data Validation Framework (4 hours)
  - Task 3: Enum Mapping and Normalization (3 hours)

- **Day 3 (6 hours)**:
  - Task 4: Rejection Handling System (4 hours)
  - Task 5: Transformation Pipeline Orchestrator (2 hours)

### **Remaining Tasks (12 hours)**

- Task 5: Complete Transformation Pipeline (2 hours)
- Task 6: Extract-Specific Transformation Logic (8 hours)
- Task 7: Quality Metrics and Monitoring (2 hours)

### **Optional Enhancements (8 hours)**

- Advanced quality analytics and trend analysis
- Machine learning-based data quality improvements
- Custom transformation rule engine
- Performance optimization and caching strategies

---

## 📅 **Next Steps**

1. **Review and approve** this implementation plan
2. **Begin implementation** with Task 1: Data Type Conversion Engine
3. **Move to Core Merger** implementation plan after completion
4. **Update progress** in phase-1.md as tasks are completed

**Status**: ✅ **Approved** - Ready for Implementation
**Start Date**: [Insert start date]
**Estimated Completion**: [Insert completion date]
**Owner**: [Insert owner name]
