import { parse, Parser } from "csv-parse";
import { IndiciCsvSeparators } from "./types/config";

/**
 * CSV Processing Options for Indici format
 */
export interface CSVParseOptions {
  fieldSeparator?: string; // "|^^|"
  rowSeparator?: string; // "|~~|"
  hasHeaders?: boolean; // false for Indici extracts
  columnMapping?: string[]; // Predefined column names by position
  maxRowLength?: number; // Safety limit for row size
  maxFieldLength?: number; // Safety limit for individual field size
  skipEmptyRows?: boolean; // Skip completely empty rows
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
export class CSVParser {
  private readonly fieldSeparator: string;
  private readonly rowSeparator: string;
  private readonly columnMapping: string[] | false;
  private readonly skipEmptyRows: boolean;
  public readonly parser: Parser;

  constructor(options: CSVParseOptions) {
    this.fieldSeparator =
      options.fieldSeparator ?? IndiciCsvSeparators.fieldSeparator;
    this.rowSeparator =
      options.rowSeparator ?? IndiciCsvSeparators.rowSeparator;
    this.columnMapping = options.columnMapping ?? false;
    this.skipEmptyRows = options.skipEmptyRows ?? true;
    this.parser = this.getParser();
  }

  private getParser(): Parser {
    // See - https://csv.js.org/parse/options for all options
    return parse({
      delimiter: this.fieldSeparator, // Custom field delimiter - separates individual data fields within each row
      record_delimiter: this.rowSeparator, // Custom row delimiter - separates each record/row in the file
      encoding: "utf16le", // File encoding format - handles UTF-16 Little Endian text encoding
      skip_empty_lines: this.skipEmptyRows, // Ignores completely empty lines in the file (no content at all)
      relax_column_count: true, // Allows rows to have different numbers of fields without throwing errors
      relax_quotes: true, // Permits quotes to appear anywhere in fields without proper CSV escaping
      columns: this.columnMapping, // Returns arrays instead of objects
      trim: true, // Automatically removes leading/trailing whitespace from each field value
      bom: true, // Automatically detects and removes Byte Order Mark (common in UTF-16 files)
      cast: true, // Casts values to the appropriate type
      cast_date: true, // Automatically converts date strings to Date objects
    });
  }
}
