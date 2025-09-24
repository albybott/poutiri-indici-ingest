# Schema Development Todo List

## Overview

This document tracks remaining development tasks for the database schema. Phase 1: Immediate Fixes has been completed - this lists the remaining work for Phase 2 and Phase 3.

**Current Status**: Phase 1 ✅ Complete | Phase 2 🔄 In Progress | Phase 3 📋 Planned
**Last Updated**: December 2024

---

## ✅ Phase 1: Immediate Fixes (COMPLETED)

### ✅ Add Missing Staging Table Indexes

- [x] **providersStg** - Added natural key, providerId, nhiNumber, isCurrent, isActive indexes
- [x] **practiceInfoStg** - Added natural key, practiceId, isActive, practiceName indexes
- [x] **diagnosesStg** - Added natural key, diagnosisId, patientId, diagnosisDate, isActive indexes

### ✅ Remove Redundant Indexes

- [x] **factMeasurement** - Removed duplicate patientId index (covered by business key)

### ✅ Clean Up Imports

- [x] **Commented imports** - Removed commented raw table imports (no longer needed)

---

## 🔄 Phase 2: Performance Enhancement (IN PROGRESS)

### 📊 Composite Indexes for Analytics

- [ ] **Appointment analytics** - Add composite index on (scheduleDate, appointmentStatus)
- [ ] **Immunisation trends** - Add composite index on (administrationTime, vaccineKey, patientKey)
- [ ] **Invoice analysis** - Add composite index on (acdate, patientKey, providerKey)
- [ ] **Diagnosis patterns** - Add composite index on (diagnosisDate, diseaseId, patientKey)
- [ ] **Measurement analytics** - Add composite index on (screeningDate, screeningType, patientKey)

### 🎯 Covering Indexes for Common Queries

- [ ] **Appointment details** - Covering index with patient info, provider info, dates, status
- [ ] **Patient timeline** - Covering index for appointments, immunisations, diagnoses per patient
- [ ] **Provider workload** - Covering index for appointments and immunisations per provider
- [ ] **Practice metrics** - Covering index for all activities per practice

### ⚡ SCD2 Query Optimization

- [ ] **Current records only** - Add partial indexes for `isCurrent = true` on all dimensions
- [ ] **Historical queries** - Add composite indexes on (effectiveFrom, effectiveTo, business_key)
- [ ] **Dimension lookups** - Optimize for common dimension key lookups

### 🔍 Enhanced Search Capabilities

- [ ] **Text search indexes** - Add GIN indexes for searchable text fields
- [ ] **Date range queries** - Add range indexes for common date filtering
- [ ] **Multi-tenant queries** - Add perOrgId + practiceId composite indexes

---

## 📋 Phase 3: Advanced Optimization (PLANNED)

### 🏗️ Partitioning Strategy

- [ ] **Time-based partitioning** - Partition large fact tables by month/year
- [ ] **Tenant partitioning** - Consider per_org_id partitioning for large deployments
- [ ] **Archive strategy** - Implement data archiving for old records
- [ ] **Partition maintenance** - Automated partition creation and cleanup

### 🚀 Performance Monitoring

- [ ] **Index usage tracking** - Monitor which indexes are actually used
- [ ] **Query performance** - Add slow query logging and analysis
- [ ] **Index recommendations** - Automated suggestions for new indexes
- [ ] **Performance testing** - Benchmark common query patterns

### 🔧 Advanced Indexing Features

- [ ] **Functional indexes** - Index calculated fields (age groups, date parts)
- [ ] **Array indexes** - For multi-value fields if needed
- [ ] **JSON indexes** - For flexible schema fields
- [ ] **BRIN indexes** - For large historical data if applicable

### 📈 Scalability Enhancements

- [ ] **Read replicas** - Setup read-only replicas for reporting
- [ ] **Connection pooling** - Optimize database connections
- [ ] **Query optimization** - Advanced query planning
- [ ] **Caching strategy** - Implement application-level caching

---

## 🎯 Missing Staging Tables (High Priority)

### 🔴 Critical Missing Tables

- [ ] **measurements** (`stg.measurements`) - Clinical measurement data
- [ ] **medicine** (`stg.medicine`) - Medicine reference data
- [ ] **vaccine** (`stg.vaccine`) - Vaccine reference data

### 🟡 Important Missing Tables

- [ ] **allergies** (`stg.allergies`) - Patient allergy information
- [ ] **appointment_medications** (`stg.appointment_medications`) - Prescription data
- [ ] **recalls** (`stg.recalls`) - Patient recall tracking
- [ ] **patient_alerts** (`stg.patient_alerts`) - Clinical alerts

### 🟢 Supporting Missing Tables

