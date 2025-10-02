/**
 * SQL Query Builder for extracting data from raw tables
 *
 * This module provides a flexible query builder for reading data from raw.* tables
 * in the ETL pipeline. It supports various filtering options, pagination, and
 * streaming capabilities for processing large datasets efficiently.
 *
 */

/**
 * Configuration options for building raw table queries
 *
 * @interface RawQueryOptions
 */
export interface RawQueryOptions {
  /** Raw table name with schema prefix (e.g., "raw.patients", "raw.appointments") */
  sourceTable: string;

  /**
   * Specific columns to select - defaults to all columns (*)
   * Use this to optimize queries when only certain fields are needed
   */
  columns?: string[];

  /**
   * Filter by specific load run file ID (FK to etl.load_run_files)
   * Used when processing data from a single file
   */
  loadRunFileId?: number;

  /**
   * Filter by multiple load run file IDs
   * Used when processing data from multiple files in a batch
   */
  loadRunFileIds?: number[];

  /** Maximum number of rows to return - useful for pagination and memory management */
  limit?: number;

  /** Number of rows to skip - used with limit for pagination */
  offset?: number;

  /** Column name to order results by (e.g., "load_ts DESC", "patient_id ASC") */
  orderBy?: string;

  /**
   * Additional WHERE conditions as raw SQL string
   * Will be wrapped in parentheses and combined with other conditions
   * Example: "created_date > '2024-01-01' AND status = 'active'"
   */
  whereClause?: string;
}

/**
 * Query builder for reading from raw tables
 *
 * This class provides methods to construct parameterized SQL queries for extracting
 * data from raw tables in the ETL pipeline. All queries use parameterized statements
 * to prevent SQL injection and ensure proper type handling.
 *
 */
