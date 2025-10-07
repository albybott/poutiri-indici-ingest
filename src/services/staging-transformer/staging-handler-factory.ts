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
import { diagnosisTransformations } from "./configs/diagnosis-transformations";
import { allergiesTransformations } from "./configs/allergies-transformations";
import { ExtractHandlerFactory } from "../raw-loader/extract-handler-factory";

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
  }
}