- [ ] **inbox** (`stg.inbox`) - Clinical messaging
- [ ] **inbox_detail** (`stg.inbox_detail`) - Clinical messaging details
- [ ] **next_of_kin** (`stg.next_of_kin`) - Emergency contacts

---

## 📊 Quality Improvements

### 🔧 Index Maintenance

- [ ] **Index defragmentation** - Regular maintenance for optimal performance
- [ ] **Unused index removal** - Clean up indexes that aren't being used
- [ ] **Index statistics** - Regular statistics updates for query planner
- [ ] **Index monitoring** - Track index usage and performance impact

### 🧹 Data Quality Enhancements

- [ ] **Constraint validation** - Add application-level validation rules
- [ ] **Data profiling** - Regular analysis of data quality metrics
- [ ] **Anomaly detection** - Automated detection of data quality issues
- [ ] **Data lineage** - Enhanced tracking of data transformations

### 🔒 Security Hardening

- [ ] **Row-level security** - Implement RLS policies for multi-tenancy
- [ ] **Column-level encryption** - Encrypt sensitive fields (NHI numbers, etc.)
- [ ] **Audit logging** - Enhanced audit trails for compliance
- [ ] **Access controls** - Fine-grained permissions for different user roles

---

## 📈 Monitoring and Observability

### 📊 Performance Monitoring

- [ ] **Query performance** - Monitor slow queries and suggest optimizations
- [ ] **Index usage** - Track which indexes are used and their effectiveness
- [ ] **Lock monitoring** - Track database locks and contention
- [ ] **Connection monitoring** - Monitor database connections and usage

### 🚨 Alerting and Health Checks

- [ ] **Index health** - Alerts for fragmented or unused indexes
- [ ] **Performance alerts** - Notifications for slow queries
- [ ] **Space monitoring** - Track table and index sizes
- [ ] **Replication status** - Monitor replication lag and health

### 📋 Operational Tools

- [ ] **Schema documentation** - Auto-generate documentation from schema
- [ ] **Migration tools** - Automated schema migration scripts
- [ ] **Backup verification** - Validate backup integrity
- [ ] **Disaster recovery** - Test and document DR procedures

---

## 🛠️ Development Workflow

### 🔄 Code Quality

- [ ] **Index naming standards** - Consistent naming across all indexes
- [ ] **Documentation** - Document index purposes and usage patterns
- [ ] **Code reviews** - Review index changes in PR process
- [ ] **Testing** - Add index-related tests

### 📚 Documentation

- [ ] **Index documentation** - Comprehensive documentation of all indexes
- [ ] **Query patterns** - Document common query patterns and their indexes
- [ ] **Performance guides** - Best practices for query optimization
- [ ] **Troubleshooting guide** - Common index-related issues and solutions

### 🎯 Future Enhancements

- [ ] **Auto-indexing** - ML-based index recommendations
- [ ] **Dynamic indexing** - Runtime index creation based on query patterns
- [ ] **Index versioning** - Track index changes over time
- [ ] **A/B testing** - Test different indexing strategies

---

## 📅 Implementation Timeline

### Sprint 1 (Current - Essential Staging Tables)

- [ ] Complete measurements, medicine, vaccine staging tables
- [ ] Add composite indexes for core analytics
- [ ] Implement SCD2 query optimization

### Sprint 2 (Performance Enhancement)

- [ ] Add covering indexes for common queries
- [ ] Implement partitioning strategy
- [ ] Add performance monitoring

### Sprint 3 (Advanced Features)

- [ ] Complete remaining staging tables
- [ ] Implement security hardening
- [ ] Add operational tools

### Sprint 4 (Optimization & Monitoring)

- [ ] Performance tuning and optimization
- [ ] Implement monitoring and alerting
- [ ] Documentation and training

---

## 🎯 Success Metrics

### Performance Targets

- **Query response time**: <100ms for common analytics queries
- **Index usage**: >90% of indexes actively used
- **Maintenance overhead**: <5% of total system resources
- **Scalability**: Support 10x data growth without performance degradation

### Quality Targets

- **Zero redundant indexes** - All indexes serve distinct purposes
- **Complete coverage** - All common query patterns optimized
- **Documentation coverage** - 100% of indexes documented
- **Test coverage** - All critical queries tested

---

## 📞 Support and Resources

### Getting Help

- **Schema questions**: Refer to `docs/schema/schema-guide.md`
- **ETL questions**: Refer to `docs/etl-guide.md`
- **Coverage status**: Refer to `docs/schema/schema-coverage.md`

### Emergency Contacts

- **Database admin**: For critical database issues
- **DevOps team**: For infrastructure and deployment issues
- **Security team**: For compliance and security concerns

---

**Next Update**: After completing essential staging tables and basic composite indexes
**Target Date**: End of current sprint
