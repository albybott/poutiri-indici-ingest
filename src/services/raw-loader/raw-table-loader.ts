import { Readable } from "node:stream";
import type {
  RawTableRow,
  LineageData,
  RawLoadOptions,
  LoadResult,
} from "./types/raw-loader";
import type { DatabaseConfig } from "./types/config";
import { IndiciCsvSeparators } from "./types/config";
import type { CSVRow } from "./csv-parser";
import { CSVParser } from "./csv-parser";
import type { ErrorHandler } from "./error-handler";
import { DatabasePool } from "../shared/database-pool";
import { BatchLoader } from "../shared/batch-loader";
import {
  StreamBatchProcessor,
  type StreamLoadResult,
} from "@/services/shared/stream-batch-processor";
import type { InsertBatch } from "../shared/types";

type CSVRowValue = string | number | boolean | Date;

/**
 * Raw Table Loader - Handles database operations for loading CSV data
 * Uses shared DatabasePool and BatchLoader for generic database operations
 */
export class RawTableLoader {
  private dbPool: DatabasePool;
  private batchLoader: BatchLoader;
  private errorHandler: ErrorHandler;

  constructor(databaseConfig: DatabaseConfig, errorHandler: ErrorHandler) {
    this.dbPool = new DatabasePool(databaseConfig);
    this.batchLoader = new BatchLoader(this.dbPool, errorHandler);
    this.errorHandler = errorHandler;
  }

  private prepareBatch(
    values: CSVRowValue[][],
    loadRunFileId: number,
    options: RawLoadOptions & {
      extractType: string;
      tableName: string;
      columns: string[];
    },
    batchNumber: number
  ): InsertBatch {
    const tableName = options.tableName || `raw.${options.extractType}`;

    if (values.length === 0) {
      throw new Error("Cannot prepare batch: no rows provided");
    }

    if (!options.loadRunFileId) {
      throw new Error("loadRunFileId is required for raw table loading");
    }

    const processedValues: any[][] = [];
    const expectedColumnCount = options.columns.length + 1; // +1 for load_run_file_id

    for (const row of values) {
      // Map values for all columns (load_run_file_id first, then business columns)
      const rowValues = [
        loadRunFileId,
        ...row.map((col: CSVRowValue) => col ?? ""),
      ];

      // Validate parameter count to catch data inconsistencies early
      if (rowValues.length !== expectedColumnCount) {
        throw new Error(
          `Parameter count mismatch for batch ${batchNumber}: expected ${expectedColumnCount} columns ` +
            `(1 load_run_file_id + ${options.columns.length} data columns), ` +
            `but got ${rowValues.length} values. ` +
            `Row data: ${JSON.stringify(rowValues.slice(0, 10))}...`
        );
      }

      // Add all rows to preserve raw data integrity
      processedValues.push(rowValues);
    }

    return {
      tableName,
      columns: ["load_run_file_id", ...options.columns],
      values: processedValues,
      rowCount: processedValues.length,
      batchNumber,
      fileKey: options.loadRunFileId.toString(), // Use loadRunFileId as fileKey for compatibility
      loadRunId: options.loadRunId,
    };
  }

  async loadFromStream(
    stream: Readable,
    options: RawLoadOptions & {
      extractType: string;
      tableName: string;
      columns: string[];
    }
  ): Promise<LoadResult> {
    const loadRunFileId = options.loadRunFileId;
    if (!loadRunFileId) {
      throw new Error("loadRunFileId is required for raw table loading");
    }

    const batchSize = this.batchLoader.calculateOptimalBatchSize(
      options.columns.length,
      options.batchSize
    );

    const csvParser = new CSVParser({
      fieldSeparator:
        options.fieldSeparator ?? IndiciCsvSeparators.fieldSeparator,
      rowSeparator: options.rowSeparator ?? IndiciCsvSeparators.rowSeparator,
      hasHeaders: false,
      skipEmptyRows: true,
    });

    const processor = new StreamBatchProcessor();

    // Define the batch executor that handles database insertion
    const batchExecutor = async (
      rows: CSVRowValue[][],
      batchNumber: number
    ) => {
      const batch = this.prepareBatch(
        rows,
        loadRunFileId,
        options,
        batchNumber
      );
      return await this.batchLoader.executeBatch(batch, {
        continueOnError: options.continueOnError,
      });
    };

    // Delegate stream processing to the specialized service
    return await processor.processStream(stream, csvParser, batchExecutor, {
      batchSize,
      maxQueueSize: 5,
      progressLogInterval: 500,
    });
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dbPool.close();
  }
}
