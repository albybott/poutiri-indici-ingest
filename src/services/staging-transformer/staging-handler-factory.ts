/**
 * Staging Handler Factory
 * Creates StagingExtractHandler instances for different extract types
 */

import type { StagingExtractHandler } from "./types/transformer";
import type { ExtractType } from "@/services/discovery/types/config";

// Import transformation configurations
import { patientsTransformations } from "./configs/patients-transformations";
import { appointmentsTransformations } from "./configs/appointments-transformations";
import { providersTransformations } from "./configs/providers-transformations";
import { practiceInfoTransformations } from "./configs/practice-info-transformations";
import { medicineTransformations } from "./configs/medicine-transformations";
import { vaccineTransformations } from "./configs/vaccine-transformations";
import { immunisationTransformations } from "./configs/immunisation-transformations";
import { diagnosisTransformations } from "./configs/diagnoses-transformations";
import { allergiesTransformations } from "./configs/allergies-transformations";
import { appointmentMedicationsTransformations } from "./configs/appointment-medications-transformations";
import { inboxTransformations } from "./configs/inbox-transformations";
import { inboxDetailTransformations } from "./configs/inbox-detail-transformations";
import { ExtractHandlerFactory } from "../raw-loader/extract-handler-factory";
import { invoiceDetailTransformations } from "./configs/invoice-detail-transformations";
import { invoicesTransformations } from "./configs/invoices-transformations";
import { measurementsTransformations } from "./configs/measurements-transformations";
import { nextOfKinTransformations } from "./configs/next-of-kin-transformations";
import { patientAlertsTransformations } from "./configs/patient-alerts-transformations";
/**
 * Staging Handler Factory
 * Creates handlers for different extract types
 */
export class StagingHandlerFactory {
  private handlers: Map<string, StagingExtractHandler> = new Map();
  private rawHandlerFactory: ExtractHandlerFactory;

  constructor() {
    this.rawHandlerFactory = new ExtractHandlerFactory();
    this.registerDefaultHandlers();
  }

  /**
   * Get handler for specific extract type
   */
  async getHandler(extractType: ExtractType): Promise<StagingExtractHandler> {
    console.log(
      `🔍 Looking for staging handler for extract type: "${extractType}"`
    );
    console.log(
      `📋 Available staging handlers: [${Array.from(this.handlers.keys()).join(", ")}]`
    );

    const handler = this.handlers.get(extractType.toLowerCase());

    if (!handler) {
      console.error(
        `❌ No staging handler found for extract type: "${extractType}"`
      );
      throw new Error(
        `No staging handler registered for extract type: ${extractType}`
      );
    }

    console.log(`✅ Found staging handler: ${handler.extractType}`);
    return handler;
  }

  /**
   * Get all registered handlers
   */
  async getAllHandlers(): Promise<StagingExtractHandler[]> {
    return Array.from(this.handlers.values());
  }

  /**
   * Register a custom handler
   */
  async registerHandler(handler: StagingExtractHandler): Promise<void> {
    this.handlers.set(handler.extractType.toLowerCase(), handler);
  }

