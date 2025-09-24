// import { index, uniqueIndex } from "drizzle-orm/pg-core";

// import {
//   patientsRaw,
//   appointmentsRaw,
//   immunisationsRaw,
//   invoicesRaw,
//   invoiceDetailRaw,
//   providersRaw,
//   practiceInfoRaw,
//   measurementsRaw,
//   diagnosesRaw,
//   recallsRaw,
//   inboxRaw,
//   inboxDetailRaw,
//   medicineRaw,
//   nextOfKinRaw,
//   vaccineRaw,
//   allergiesRaw,
//   appointmentMedicationsRaw,
//   patientAlertsRaw,
// } from "./";

// import {
//   patientsStg,
//   appointmentsStg,
//   immunisationsStg,
//   invoicesStg,
//   invoiceDetailStg,
//   providersStg,
//   practiceInfoStg,
//   diagnosesStg,
// } from "./";

// import {
//   dimPatient,
//   dimProvider,
//   dimPractice,
//   dimMedicine,
//   dimVaccine,
//   factAppointment,
//   factImmunisation,
//   factInvoice,
//   factInvoiceDetail,
//   factDiagnosis,
//   factMeasurement,
// } from "./";

// import {
//   loadRuns,
//   loadRunFiles,
//   dqResults,
//   health,
//   config,
//   extractConfig,
//   dqThresholds,
// } from "./";

// // Raw schema indexes - optimized for discovery and lineage tracking
// export const rawIndexes = {
//   // Common indexes for all raw tables
//   dateExtractedExtractType: (table: any) =>
//     index(`${table._.name}_date_extracted_extract_type_idx`).on(
//       table.dateExtracted,
//       table.extractType
//     ),
//   perOrgIdPracticeId: (table: any) =>
//     index(`${table._.name}_per_org_id_practice_id_idx`).on(
//       table.perOrgId,
//       table.practiceId
//     ),
//   loadRunId: (table: any) =>
//     index(`${table._.name}_load_run_id_idx`).on(table.loadRunId),
//   s3VersionId: (table: any) =>
//     index(`${table._.name}_s3_version_id_idx`).on(table.s3VersionId),

//   // Specific indexes for key tables
//   patientsRaw: {
//     patientId: index("patients_raw_patient_id_idx").on(patientsRaw.patientId),
//     nhiNumber: index("patients_raw_nhi_number_idx").on(patientsRaw.nhiNumber),
//   },
//   appointmentsRaw: {
//     appointmentId: index("appointments_raw_appointment_id_idx").on(
//       appointmentsRaw.appointmentId
//     ),
//     patientId: index("appointments_raw_patient_id_idx").on(
//       appointmentsRaw.patientId
//     ),
//     scheduleDate: index("appointments_raw_schedule_date_idx").on(
//       appointmentsRaw.scheduleDate
//     ),
//   },
//   immunisationsRaw: {
//     appointmentImmunisationId: index(
//       "immunisations_raw_appointment_immunisation_id_idx"
//     ).on(immunisationsRaw.appointmentImmunisationId),
//     patientId: index("immunisations_raw_patient_id_idx").on(
//       immunisationsRaw.patientId
//     ),
//     vaccineId: index("immunisations_raw_vaccine_id_idx").on(
//       immunisationsRaw.vaccineId
//     ),
//   },
//   invoicesRaw: {
//     invoiceTransactionId: index("invoices_raw_invoice_transaction_id_idx").on(
//       invoicesRaw.invoiceTransactionId
//     ),
//     patientId: index("invoices_raw_patient_id_idx").on(invoicesRaw.patientId),
//     acdate: index("invoices_raw_acdate_idx").on(invoicesRaw.acdate),
//   },
//   invoiceDetailRaw: {
//     invoiceDetailId: index("invoice_detail_raw_invoice_detail_id_idx").on(
//       invoiceDetailRaw.invoiceDetailId
//     ),
//     invoiceTransactionId: index(
//       "invoice_detail_raw_invoice_transaction_id_idx"
//     ).on(invoiceDetailRaw.invoiceTransactionId),
//   },
//   providersRaw: {
//     providerId: index("providers_raw_provider_id_idx").on(
//       providersRaw.providerId
//     ),
//     nhiNumber: index("providers_raw_nhi_number_idx").on(providersRaw.nhiNumber),
//   },
//   practiceInfoRaw: {
//     practiceId: index("practice_info_raw_practice_id_idx").on(
//       practiceInfoRaw.practiceId
//     ),
//   },
//   measurementsRaw: {
//     patientId: index("measurements_raw_patient_id_idx").on(
//       measurementsRaw.patientId
//     ),
//     screeningDate: index("measurements_raw_screening_date_idx").on(
//       measurementsRaw.screeningDate
//     ),
//   },
//   diagnosesRaw: {
//     diagnosisId: index("diagnoses_raw_diagnosis_id_idx").on(
//       diagnosesRaw.diagnosisId
//     ),
//     patientId: index("diagnoses_raw_patient_id_idx").on(diagnosesRaw.patientId),
//     diagnosisDate: index("diagnoses_raw_diagnosis_date_idx").on(
//       diagnosesRaw.diagnosisDate
//     ),
//   },
// };

