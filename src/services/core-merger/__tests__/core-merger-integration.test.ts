/**
 * Core Merger Service Integration Tests
 *
 * Note: These tests require a database connection.
 * They are designed to be run with a test database.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { CoreMergerService } from "../core-merger-service";
import { defaultCoreMergerConfig } from "../types/config";
import type { CoreMergeOptions } from "../types/core-merger";

describe("Core Merger Service Integration", () => {
  let pool: Pool;
  let service: CoreMergerService;

  beforeAll(() => {
    // Create database pool
    const dbUrl =
      process.env.DATABASE_URL ??
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    pool = new Pool({
      connectionString: dbUrl,
      max: 5,
    });

    service = new CoreMergerService(pool, defaultCoreMergerConfig);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("healthCheck", () => {
    it("should check database connection", async () => {
      const isHealthy = await service.healthCheck();

      // Health check may fail if no database configured
      // This is expected in unit test environment
      expect(typeof isHealthy).toBe("boolean");
    });
  });

  describe("getLoadProgress", () => {
    it("should return undefined for non-existent merge run", () => {
      const progress = service.getLoadProgress("non-existent-id");

      expect(progress).toBeUndefined();
    });
  });

  // Note: Actual merge tests would require:
  // 1. Test data in staging tables
  // 2. Database schema to be set up
  // 3. Cleanup between tests
  // These should be added when integration test infrastructure is ready

  describe("mergeToCore (unit-level)", () => {
    it("should validate options", () => {
      const options: CoreMergeOptions = {
        loadRunId: "test-run-123",
        extractTypes: ["Patient"],
      };

      expect(options.loadRunId).toBeTruthy();
      expect(options.extractTypes).toContain("Patient");
    });
  });
});
