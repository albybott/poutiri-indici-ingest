# Indici Healthcare Data Staging Schema Documentation

This document provides comprehensive documentation of the staging schema for the Indici healthcare data extracts. The staging schema (`stg.*` tables) serves as an intermediate layer between raw data ingestion and the core data warehouse.

## Overview

The staging schema contains 18 main tables that capture healthcare data from various sources including patient information, appointments, diagnoses, medications, immunizations, measurements, and more. All tables follow consistent patterns:

- **Natural Keys**: Each table has a unique constraint on `(primary_id, practice_id, per_org_id)` for deduplication
- **Audit Fields**: All tables include `load_run_file_id`, `load_ts`, and `loaded_date_time` for lineage tracking
- **Soft Deletes**: Most tables include `is_active` and `is_deleted` boolean flags
- **Geographic Data**: Many tables include latitude/longitude coordinates for address information

## Core Tables

### 1. patients (stg.patients)

**Primary Purpose**: Patient demographic and enrollment information

**Key Columns**:
- `patient_id` (text) - Primary patient identifier
- `practice_id` (text) - Practice/organization identifier
- `per_org_id` (text) - Organization identifier
- `nhi_number` (text) - National Health Index number
- `first_name`, `middle_name`, `family_name` (text) - Patient names
- `gender`, `gender_id` (text) - Gender information
- `dob` (date) - Date of birth
- `age` (integer) - Current age
- `ethnicity`, `ethnicity_id` (text) - Ethnicity information
- `is_alive` (boolean) - Living status
- `death_date` (date) - Date of death if applicable
- `permanent_address_*` - Full address information with lat/lng
- `postal_address_*` - Postal address information with lat/lng
- `cell_number`, `day_phone`, `night_phone`, `email` (text) - Contact information
- `enrolment_status`, `enrolment_date` (text/date) - Enrollment information
- `funding_status`, `funding_from`, `funding_to` (text/date) - Funding information
- `is_insured`, `balance`, `calculated_balance` (boolean/decimal) - Financial information

**Important Relationships**:
- Links to `appointments` via `patient_id`
- Links to `diagnoses` via `patient_id`
- Links to `immunisation` via `patient_id`
- Links to `measurements` via `patient_id`
- Links to `allergies` via `patient_id`
- Links to `patient_alerts` via `patient_id`
- Links to `next_of_kin` via `patient_id`
- Links to `appointment_medications` via `patient_id`
- Links to `invoices` via `patient_id`

### 2. appointments (stg.appointments)

**Primary Purpose**: Patient appointment records

**Key Columns**:
- `appointment_id` (text) - Primary appointment identifier
- `patient_id` (text) - Patient identifier
- `practice_id` (text) - Practice identifier
- `per_org_id` (text) - Organization identifier
- `appointment_type`, `appointment_type_id` (text) - Type of appointment
- `appointment_status` (text) - Current status
- `schedule_date` (timestamp) - Scheduled appointment time
- `arrived` (boolean) - Whether patient arrived
- `appointment_completed` (boolean) - Whether appointment was completed
- `consult_time` (integer) - Consultation duration in minutes
- `provider_id`, `provider` (text) - Healthcare provider
- `notes`, `reasonfor_visit` (text) - Appointment notes and reason
- `is_confidential` (boolean) - Confidentiality flag
- `permanent_address_latitude/longitude` (decimal) - Location coordinates

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `diagnoses` via `appointment_id`
- Links to `immunisation` via `appointment_id`
- Links to `appointment_medications` via `appointment_id`

### 3. diagnoses (stg.diagnoses)

**Primary Purpose**: Patient diagnosis records

**Key Columns**:
- `diagnosis_id` (text) - Primary diagnosis identifier
- `patient_id` (text) - Patient identifier
- `appointment_id` (text) - Related appointment
- `practice_id` (text) - Practice identifier
- `per_org_id` (text) - Organization identifier
- `disease_id`, `disease` (text) - Disease information
- `diagnosis_date` (date) - Date of diagnosis
- `diagnosis_by_id`, `diagnosis_by` (text) - Diagnosing provider
- `summary` (text) - Diagnosis summary
- `is_long_term` (boolean) - Whether it's a long-term condition
- `is_active` (boolean) - Whether diagnosis is currently active
- `diagnosis_type`, `diagnosis_type_id` (text) - Type of diagnosis
- `snomed_id`, `snomed_term` (text) - SNOMED CT coding
- `med_tech_read_code`, `med_tech_read_term` (text) - MedTech coding

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `appointments` via `appointment_id`
- Links to `recalls` via `recall_id`