// // Staging schema indexes - optimized for validation and transformation
// export const stgIndexes = {
//   // Unique constraints for natural keys
//   patientsStg: {
//     naturalKey: uniqueIndex("patients_stg_natural_key_idx").on(
//       patientsStg.patientId,
//       patientsStg.practiceId,
//       patientsStg.perOrgId
//     ),
//     patientId: index("patients_stg_patient_id_idx").on(patientsStg.patientId),
//     nhiNumber: index("patients_stg_nhi_number_idx").on(patientsStg.nhiNumber),
//   },
//   appointmentsStg: {
//     naturalKey: uniqueIndex("appointments_stg_natural_key_idx").on(
//       appointmentsStg.appointmentId,
//       appointmentsStg.practiceId,
//       appointmentsStg.perOrgId
//     ),
//     appointmentId: index("appointments_stg_appointment_id_idx").on(
//       appointmentsStg.appointmentId
//     ),
//     patientId: index("appointments_stg_patient_id_idx").on(
//       appointmentsStg.patientId
//     ),
//     scheduleDate: index("appointments_stg_schedule_date_idx").on(
//       appointmentsStg.scheduleDate
//     ),
//   },
//   immunisationsStg: {
//     naturalKey: uniqueIndex("immunisations_stg_natural_key_idx").on(
//       immunisationsStg.appointmentImmunisationId,
//       immunisationsStg.practiceId,
//       immunisationsStg.perOrgId
//     ),
//     appointmentImmunisationId: index(
//       "immunisations_stg_appointment_immunisation_id_idx"
//     ).on(immunisationsStg.appointmentImmunisationId),
//     patientId: index("immunisations_stg_patient_id_idx").on(
//       immunisationsStg.patientId
//     ),
//     vaccineId: index("immunisations_stg_vaccine_id_idx").on(
//       immunisationsStg.vaccineId
//     ),
//   },
//   invoicesStg: {
//     naturalKey: uniqueIndex("invoices_stg_natural_key_idx").on(
//       invoicesStg.invoiceTransactionId,
//       invoicesStg.practiceId,
//       invoicesStg.perOrgId
//     ),
//     invoiceTransactionId: index("invoices_stg_invoice_transaction_id_idx").on(
//       invoicesStg.invoiceTransactionId
//     ),
//     patientId: index("invoices_stg_patient_id_idx").on(invoicesStg.patientId),
//     acdate: index("invoices_stg_acdate_idx").on(invoicesStg.acdate),
//   },
//   invoiceDetailStg: {
//     naturalKey: uniqueIndex("invoice_detail_stg_natural_key_idx").on(
//       invoiceDetailStg.invoiceDetailId,
//       invoiceDetailStg.practiceId,
//       invoiceDetailStg.perOrgId
//     ),
//     invoiceDetailId: index("invoice_detail_stg_invoice_detail_id_idx").on(
//       invoiceDetailStg.invoiceDetailId
//     ),
//     invoiceTransactionId: index(
//       "invoice_detail_stg_invoice_transaction_id_idx"
//     ).on(invoiceDetailStg.invoiceTransactionId),
//   },
//   providersStg: {
//     naturalKey: uniqueIndex("providers_stg_natural_key_idx").on(
//       providersStg.providerId,
//       providersStg.practiceId,
//       providersStg.perOrgId
//     ),
//     providerId: index("providers_stg_provider_id_idx").on(
//       providersStg.providerId
//     ),
//     nhiNumber: index("providers_stg_nhi_number_idx").on(providersStg.nhiNumber),
//     isActive: index("providers_stg_is_active_idx").on(providersStg.isActive),
//     dob: index("providers_stg_dob_idx").on(providersStg.dob),
//   },
//   practiceInfoStg: {
//     naturalKey: uniqueIndex("practice_info_stg_natural_key_idx").on(
//       practiceInfoStg.practiceId,
//       practiceInfoStg.perOrgId
//     ),
//     practiceId: index("practice_info_stg_practice_id_idx").on(
//       practiceInfoStg.practiceId
//     ),
//     isActive: index("practice_info_stg_is_active_idx").on(
//       practiceInfoStg.isActive
//     ),
//     practiceName: index("practice_info_stg_practice_name_idx").on(
//       practiceInfoStg.practiceName
//     ),
//   },
//   diagnosesStg: {
//     naturalKey: uniqueIndex("diagnoses_stg_natural_key_idx").on(
//       diagnosesStg.diagnosisId,
//       diagnosesStg.practiceId,
//       diagnosesStg.perOrgId
//     ),
//     diagnosisId: index("diagnoses_stg_diagnosis_id_idx").on(
//       diagnosesStg.diagnosisId
//     ),
//     patientId: index("diagnoses_stg_patient_id_idx").on(diagnosesStg.patientId),
//     diagnosisDate: index("diagnoses_stg_diagnosis_date_idx").on(
//       diagnosesStg.diagnosisDate
//     ),
//     isActive: index("diagnoses_stg_is_active_idx").on(diagnosesStg.isActive),
//   },
// };

