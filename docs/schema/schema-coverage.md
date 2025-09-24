# Schema Coverage Status

## Overview

This document tracks the current implementation status of the database schema across all layers. It provides visibility into what's been completed, what's in progress, and what remains to be implemented.

**Last Updated**: December 2024
**Overall Progress**: ~65% Complete

## Layer-by-Layer Status

### 🔴 Raw Layer (Data Capture)

**Status**: ✅ **COMPLETE** (18/18 extracts)
**Coverage**: 100%

All source extract types have corresponding raw tables that capture data directly from CSV files with minimal processing.

| Extract                | Raw Table                     | Status | Notes    |
| ---------------------- | ----------------------------- | ------ | -------- |
| Allergies              | `raw.allergies`               | ✅     | Complete |
| AppointmentMedications | `raw.appointment_medications` | ✅     | Complete |
| Appointments           | `raw.appointments`            | ✅     | Complete |
| Diagnosis              | `raw.diagnoses`               | ✅     | Complete |
| Immunisation           | `raw.immunisations`           | ✅     | Complete |
| Inbox                  | `raw.inbox`                   | ✅     | Complete |
| InboxDetail            | `raw.inbox_detail`            | ✅     | Complete |
| InvoiceDetail          | `raw.invoice_detail`          | ✅     | Complete |
| Invoices               | `raw.invoices`                | ✅     | Complete |
| Measurements           | `raw.measurements`            | ✅     | Complete |
| Medicine               | `raw.medicine`                | ✅     | Complete |
| NextOfKin              | `raw.next_of_kin`             | ✅     | Complete |
| Patient                | `raw.patients`                | ✅     | Complete |
| PatientAlerts          | `raw.patient_alerts`          | ✅     | Complete |
| PracticeInfo           | `raw.practice_info`           | ✅     | Complete |
| Provider               | `raw.providers`               | ✅     | Complete |
| Recalls                | `raw.recalls`                 | ✅     | Complete |
| Vaccine                | `raw.vaccine`                 | ✅     | Complete |

**✅ All raw tables implemented** with proper lineage tracking (S3 metadata, file hashing, load tracking).

### 🟡 Staging Layer (Data Validation & Transformation)

**Status**: 🔄 **IN PROGRESS** (9/18 extracts)
**Coverage**: 50%

Staging tables apply type conversions, validation rules, and data quality constraints.

| Extract           | Staging Table        | Status | Priority   | Notes                       |
| ----------------- | -------------------- | ------ | ---------- | --------------------------- |
| **Patient**       | `stg.patients`       | ✅     | **HIGH**   | Core business entity        |
| **Appointments**  | `stg.appointments`   | ✅     | **HIGH**   | Core business entity        |
| **Immunisations** | `stg.immunisations`  | ✅     | **HIGH**   | Core business entity        |
| **Invoices**      | `stg.invoices`       | ✅     | **HIGH**   | Financial data              |
| **InvoiceDetail** | `stg.invoice_detail` | ✅     | **HIGH**   | Financial data              |
| **Providers**     | `stg.providers`      | ✅     | **HIGH**   | Essential for relationships |
| **PracticeInfo**  | `stg.practice_info`  | ✅     | **HIGH**   | Practice-level data         |
| **Diagnoses**     | `stg.diagnoses`      | ✅     | **MEDIUM** | Clinical data               |
| **Mappings**      | `stg.mappings`       | ✅     | **LOW**    | Reference data              |

#### Missing Staging Tables (9 remaining)

