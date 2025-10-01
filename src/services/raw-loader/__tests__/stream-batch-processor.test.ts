/**
 * Stream Batch Processor - Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { Readable } from "node:stream";
import { StreamBatchProcessor } from "../stream-batch-processor";
import { CSVParser } from "../csv-parser";
import type { BatchResult } from "../types/raw-loader";

describe("StreamBatchProcessor", () => {
  it("should process a stream with batching", async () => {
    const processor = new StreamBatchProcessor();

    // Create a CSV string with 25 rows (each row has 3 fields)
    const csvData = Array.from(
      { length: 25 },
      (_, i) => `field1_${i}|^^|field2_${i}|^^|field3_${i}`
    ).join("|~~|");

    // Convert to UTF-16LE buffer as expected by CSVParser
    const buffer = Buffer.from(csvData, "utf16le");
    const stream = Readable.from([buffer]);

    // Create CSV parser with Indici separators
    const parser = new CSVParser({
      fieldSeparator: "|^^|",
      rowSeparator: "|~~|",
      hasHeaders: false,
      skipEmptyRows: true,
    });

    // Track batches processed
    const batchesProcessed: any[] = [];
    const batchExecutor = vi.fn(async (rows: any[], batchNumber: number) => {
      batchesProcessed.push({ rows, batchNumber });
      return {
        batchNumber,
        rowsInserted: rows.length,
        errors: [],
        warnings: [],
        durationMs: 10,
        success: true,
      } as BatchResult;
    });

    // Process stream with batch size of 10
    const result = await processor.processStream(
      stream,
      parser,
      batchExecutor,
      {
        batchSize: 10,
        maxQueueSize: 3,
        progressLogInterval: 100,
      }
    );

    // Verify results
    expect(result.totalRows).toBe(25);
    expect(result.successfulBatches).toBe(3); // 10 + 10 + 5 rows
    expect(result.failedBatches).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(batchExecutor).toHaveBeenCalledTimes(3);

    // Verify batches were processed in order
    expect(batchesProcessed[0].rows).toHaveLength(10);
    expect(batchesProcessed[1].rows).toHaveLength(10);
    expect(batchesProcessed[2].rows).toHaveLength(5); // Final partial batch
  });

  it("should handle batch processing errors gracefully", async () => {
    const processor = new StreamBatchProcessor();

    const csvData = Array.from(
      { length: 15 },
      (_, i) => `field1_${i}|^^|field2_${i}|^^|field3_${i}`
    ).join("|~~|");

    const buffer = Buffer.from(csvData, "utf16le");
    const stream = Readable.from([buffer]);

    const parser = new CSVParser({
      fieldSeparator: "|^^|",
      rowSeparator: "|~~|",
      hasHeaders: false,
      skipEmptyRows: true,
    });

    // Simulate batch executor that fails on second batch
    let callCount = 0;
    const batchExecutor = vi.fn(async (rows: any[], batchNumber: number) => {
      callCount++;
      if (callCount === 2) {
        // Second batch fails
        return {
          batchNumber,
          rowsInserted: 0,
          errors: [
            {
              errorType: "DATABASE_ERROR" as any,
              message: "Simulated error",
              timestamp: new Date(),
              isRetryable: true,
            },
          ],
          warnings: [],
          durationMs: 10,
          success: false,
        } as BatchResult;
      }

      return {
        batchNumber,
        rowsInserted: rows.length,
        errors: [],
        warnings: [],
        durationMs: 10,
        success: true,
      } as BatchResult;
    });

    const result = await processor.processStream(
      stream,
      parser,
      batchExecutor,
      {
        batchSize: 5,
        maxQueueSize: 3,
        progressLogInterval: 100,
      }
    );

    // Verify that processing continued despite the error
    expect(result.totalRows).toBe(15);
    expect(result.successfulBatches).toBe(2); // First and third batches
    expect(result.failedBatches).toBe(1); // Second batch
    expect(batchExecutor).toHaveBeenCalledTimes(3);
  });

  it("should handle empty streams", async () => {
    const processor = new StreamBatchProcessor();

    const stream = Readable.from([""]);

    const parser = new CSVParser({
      fieldSeparator: "|^^|",
      rowSeparator: "|~~|",
      hasHeaders: false,
      skipEmptyRows: true,
    });

    const batchExecutor = vi.fn(async (rows: any[], batchNumber: number) => {
      return {
        batchNumber,
        rowsInserted: rows.length,
        errors: [],
        warnings: [],
        durationMs: 10,
        success: true,
      } as BatchResult;
    });

    const result = await processor.processStream(
      stream,
      parser,
      batchExecutor,
      {
        batchSize: 10,
      }
    );

    expect(result.totalRows).toBe(0);
    expect(result.successfulBatches).toBe(0);
    expect(result.failedBatches).toBe(0);
    expect(batchExecutor).not.toHaveBeenCalled();
  });
});
