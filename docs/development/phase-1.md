# Phase 1 Development Plan - Poutiri Indici Ingest Service

## 🎯 **Phase 1 Objectives**

Build a **Minimum Viable Product (MVP)** ETL service that can:

- Discover and process Indici CSV files from S3
- Load data through the 4-layer architecture (Raw → Staging → Core → ETL)
- Handle the 5 highest-priority extract types
- Provide basic monitoring and health checks
- Support idempotent operations

## 📊 **Current State Analysis**

**✅ Completed:**

- Database schema (raw/staging/core/ETL layers) - 100%
- Database tables generated - 100%
- Project structure and tooling setup - 100%

**🔄 Needs Development:**

- ETL service implementation - 0%
- S3 integration - 0%
- Data transformation logic - 0%
- Monitoring and health checks - 0%

## 🏗️ **Phase 1 Architecture**

### Core Components to Build:

1. **S3 Discovery Service** - Find and parse Indici files
2. **Raw Loader** - Stream CSV data directly to raw tables
3. **Staging Transformer** - Apply type conversion and validation
4. **Core Merger** - Load dimensions and facts with SCD2 logic
5. **Audit Manager** - Track loads and maintain ETL metadata
6. **Health Monitor** - Basic system monitoring

### Priority Extract Types (Phase 1):

1. **Patients** - Core business entity
2. **Appointments** - High-volume business events
3. **Providers** - Essential for relationships
4. **Practice Info** - Practice-level metadata
5. **Invoices** - Financial data

## 📋 **Detailed Implementation Plan**

### **Week 1: Foundation & S3 Integration**

#### Day 1-2: Project Setup & S3 Discovery

- [ ] Set up AWS SDK integration
- [ ] Create S3 client with proper credentials
- [ ] Implement file discovery service
  - Parse filename convention: `685146545<ExtractType>_<DateFrom>_<DateTo>_<DateExtracted>`
  - Group files by `DateExtracted` batch
  - Support both full and delta file types
- [ ] Create basic configuration management
- [ ] Set up logging infrastructure

#### Day 3-4: Raw Layer Implementation

- [ ] Create CSV streaming parser
  - Handle custom separators (`|~~|` field, `|^^|` row)
  - Support headerless CSV format
  - Apply column names from documentation
- [ ] Implement raw table loaders
- [ ] Add file hash calculation and S3 version tracking
- [ ] Create idempotency checks (prevent duplicate processing)

#### Day 5: Testing & Validation

- [ ] Unit tests for S3 discovery
- [ ] Integration tests with sample CSV files
- [ ] Validate raw data loading
- [ ] Error handling and logging

### **Week 2: Staging Layer & Data Quality**

#### Day 1-2: Staging Transformation Engine

- [ ] Create type conversion utilities
  - Text to Date/Timestamp (handle various formats)
  - Text to Integer/Decimal with validation
  - Boolean conversion from text
  - NULL handling for empty strings
- [ ] Implement enum mapping system
- [ ] Add data validation framework
  - Required field validation
  - Format validation (NHI numbers, dates, etc.)
  - Range checks for numeric fields

#### Day 3-4: Priority Extract Transformations

- [ ] **Patients**: Implement full staging transformation
- [ ] **Appointments**: Handle appointment status mapping
- [ ] **Providers**: Provider role and credential validation
- [ ] **Practice Info**: Practice metadata validation
- [ ] **Invoices**: Financial data validation and formatting

#### Day 5: Data Quality & Rejection Handling

- [ ] Create rejection tracking system
- [ ] Implement DQ threshold checking
- [ ] Add data quality metrics collection
- [ ] Testing and validation

### **Week 3: Core Layer & SCD2 Implementation**

#### Day 1-2: SCD2 Dimension Management

- [ ] Create SCD2 utility functions
  - Compare dimension attributes
  - Handle effective date management
  - Manage current/historical flags
- [ ] Implement dimension loaders:
  - **Patient** dimension with SCD2
  - **Provider** dimension with SCD2
  - **Practice** dimension with SCD2

#### Day 3-4: Fact Table Loading

- [ ] Create fact table utilities
  - Foreign key resolution
  - Business key constraint handling
  - Upsert logic for existing records
- [ ] Implement fact loaders:
  - **Appointment** facts
  - **Invoice** facts

#### Day 5: Core Layer Integration

- [ ] Create dimension-first, facts-second loading orchestration
- [ ] Add referential integrity validation
- [ ] Testing with end-to-end data flow

### **Week 4: ETL Orchestration & Monitoring**

#### Day 1-2: ETL Orchestration

- [ ] Create load run management
- [ ] Implement file-level processing tracking
- [ ] Add load run status management
- [ ] Create batch processing coordination

#### Day 3-4: Health Monitoring & Observability

- [ ] Implement health check endpoints
- [ ] Add performance metrics collection
- [ ] Create basic alerting system
- [ ] Add operational logging

#### Day 5: Integration & Testing

- [ ] End-to-end testing with real data samples
- [ ] Performance testing and optimization
- [ ] Error scenario testing
- [ ] Documentation updates

## 🛠️ **Technical Implementation Details**

### **Technology Stack**

- **Runtime**: Node.js 18+ with TypeScript 5.9+
- **Database**: PostgreSQL with Drizzle ORM
- **AWS**: S3 SDK for file operations
- **Processing**: Stream-based CSV processing
- **Monitoring**: Custom health checks and metrics
- **Testing**: Vitest for unit and integration tests

### **Key Design Patterns**

- **Strategy Pattern**: Different transformation strategies per extract type
- **Pipeline Pattern**: Raw → Staging → Core data flow
- **Observer Pattern**: Event-driven monitoring and alerting
- **Repository Pattern**: Data access abstraction

