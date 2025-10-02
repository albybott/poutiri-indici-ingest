/**
 * Core Merger Container
 * Dependency injection container for Core Merger Service
 */

import { Pool } from "pg";
import { CoreMergerService } from "./core-merger-service";
import type { CoreMergerConfig } from "./types/config";
import { defaultCoreMergerConfig } from "./types/config";
import { logger } from "../../shared/utils/logger";

/**
 * Partial configuration type with nested partials
 */
export type PartialCoreMergerConfig = {
  dimension?: Partial<CoreMergerConfig["dimension"]>;
  fact?: Partial<CoreMergerConfig["fact"]>;
  cache?: Partial<CoreMergerConfig["cache"]>;
  errorHandling?: Partial<CoreMergerConfig["errorHandling"]>;
  monitoring?: Partial<CoreMergerConfig["monitoring"]>;
};

export class CoreMergerContainer {
  /**
   * Create CoreMergerService with dependency injection
   */
  static create(
    config?: PartialCoreMergerConfig,
    databaseUrl?: string
  ): CoreMergerService {
    // Merge with default config
    const mergedConfig: CoreMergerConfig = {
      dimension: {
        ...defaultCoreMergerConfig.dimension,
        ...config?.dimension,
      },
      fact: {
        ...defaultCoreMergerConfig.fact,
        ...config?.fact,
      },
      cache: {
        ...defaultCoreMergerConfig.cache,
        ...config?.cache,
      },
      errorHandling: {
        ...defaultCoreMergerConfig.errorHandling,
        ...config?.errorHandling,
      },
      monitoring: {
        ...defaultCoreMergerConfig.monitoring,
        ...config?.monitoring,
      },
    };

    // Create database pool
    const dbUrl =
      databaseUrl ??
      process.env.DATABASE_URL ??
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    const pool = new Pool({
      connectionString: dbUrl,
      max:
        mergedConfig.dimension.maxConcurrentLoads +
        mergedConfig.fact.maxConcurrentLoads +
        5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: mergedConfig.dimension.timeoutMs,
    });

    // Create service
    const service = new CoreMergerService(pool, mergedConfig);

    logger.info("CoreMergerService created", {
      scd2Strategy: mergedConfig.dimension.scd2Strategy,
      dimensionBatchSize: mergedConfig.dimension.batchSize,
      factBatchSize: mergedConfig.fact.batchSize,
      cacheEnabled: mergedConfig.cache.enableDimensionCache,
    });

    return service;
  }

  /**
   * Create with existing database pool
   */
  static createWithPool(
    pool: Pool,
    config?: PartialCoreMergerConfig
  ): CoreMergerService {
    const mergedConfig: CoreMergerConfig = {
      dimension: {
        ...defaultCoreMergerConfig.dimension,
        ...config?.dimension,
      },
      fact: {
        ...defaultCoreMergerConfig.fact,
        ...config?.fact,
      },
      cache: {
        ...defaultCoreMergerConfig.cache,
        ...config?.cache,
      },
      errorHandling: {
        ...defaultCoreMergerConfig.errorHandling,
        ...config?.errorHandling,
      },
      monitoring: {
        ...defaultCoreMergerConfig.monitoring,
        ...config?.monitoring,
      },
    };

    return new CoreMergerService(pool, mergedConfig);
  }
}