### 4. immunisation (stg.immunisation)

**Primary Purpose**: Patient immunization records

**Key Columns**:
- `appointment_immunisation_id` (text) - Primary immunization identifier
- `patient_id` (text) - Patient identifier
- `appointment_id` (text) - Related appointment
- `vaccine_id`, `vaccine_name`, `vaccine_code` (text) - Vaccine information
- `dose`, `dose_number` (text/integer) - Dose information
- `administration_site`, `route` (text) - Administration details
- `batch_number`, `expiry_date` (text/date) - Vaccine batch information
- `immunisation_status` (text) - Current status
- `provider_id`, `provider` (text) - Administering provider
- `administration_time` (timestamp) - When administered
- `is_nir_ack` (boolean) - National Immunisation Register acknowledgment

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `appointments` via `appointment_id`
- Links to `vaccine` via `vaccine_id`

### 5. measurements (stg.measurements)

**Primary Purpose**: Patient measurement and screening results

**Key Columns**:
- `screening_id` (text) - Primary screening identifier
- `patient_id` (text) - Patient identifier
- `appointment_id` (text) - Related appointment
- `screening_date` (date) - Date of screening
- `screening_type`, `screening_group` (text) - Type of screening
- `outcome`, `outcome_description` (text) - Screening results
- `scncode` (text) - Screening code
- `hba1c` (text) - HbA1c measurement
- `field1` through `field100` (text) - Flexible data fields
- `score` (text) - Calculated score
- `is_confidential` (boolean) - Confidentiality flag
- `permanent_address_latitude/longitude` (decimal) - Location coordinates

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `appointments` via `appointment_id`

### 6. medicine (stg.medicine)

**Primary Purpose**: Medicine catalog/reference data

**Key Columns**:
- `medicine_id` (text) - Primary medicine identifier
- `medicine_name`, `medicine_short_name` (text) - Medicine names
- `sct_id` (text) - SNOMED CT identifier
- `type` (text) - Medicine type
- `pharma_code` (text) - Pharmaceutical code
- `is_active` (boolean) - Whether medicine is currently active

**Important Relationships**:
- Links to `appointment_medications` via `medicine_id`
- Links to `allergies` via `medicine_id`

### 7. allergies (stg.allergies)

**Primary Purpose**: Patient allergy records

**Key Columns**:
- `allergy_id` (text) - Primary allergy identifier
- `patient_id` (text) - Patient identifier
- `appointment_id` (text) - Related appointment (optional)
- `medicine_id`, `medicine` (text) - Related medicine if applicable
- `allergy_type` (text) - Type of allergy
- `reaction_id`, `reactions` (text) - Reaction information
- `severity`, `severity_id` (text) - Severity level
- `onset_date` (date) - When allergy was identified
- `is_active` (boolean) - Whether allergy is currently active
- `allergy_category` (text) - Category of allergy
- `substance_type` (text) - Type of substance causing allergy

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `appointments` via `appointment_id`
- Links to `medicine` via `medicine_id`

### 8. next_of_kin (stg.next_of_kin)

**Primary Purpose**: Patient next of kin/emergency contact information

**Key Columns**:
- `next_to_kin_id` (text) - Primary next of kin identifier
- `patient_id` (text) - Patient identifier
- `name` (text) - Contact person's name
- `cell_number`, `day_phone`, `night_phone` (text) - Contact numbers
- `relationship_type` (text) - Relationship to patient
- `is_emergency` (boolean) - Whether this is emergency contact
- `full_address` (text) - Contact's address
- `permanent_address_latitude/longitude` (decimal) - Address coordinates

**Important Relationships**:
- Links to `patients` via `patient_id`

### 9. patient_alerts (stg.patient_alerts)

**Primary Purpose**: Patient alerts and notifications

