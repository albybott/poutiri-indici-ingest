/**
 * CSV Processing Types
 */

export interface CSVParseOptions {
  fieldSeparator: string; // "|~~|"
  rowSeparator: string; // "|^^|"
  hasHeaders: boolean; // false for Indici extracts
  columnMapping: string[]; // Predefined column names by position
  maxRowLength?: number; // Safety limit for row size
  skipEmptyRows: boolean; // Skip completely empty rows
}

export interface CSVRow {
  [columnName: string]: string | number;
  rowNumber: number;
  rawText: string; // Original row text for debugging
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ColumnMapping {
  extractType: string;
  columnNames: string[]; // Ordered array of column names
  requiredColumns: string[]; // Columns that must be present
  optionalColumns: string[]; // Columns that can be empty/missing
}

export interface CSVProcessingStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  totalErrors: number;
  totalWarnings: number;
  processingTimeMs: number;
  averageRowLength: number;
}

export interface CSVChunk {
  rows: CSVRow[];
  chunkNumber: number;
  startRow: number;
  endRow: number;
  hasMore: boolean;
}

export interface CSVParseError extends Error {
  rowNumber?: number;
  columnName?: string;
  rawRow?: string;
  errorType: "PARSE_ERROR" | "VALIDATION_ERROR" | "FORMAT_ERROR";
}

export type CSVParserEvent =
  | { type: "row_parsed"; row: CSVRow; rowNumber: number }
  | { type: "row_error"; error: CSVParseError; rowNumber: number }
  | {
      type: "validation_error";
      row: CSVRow;
      errors: string[];
      warnings: string[];
    }
  | { type: "chunk_complete"; chunk: CSVChunk }
  | { type: "parse_complete"; stats: CSVProcessingStats };