  /**
   * Register all default handlers
   */
  private registerDefaultHandlers(): void {
    // Patient handler
    const patientHandler: StagingExtractHandler = {
      extractType: "Patient",
      sourceTable: "raw.patients",
      targetTable: "stg.patients",
      naturalKeys: ["patientId", "practiceId", "perOrgId"],
      transformations: patientsTransformations,
      sourceColumns: this.rawHandlerFactory.getHandler("Patient").columnMapping,
    };
    this.handlers.set("patient", patientHandler);

    // Appointments handler
    const appointmentsHandler: StagingExtractHandler = {
      extractType: "Appointments",
      sourceTable: "raw.appointments",
      targetTable: "stg.appointments",
      naturalKeys: ["appointmentId", "practiceId", "perOrgId"],
      transformations: appointmentsTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Appointments").columnMapping,
    };
    this.handlers.set("appointments", appointmentsHandler);

    // Provider handler
    const providerHandler: StagingExtractHandler = {
      extractType: "Provider",
      sourceTable: "raw.providers",
      targetTable: "stg.providers",
      naturalKeys: ["providerId", "practiceId", "perOrgId"],
      transformations: providersTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Provider").columnMapping,
    };
    this.handlers.set("provider", providerHandler);

    // PracticeInfo handler
    const practiceInfoHandler: StagingExtractHandler = {
      extractType: "PracticeInfo",
      sourceTable: "raw.practice_info",
      targetTable: "stg.practice_info",
      naturalKeys: ["practiceId", "perOrgId"],
      transformations: practiceInfoTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("PracticeInfo").columnMapping,
    };
    this.handlers.set("practiceinfo", practiceInfoHandler);

    // Medicine handler
    const medicineHandler: StagingExtractHandler = {
      extractType: "Medicine",
      sourceTable: "raw.medicine",
      targetTable: "stg.medicine",
      naturalKeys: ["medicineId", "practiceId", "perOrgId"],
      transformations: medicineTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Medicine").columnMapping,
    };
    this.handlers.set("medicine", medicineHandler);

    // Vaccine handler
    const vaccineHandler: StagingExtractHandler = {
      extractType: "Vaccine",
      sourceTable: "raw.vaccine",
      targetTable: "stg.vaccine",
      naturalKeys: ["vaccineId", "practiceId", "perOrgId"],
      transformations: vaccineTransformations,
      sourceColumns: this.rawHandlerFactory.getHandler("Vaccine").columnMapping,
    };
    this.handlers.set("vaccine", vaccineHandler);

    // Immunisation handler
    const immunisationHandler: StagingExtractHandler = {
      extractType: "Immunisation",
      sourceTable: "raw.immunisation",
      targetTable: "stg.immunisation",
      naturalKeys: ["appointmentImmunisationId", "practiceId", "perOrgId"],
      transformations: immunisationTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Immunisation").columnMapping,
    };
    this.handlers.set("immunisation", immunisationHandler);

    // Diagnosis handler
    const diagnosisHandler: StagingExtractHandler = {
      extractType: "Diagnosis",
      sourceTable: "raw.diagnoses",
      targetTable: "stg.diagnoses",
      naturalKeys: ["diagnosisId", "practiceId", "perOrgId"],
      transformations: diagnosisTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Diagnosis").columnMapping,
    };
    this.handlers.set("diagnosis", diagnosisHandler);

    // Allergies handler
    const allergiesHandler: StagingExtractHandler = {
      extractType: "Allergies",
      sourceTable: "raw.allergies",
      targetTable: "stg.allergies",
      naturalKeys: ["allergyId", "practiceId", "perOrgId"],
      transformations: allergiesTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Allergies").columnMapping,
    };
    this.handlers.set("allergies", allergiesHandler);

    // AppointmentMedications handler
    const appointmentMedicationsHandler: StagingExtractHandler = {
      extractType: "AppointmentMedications",
      sourceTable: "raw.appointment_medications",
      targetTable: "stg.appointment_medications",
      naturalKeys: ["medicationId", "practiceId", "perOrgId"],
      transformations: appointmentMedicationsTransformations,
      sourceColumns: this.rawHandlerFactory.getHandler("AppointmentMedications")
        .columnMapping,
    };
    this.handlers.set("appointmentmedications", appointmentMedicationsHandler);

    // Inbox handler
    const inboxHandler: StagingExtractHandler = {
      extractType: "Inbox",
      sourceTable: "raw.inbox",
      targetTable: "stg.inbox",
      naturalKeys: ["inboxFolderItemId", "practiceId", "perOrgId"],
      transformations: inboxTransformations,
      sourceColumns: this.rawHandlerFactory.getHandler("Inbox").columnMapping,
    };
    this.handlers.set("inbox", inboxHandler);

    // InboxDetail handler
    const inboxDetailHandler: StagingExtractHandler = {
      extractType: "InboxDetail",
      sourceTable: "raw.inbox_detail",
      targetTable: "stg.inbox_detail",
      naturalKeys: ["inBoxFolderItemInLineId", "practiceId", "perOrgId"],
      transformations: inboxDetailTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("InboxDetail").columnMapping,
    };
    this.handlers.set("inboxdetail", inboxDetailHandler);

    // InvoiceDetail handler
    const invoiceDetailHandler: StagingExtractHandler = {
      extractType: "InvoiceDetail",
      sourceTable: "raw.invoice_detail",
      targetTable: "stg.invoice_detail",
      naturalKeys: ["invoiceDetailId", "practiceId", "perOrgId"],
      transformations: invoiceDetailTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("InvoiceDetail").columnMapping,
    };
    this.handlers.set("invoicedetail", invoiceDetailHandler);

    // Invoices handler
    const invoicesHandler: StagingExtractHandler = {
      extractType: "Invoices",
      sourceTable: "raw.invoices",
      targetTable: "stg.invoices",
      naturalKeys: ["invoiceTransactionId", "practiceId", "perOrgId"],
      transformations: invoicesTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Invoices").columnMapping,
    };
    this.handlers.set("invoices", invoicesHandler);

    // Measurements handler
    const measurementsHandler: StagingExtractHandler = {
      extractType: "Measurements",
      sourceTable: "raw.measurements",
      targetTable: "stg.measurements",
      naturalKeys: ["screeningId", "practiceId", "perOrgId"],
      transformations: measurementsTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("Measurements").columnMapping,
    };
    this.handlers.set("measurements", measurementsHandler);

    // NextOfKin handler
    const nextOfKinHandler: StagingExtractHandler = {
      extractType: "NextOfKin",
      sourceTable: "raw.next_of_kin",
      targetTable: "stg.next_of_kin",
      naturalKeys: ["nextToKinId", "practiceId", "perOrgId"],
      transformations: nextOfKinTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("NextOfKin").columnMapping,
    };
    this.handlers.set("nextofkin", nextOfKinHandler);

    // PatientAlerts handler
    const patientAlertsHandler: StagingExtractHandler = {
      extractType: "PatientAlerts",
      sourceTable: "raw.patient_alerts",
      targetTable: "stg.patient_alerts",
      naturalKeys: ["patientAlertId", "practiceId", "perOrgId"],
      transformations: patientAlertsTransformations,
      sourceColumns:
        this.rawHandlerFactory.getHandler("PatientAlerts").columnMapping,
    };
    this.handlers.set("patientalerts", patientAlertsHandler);
  }
}