**Key Columns**:
- `patient_alert_id` (text) - Primary alert identifier
- `patient_id` (text) - Patient identifier
- `type`, `alert` (text) - Alert type and description
- `severity` (text) - Alert severity level
- `effective_date`, `expiry_date` (date) - Alert validity period
- `note` (text) - Additional alert notes
- `is_active` (boolean) - Whether alert is currently active
- `alert_state` (text) - Current state of alert

**Important Relationships**:
- Links to `patients` via `patient_id`

### 10. providers (stg.providers)

**Primary Purpose**: Healthcare provider information

**Key Columns**:
- `provider_id` (text) - Primary provider identifier
- `practice_id` (text) - Practice identifier
- `per_org_id` (text) - Organization identifier
- `full_name` (text) - Provider's full name
- `provider_code` (text) - Provider code
- `nzmc_no` (text) - New Zealand Medical Council number
- `first_name`, `family_name` (text) - Provider names
- `gender`, `dob` (text/date) - Provider demographics
- `is_doctor` (boolean) - Whether provider is a doctor
- `specialty` (text) - Medical specialty
- `is_active` (boolean) - Whether provider is currently active

**Important Relationships**:
- Links to `appointments` via `provider_id`
- Links to `immunisation` via `provider_id`
- Links to `appointment_medications` via `provider_id`

### 11. appointment_medications (stg.appointment_medications)

**Primary Purpose**: Medications prescribed during appointments

**Key Columns**:
- `medication_id` (text) - Primary medication identifier
- `appointment_id` (text) - Related appointment
- `patient_id` (text) - Patient identifier
- `medicine_id`, `medicine_name` (text) - Medication information
- `strength`, `form` (text) - Medication strength and form
- `dose`, `frequency` (text) - Dosage instructions
- `duration`, `duration_type` (integer/text) - Treatment duration
- `start_date`, `end_date` (date) - Treatment period
- `quantity` (decimal) - Quantity prescribed
- `is_long_term` (boolean) - Whether it's long-term medication
- `rx_status` (text) - Prescription status
- `prescription_no` (text) - Prescription number

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `appointments` via `appointment_id`
- Links to `medicine` via `medicine_id`

### 12. vaccine (stg.vaccine)

**Primary Purpose**: Vaccine catalog/reference data

**Key Columns**:
- `vaccine_id` (text) - Primary vaccine identifier
- `vaccine_code`, `vaccine_name` (text) - Vaccine identification
- `long_description` (text) - Detailed vaccine description
- `coding_system` (text) - Coding system used
- `gender_id`, `gender` (text) - Target gender if applicable
- `is_nir` (boolean) - Whether part of National Immunisation Register

**Important Relationships**:
- Links to `immunisation` via `vaccine_id`

### 13. recalls (stg.recalls)

**Primary Purpose**: Patient recall/reminder records

**Key Columns**:
- `re_call_id` (text) - Primary recall identifier
- `patient_id` (text) - Patient identifier
- `re_call_date` (date) - Scheduled recall date
- `is_contacted` (boolean) - Whether patient has been contacted
- `recall_reason` (text) - Reason for recall
- `screening_type` (text) - Type of screening/follow-up
- `vaccine`, `vaccine_group` (text) - Related vaccine if applicable
- `re_call_group` (text) - Recall grouping
- `re_call_attempts` (integer) - Number of contact attempts
- `is_canceled` (boolean) - Whether recall was canceled

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `diagnoses` via `recall_id`

### 14. practice_info (stg.practice_info)

**Primary Purpose**: Practice/organization information

**Key Columns**:
- `practice_id` (text) - Primary practice identifier
- `per_org_id` (text) - Organization identifier
- `practice_name` (text) - Practice name
- `practice_category`, `practice_speciality` (text) - Practice type
- `pho` (text) - Primary Health Organization
- `legal_entity_title` (text) - Legal entity name
- `primary_phone`, `primary_email` (text) - Contact information
- `health_facility_no` (text) - Health facility number
- `is_rural` (boolean) - Whether practice is in rural area

**Important Relationships**:
- Links to all patient-related tables via `practice_id`

### 15. inbox (stg.inbox)

**Primary Purpose**: Patient inbox/communication records

