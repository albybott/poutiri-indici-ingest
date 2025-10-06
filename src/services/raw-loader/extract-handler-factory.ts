import type { ExtractHandler } from "./types/raw-loader";
import { AllergiesSchemaHandler } from "./handlers/allergies-schema-handler";
import { AppointmentMedicationsSchemaHandler } from "./handlers/appointment-medications-schema-handler";
import { AppointmentsSchemaHandler } from "./handlers/appointments-schema-handler";
import { DiagnosesSchemaHandler } from "./handlers/diagnoses-schema-handler";
import { ImmunisationSchemaHandler } from "./handlers/immunisation-schema-handler";
import { InboxSchemaHandler } from "./handlers/inbox-schema-handler";
import { InboxDetailSchemaHandler } from "./handlers/inbox-detail-schema-handler";
import { InvoiceDetailSchemaHandler } from "./handlers/invoice-detail-schema-handler";
import { InvoicesSchemaHandler } from "./handlers/invoices-schema-handler";
import { MeasurementsSchemaHandler } from "./handlers/measurements-schema-handler";
import { MedicineSchemaHandler } from "./handlers/medicine-schema-handler";
import { NextOfKinSchemaHandler } from "./handlers/next-of-kin-schema-handler";
import { PatientsSchemaHandler } from "./handlers/patients-schema-handler";
import { PatientAlertsSchemaHandler } from "./handlers/patient-alerts-schema-handler";
import { PracticeInfoSchemaHandler } from "./handlers/practice-info-schema-handler";
import { ProvidersSchemaHandler } from "./handlers/providers-schema-handler";
import { RecallsSchemaHandler } from "./handlers/recalls-schema-handler";
import { VaccineSchemaHandler } from "./handlers/vaccine-schema-handler";

/**
 * Extract Handler Factory - creates handlers for different extract types
 */
export class ExtractHandlerFactory {
  private handlers: Map<string, ExtractHandler> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Get handler for specific extract type
   */
  async getHandler(extractType: string): Promise<ExtractHandler> {
    console.log(`🔍 Looking for handler for extract type: "${extractType}"`);
    console.log(
      `📋 Available handlers: [${Array.from(this.handlers.keys()).join(", ")}]`
    );

    // A handler is a function that will be used to load the data into the database
    // It contains the column mapping, validation rules, and other metadata needed to load the data into the database
    const handler = this.handlers.get(extractType);

    if (!handler) {
      console.error(`❌ No handler found for extract type: "${extractType}"`);
      throw new Error(`No handler registered for extract type: ${extractType}`);
    }

    console.log(`✅ Found handler: ${handler.extractType}`);
    return handler;
  }

  /**
   * Register a custom handler
   */
  async registerHandler(handler: ExtractHandler): Promise<void> {
    this.handlers.set(handler.extractType.toLowerCase(), handler);
  }

  /**
   * Get all registered handlers
   */
  async getAllHandlers(): Promise<ExtractHandler[]> {
    return Array.from(this.handlers.values());
  }

  /**
   * Validate handler configuration
   */
  async validateHandler(handler: ExtractHandler): Promise<boolean> {
    // Validate handler has required properties
    if (!handler.extractType || !handler.tableName || !handler.columnMapping) {
      return false;
    }

    // Validate column mapping matches expected schema
    // This would check against actual database schema
    return true;
  }

  /**
   * Register all default handlers
   */
  private registerDefaultHandlers(): void {
    // Register all schema-driven handlers
    const allergiesHandler = new AllergiesSchemaHandler();
    this.handlers.set("Allergy", allergiesHandler);

    const appointmentMedicationsHandler =
      new AppointmentMedicationsSchemaHandler();
    this.handlers.set("AppointmentMedication", appointmentMedicationsHandler);

    const appointmentsHandler = new AppointmentsSchemaHandler();
    this.handlers.set("Appointment", appointmentsHandler);

    const diagnosesHandler = new DiagnosesSchemaHandler();
    this.handlers.set("Diagnose", diagnosesHandler);

    const immunisationHandler = new ImmunisationSchemaHandler();
    this.handlers.set("Immunisation", immunisationHandler);

    const inboxHandler = new InboxSchemaHandler();
    this.handlers.set("Inbox", inboxHandler);

    const inboxDetailHandler = new InboxDetailSchemaHandler();
    this.handlers.set("InboxDetail", inboxDetailHandler);

    const invoiceDetailHandler = new InvoiceDetailSchemaHandler();
    this.handlers.set("InvoiceDetail", invoiceDetailHandler);

    const invoicesHandler = new InvoicesSchemaHandler();
    this.handlers.set("Invoice", invoicesHandler);

    const measurementsHandler = new MeasurementsSchemaHandler();
    this.handlers.set("Measurement", measurementsHandler);

    const medicineHandler = new MedicineSchemaHandler();
    this.handlers.set("Medicine", medicineHandler);

    const nextOfKinHandler = new NextOfKinSchemaHandler();
    this.handlers.set("NextOfKin", nextOfKinHandler);

    const patientsHandler = new PatientsSchemaHandler();
    this.handlers.set("Patient", patientsHandler);

    const patientAlertsHandler = new PatientAlertsSchemaHandler();
    this.handlers.set("PatientAlert", patientAlertsHandler);

    const practiceInfoHandler = new PracticeInfoSchemaHandler();
    this.handlers.set("PracticeInfo", practiceInfoHandler);

    const providersHandler = new ProvidersSchemaHandler();
    this.handlers.set("Provider", providersHandler);

    const recallsHandler = new RecallsSchemaHandler();
    this.handlers.set("Recall", recallsHandler);

    const vaccineHandler = new VaccineSchemaHandler();
    this.handlers.set("Vaccine", vaccineHandler);
  }
}