// // Core schema indexes - optimized for analytics and reporting
// export const coreIndexes = {
//   // Dimension indexes
//   dimPatient: {
//     businessKey: uniqueIndex("dim_patient_business_key_idx").on(
//       dimPatient.patientId,
//       dimPatient.practiceId,
//       dimPatient.perOrgId
//     ),
//     patientId: index("dim_patient_patient_id_idx").on(dimPatient.patientId),
//     nhiNumberHash: index("dim_patient_nhi_number_hash_idx").on(
//       dimPatient.nhiNumberHash
//     ),
//     isCurrent: index("dim_patient_is_current_idx").on(dimPatient.isCurrent),
//     effectiveFrom: index("dim_patient_effective_from_idx").on(
//       dimPatient.effectiveFrom
//     ),
//   },
//   dimProvider: {
//     businessKey: uniqueIndex("dim_provider_business_key_idx").on(
//       dimProvider.providerId,
//       dimProvider.practiceId,
//       dimProvider.perOrgId
//     ),
//     providerId: index("dim_provider_provider_id_idx").on(
//       dimProvider.providerId
//     ),
//     nhiNumber: index("dim_provider_nhi_number_idx").on(dimProvider.nhiNumber),
//     isCurrent: index("dim_provider_is_current_idx").on(dimProvider.isCurrent),
//   },
//   dimPractice: {
//     businessKey: uniqueIndex("dim_practice_business_key_idx").on(
//       dimPractice.practiceId,
//       dimPractice.perOrgId
//     ),
//     practiceId: index("dim_practice_practice_id_idx").on(
//       dimPractice.practiceId
//     ),
//     isCurrent: index("dim_practice_is_current_idx").on(dimPractice.isCurrent),
//   },
//   dimMedicine: {
//     businessKey: uniqueIndex("dim_medicine_business_key_idx").on(
//       dimMedicine.medicineId,
//       dimMedicine.practiceId,
//       dimMedicine.perOrgId
//     ),
//     medicineId: index("dim_medicine_medicine_id_idx").on(
//       dimMedicine.medicineId
//     ),
//     sctid: index("dim_medicine_sctid_idx").on(dimMedicine.sctid),
//   },
//   dimVaccine: {
//     businessKey: uniqueIndex("dim_vaccine_business_key_idx").on(
//       dimVaccine.vaccineId,
//       dimVaccine.practiceId,
//       dimVaccine.perOrgId
//     ),
//     vaccineId: index("dim_vaccine_vaccine_id_idx").on(dimVaccine.vaccineId),
//     vaccineCode: index("dim_vaccine_vaccine_code_idx").on(
//       dimVaccine.vaccineCode
//     ),
//   },

