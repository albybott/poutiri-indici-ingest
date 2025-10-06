/**
 * Core Merger Service
 * Main orchestrator for loading staging data into core dimensional model
 */

import type { Pool } from "pg";
import { randomUUID } from "crypto";
import { DimensionLoader } from "./dimension/dimension-loader";
import { PatientDimensionHandler } from "./dimension/handlers/patient-dimension-handler";
import { ProviderDimensionHandler } from "./dimension/handlers/provider-dimension-handler";
import { PracticeDimensionHandler } from "./dimension/handlers/practice-dimension-handler";
import { MedicineDimensionHandler } from "./dimension/handlers/medicine-dimension-handler";
import { VaccineDimensionHandler } from "./dimension/handlers/vaccine-dimension-handler";
import { ForeignKeyResolver } from "./fact/foreign-key-resolver";
import { FactLoader } from "./fact/fact-loader";
import { appointmentFactConfig } from "./fact/handlers/appointment-fact-handler";
import { immunisationFactConfig } from "./fact/handlers/immunisation-fact-handler";
import { CoreAuditService } from "./core-audit-service";
import { CoreMergeRunService } from "./core-merge-run-service";
import { LoadMonitor } from "./load-monitor";
import type {
  CoreMergeOptions,
  CoreMergeResult,
  CoreMergeRunStatus,
} from "./types/core-merger";

import type { CoreMergerConfig } from "./types/config";
import { DimensionType } from "./types/scd2";
import { FactType } from "./types/fact";
import { logger } from "@/services/shared/utils/logger";

export class CoreMergerService {
  private pool: Pool;
  private config: CoreMergerConfig;
  private fkResolver: ForeignKeyResolver;
  private auditService: CoreAuditService;
  private mergeRunService: CoreMergeRunService;
  private loadMonitor: LoadMonitor;

  constructor(pool: Pool, config: CoreMergerConfig) {
    this.pool = pool;
    this.config = config;
    this.fkResolver = new ForeignKeyResolver(
      pool,
      config.cache.enableDimensionCache,
      config.cache.maxCacheSize,
      config.cache.cacheTtlMs
    );
    this.auditService = new CoreAuditService(pool);
    this.mergeRunService = new CoreMergeRunService();
    this.loadMonitor = new LoadMonitor();
  }