**Key Columns**:
- `inbox_folder_item_id` (text) - Primary inbox item identifier
- `patient_id` (text) - Patient identifier
- `folder_name` (text) - Inbox folder
- `item_type` (text) - Type of inbox item
- `from_organization_name` (text) - Sending organization
- `message_subject` (text) - Message subject
- `result_date` (date) - Date of result/communication
- `is_confidential` (boolean) - Confidentiality flag
- `is_reviewed` (boolean) - Whether item has been reviewed

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `inbox_detail` via `inbox_folder_item_id`

### 16. inbox_detail (stg.inbox_detail)

**Primary Purpose**: Detailed inbox item content

**Key Columns**:
- `in_box_folder_item_in_line_id` (text) - Primary detail identifier
- `inbox_folder_item_id` (text) - Parent inbox item
- `patient_id` (text) - Patient identifier
- `prompt` (text) - Test/prompt description
- `result` (text) - Test result value
- `ab_norm` (text) - Abnormal flag
- `unit` (text) - Unit of measurement
- `reference_ranges` (text) - Normal reference ranges

**Important Relationships**:
- Links to `inbox` via `inbox_folder_item_id`
- Links to `patients` via `patient_id`

### 17. invoices (stg.invoices)

**Primary Purpose**: Patient billing/invoice records

**Key Columns**:
- `invoice_transaction_id` (text) - Primary invoice identifier
- `patient_id` (text) - Patient identifier
- `ac_date` (date) - Accounting date
- `total_amount`, `unpaid_amount` (decimal) - Invoice amounts
- `payment_mode` (text) - Payment method
- `provider_id` (text) - Billing provider
- `transaction_type` (text) - Type of transaction

**Important Relationships**:
- Links to `patients` via `patient_id`
- Links to `invoice_detail` via `invoice_transaction_id`

### 18. invoice_detail (stg.invoice_detail)

**Primary Purpose**: Detailed invoice line items

**Key Columns**:
- `invoice_detail_id` (text) - Primary detail identifier
- `invoice_transaction_id` (text) - Parent invoice
- `master_service_name`, `service_name` (text) - Service description
- `quantity` (decimal) - Quantity of service
- `claim_amount`, `co_payment` (decimal) - Billing amounts
- `funder_name` (text) - Funding organization
- `is_funded` (boolean) - Whether service is funded

**Important Relationships**:
- Links to `invoices` via `invoice_transaction_id`

## Common Data Patterns

### Geographic Information
Many tables include address information with latitude/longitude coordinates:
- `permanent_address_latitude/longitude` (decimal 10,8 / 11,8)
- `postal_address_latitude/longitude` (decimal 10,8 / 11,8)

### Audit and Lineage
All tables include:
- `load_run_file_id` (integer) - Foreign key to etl.load_run_files
- `load_ts` (timestamp) - When record was loaded
- `loaded_date_time` (timestamp) - When record was processed

### Natural Keys
All tables have unique constraints on `(primary_id, practice_id, per_org_id)` for deduplication.

### Boolean Flags
Common boolean fields across tables:
- `is_active` - Whether record is currently active
- `is_deleted` - Whether record is soft-deleted
- `is_confidential` - Whether record contains confidential information

## Key Relationships Summary

### Patient-Centric Relationships
- **Patient → Appointments**: One patient can have many appointments
- **Patient → Diagnoses**: One patient can have many diagnoses
- **Patient → Immunizations**: One patient can have many immunizations
- **Patient → Measurements**: One patient can have many measurements
- **Patient → Allergies**: One patient can have many allergies
- **Patient → Alerts**: One patient can have many alerts
- **Patient → Next of Kin**: One patient can have multiple next of kin
- **Patient → Medications**: One patient can have many prescribed medications
- **Patient → Invoices**: One patient can have many invoices

### Appointment-Centric Relationships
- **Appointment → Diagnoses**: One appointment can result in multiple diagnoses
- **Appointment → Immunizations**: One appointment can include multiple immunizations
- **Appointment → Medications**: One appointment can prescribe multiple medications

### Provider Relationships
- **Provider → Appointments**: One provider can have many appointments
- **Provider → Immunizations**: One provider can administer many immunizations
- **Provider → Prescribed Medications**: One provider can prescribe many medications

