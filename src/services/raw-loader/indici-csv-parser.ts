import { Readable } from "node:stream";
import { createReadStream } from "node:fs";

/**
 * CSV Processing Options for Indici format
 */
export interface CSVParseOptions {
  fieldSeparator: string; // "|^^|"
  rowSeparator: string; // "|~~|"
  hasHeaders: boolean; // false for Indici extracts
  columnMapping: string[]; // Predefined column names by position
  maxRowLength?: number; // Safety limit for row size
  maxFieldLength?: number; // Safety limit for individual field size
  skipEmptyRows: boolean; // Skip completely empty rows
}

/**
 * Parsed CSV Row with metadata
 */
export interface CSVRow {
  [columnName: string]: string | number;
  rowNumber: number;
  rawText: string; // Original row text for debugging
}

/**
 * Validation result for CSV rows
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Custom CSV Parser for Indici headerless format with custom separators
 */
export class IndiciCSVParser {
  private readonly fieldSeparator: string;
  private readonly rowSeparator: string;
  private readonly columnMapping: string[];
  private readonly maxRowLength: number;
  private readonly maxFieldLength: number;
  private readonly skipEmptyRows: boolean;

  constructor(options: CSVParseOptions) {
    this.fieldSeparator = options.fieldSeparator;
    this.rowSeparator = options.rowSeparator;
    this.columnMapping = options.columnMapping;
    this.maxRowLength = options.maxRowLength || 10000000; // Increased to handle extremely long rows
    this.maxFieldLength = options.maxFieldLength || 5000; // Default field limit
    this.skipEmptyRows = options.skipEmptyRows;
  }