  /**
   * Merge staging data to core
   */
  async mergeToCore(options: CoreMergeOptions): Promise<CoreMergeResult> {
    const startedAt = new Date();

    logger.info(`Starting core merge`, {
      stagingRunId: options.stagingRunId,
      extractTypes: options.extractTypes,
    });

    // Get staging run details to extract loadRunId and extractType
    const stagingRun = await this.getStagingRunDetails(options.stagingRunId);
    if (!stagingRun) {
      throw new Error(`Staging run ${options.stagingRunId} not found`);
    }

    logger.info(`Found staging run`, {
      loadRunId: stagingRun.loadRunId,
      extractType: stagingRun.extractType,
    });

    // Check if staging run already merged
    const existing = await this.checkExistingMerge(options.stagingRunId);

    // If merge has already completed
    if (existing && existing.status === "completed") {
      logger.info(`Staging run already merged`, {
        stagingRunId: options.stagingRunId,
        mergeRunId: existing.mergeRunId,
      });

      // If not forcing reprocessing, return the cached result
      if (!options.forceReprocess) {
        logger.info(`Returning existing merge run`, {
          stagingRunId: options.stagingRunId,
          mergeRunId: existing.mergeRunId,
        });
        return existing.result!;
      } else {
        logger.info(`Force reprocessing staging run`, {
          stagingRunId: options.stagingRunId,
        });
      }
    }

    // Create or use existing merge run id
    const mergeRunId =
      existing?.mergeRunId ??
      (await this.mergeRunService.createRun({
        loadRunId: stagingRun.loadRunId,
        stagingRunId: options.stagingRunId,
        extractType: stagingRun.extractType,
      }));

    // Start monitoring
    // TODO: Calculate actual item count from staging data instead of using placeholder
    const totalEstimatedItems = 1000; // Placeholder estimate for monitoring progress
    this.loadMonitor.startMonitoring(mergeRunId, totalEstimatedItems);

    const result: CoreMergeResult = {
      mergeRunId,
      stagingRunId: options.stagingRunId,
      loadRunId: stagingRun.loadRunId,
      extractTypes: options.extractTypes ?? [],
      dimensionResults: new Map(),
      factResults: new Map(),
      dimensionsCreated: 0,
      dimensionsUpdated: 0,
      factsInserted: 0,
      factsUpdated: 0,
      totalErrors: 0,
      totalWarnings: 0,
      durationMs: 0,
      status: "completed",
      startedAt,
      dryRun: options.dryRun ?? false,
    };

    try {
      // Phase 1: Load dimensions (in dependency order)
      this.loadMonitor.updatePhase(mergeRunId, "dimensions");
      await this.loadDimensions(mergeRunId, options, result, stagingRun);

      // Phase 2: Preload dimension cache for FK resolution
      logger.info("Preloading dimension cache for FK resolution");
      await this.fkResolver.preloadCache();

      // Phase 3: Load facts
      this.loadMonitor.updatePhase(mergeRunId, "facts");
      await this.loadFacts(mergeRunId, options, result, stagingRun);

      // Complete
      result.status = "completed";
      result.completedAt = new Date();
      result.durationMs = result.completedAt.getTime() - startedAt.getTime();

      this.loadMonitor.completeMonitoring(mergeRunId);

      // Record merge run completion
      await this.mergeRunService.completeRun(mergeRunId, result);

      logger.info(`Core merge completed`, {
        mergeRunId,
        dimensionsCreated: result.dimensionsCreated,
        dimensionsUpdated: result.dimensionsUpdated,
        factsInserted: result.factsInserted,
        durationMs: result.durationMs,
      });
    } catch (error) {
      result.status = "failed";
      result.completedAt = new Date();
      result.durationMs = result.completedAt.getTime() - startedAt.getTime();

      logger.error("Core merge failed", {
        mergeRunId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Record failure
      await this.mergeRunService.failRun(
        mergeRunId,
        error instanceof Error ? error.message : String(error)
      );

      throw error;
    }

    return result;
  }

  /**
   * Load dimensions in dependency order
   */
  private async loadDimensions(
    mergeRunId: string,
    options: CoreMergeOptions,
    result: CoreMergeResult,
    stagingRun: { loadRunId: string; extractType: string }
  ): Promise<void> {
    // Define load order (based on dependencies)
    const dimensionLoadOrder = [
      DimensionType.PRACTICE, // No dependencies
      DimensionType.PATIENT, // Depends on practice
      DimensionType.PROVIDER, // Depends on practice
    ];

    for (const dimensionType of dimensionLoadOrder) {
      // Check if this extract type should be processed
      const extractType = this.getExtractTypeForDimension(dimensionType);
      if (
        options.extractTypes &&
        options.extractTypes.length > 0 &&
        !options.extractTypes.includes(extractType)
      ) {
        logger.info(`Skipping ${dimensionType} - not in extract types`);
        continue;
      }

      this.loadMonitor.updateProgress(mergeRunId, 0, dimensionType);

      try {
        const handler = this.getDimensionHandler(dimensionType);
        const loader = new DimensionLoader(
          this.pool,
          handler,
          this.config.dimension.scd2Strategy === "hash"
        );

        const dimResult = await loader.loadDimension({
          loadRunId: stagingRun.loadRunId,
          stagingRunId: options.stagingRunId,
          extractType,
          batchSize: options.batchSize ?? this.config.dimension.batchSize,
          enableSCD2: this.config.dimension.enableSCD2,
          dryRun: options.dryRun,
          continueOnError: this.config.errorHandling.continueOnError,
        });

        result.dimensionResults.set(dimensionType, dimResult);
        result.dimensionsCreated += dimResult.recordsCreated;
        result.dimensionsUpdated += dimResult.recordsUpdated;
        result.totalErrors += dimResult.errors.length;
        result.totalWarnings += dimResult.warnings.length;

        logger.info(`Completed loading ${dimensionType}`, {
          created: dimResult.recordsCreated,
          updated: dimResult.recordsUpdated,
          skipped: dimResult.recordsSkipped,
        });
      } catch (error) {
        logger.error(`Failed to load ${dimensionType}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        if (!this.config.errorHandling.continueOnError) {
          throw error;
        }
      }
    }
  }

  /**
   * Load facts
   */
  private async loadFacts(
    mergeRunId: string,
    options: CoreMergeOptions,
    result: CoreMergeResult,
    stagingRun: { loadRunId: string; extractType: string }
  ): Promise<void> {
    // Define fact load order
    const factLoadOrder = [
      FactType.APPOINTMENT, // Primary fact
    ];

    for (const factType of factLoadOrder) {
      // Check if this extract type should be processed
      const extractType = this.getExtractTypeForFact(factType);
      if (
        options.extractTypes &&
        options.extractTypes.length > 0 &&
        !options.extractTypes.includes(extractType)
      ) {
        logger.debug(`Skipping ${factType} - not in extract types`);
        continue;
      }

      this.loadMonitor.updateProgress(mergeRunId, 0, undefined, factType);

      try {
        const factConfig = this.getFactConfig(factType);
        const factLoader = new FactLoader(
          this.pool,
          factConfig,
          this.fkResolver
        );

        const factResult = await factLoader.loadFacts({
          loadRunId: stagingRun.loadRunId,
          stagingRunId: options.stagingRunId,
          extractType,
          batchSize: options.batchSize ?? this.config.fact.batchSize,
          validateFKs: this.config.fact.enableFKValidation,
          dryRun: options.dryRun,
          continueOnError: this.config.errorHandling.continueOnError,
        });

        result.factResults.set(factType, factResult);
        result.factsInserted += factResult.recordsInserted;
        result.factsUpdated += factResult.recordsUpdated;
        result.totalErrors += factResult.errors.length;
        result.totalWarnings += factResult.warnings.length;

        logger.info(`Completed loading ${factType}`, {
          inserted: factResult.recordsInserted,
          updated: factResult.recordsUpdated,
          skipped: factResult.recordsSkipped,
        });
      } catch (error) {
        logger.error(`Failed to load ${factType}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        if (!this.config.errorHandling.continueOnError) {
          throw error;
        }
      }
    }
  }

  /**
   * Get dimension handler by type
   */
  private getDimensionHandler(dimensionType: DimensionType) {
    switch (dimensionType) {
      case DimensionType.PATIENT:
        return new PatientDimensionHandler();
      case DimensionType.PROVIDER:
        return new ProviderDimensionHandler();
      case DimensionType.PRACTICE:
        return new PracticeDimensionHandler();
      case DimensionType.MEDICINE:
        return new MedicineDimensionHandler();
      case DimensionType.VACCINE:
        return new VaccineDimensionHandler();
      default:
        throw new Error(`Unknown dimension type: ${dimensionType}`);
    }
  }

  /**
   * Get fact config by type
   */
  private getFactConfig(factType: FactType) {
    switch (factType) {
      case FactType.APPOINTMENT:
        return appointmentFactConfig;
      case FactType.IMMUNISATION:
        return immunisationFactConfig;
      default:
        throw new Error(`Unknown fact type: ${factType}`);
    }
  }

  /**
   * Map dimension type to extract type
   */
  private getExtractTypeForDimension(dimensionType: DimensionType): string {
    const mapping: Record<DimensionType, string> = {
      [DimensionType.PATIENT]: "Patient",
      [DimensionType.PROVIDER]: "Provider",
      [DimensionType.PRACTICE]: "PracticeInfo",
      [DimensionType.VACCINE]: "Vaccine",
      [DimensionType.MEDICINE]: "Medicine",
    };
    return mapping[dimensionType];
  }

  /**
   * Map fact type to extract type
   */
  private getExtractTypeForFact(factType: FactType): string {
    const mapping: Record<FactType, string> = {
      [FactType.APPOINTMENT]: "Appointment",
      [FactType.IMMUNISATION]: "Immunisation",
      [FactType.INVOICE]: "Invoice",
      [FactType.INVOICE_DETAIL]: "InvoiceDetail",
      [FactType.DIAGNOSIS]: "Diagnosis",
      [FactType.MEASUREMENT]: "Measurement",
    };
    return mapping[factType];
  }

  /**
   * Check if load run already merged
   */
  private async checkExistingMerge(
    stagingRunId: string
  ): Promise<CoreMergeRunStatus | null> {
    try {
      const existingRun =
        await this.mergeRunService.getExistingMergeRun(stagingRunId);
      if (!existingRun) {
        return null;
      }

      return {
        mergeRunId: existingRun.mergeRunId,
        stagingRunId: existingRun.stagingRunId,
        loadRunId: existingRun.loadRunId,
        extractType: existingRun.extractType,
        status: existingRun.status as "running" | "completed" | "failed",
        startedAt: existingRun.startedAt,
        completedAt: existingRun.completedAt || undefined,
        result: existingRun.result ? JSON.parse(existingRun.result) : undefined,
      };
    } catch (error) {
      logger.warn("Failed to check existing merge", {
        stagingRunId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get staging run details needed for merge operation
   */
  private async getStagingRunDetails(stagingRunId: string): Promise<{
    loadRunId: string;
    extractType: string;
  } | null> {
    try {
      const stagingRunService = new (
        await import("../../services/staging-transformer/staging-run-service")
      ).StagingRunService();
      const stagingRun = await stagingRunService.getRun(stagingRunId);

      if (!stagingRun) {
        return null;
      }

      return {
        loadRunId: stagingRun.loadRunId,
        extractType: stagingRun.extractType,
      };
    } catch (error) {
      logger.error("Failed to get staging run details", {
        stagingRunId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get load progress
   */
  getLoadProgress(mergeRunId: string) {
    return this.loadMonitor.getProgress(mergeRunId);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query("SELECT 1");
      return result.rows.length > 0;
    } catch (error) {
      logger.error("Health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    // No explicit close needed - pool managed externally
    logger.info("Core merger service closed");
  }
}
