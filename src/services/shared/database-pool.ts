import { Pool, type QueryResult, type PoolClient } from "pg";
import type { DatabaseConfig } from "../raw-loader/types/config";

/**
 * Generic database connection pool wrapper
 * Provides connection pooling, transaction support, and error handling
 * Can be used across all ETL layers (raw, staging, core)
 */
export class DatabasePool {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    console.log("📡 Creating database pool with config:", {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "poutiri_indici",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD ?? "(not set)",
      maxConnections: config.maxConnections || 20,
      timeoutMs: config.timeoutMs || 30000,
    });

    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "poutiri_indici",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.timeoutMs || 30000,
    });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  /**
   * Execute a query with automatic connection management
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for manual transaction management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get the database configuration
   */
  getConfig(): DatabaseConfig {
    return this.config;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}