//   // Fact table indexes
//   factAppointment: {
//     businessKey: uniqueIndex("fact_appointment_business_key_idx").on(
//       factAppointment.appointmentId,
//       factAppointment.practiceId,
//       factAppointment.perOrgId
//     ),
//     appointmentId: index("fact_appointment_appointment_id_idx").on(
//       factAppointment.appointmentId
//     ),
//     patientKey: index("fact_appointment_patient_key_idx").on(
//       factAppointment.patientKey
//     ),
//     providerKey: index("fact_appointment_provider_key_idx").on(
//       factAppointment.providerKey
//     ),
//     practiceKey: index("fact_appointment_practice_key_idx").on(
//       factAppointment.practiceKey
//     ),
//     scheduleDate: index("fact_appointment_schedule_date_idx").on(
//       factAppointment.scheduleDate
//     ),
//     appointmentStatus: index("fact_appointment_appointment_status_idx").on(
//       factAppointment.appointmentStatus
//     ),
//   },
//   factImmunisation: {
//     businessKey: uniqueIndex("fact_immunisation_business_key_idx").on(
//       factImmunisation.appointmentImmunisationId,
//       factImmunisation.practiceId,
//       factImmunisation.perOrgId
//     ),
//     appointmentImmunisationId: index(
//       "fact_immunisation_appointment_immunisation_id_idx"
//     ).on(factImmunisation.appointmentImmunisationId),
//     patientKey: index("fact_immunisation_patient_key_idx").on(
//       factImmunisation.patientKey
//     ),
//     providerKey: index("fact_immunisation_provider_key_idx").on(
//       factImmunisation.providerKey
//     ),
//     practiceKey: index("fact_immunisation_practice_key_idx").on(
//       factImmunisation.practiceKey
//     ),
//     vaccineKey: index("fact_immunisation_vaccine_key_idx").on(
//       factImmunisation.vaccineKey
//     ),
//     administrationTime: index("fact_immunisation_administration_time_idx").on(
//       factImmunisation.administrationTime
//     ),
//   },
//   factInvoice: {
//     businessKey: uniqueIndex("fact_invoice_business_key_idx").on(
//       factInvoice.invoiceTransactionId,
//       factInvoice.practiceId,
//       factInvoice.perOrgId
//     ),
//     invoiceTransactionId: index("fact_invoice_invoice_transaction_id_idx").on(
//       factInvoice.invoiceTransactionId
//     ),
//     patientKey: index("fact_invoice_patient_key_idx").on(
//       factInvoice.patientKey
//     ),
//     providerKey: index("fact_invoice_provider_key_idx").on(
//       factInvoice.providerKey
//     ),
//     practiceKey: index("fact_invoice_practice_key_idx").on(
//       factInvoice.practiceKey
//     ),
//     acdate: index("fact_invoice_acdate_idx").on(factInvoice.acdate),
//   },
//   factInvoiceDetail: {
//     businessKey: uniqueIndex("fact_invoice_detail_business_key_idx").on(
//       factInvoiceDetail.invoiceDetailId,
//       factInvoiceDetail.practiceId,
//       factInvoiceDetail.perOrgId
//     ),
//     invoiceDetailId: index("fact_invoice_detail_invoice_detail_id_idx").on(
//       factInvoiceDetail.invoiceDetailId
//     ),
//     invoiceKey: index("fact_invoice_detail_invoice_key_idx").on(
//       factInvoiceDetail.invoiceKey
//     ),
//     invoiceTransactionId: index(
//       "fact_invoice_detail_invoice_transaction_id_idx"
//     ).on(factInvoiceDetail.invoiceTransactionId),
//   },
//   factDiagnosis: {
//     businessKey: uniqueIndex("fact_diagnosis_business_key_idx").on(
//       factDiagnosis.diagnosisId,
//       factDiagnosis.practiceId,
//       factDiagnosis.perOrgId
//     ),
//     diagnosisId: index("fact_diagnosis_diagnosis_id_idx").on(
//       factDiagnosis.diagnosisId
//     ),
//     patientKey: index("fact_diagnosis_patient_key_idx").on(
//       factDiagnosis.patientKey
//     ),
//     providerKey: index("fact_diagnosis_provider_key_idx").on(
//       factDiagnosis.providerKey
//     ),
//     practiceKey: index("fact_diagnosis_practice_key_idx").on(
//       factDiagnosis.practiceKey
//     ),
//     diagnosisDate: index("fact_diagnosis_diagnosis_date_idx").on(
//       factDiagnosis.diagnosisDate
//     ),
//   },
//   factMeasurement: {
//     businessKey: uniqueIndex("fact_measurement_business_key_idx").on(
//       factMeasurement.patientId,
//       factMeasurement.practiceId,
//       factMeasurement.perOrgId
//     ),
//     patientKey: index("fact_measurement_patient_key_idx").on(
//       factMeasurement.patientKey
//     ),
//     practiceKey: index("fact_measurement_practice_key_idx").on(
//       factMeasurement.practiceKey
//     ),
//     screeningDate: index("fact_measurement_screening_date_idx").on(
//       factMeasurement.screeningDate
//     ),
//     screeningType: index("fact_measurement_screening_type_idx").on(
//       factMeasurement.screeningType
//     ),
//   },
// };

