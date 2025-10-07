It has quickly become complex. I'm now thinking it would be much simpler for me to just handle the raw load and then the raw load to staging. and then I just create some foreign key connections if any and then I just leave the merge to Koa later. This way I could use the staging tables now for some basic reporting. This is my ideas at the moment, can you please advise and help me make the best decision? # Patient Extract Type ETL Pipeline Audit & Implementation Plan

**Date:** October 6, 2025
**Focus:** Complete Patient extract type implementation across all ETL stages
**Goal:** Create a fully functional end-to-end Patient data pipeline as a reference implementation

## Executive Summary

The Patient extract type is **94% complete** across the ETL pipeline but missing core fact handler implementation. Patient data serves as the foundation for most healthcare analytics, making this an ideal candidate for a complete reference implementation.

## Current Status Analysis

### ✅ Completed Components

| Stage | Component | Status | Location | Notes |
|-------|-----------|--------|----------|--------|
| **Raw Loading** | Schema | ✅ Complete | `src/db/schema/raw/patients.ts` | 263+ columns, all text |
| | Handler | ✅ Complete | `src/services/raw-loader/handlers/patients-schema-handler.ts` | CSV parsing, validation |
| **Staging Transform** | Schema | ✅ Complete | `src/db/schema/stg/patients.ts` | Typed columns, camelCase |
| | Config | ✅ Complete | `src/services/staging-transformer/configs/patients-transformations.ts` | Type conversions, validation |
| | Handler | ✅ Complete | Registered in `StagingHandlerFactory` | Upsert logic, rejections |
| **Core Merging** | Dimension Handler | ✅ Complete | `src/services/core-merger/dimension/handlers/patient-dimension-handler.ts` | SCD2 patient history |
| **ETL Audit** | Lineage | ✅ Complete | `etl.load_runs`, `etl.lineage` | Full audit trail |

### ❌ Missing Components

| Stage | Component | Status | Impact | Priority |
|-------|-----------|--------|--------|----------|
| **Core Merging** | Fact Handler | ❌ Missing | Patient events not tracked | HIGH |

## Gap Analysis

### What Patient Fact Events Should Exist?

Based on the raw data schema and healthcare domain, Patient extract type should generate facts for:

1. **Patient Registration Events**
   - Enrollment date changes
   - Status transitions (active/inactive)
   - Demographic updates

2. **Patient Status Changes**
   - Enrollment status changes
   - Address changes
   - Contact information updates

3. **Patient Lifecycle Events**
   - New patient registrations
   - Patient deactivation/reactivation
   - Significant demographic changes

## Implementation Plan

### Phase 1: Core Patient Fact Handler (Priority 1)

#### Step 1.1: Analyze Patient Fact Requirements
**Goal:** Define what patient-related facts need to be tracked
**Deliverables:**
- Patient fact schema design
- Fact identification logic
- Business rules for fact generation

**Key Facts to Track:**
```typescript
// Patient status change facts
{
  fact_type: "patient_status_change",
  patient_id: string,
  old_status: "active" | "inactive",
  new_status: "active" | "inactive",
  change_reason?: string,
  effective_date: Date
}

// Patient enrollment facts
{
  fact_type: "patient_enrollment",
  patient_id: string,
  enrollment_date: Date,
  enrollment_type: string,
  enrollment_status: string
}

// Patient demographic update facts
{
  fact_type: "patient_demographic_update",
  patient_id: string,
  field_changed: "address" | "contact" | "ethnicity",
  old_value?: string,
  new_value?: string,
  update_date: Date
}
```

#### Step 1.2: Create Patient Fact Handler
**Location:** `src/services/core-merger/fact/handlers/patient-fact-handler.ts`
**Extends:** `BaseFactHandler`

**Key Responsibilities:**
- Read from `stg.patients` table
- Identify fact-worthy events from patient data
- Generate surrogate keys for facts
- Handle SCD2 dimension relationships
- Insert facts into `core.fact_patients`

#### Step 1.3: Define Patient Fact Schema
**Location:** `src/db/schema/core/facts.ts` (extend existing)
**Add:**
```typescript
export const patientFacts = createTable("core.fact_patients", {
  // Surrogate key
  patient_fact_id: bigserial("patient_fact_id", { mode: "number" }).primaryKey(),

  // Natural keys
  patient_id: text("patient_id").notNull(),
  practice_id: text("practice_id").notNull(),

  // Dimension foreign keys (resolved)
  patient_key: bigint("patient_key", { mode: "number" }).references(() => patientDimensions.patient_key),
  practice_key: bigint("practice_key", { mode: "number" }).references(() => practiceDimensions.practice_key),

  // Fact attributes
  fact_type: text("fact_type").notNull(), // "registration", "status_change", "update"
  effective_date: date("effective_date").notNull(),
  fact_date: date("fact_date").notNull(),

  // Fact-specific data
  old_value: jsonb("old_value"),
  new_value: jsonb("new_value"),
  change_reason: text("change_reason"),

  // SCD2 tracking
  is_current: boolean("is_current").notNull().default(true),
  valid_from: timestamp("valid_from").notNull().defaultNow(),
  valid_to: timestamp("valid_to"),

  // Audit
  load_run_id: uuid("load_run_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
```

