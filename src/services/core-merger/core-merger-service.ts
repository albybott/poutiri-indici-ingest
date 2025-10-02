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
import { ForeignKeyResolver } from "./fact/foreign-key-resolver";
import { FactLoader } from "./fact/fact-loader";
import { appointmentFactConfig } from "./fact/handlers/appointment-fact-handler";
import { CoreAuditService } from "./core-audit-service";
import { LoadMonitor } from "./load-monitor";
import type {
  CoreMergeOptions,
  CoreMergeResult,
  CoreMergeRunStatus,
} from "./types/core-merger";
import type { CoreMergerConfig } from "./types/config";
import { DimensionType } from "./types/scd2";
import { FactType } from "./types/fact";
import { logger } from "../../shared/utils/logger";

export class CoreMergerService {
  private pool: Pool;
  private config: CoreMergerConfig;
  private fkResolver: ForeignKeyResolver;
  private auditService: CoreAuditService;
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
    this.loadMonitor = new LoadMonitor();
  }

  /**
   * Merge staging data to core
   */
  async mergeToCore(options: CoreMergeOptions): Promise<CoreMergeResult> {
    const mergeRunId = randomUUID();
    const startedAt = new Date();

    logger.info(`Starting core merge`, {
      mergeRunId,
      loadRunId: options.loadRunId,
      extractTypes: options.extractTypes,
    });

    // Check idempotency (unless forced)
    if (!options.forceReprocess) {
      const existing = await this.checkExistingMerge(options.loadRunId);
      if (existing && existing.status === "completed") {
        logger.info(`Load run already merged - returning cached result`, {
          loadRunId: options.loadRunId,
          mergeRunId: existing.mergeRunId,
        });
        return existing.result!;
      }
    }

    // Record merge run start
    await this.recordMergeRunStart(mergeRunId, options.loadRunId);

    // Start monitoring
    // TODO: Calculate actual item count from staging data instead of using placeholder
    const totalEstimatedItems = 1000; // Placeholder estimate for monitoring progress
    this.loadMonitor.startMonitoring(mergeRunId, totalEstimatedItems);

    const result: CoreMergeResult = {
      mergeRunId,
      loadRunId: options.loadRunId,
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
      await this.loadDimensions(mergeRunId, options, result);

      // Phase 2: Preload dimension cache for FK resolution
      logger.info("Preloading dimension cache for FK resolution");
      await this.fkResolver.preloadCache();

      // Phase 3: Load facts
      this.loadMonitor.updatePhase(mergeRunId, "facts");
      await this.loadFacts(mergeRunId, options, result);

      // Complete
      result.status = "completed";
      result.completedAt = new Date();
      result.durationMs = result.completedAt.getTime() - startedAt.getTime();

      this.loadMonitor.completeMonitoring(mergeRunId);

      // Record merge run completion
      await this.recordMergeRunComplete(mergeRunId, options.loadRunId, result);

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
      await this.recordMergeRunFailure(
        mergeRunId,
        options.loadRunId,
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
    result: CoreMergeResult
  ): Promise<void> {
    // Define load order (based on dependencies)
    const dimensionLoadOrder = [
      // DimensionType.PRACTICE, // No dependencies
      DimensionType.PATIENT, // Depends on practice
      // DimensionType.PROVIDER, // Depends on practice
    ];

    for (const dimensionType of dimensionLoadOrder) {
      // Check if this extract type should be processed
      const extractType = this.getExtractTypeForDimension(dimensionType);
      if (
        options.extractTypes &&
        options.extractTypes.length > 0 &&
        !options.extractTypes.includes(extractType)
      ) {
        logger.debug(`Skipping ${dimensionType} - not in extract types`);
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
          loadRunId: options.loadRunId,
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
    result: CoreMergeResult
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
          loadRunId: options.loadRunId,
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
    loadRunId: string
  ): Promise<CoreMergeRunStatus | null> {
    const query = `
      SELECT *
      FROM etl.core_merge_runs
      WHERE load_run_id = $1
        AND status = 'completed'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [loadRunId]);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        mergeRunId: row.merge_run_id,
        loadRunId: row.load_run_id,
        extractType: row.extract_type,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        result: row.result ? JSON.parse(row.result) : undefined,
      };
    } catch (error) {
      logger.warn("Failed to check existing merge", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Record merge run start
   */
  private async recordMergeRunStart(
    mergeRunId: string,
    loadRunId: string
  ): Promise<void> {
    const query = `
      INSERT INTO etl.core_merge_runs (
        merge_run_id,
        load_run_id,
        extract_type,
        started_at,
        status
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    try {
      await this.pool.query(query, [
        mergeRunId,
        loadRunId,
        "Multiple", // Can track multiple extract types
        new Date(),
        "running",
      ]);
    } catch (error) {
      logger.error("Failed to record merge run start", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Record merge run completion
   */
  private async recordMergeRunComplete(
    mergeRunId: string,
    loadRunId: string,
    result: CoreMergeResult
  ): Promise<void> {
    const query = `
      UPDATE etl.core_merge_runs
      SET completed_at = $1,
          status = $2,
          dimensions_created = $3,
          dimensions_updated = $4,
          facts_inserted = $5,
          facts_updated = $6,
          result = $7
      WHERE merge_run_id = $8
    `;

    try {
      await this.pool.query(query, [
        new Date(),
        result.status,
        result.dimensionsCreated,
        result.dimensionsUpdated,
        result.factsInserted,
        result.factsUpdated,
        JSON.stringify(result),
        mergeRunId,
      ]);
    } catch (error) {
      logger.error("Failed to record merge run completion", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Record merge run failure
   */
  private async recordMergeRunFailure(
    mergeRunId: string,
    loadRunId: string,
    errorMessage: string
  ): Promise<void> {
    const query = `
      UPDATE etl.core_merge_runs
      SET completed_at = $1,
          status = $2,
          error = $3
      WHERE merge_run_id = $4
    `;

    try {
      await this.pool.query(query, [
        new Date(),
        "failed",
        errorMessage,
        mergeRunId,
      ]);
    } catch (error) {
      logger.error("Failed to record merge run failure", {
        error: error instanceof Error ? error.message : String(error),
      });
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