| Extract                    | Staging Table                 | Priority   | Complexity | Business Impact           |
| -------------------------- | ----------------------------- | ---------- | ---------- | ------------------------- |
| **Measurements**           | `stg.measurements`            | **HIGH**   | Medium     | Clinical analytics        |
| **Medicine**               | `stg.medicine`                | **HIGH**   | Low        | Reference data            |
| **Vaccine**                | `stg.vaccine`                 | **HIGH**   | Low        | Reference data            |
| **Allergies**              | `stg.allergies`               | **MEDIUM** | Medium     | Clinical data             |
| **AppointmentMedications** | `stg.appointment_medications` | **MEDIUM** | High       | Complex prescription data |
| **Recalls**                | `stg.recalls`                 | **MEDIUM** | Medium     | Patient tracking          |
| **PatientAlerts**          | `stg.patient_alerts`          | **MEDIUM** | Medium     | Clinical alerts           |
| **Inbox**                  | `stg.inbox`                   | **LOW**    | High       | Clinical messaging        |
| **InboxDetail**            | `stg.inbox_detail`            | **LOW**    | High       | Clinical messaging        |
| **NextOfKin**              | `stg.next_of_kin`             | **LOW**    | Medium     | Emergency contacts        |

### 🟢 Core Layer (Analytics Model)

**Status**: 🔄 **IN PROGRESS** (6/6 facts, 5/5 dimensions)
**Coverage**: ~85%

#### Dimensions (5/5) ✅ COMPLETE

All dimension tables implemented with SCD2 historical tracking:

| Dimension | Table           | SCD2 | Status | Notes                    |
| --------- | --------------- | ---- | ------ | ------------------------ |
| Patient   | `core.patient`  | ✅   | ✅     | Full SCD2 implementation |
| Provider  | `core.provider` | ✅   | ✅     | Full SCD2 implementation |
| Practice  | `core.practice` | ✅   | ✅     | Full SCD2 implementation |
| Medicine  | `core.medicine` | ✅   | ✅     | Full SCD2 implementation |
| Vaccine   | `core.vaccine`  | ✅   | ✅     | Full SCD2 implementation |

#### Facts (6/6) ✅ COMPLETE

All planned fact tables are implemented:

| Fact          | Table                      | Status | Grain              | Notes               |
| ------------- | -------------------------- | ------ | ------------------ | ------------------- |
| Appointments  | `core.fact_appointment`    | ✅     | Appointment-level  | Core business event |
| Immunisations | `core.fact_immunisation`   | ✅     | Immunisation-level | Clinical event      |
| Invoices      | `core.fact_invoice`        | ✅     | Invoice-level      | Financial event     |
| InvoiceDetail | `core.fact_invoice_detail` | ✅     | Line-item level    | Detailed financials |
| Diagnoses     | `core.fact_diagnosis`      | ✅     | Diagnosis-level    | Clinical event      |
| Measurements  | `core.fact_measurement`    | ✅     | Measurement-level  | Clinical data       |

**Note**: All fact tables have proper foreign key relationships to dimensions and include comprehensive lineage tracking.

### 🔵 ETL Layer (Audit & Operations)

**Status**: ✅ **COMPLETE** (2/2 components)
**Coverage**: 100%

All ETL operational tables are implemented:

| Component      | Table                | Status | Purpose                    | Notes                      |
| -------------- | -------------------- | ------ | -------------------------- | -------------------------- |
| Load Runs      | `etl.load_runs`      | ✅     | ETL execution tracking     | Complete audit trail       |
| Load Run Files | `etl.load_run_files` | ✅     | Individual file processing | Idempotency support        |
| Data Quality   | `etl.dq_results`     | ✅     | Validation metrics         | Configurable thresholds    |
| Health         | `etl.health`         | ✅     | System monitoring          | Per-extract health status  |
| Configuration  | `etl.config`         | ✅     | Runtime parameters         | Feature flags & thresholds |

## Implementation Priority Matrix

### Phase 1: Foundation (✅ Complete)

- **Raw Layer**: All 18 extract tables
- **Core Dimensions**: All 5 business entities with SCD2
- **Core Facts**: All 6 business event tables
- **ETL Infrastructure**: Complete audit and monitoring

### Phase 2: Essential Staging (🔄 In Progress)

**Priority**: HIGH - Required for production data processing

#### High Priority (Next 1-2 weeks)

1. **Measurements** (`stg.measurements`)
   - Clinical measurement data
   - Essential for healthcare analytics
   - Medium complexity (100+ fields)

2. **Medicine** (`stg.medicine`)
   - Medicine reference data
   - Needed for fact tables
   - Low complexity

