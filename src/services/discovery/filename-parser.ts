/**
 * Filename Parser Implementation
 * Parses Indici CSV filenames to extract metadata
 */

import { extractTypes, type ExtractType } from "@/db/schema";
import type { ParsedFilename } from "./types/files";

// Re-export ParsedFilename for convenience
export type { ParsedFilename };

export class FilenameParser {
  /**
   * Parse filename and extract metadata
   */
  parseFilename(filename: string): ParsedFilename | null {
    return FilenameParser.parse(filename);
  }

  /**
   * Static parse method for direct usage
   */
  static parse(filename: string): ParsedFilename {
    // Handle full S3 key path or just filename
    // Support both Windows (\) and Unix (/) path separators
    let baseFilename = filename;

    if (filename.includes("\\")) {
      baseFilename = filename.split("\\").pop() || "";
    } else if (filename.includes("/")) {
      baseFilename = filename.split("/").pop() || "";
    }

    if (!baseFilename) {
      throw new Error(`Could not extract filename from: ${filename}`);
    }

    // Remove .csv extension if present
    const nameWithoutExt = baseFilename.replace(/\.csv$/i, ""); // Case insensitive

    // Expected format: 685146_535_<ExtractType>_<DateFrom>_<DateTo>_<DateExtracted>
    // Example: 685146_535_Allergies_202508180544_202508181044_2508181044

    const regex = /^(\d{6})_(\d{3})_(\w+)_(\d{12})_(\d{12})_(\d{10})$/;
    const match = nameWithoutExt.match(regex);

    if (!match) {
      throw new Error(
        `Invalid filename format: ${nameWithoutExt}. Expected: 685146_535_<ExtractType>_<DateFrom>_<DateTo>_<DateExtracted>`
      );
    }

    const [
      ,
      perOrgId,
      practiceId,
      extractType,
      dateFromStr,
      dateToStr,
      dateExtractedStr,
    ] = match;

    // Validate known values
    if (perOrgId !== "685146") {
      throw new Error(`Invalid PerOrgID: ${perOrgId}. Expected: 685146`);
    }

    if (practiceId !== "535") {
      throw new Error(`Invalid PracticeID: ${practiceId}. Expected: 535`);
    }

    if (!extractTypes[extractType as ExtractType]) {
      throw new Error(
        `Invalid ExtractType: ${extractType}. Expected: ${Object.values(extractTypes).join(", ")}`
      );
    }

    const dateFrom = this.parseDateString(dateFromStr);
    const dateTo = this.parseDateString(dateToStr);
    const dateExtracted = this.parseDateString(dateExtractedStr);

    // Validate date logic
    if (dateExtracted < dateTo) {
      throw new Error(
        `DateExtracted (${dateExtracted.toISOString()}) must be >= DateTo (${dateTo.toISOString()})`
      );
    }

    // Determine if this is a full load or delta based on date range
    const isFullLoad = this.isFullLoad(dateFrom, dateTo);
    const isDelta = !isFullLoad;

    const batchId = this.formatBatchId(dateExtracted);

    return {
      perOrgId,
      practiceId,
      extractType: extractType as ExtractType,
      dateFrom,
      dateTo,
      dateExtracted,
      isFullLoad,
      isDelta,
      batchId,
    };
  }

  /**
   * Validate parsed filename
   */
  static validate(parsed: ParsedFilename): boolean {
    try {
      // Check required fields
      if (!parsed.perOrgId || !parsed.practiceId || !parsed.extractType) {
        return false;
      }

      // Check date validity
      if (parsed.dateExtracted < parsed.dateTo) {
        return false;
      }

      // Check batch ID format
      if (!parsed.batchId.match(/^\d{10}$/)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse date string in YYYYMMDDHHMM or YYMMDDHHMM format to Date object
   */
  private static parseDateString(dateStr: string): Date {
    let year: number;
    let month: number;
    let day: number;
    let hour: number;
    let minute: number;

    if (dateStr.length === 12) {
      // Format: YYYYMMDDHHMM (202508180544)
      year = parseInt(dateStr.substring(0, 4));
      month = parseInt(dateStr.substring(4, 6));
      day = parseInt(dateStr.substring(6, 8));
      hour = parseInt(dateStr.substring(8, 10));
      minute = parseInt(dateStr.substring(10, 12));
    } else if (dateStr.length === 10) {
      // Format: YYMMDDHHMM (2508181044)
      year = 2000 + parseInt(dateStr.substring(0, 2));
      month = parseInt(dateStr.substring(2, 4));
      day = parseInt(dateStr.substring(4, 6));
      hour = parseInt(dateStr.substring(6, 8));
      minute = parseInt(dateStr.substring(8, 10));
    } else {
      throw new Error(
        `Invalid date format: ${dateStr}. Expected YYYYMMDDHHMM or YYMMDDHHMM`
      );
    }

    // Validate date components
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}`);
    }
    if (day < 1 || day > 31) {
      throw new Error(`Invalid day: ${day}`);
    }
    if (hour < 0 || hour > 23) {
      throw new Error(`Invalid hour: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new Error(`Invalid minute: ${minute}`);
    }

    return new Date(year, month - 1, day, hour, minute); // month is 0-indexed in Date constructor
  }

  /**
   * Extract DateExtracted from filename
   */
  static extractDateExtracted(filename: string): Date {
    const parsed = this.parse(filename);
    return parsed.dateExtracted;
  }

  /**
   * Format date as batch ID (YYMMDDHHMM)
   */
  private static formatBatchId(date: Date): string {
    const year = (date.getFullYear() % 100).toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}`;
  }

  /**
   * Determine if this is a full load based on date range
   */
  private static isFullLoad(dateFrom: Date, dateTo: Date): boolean {
    // Full loads typically have longer date ranges or specific patterns
    const diffInHours =
      (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60);

    // If the range is more than 24 hours, it's likely a full load
    return diffInHours >= 24;
  }
}
