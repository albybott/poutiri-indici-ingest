-- Query for Māori and Pasifika men aged 13-100 who have engaged with Poutiri since July 1, 2024
-- This query finds patients who have had appointments since the specified date

SELECT
    p.patient_id,
    p.nhi_number,
    p.first_name,
    p.family_name,
    p.full_name,
    -- Age calculation
    EXTRACT(YEAR FROM AGE(COALESCE(p.dob, CURRENT_DATE))) as current_age,
    p.dob as date_of_birth,
    -- Basic information
    p.gender,
    -- Ethnicity information (Note: No specific iwi field found in schema)
    p.ethnicity as primary_ethnicity,
    p.secondary_ethnicity,
    p.other_ethnicity,
    p.ethcode,
    p.ethcode2,
    p.ethcode3,
    -- Address information
    COALESCE(
        CONCAT(
            COALESCE(p.permanent_address_house_number, ''),
            COALESCE(' ' || p.permanent_address_street_number, ''),
            ' ', COALESCE(p.permanent_address_suburb, ''),
            ' ', COALESCE(p.permanent_address_city, ''),
            ' ', COALESCE(p.permanent_address_postal_code, '')
        ),
        p.permanent_address
    ) as full_address,
    p.permanent_address_city,
    p.permanent_address_suburb,
    p.permanent_address_postal_code,
    p.permanent_address_latitude,
    p.permanent_address_longitude,
    -- Enrolment information
    p.enrolment_date,
    p.enrolment_status,
    p.enrolment_type,
    p.pho_name,
    -- Engagement information (most recent appointment)
    a.last_appointment_date,
    a.appointment_count_since_july_2024,
    a.most_recent_appointment_type,
    -- Diagnosis information
    d.recent_diagnoses,
    d.long_term_conditions_count,
    d.most_recent_diagnosis_date,
    -- Patient status
    p.is_alive,
    p.is_active,
    p.is_deleted,
    -- Practice information
    p.practice_id,
    p.practice_name,
    p.per_org_id

FROM stg.patients p

-- Join with appointments to find engagement since July 1, 2024
INNER JOIN (
    SELECT DISTINCT
        patient_id,
        MAX(schedule_date) as last_appointment_date,
        COUNT(*) as appointment_count_since_july_2024,
        -- Get the most recent appointment type for context
        (SELECT appointment_type
         FROM stg.appointments a2
         WHERE a2.patient_id = a.patient_id
           AND a2.schedule_date >= '2024-07-01'
           AND a2.is_active = true
           AND a2.is_deleted = false
           AND a2.appointment_completed = true
         ORDER BY a2.schedule_date DESC
         LIMIT 1) as most_recent_appointment_type
    FROM stg.appointments a
    WHERE schedule_date >= '2024-07-01'
        AND is_active = true
        AND is_deleted = false
        AND appointment_completed = true  -- Only count completed appointments
    GROUP BY patient_id
) a ON p.patient_id = a.patient_id

-- LEFT JOIN with diagnoses to get diagnosis information
LEFT JOIN (
    SELECT
        patient_id,
        -- Get recent diagnoses (last 2 years) - ordered by diagnosis date
        ARRAY_AGG(disease ORDER BY diagnosis_date DESC) FILTER (
            WHERE diagnosis_date >= CURRENT_DATE - INTERVAL '2 years'
        ) as recent_diagnoses,
        -- Count of long-term conditions
        COUNT(*) FILTER (WHERE is_long_term = true AND is_active = true) as long_term_conditions_count,
        -- Most recent diagnosis date
        MAX(diagnosis_date) as most_recent_diagnosis_date
    FROM stg.diagnoses
    WHERE is_active = true
        AND is_deleted = false
    GROUP BY patient_id
) d ON p.patient_id = d.patient_id

WHERE
    -- Gender filter: Male patients only
    p.gender = 'Male'

    -- Age filter: 13 to 100 years old
    AND EXTRACT(YEAR FROM AGE(COALESCE(p.dob, CURRENT_DATE))) BETWEEN 13 AND 100

    -- Ethnicity filter: Māori and Pasifika
    -- Note: This covers common Māori and Pacific Island ethnicities
    AND (
        p.ethnicity ILIKE '%māori%'
        OR p.ethnicity ILIKE '%maori%'
        OR p.secondary_ethnicity ILIKE '%māori%'
        OR p.secondary_ethnicity ILIKE '%maori%'
        OR p.other_ethnicity ILIKE '%māori%'
        OR p.other_ethnicity ILIKE '%maori%'
        -- Pacific Island ethnicities
        OR p.ethnicity ILIKE '%samoan%'
        OR p.ethnicity ILIKE '%tongan%'
        OR p.ethnicity ILIKE '%cook island%'
        OR p.ethnicity ILIKE '%niuean%'
        OR p.ethnicity ILIKE '%fijian%'
        OR p.ethnicity ILIKE '%tokelauan%'
        OR p.ethnicity ILIKE '%kiribati%'
        OR p.ethnicity ILIKE '%tuvaluan%'
        OR p.ethnicity ILIKE '%pacific%'
        OR p.ethnicity ILIKE '%pasifika%'
        -- Also check secondary and other ethnicity fields
        OR p.secondary_ethnicity ILIKE '%samoan%'
        OR p.secondary_ethnicity ILIKE '%tongan%'
        OR p.secondary_ethnicity ILIKE '%cook island%'
        OR p.secondary_ethnicity ILIKE '%niuean%'
        OR p.secondary_ethnicity ILIKE '%fijian%'
        OR p.secondary_ethnicity ILIKE '%tokelauan%'
        OR p.secondary_ethnicity ILIKE '%kiribati%'
        OR p.secondary_ethnicity ILIKE '%tuvaluan%'
        OR p.secondary_ethnicity ILIKE '%pacific%'
        OR p.secondary_ethnicity ILIKE '%pasifika%'
        OR p.other_ethnicity ILIKE '%samoan%'
        OR p.other_ethnicity ILIKE '%tongan%'
        OR p.other_ethnicity ILIKE '%cook island%'
        OR p.other_ethnicity ILIKE '%niuean%'
        OR p.other_ethnicity ILIKE '%fijian%'
        OR p.other_ethnicity ILIKE '%tokelauan%'
        OR p.other_ethnicity ILIKE '%kiribati%'
        OR p.other_ethnicity ILIKE '%tuvaluan%'
        OR p.other_ethnicity ILIKE '%pacific%'
        OR p.other_ethnicity ILIKE '%pasifika%'
    )

    -- Patient status filters
    AND p.is_active = true
    AND p.is_deleted = false
    AND p.is_alive = true

    -- Ensure we have valid NHI for healthcare context
    AND p.nhi_number IS NOT NULL
    AND TRIM(p.nhi_number) != ''

ORDER BY
    -- Order by most recent engagement first
    a.last_appointment_date DESC,
    p.family_name,
    p.first_name;