3. **Vaccine** (`stg.vaccine`)
   - Vaccine reference data
   - Needed for immunisation facts
   - Low complexity

#### Medium Priority (Next 2-4 weeks)

4. **Allergies** (`stg.allergies`)
   - Patient allergy information
   - Clinical significance

5. **AppointmentMedications** (`stg.appointment_medications`)
   - Prescription data
   - Complex relationships

### Phase 3: Supporting Staging (📋 Planned)

**Priority**: MEDIUM - For comprehensive coverage

6-9. **Recalls**, **PatientAlerts**, **Inbox**, **InboxDetail**, **NextOfKin**

- Supporting clinical workflows
- Lower business impact initially

### Phase 4: Advanced Features (🎯 Future)

- **Summary tables** for common aggregations
- **Data mart** tables for specific analytics use cases
- **Partitioning** implementation for large tables
- **Advanced indexing** for performance optimization

## Quality Metrics

### Data Integrity

- **Foreign Keys**: ✅ All fact tables reference dimensions
- **Natural Keys**: ✅ Enforced in staging and core layers
- **SCD2 Constraints**: ✅ Proper historical tracking
- **Lineage Tracking**: ✅ Complete audit trail

### Performance

- **Indexing**: ✅ Comprehensive indexing strategy
- **Partitioning**: 📋 Ready for large tables (>10M rows)
- **Query Optimization**: ✅ Optimized for common patterns

### Scalability

- **Multi-tenancy**: ✅ `per_org_id` and `practice_id` in all tables
- **Horizontal Scaling**: ✅ Stateless design supports multiple instances
- **Batch Processing**: ✅ Configurable batch sizes

## Dependency Analysis

### Required for Production

**Must have before production deployment:**

- ✅ Raw layer (complete)
- ✅ Core dimensions (complete)
- ✅ Core facts (complete)
- ✅ ETL infrastructure (complete)
- 🔄 Essential staging tables (measurements, medicine, vaccine)

**Can be added incrementally:**

- 🟡 Remaining staging tables (allergies, appointment_medications, etc.)
- 🟡 Supporting extracts (inbox, recalls, patient_alerts)
- 🟡 Advanced features (summary tables, partitioning)

## Recommendations

### Immediate Actions (Next Sprint)

1. **Complete essential staging tables**:
   - `stg.measurements` (clinical analytics priority)
   - `stg.medicine` (reference data)
   - `stg.vaccine` (reference data)

2. **Begin testing with real data**:
   - Validate ETL pipeline with current schema
   - Test SCD2 functionality
   - Verify foreign key relationships

### Medium-term Goals (1-2 months)

3. **Add remaining staging tables**:
   - `stg.allergies`
   - `stg.appointment_medications`
   - `stg.recalls`
   - `stg.patient_alerts`

4. **Implement advanced features**:
   - Table partitioning for large facts
   - Summary tables for common queries
   - Performance monitoring enhancements

### Long-term Vision (2-3 months)

5. **Complete comprehensive coverage**:
   - All 18 extracts in staging layer
   - Inbox and messaging support
   - Emergency contact management

6. **Production optimization**:
   - Query performance tuning
   - Automated monitoring and alerting
   - Backup and recovery procedures

## Progress Tracking

### Weekly Updates

- Track staging table implementation progress
- Monitor data quality metrics
- Update completion percentages

### Milestone Checkpoints

- **Milestone 1**: Essential staging tables complete (Target: End of next sprint)
- **Milestone 2**: All staging tables complete (Target: 1 month)
- **Milestone 3**: Production deployment ready (Target: 2 months)

## Visual Progress

```
Raw Layer:          [████████████████████] 100% (18/18)
Staging Layer:      [██████████░░░░░░░░░░] 50% (9/18)
Core Dimensions:    [████████████████████] 100% (5/5)
Core Facts:         [████████████████████] 100% (6/6)
ETL Layer:          [████████████████████] 100% (2/2)

Overall Progress:   [██████████████░░░░░░] ~65% Complete
```

---

**Next Update**: Track progress on essential staging tables implementation
**Target Date**: End of current sprint for measurements, medicine, vaccine staging tables