#### Step 1.4: Implement Fact Detection Logic
**Business Rules:**
1. **New Patient Registration**: First time patient appears
2. **Status Changes**: `is_active` transitions
3. **Enrollment Changes**: `enrolment_status` or `enrolment_date` changes
4. **Demographic Updates**: Significant field changes (address, ethnicity, etc.)

**Detection Strategy:**
```typescript
interface PatientFactDetector {
  detectNewRegistrations(currentPatients: PatientRow[], existingPatients: PatientRow[]): PatientFact[];
  detectStatusChanges(currentPatients: PatientRow[], previousPatients: PatientRow[]): PatientFact[];
  detectDemographicChanges(currentPatients: PatientRow[], previousPatients: PatientRow[]): PatientFact[];
}
```

### Phase 2: Integration Testing (Priority 2)

#### Step 2.1: End-to-End Patient Pipeline Test
**Goal:** Verify complete Patient data flow from CSV to core facts
**Test Coverage:**
- Raw loading → Staging transform → Core merge
- Fact generation accuracy
- Dimension-fact relationships
- SCD2 behavior

#### Step 2.2: Business Logic Validation
**Test Scenarios:**
- New patient registration generates fact
- Patient status change creates status_change fact
- Address update generates demographic_update fact
- Multiple practice patients handled correctly

### Phase 3: Performance & Monitoring (Priority 3)

#### Step 3.1: Patient Handler Performance Optimization
- Batch processing for large patient datasets
- Memory-efficient fact generation
- Parallel processing where possible

#### Step 3.2: Monitoring Integration
- Patient-specific metrics in load monitoring
- Fact generation statistics
- Error tracking and alerting

## Implementation Dependencies

### Required Components
1. **Core Merger Framework**: Must exist for fact handler integration
2. **Patient Dimension Handler**: Must be functional for foreign key resolution
3. **Practice Dimension Handler**: Must exist for practice relationships

### Data Flow Dependencies
```
stg.patients → patient_dimension_handler → core.dim_patients (patient_key)
stg.practice_info → practice_dimension_handler → core.dim_practices (practice_key)
stg.patients + dimension_keys → patient_fact_handler → core.fact_patients
```

## Success Criteria

### Functional Completeness
- [ ] Patient fact handler processes all patient records
- [ ] All fact types (registration, status_change, demographic_update) generated
- [ ] Foreign key relationships correctly resolved
- [ ] SCD2 history properly maintained

### Data Quality
- [ ] No duplicate facts for same business event
- [ ] Fact dates accurately reflect business events
- [ ] All required fields populated
- [ ] Referential integrity maintained

### Performance
- [ ] Processes 10,000+ patients within 5 minutes
- [ ] Memory usage stays within reasonable bounds
- [ ] Error handling doesn't break pipeline flow

### Integration
- [ ] Works with existing ETL pipeline orchestration
- [ ] Proper error propagation and logging
- [ ] Monitoring and alerting integration

## Risk Assessment

### High Risk
- **Fact Duplication**: Complex detection logic could create duplicate facts
- **Foreign Key Resolution**: Dependency on dimension handlers working correctly
- **Performance**: Patient data volumes could be large

### Mitigation Strategies
- Comprehensive testing with realistic data volumes
- Incremental fact detection with deduplication logic
- Performance profiling and optimization
- Fallback error handling for dimension resolution failures

## Implementation Timeline

### Week 1: Core Fact Handler
- Day 1-2: Design patient fact schema and detection logic
- Day 3-4: Implement PatientFactHandler class
- Day 5: Unit tests and basic integration

### Week 2: Integration & Testing
- Day 1-2: End-to-end pipeline testing
- Day 3-4: Business logic validation
- Day 5: Performance testing and optimization

### Week 3: Production Readiness
- Day 1-2: Error handling and monitoring
- Day 3-4: Documentation and deployment preparation
- Day 5: Final validation and sign-off

## Next Steps

1. **Immediate Action**: Review and approve this implementation plan
2. **Start Implementation**: Begin with Phase 1, Step 1.1 (Patient Fact Requirements Analysis)
3. **Weekly Checkpoints**: Review progress and adjust plan as needed
4. **Documentation**: Update audit.md and architecture docs as implementation progresses

## Questions for Clarification

1. **Fact Granularity**: Should we track all patient field changes, or only significant ones?
2. **Fact Retention**: How long should patient facts be retained?
3. **Fact Types**: Are the proposed fact types comprehensive for business needs?
4. **Performance Requirements**: What are the target processing times for patient data?

---

**Approval Required:** Implementation plan review and approval before proceeding to Phase 1.