### Practice/Organization
- All patient-related records are associated with a practice_id
- All records are associated with a per_org_id for organization-level grouping

## Data Quality Considerations

### Common Issues to Watch For:
1. **Missing Geographic Data**: Some records may have null latitude/longitude values
2. **Inactive Records**: Always filter by `is_active = true` and `is_deleted = false` unless specifically needed
3. **Date Validation**: Check date ranges for logical consistency
4. **Confidentiality**: Respect `is_confidential` flags when exposing data
5. **Practice Scoping**: Most queries should include `WHERE practice_id = ?` for data isolation

### Useful Query Patterns:

**Get active patients for a practice:**
```sql
SELECT * FROM stg.patients
WHERE practice_id = 'your_practice_id'
  AND is_active = true
  AND is_deleted = false;
```

**Get patients with recent appointments:**
```sql
SELECT p.*, a.schedule_date, a.appointment_type
FROM stg.patients p
JOIN stg.appointments a ON p.patient_id = a.patient_id
WHERE p.practice_id = 'your_practice_id'
  AND a.schedule_date >= CURRENT_DATE - INTERVAL '30 days'
  AND p.is_active = true
  AND a.is_active = true;
```

**Get patients with specific diagnoses:**
```sql
SELECT p.*, d.disease, d.diagnosis_date, d.is_long_term
FROM stg.patients p
JOIN stg.diagnoses d ON p.patient_id = d.patient_id
WHERE p.practice_id = 'your_practice_id'
  AND d.disease ILIKE '%diabetes%'
  AND d.is_active = true;
```

## Example Query Generation

Based on this schema documentation, here are examples of how to generate complex queries for specific healthcare analytics:

### Example 1: "Create a statement that shows all men under 25, include demographic information and diagnoses"

```sql
SELECT
    p.patient_id,
    p.first_name,
    p.family_name,
    p.gender,
    EXTRACT(YEAR FROM AGE(p.dob)) as age,
    p.ethnicity,
    p.permanent_address_city,
    p.enrolment_status,
    -- Recent diagnoses in the last 2 years
    array_agg(DISTINCT d.disease ORDER BY d.diagnosis_date DESC) FILTER (
        WHERE d.diagnosis_date >= CURRENT_DATE - INTERVAL '2 years'
    ) as recent_diagnoses,
    -- Count of long-term conditions
    COUNT(DISTINCT d.diagnosis_id) FILTER (WHERE d.is_long_term = true) as long_term_conditions,
    -- Most recent appointment
    MAX(a.schedule_date) as last_appointment_date,
    -- Appointment count last year
    COUNT(DISTINCT a.appointment_id) FILTER (
        WHERE a.schedule_date >= CURRENT_DATE - INTERVAL '1 year'
    ) as appointments_last_year
FROM stg.patients p
LEFT JOIN stg.diagnoses d ON p.patient_id = d.patient_id AND d.is_active = true
LEFT JOIN stg.appointments a ON p.patient_id = a.patient_id AND a.is_active = true
WHERE p.practice_id = 'your_practice_id'
    AND p.gender = 'Male'
    AND EXTRACT(YEAR FROM AGE(p.dob)) < 25
    AND p.is_active = true
    AND p.is_deleted = false
    AND p.is_alive = true
GROUP BY p.patient_id, p.first_name, p.family_name, p.gender, p.dob, p.ethnicity,
         p.permanent_address_city, p.enrolment_status
ORDER BY p.age, p.family_name, p.first_name;
```

### Example 2: "Find patients with diabetes who haven't had an HbA1c test in the last 6 months"