### **Configuration Management**

```typescript
interface ETLConfig {
  s3: {
    bucket: string;
    region: string;
    prefix: string;
  };
  processing: {
    batchSize: number;
    maxConcurrency: number;
    maxRejectRate: number;
  };
  monitoring: {
    healthCheckInterval: number;
    alertThresholds: Record<string, number>;
  };
}
```

## 📈 **Success Criteria for Phase 1**

### **Functional Requirements**

- [ ] Successfully process all 5 priority extract types
- [ ] Handle both full and delta files
- [ ] Maintain data lineage and audit trails
- [ ] Support idempotent reprocessing
- [ ] Reject invalid data with proper tracking

### **Performance Requirements**

- [ ] Process typical file sizes (1K-100K rows) within 5 minutes
- [ ] Handle concurrent extract processing
- [ ] Maintain <5% rejection rate for clean data
- [ ] Support backfill operations

### **Quality Requirements**

- [ ] 100% test coverage for core transformation logic
- [ ] Comprehensive error handling and logging
- [ ] Data integrity validation across all layers
- [ ] Complete documentation of APIs and processes

## 🚨 **Risk Mitigation**

### **High-Risk Areas**

1. **CSV Parsing Complexity**: Custom separators and headerless format
   - _Mitigation_: Extensive testing with real data samples
2. **SCD2 Implementation**: Complex historical tracking logic
   - _Mitigation_: Start simple, iterative testing approach
3. **Data Quality Edge Cases**: Unexpected data formats
   - _Mitigation_: Configurable validation rules, comprehensive rejection tracking

### **Dependencies**

- AWS S3 access and credentials
- Sample data files for testing
- Database connection and permissions
- Understanding of business rules for each extract type

## 📅 **Timeline Summary**

- **Week 1**: S3 Integration & Raw Loading (Foundation)
- **Week 2**: Staging Transformation & Data Quality
- **Week 3**: Core Loading & SCD2 Implementation
- **Week 4**: Orchestration & Monitoring

**Total Duration**: 4 weeks for MVP
**Deliverable**: Production-ready ETL service for 5 priority extract types

## 🔄 **Phase 2 Preview**

After Phase 1 completion:

- Add remaining 13 extract types
- Implement advanced features (partitioning, performance optimization)
- Add comprehensive monitoring dashboard
- Implement automated scheduling
- Add data mart layers for analytics

## 📚 **Key Reference Files**

### **Project Requirements**

- [`docs/project-files/ingest-tool-requirements.md`](../project-files/ingest-tool-requirements.md) - Complete technical requirements
- [`docs/project-files/data-extract-Info.md`](../project-files/data-extract-Info.md) - CSV format and column specifications
- [`docs/project-files/preferred-tech-stack.md`](../project-files/preferred-tech-stack.md) - Technology preferences

### **Database Schema**

- [`docs/schema/schema-guide.md`](../schema/schema-guide.md) - Comprehensive schema documentation
- [`docs/schema/schema-coverage.md`](../schema/schema-coverage.md) - Implementation status tracker
- [`docs/schema/schema-todo.md`](../schema/schema-todo.md) - Remaining schema work
- [`src/db/schema/`](../../src/db/schema/) - Drizzle schema definitions

### **Database Layer Structure**

- [`src/db/schema/raw/`](../../src/db/schema/raw/) - Raw layer table definitions
- [`src/db/schema/stg/`](../../src/db/schema/stg/) - Staging layer table definitions
- [`src/db/schema/core/`](../../src/db/schema/core/) - Core layer dimensions and facts
- [`src/db/schema/etl/`](../../src/db/schema/etl/) - ETL audit and monitoring tables

### **ETL Documentation**

- [`docs/etl/etl-guide.md`](../etl/etl-guide.md) - ETL service architecture guide

### **Project Configuration**

- [`package.json`](../../package.json) - Dependencies and scripts
- [`tsconfig.json`](../../tsconfig.json) - TypeScript configuration
- [`drizzle.config.ts`](../../drizzle.config.ts) - Database configuration
- [`vitest.config.ts`](../../vitest.config.ts) - Testing configuration

### **Existing Source Code**

- [`src/index.ts`](../../src/index.ts) - Main entry point
- [`src/db/client.ts`](../../src/db/client.ts) - Database client setup
- [`src/utils/`](../../src/utils/) - Utility functions and helpers

### **Development Tools**

- [`eslint.config.js`](../../eslint.config.js) - Linting configuration
- [`README.md`](../../README.md) - Project setup and usage

## 🎯 **Implementation Priority Matrix**

### **Must Have (Week 1-2)**

1. S3 file discovery and CSV parsing
2. Raw layer loading with lineage tracking
3. Basic staging transformation for Patients and Appointments
4. Error handling and logging infrastructure

### **Should Have (Week 3)**

1. Complete staging transformations for all 5 priority extracts
2. SCD2 dimension loading (Patient, Provider, Practice)
3. Basic fact table loading (Appointments, Invoices)
4. Data quality validation and rejection tracking

### **Could Have (Week 4)**

1. Advanced monitoring and health checks
2. Performance optimization
3. Comprehensive test coverage
4. Operational documentation

### **Won't Have (Phase 1)**

1. Remaining 13 extract types
2. Advanced analytics features
3. Automated scheduling
4. Performance dashboards

---

**Status**: 📋 Planning Complete - Ready for Implementation
**Next Steps**: Begin Week 1 implementation starting with S3 integration and CSV parsing
**Review Date**: End of each week for progress assessment and plan adjustments