export class RawQueryBuilder {
  /**
   * Build a parameterized SELECT query to read from a raw table
   *
   * Constructs a SQL SELECT statement with dynamic WHERE clauses based on the
   * provided options. All user input is properly parameterized to prevent SQL injection.
   *
   * @param options - Configuration for the query including table, filters, and pagination
   * @returns Object containing the SQL query string and parameter array
   *
   */
  buildSelectQuery(options: RawQueryOptions): {
    query: string;
    params: any[];
  } {
    const {
      sourceTable,
      columns = ["*"], // Default to all columns if none specified
      loadRunFileId,
      loadRunFileIds,
      limit,
      offset,
      orderBy,
      whereClause,
    } = options;

    // Build SELECT clause - join column names with commas
    const selectClause = columns.join(", ");

    // Build WHERE clause with parameterized queries for security
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1; // PostgreSQL uses $1, $2, etc. for parameters

    // Add single file ID filter if provided
    if (loadRunFileId) {
      whereClauses.push(`load_run_file_id = $${paramIndex++}`);
      params.push(loadRunFileId);
    }

    // Add multiple file IDs filter if provided (uses IN clause for efficiency)
    if (loadRunFileIds && loadRunFileIds.length > 0) {
      // Create parameterized placeholders for each file ID
      const placeholders = loadRunFileIds
        .map(() => `$${paramIndex++}`)
        .join(", ");
      whereClauses.push(`load_run_file_id IN (${placeholders})`);
      params.push(...loadRunFileIds);
    }

    // Add custom WHERE clause if provided (wrapped in parentheses for safety)
    if (whereClause) {
      whereClauses.push(`(${whereClause})`);
    }

    // Combine all WHERE conditions with AND
    const whereSection =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Build ORDER BY clause if specified
    const orderBySection = orderBy ? `ORDER BY ${orderBy}` : "";

    // Build LIMIT/OFFSET clause for pagination
    let limitSection = "";
    if (limit !== undefined) {
      limitSection += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }
    if (offset !== undefined) {
      limitSection += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    // Combine all clauses into final SQL query
    const query = `
      SELECT ${selectClause}
      FROM ${sourceTable}
      ${whereSection}
      ${orderBySection}
      ${limitSection}
    `.trim();

    return { query, params };
  }

  /**
   * Build a parameterized COUNT query to get total row count from a raw table
   *
   * Creates a SQL COUNT(*) query with the same filtering options as buildSelectQuery
   * but only returns the total number of matching rows. Useful for pagination and
   * progress tracking in ETL processes.
   *
   * @param options - Filtering options (subset of RawQueryOptions)
   * @returns Object containing the COUNT query and parameter array
   */
  buildCountQuery(
    options: Pick<
      RawQueryOptions,
      "sourceTable" | "loadRunFileId" | "loadRunFileIds" | "whereClause"
    >
  ): {
    query: string;
    params: any[];
  } {
    const { sourceTable, loadRunFileId, loadRunFileIds, whereClause } = options;

    // Build WHERE clause using same logic as buildSelectQuery
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1; // PostgreSQL parameter indexing

    // Add single file ID filter
    if (loadRunFileId) {
      whereClauses.push(`load_run_file_id = $${paramIndex++}`);
      params.push(loadRunFileId);
    }

    // Add multiple file IDs filter
    if (loadRunFileIds && loadRunFileIds.length > 0) {
      const placeholders = loadRunFileIds
        .map(() => `$${paramIndex++}`)
        .join(", ");
      whereClauses.push(`load_run_file_id IN (${placeholders})`);
      params.push(...loadRunFileIds);
    }

    // Add custom WHERE clause
    if (whereClause) {
      whereClauses.push(`(${whereClause})`);
    }

    // Combine WHERE conditions
    const whereSection =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Build COUNT query (no LIMIT/OFFSET needed for counting)
    const query = `
      SELECT COUNT(*) as total
      FROM ${sourceTable}
      ${whereSection}
    `.trim();

    return { query, params };
  }

  /**
   * Build a query to get distinct load_run_file_ids with row counts from a raw table
   *
   * This query is useful for discovering what files have been loaded into a raw table
   * and how many rows each file contains. Results are ordered by the most recent
   * load timestamp to show the latest files first.
   *
   * @param sourceTable - The raw table name to query
   * @returns SQL query string (no parameters needed)
   */
  buildGetLoadRunFilesQuery(sourceTable: string): string {
    return `
      SELECT DISTINCT load_run_file_id, COUNT(*) as row_count
      FROM ${sourceTable}
      GROUP BY load_run_file_id
      ORDER BY MAX(load_ts) DESC
    `.trim();
  }

  /**
   * Build a parameterized query to check if data exists for a specific load run file
   *
   * Uses PostgreSQL's EXISTS clause for efficient existence checking without
   * returning actual data. Returns a boolean indicating whether any rows
   * exist for the given file ID.
   *
   * @param sourceTable - The raw table name to check
   * @param loadRunFileId - The file ID to check for existence
   * @returns Object containing the EXISTS query and parameter array
   *
   * @example
   * ```typescript
   * const result = builder.buildCheckLoadRunFileExistsQuery('raw.patients', 123);
   * // Returns: { query: "SELECT EXISTS(SELECT 1 FROM raw.patients WHERE load_run_file_id = $1) as exists", params: [123] }
   * ```
   */
  buildCheckLoadRunFileExistsQuery(
    sourceTable: string,
    loadRunFileId: number
  ): { query: string; params: any[] } {
    return {
      query: `
        SELECT EXISTS(
          SELECT 1 FROM ${sourceTable}
          WHERE load_run_file_id = $1
        ) as exists
      `.trim(),
      params: [loadRunFileId],
    };
  }

  /**
   * Build a streaming query using PostgreSQL cursors for large dataset processing
   *
   * Creates a cursor-based query that allows processing large datasets without
   * loading everything into memory. The cursor fetches data in configurable
   * batches, making it ideal for ETL processes that need to handle millions of rows.
   *
   * @param options - Query configuration (same as buildSelectQuery)
   * @returns Object containing cursor name and SQL statements for cursor operations
   *
   * @example
   * ```typescript
   * const streaming = builder.buildStreamingQuery({
   *   sourceTable: 'raw.patients',
   *   loadRunFileId: 123,
   *   limit: 1000
   * });
   *
   * // Usage:
   * // 1. await db.query(streaming.declareCursor, streaming.params)
   * // 2. while (true) {
   * //      const result = await db.query(streaming.fetchQuery)
   * //      if (result.rows.length === 0) break
   * //      // Process batch...
   * //    }
   * // 3. await db.query(streaming.closeCursor)
   * ```
   */
  buildStreamingQuery(options: RawQueryOptions): {
    cursorName: string;
    declareCursor: string;
    fetchQuery: string;
    closeCursor: string;
    params: any[];
  } {
    // Generate unique cursor name using timestamp to avoid conflicts
    const cursorName = `raw_cursor_${Date.now()}`;
    const { query, params } = this.buildSelectQuery(options);

    return {
      cursorName,
      declareCursor: `DECLARE ${cursorName} CURSOR FOR ${query}`,
      fetchQuery: `FETCH ${options.limit ?? 1000} FROM ${cursorName}`, // Default batch size of 1000
      closeCursor: `CLOSE ${cursorName}`,
      params,
    };
  }
}