```sql
SELECT
    p.patient_id,
    p.first_name || ' ' || p.family_name as patient_name,
    p.dob,
    EXTRACT(YEAR FROM AGE(p.dob)) as age,
    d.diagnosis_date as diabetes_diagnosis_date,
    -- Most recent HbA1c measurement
    MAX(m.screening_date) FILTER (WHERE m.hba1c IS NOT NULL) as last_hba1c_date,
    -- Days since last HbA1c
    EXTRACT(DAY FROM CURRENT_DATE - MAX(m.screening_date) FILTER (WHERE m.hba1c IS NOT NULL)) as days_since_hba1c
FROM stg.patients p
JOIN stg.diagnoses d ON p.patient_id = d.patient_id
LEFT JOIN stg.measurements m ON p.patient_id = m.patient_id
WHERE p.practice_id = 'your_practice_id'
    AND p.is_active = true
    AND p.is_deleted = false
    AND d.is_active = true
    AND (d.disease ILIKE '%diabetes%' OR d.disease ILIKE '%diabetic%')
    AND (m.screening_date IS NULL OR m.screening_date < CURRENT_DATE - INTERVAL '6 months')
GROUP BY p.patient_id, p.first_name, p.family_name, p.dob, d.diagnosis_date
HAVING MAX(m.screening_date) IS NULL
    OR MAX(m.screening_date) < CURRENT_DATE - INTERVAL '6 months'
ORDER BY days_since_hba1c DESC NULLS FIRST;
```

### Example 3: "Show immunization coverage rates by age group and vaccine type"

```sql
SELECT
    CASE
        WHEN EXTRACT(YEAR FROM AGE(p.dob)) < 18 THEN 'Under 18'
        WHEN EXTRACT(YEAR FROM AGE(p.dob)) BETWEEN 18 AND 65 THEN '18-65'
        ELSE 'Over 65'
    END as age_group,
    v.vaccine_name,
    COUNT(DISTINCT p.patient_id) as total_patients,
    COUNT(DISTINCT i.patient_id) as vaccinated_patients,
    ROUND(
        COUNT(DISTINCT i.patient_id)::numeric /
        NULLIF(COUNT(DISTINCT p.patient_id), 0) * 100, 2
    ) as coverage_rate_percent
FROM stg.patients p
CROSS JOIN stg.vaccine v
LEFT JOIN stg.immunisation i ON p.patient_id = i.patient_id
    AND i.vaccine_id = v.vaccine_id
    AND i.immunisation_status = 'Completed'
    AND i.is_active = true
WHERE p.practice_id = 'your_practice_id'
    AND p.is_active = true
    AND p.is_deleted = false
    AND p.dob IS NOT NULL
    AND v.is_active = true
GROUP BY age_group, v.vaccine_name
ORDER BY age_group, v.vaccine_name;
```

### Example 4: "Find patients with multiple long-term conditions and their primary providers"

```sql
WITH patient_conditions AS (
    SELECT
        p.patient_id,
        p.first_name || ' ' || p.family_name as patient_name,
        p.dob,
        EXTRACT(YEAR FROM AGE(p.dob)) as age,
        COUNT(d.diagnosis_id) FILTER (WHERE d.is_long_term = true) as long_term_conditions,
        -- Primary provider (most frequent)
        MODE() WITHIN GROUP (ORDER BY a.provider) as primary_provider,
        MAX(a.schedule_date) as last_appointment
    FROM stg.patients p
    JOIN stg.diagnoses d ON p.patient_id = d.patient_id
    LEFT JOIN stg.appointments a ON p.patient_id = a.patient_id
    WHERE p.practice_id = 'your_practice_id'
        AND p.is_active = true
        AND p.is_deleted = false
        AND d.is_active = true
        AND a.is_active = true
    GROUP BY p.patient_id, p.first_name, p.family_name, p.dob
)
SELECT *
FROM patient_conditions
WHERE long_term_conditions >= 2
ORDER BY long_term_conditions DESC, age DESC;
```

## Usage Notes for LLM Query Generation

When generating queries based on this schema:

1. **Always include practice scoping**: `WHERE practice_id = 'your_practice_id'`
2. **Filter for active records**: `AND is_active = true AND is_deleted = false`
3. **Handle confidentiality**: Respect `is_confidential` flags when appropriate
4. **Use appropriate joins**: Patient-centric queries often need multiple JOINs
5. **Consider date ranges**: Use appropriate time windows for analysis
6. **Handle null values**: Use `IS NOT NULL` checks for required fields
7. **Use aggregates carefully**: PostgreSQL functions like `MODE()`, `array_agg()` are useful for complex analysis

This documentation provides a comprehensive foundation for understanding the staging schema structure and relationships, enabling effective SQL query generation for healthcare data analysis.