  /**
   * Parse CSV content from a Node.js readable stream
   */
  async parseStream(stream: Readable): Promise<CSVRow[]> {
    const rows: CSVRow[] = [];
    let rowNumber = 1;
    let buffer = "";
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        try {
          // Handle UTF-16/UTF-8 encoding issue by converting buffer properly
          const chunkStr = this.decodeBuffer(chunk);
          buffer += chunkStr;
          const { completeRows, remainingBuffer } = this.processBuffer(buffer);
          buffer = remainingBuffer;

          // Process complete rows
          for (const rowText of completeRows) {
            if (this.shouldSkipRow(rowText)) continue;

            const parsedRow = this.parseRow(rowText, rowNumber);
            if (parsedRow) {
              rows.push(parsedRow);
            }
            rowNumber++;
          }
        } catch (error) {
          reject(
            new Error(`Error processing chunk at row ${rowNumber}: ${error}`)
          );
        }
      });

      stream.on("end", () => {
        try {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            const parsedRow = this.parseRow(buffer.trim(), rowNumber);
            if (parsedRow) {
              rows.push(parsedRow);
            }
          }
          resolve(rows);
        } catch (error) {
          reject(new Error(`Error processing final buffer: ${error}`));
        }
      });

      stream.on("error", (error) => {
        reject(new Error(`Stream error: ${error.message}`));
      });
    });
  }

  /**
   * Parse CSV content from a file path
   */
  async parseFile(filePath: string): Promise<CSVRow[]> {
    const stream = createReadStream(filePath, { encoding: "utf8" });
    return this.parseStream(stream);
  }

  /**
   * Parse CSV content from S3 object key
   */
  async parseS3Object(s3Key: string, s3Stream: Readable): Promise<CSVRow[]> {
    return this.parseStream(s3Stream);
  }

  /**
   * Validate a parsed row against extract type rules
   */
  async validateRow(
    row: CSVRow,
    extractType: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required columns are present
    const requiredColumns = this.getRequiredColumns(extractType);
    for (const requiredCol of requiredColumns) {
      const value = row[requiredCol];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors.push(`Required column '${requiredCol}' is missing or empty`);
      }
    }

    // Validate data types and formats based on extract type
    const formatErrors = this.validateRowFormat(row, extractType);
    errors.push(...formatErrors);

    // Check for suspicious data patterns
    const dataWarnings = this.checkDataQuality(row);
    warnings.push(...dataWarnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Count total rows in a stream (for progress tracking)
   */
  async countRows(stream: Readable): Promise<number> {
    let count = 0;
    let buffer = "";

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        const chunkStr = this.decodeBuffer(chunk);
        buffer += chunkStr;
        const lines = buffer.split(this.rowSeparator);
        count += lines.length - 1; // Don't count the incomplete line at the end
        buffer = lines[lines.length - 1]; // Keep incomplete line
      });

      stream.on("end", () => {
        if (buffer.trim()) {
          count++;
        }
        resolve(count);
      });

      stream.on("error", reject);
    });
  }

  private processBuffer(buffer: string): {
    completeRows: string[];
    remainingBuffer: string;
  } {
    const rows = buffer.split(this.rowSeparator);
    const completeRows = rows.slice(0, -1); // All complete rows
    const remainingBuffer = rows[rows.length - 1]; // Incomplete row at end
    return { completeRows, remainingBuffer };
  }

  /**
   * Decode buffer to handle UTF-16/UTF-8 encoding issues
   */
  public decodeBuffer(chunk: Buffer): string {
    // Check for UTF-16LE BOM (Byte Order Mark)
    if (chunk.length >= 2 && chunk[0] === 0xff && chunk[1] === 0xfe) {
      return chunk.toString("utf16le");
    }

    // Check for UTF-16BE BOM (swap bytes and use utf16le)
    if (chunk.length >= 2 && chunk[0] === 0xfe && chunk[1] === 0xff) {
      return chunk.toString("utf16le");
    }

    // Check if this looks like UTF-16LE encoded data (null bytes in odd positions for LE)
    if (chunk.length > 2 && chunk.length % 2 === 0) {
      let nullByteCount = 0;
      let oddPositionNulls = 0;

      for (let i = 1; i < chunk.length; i += 2) {
        if (chunk[i] === 0x00) {
          nullByteCount++;
          if (i % 2 === 1) oddPositionNulls++; // null bytes in odd positions for UTF-16LE
        }
      }

      // If we have many null bytes in odd positions, this is likely UTF-16LE
      if (
        nullByteCount > chunk.length / 4 &&
        oddPositionNulls > nullByteCount / 2
      ) {
        try {
          const utf16String = chunk.toString("utf16le" as any);
          // console.log(
          //   `🔍 Debug - Detected UTF-16LE buffer (${chunk.length} bytes) -> "${utf16String.substring(0, 50)}..."`
          // );
          return utf16String;
        } catch (error) {
          console.warn(
            `⚠️ Failed to decode as UTF-16LE, falling back to UTF-8:`,
            error
          );
        }
      }
    }

    // Default to UTF-8
    const utf8String = chunk.toString("utf8");
    // console.log(
    //   `🔍 Debug - Using UTF-8: "${utf8String.substring(0, 50)}${utf8String.length > 50 ? '...' : ''}"`
    // );
    return utf8String;
  }

  private shouldSkipRow(rowText: string): boolean {
    if (!this.skipEmptyRows) return false;
    return (
      rowText.trim() === "" ||
      rowText.split(this.fieldSeparator).every((field) => field.trim() === "")
    );
  }

  private parseRow(rowText: string, rowNumber: number): CSVRow | null {
    if (rowText.length > this.maxRowLength) {
      throw new Error(
        `Row ${rowNumber} exceeds maximum length of ${this.maxRowLength} characters`
      );
    }

    const fields = rowText.split(this.fieldSeparator);

    // Validate and clean individual field values
    for (let i = 0; i < fields.length; i++) {
      let fieldValue =
        typeof fields[i] === "string" ? fields[i].trim() : String(fields[i]);

      // Clean null bytes and other invalid UTF-8 characters
      fieldValue = fieldValue
        .replace(/\0/g, "") // Remove null bytes
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
        .replace(/\uFFFD/g, "") // Remove replacement characters (�)
        .replace(/\uFEFF/g, ""); // Remove BOM characters

      // Check for length after cleaning
      if (fieldValue.length > this.maxFieldLength) {
        console.warn(
          `⚠️  Field ${i} in row ${rowNumber} exceeds maximum length of ${this.maxFieldLength} characters (${fieldValue.length} chars). Truncating.`
        );
        fieldValue = fieldValue.substring(0, this.maxFieldLength);
      }

      fields[i] = fieldValue;
    }

    // Create row object with column mapping
    const row: CSVRow = {
      rowNumber,
      rawText: rowText,
    };

    // Map fields to column names by position
    const maxFields = Math.min(fields.length, this.columnMapping.length);
    for (let i = 0; i < maxFields; i++) {
      const fieldValue =
        typeof fields[i] === "string" ? fields[i].trim() : String(fields[i]);
      row[this.columnMapping[i]] = fieldValue;
    }

    return row;
  }

  private getRequiredColumns(extractType: string): string[] {
    // This would be populated based on schema definitions
    // For now, return basic required columns
    return ["patient_id", "practice_id", "extracted_date"];
  }

  private validateRowFormat(row: CSVRow, extractType: string): string[] {
    const errors: string[] = [];

    // Basic format validations - would be extended per extract type
    if (extractType === "patients" && row.patient_id) {
      const patientId =
        typeof row.patient_id === "string"
          ? row.patient_id
          : String(row.patient_id);
      if (!/^\d+$/.test(patientId)) {
        errors.push("patient_id must be numeric");
      }
    }

    return errors;
  }

  private checkDataQuality(row: CSVRow): string[] {
    const warnings: string[] = [];

    // Check for unusually long values
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === "string" && value.length > 1000) {
        warnings.push(
          `Column '${key}' has unusually long value (${value.length} characters)`
        );
      }
    });

    // Check for potential encoding issues
    if (row.rawText.includes("?") || row.rawText.includes("\uFFFD")) {
      warnings.push("Potential encoding issues detected in raw data");
    }

    return warnings;
  }
}