// // ETL schema indexes - optimized for monitoring and operations
// export const etlIndexes = {
//   loadRuns: {
//     status: index("load_runs_status_idx").on(loadRuns.status),
//     startedAt: index("load_runs_started_at_idx").on(loadRuns.startedAt),
//     triggeredBy: index("load_runs_triggered_by_idx").on(loadRuns.triggeredBy),
//   },
//   loadRunFiles: {
//     loadRunId: index("load_run_files_load_run_id_idx").on(
//       loadRunFiles.loadRunId
//     ),
//     s3VersionId: uniqueIndex("load_run_files_s3_version_id_idx").on(
//       loadRunFiles.s3VersionId,
//       loadRunFiles.fileHash
//     ),
//     extractType: index("load_run_files_extract_type_idx").on(
//       loadRunFiles.extractType
//     ),
//     status: index("load_run_files_status_idx").on(loadRunFiles.status),
//     perOrgId: index("load_run_files_per_org_id_idx").on(loadRunFiles.perOrgId),
//     practiceId: index("load_run_files_practice_id_idx").on(
//       loadRunFiles.practiceId
//     ),
//   },
//   dqResults: {
//     loadRunId: index("dq_results_load_run_id_idx").on(dqResults.loadRunId),
//     extractType: index("dq_results_extract_type_idx").on(dqResults.extractType),
//     pass: index("dq_results_pass_idx").on(dqResults.pass),
//     metricName: index("dq_results_metric_name_idx").on(dqResults.metricName),
//   },
//   health: {
//     extractType: index("health_extract_type_idx").on(health.extractType),
//     perOrgId: index("health_per_org_id_idx").on(health.perOrgId),
//     practiceId: index("health_practice_id_idx").on(health.practiceId),
//     isHealthy: index("health_is_healthy_idx").on(health.isHealthy),
//     lastSuccessfulRunAt: index("health_last_successful_run_at_idx").on(
//       health.lastSuccessfulRunAt
//     ),
//   },
//   config: {
//     extractType: index("config_extract_type_idx").on(config.extractType),
//     perOrgId: index("config_per_org_id_idx").on(config.perOrgId),
//     practiceId: index("config_practice_id_idx").on(config.practiceId),
//     isActive: index("config_is_active_idx").on(config.isActive),
//   },
//   extractConfig: {
//     extractType: index("extract_config_extract_type_idx").on(
//       extractConfig.extractType
//     ),
//     perOrgId: index("extract_config_per_org_id_idx").on(extractConfig.perOrgId),
//     practiceId: index("extract_config_practice_id_idx").on(
//       extractConfig.practiceId
//     ),
//     configKey: index("extract_config_config_key_idx").on(
//       extractConfig.configKey
//     ),
//     isActive: index("extract_config_is_active_idx").on(extractConfig.isActive),
//   },
//   dqThresholds: {
//     extractType: index("dq_thresholds_extract_type_idx").on(
//       dqThresholds.extractType
//     ),
//     perOrgId: index("dq_thresholds_per_org_id_idx").on(dqThresholds.perOrgId),
//     practiceId: index("dq_thresholds_practice_id_idx").on(
//       dqThresholds.practiceId
//     ),
//     metricName: index("dq_thresholds_metric_name_idx").on(
//       dqThresholds.metricName
//     ),
//     isActive: index("dq_thresholds_is_active_idx").on(dqThresholds.isActive),
//   },
// };
