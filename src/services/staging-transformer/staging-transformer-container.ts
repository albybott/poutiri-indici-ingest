/**
 * Staging Transformer Container
 * Dependency Injection container for staging transformer services
 */

import { DatabasePool } from "@/services/shared/database-pool";
import { ErrorHandler } from "@/services/raw-loader/error-handler";
import { StagingTransformerService } from "./staging-transformer-service";
import type { StagingTransformerConfig } from "./types/config";
import { defaultStagingTransformerConfig } from "./types/config";

/**
 * Staging Transformer Containe r
 * Creates and wires up all staging transformer dependencies
 */
export class StagingTransformerContainer {
  /**
   * Create a fully configured StagingTransformerService instance
   */
  static create(
    config?: Partial<StagingTransformerConfig>
  ): StagingTransformerService {
    // Merge with defaults
    const fullConfig: StagingTransformerConfig = {
      ...defaultStagingTransformerConfig,
      ...config,
      database: {
        ...defaultStagingTransformerConfig.database,
        ...config?.database,
      },
      transformation: {
        ...defaultStagingTransformerConfig.transformation,
        ...config?.transformation,
      },
      validation: {
        ...defaultStagingTransformerConfig.validation,
        ...config?.validation,
      },
      errorHandling: {
        ...defaultStagingTransformerConfig.errorHandling,
        ...config?.errorHandling,
      },
      monitoring: {
        ...defaultStagingTransformerConfig.monitoring,
        ...config?.monitoring,
      },
    };

    console.log("🏗️  Creating Staging Transformer Container");

    // Create shared infrastructure
    const dbPool = new DatabasePool(fullConfig.database);
    const errorHandler = new ErrorHandler(fullConfig.errorHandling);

    // Create main service
    const service = new StagingTransformerService(
      dbPool,
      errorHandler,
      fullConfig
    );

    console.log("✅ Staging Transformer Service ready");

    return service;
  }

  /**
   * Create a service for testing with mock dependencies
   */
  static createForTesting(
    dbPool: DatabasePool,
    errorHandler: ErrorHandler,
    config?: Partial<StagingTransformerConfig>
  ): StagingTransformerService {
    const fullConfig: StagingTransformerConfig = {
      ...defaultStagingTransformerConfig,
      ...config,
    };

    return new StagingTransformerService(dbPool, errorHandler, fullConfig);
  }
}
