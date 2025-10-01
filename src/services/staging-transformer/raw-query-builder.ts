/**
 * SQL Query Builder for extracting data from raw tables
 * Builds queries to read from raw.* tables with optional filtering
 */

export interface RawQueryOptions {
  sourceTable: string; // Raw table name (e.g., "raw.patients")
  columns?: string[]; // Specific columns to select (defaults to all)
  loadRunFileId?: number; // Filter by specific file (FK to etl.load_run_files)
  loadRunFileIds?: number[]; // Filter by multiple files
  limit?: number; // Limit number of rows
  offset?: number; // Offset for pagination
  orderBy?: string; // Column to order by
  whereClause?: string; // Additional WHERE conditions
}

/**
 * Query builder for reading from raw tables
 */
export class RawQueryBuilder {
  /**
   * Build a SELECT query to read from a raw table
   */
  buildSelectQuery(options: RawQueryOptions): {
    query: string;
    params: any[];
  } {
    const {
      sourceTable,
      columns = ["*"],
      loadRunFileId,
      loadRunFileIds,
      limit,
      offset,
      orderBy,
      whereClause,
    } = options;

    // Build SELECT clause
    const selectClause = columns.join(", ");

    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (loadRunFileId) {
      whereClauses.push(`load_run_file_id = $${paramIndex++}`);
      params.push(loadRunFileId);
    }

    if (loadRunFileIds && loadRunFileIds.length > 0) {
      const placeholders = loadRunFileIds
        .map(() => `$${paramIndex++}`)
        .join(", ");
      whereClauses.push(`load_run_file_id IN (${placeholders})`);
      params.push(...loadRunFileIds);
    }

    if (whereClause) {
      whereClauses.push(`(${whereClause})`);
    }

    const whereSection =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Build ORDER BY clause
    const orderBySection = orderBy ? `ORDER BY ${orderBy}` : "";

    // Build LIMIT/OFFSET clause
    let limitSection = "";
    if (limit !== undefined) {
      limitSection += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }
    if (offset !== undefined) {
      limitSection += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    // Combine into final query
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
   * Build a query to count rows in raw table
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

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (loadRunFileId) {
      whereClauses.push(`load_run_file_id = $${paramIndex++}`);
      params.push(loadRunFileId);
    }

    if (loadRunFileIds && loadRunFileIds.length > 0) {
      const placeholders = loadRunFileIds
        .map(() => `$${paramIndex++}`)
        .join(", ");
      whereClauses.push(`load_run_file_id IN (${placeholders})`);
      params.push(...loadRunFileIds);
    }

    if (whereClause) {
      whereClauses.push(`(${whereClause})`);
    }

    const whereSection =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT COUNT(*) as total
      FROM ${sourceTable}
      ${whereSection}
    `.trim();

    return { query, params };
  }

  /**
   * Build a query to get distinct load_run_file_ids from raw table
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
   * Build a query to check if data exists for a load run file
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
   * Build a streaming query that can be used with PostgreSQL cursor
   * This is useful for processing large datasets without loading all into memory
   */
  buildStreamingQuery(options: RawQueryOptions): {
    cursorName: string;
    declareCursor: string;
    fetchQuery: string;
    closeCursor: string;
    params: any[];
  } {
    const cursorName = `raw_cursor_${Date.now()}`;
    const { query, params } = this.buildSelectQuery(options);

    return {
      cursorName,
      declareCursor: `DECLARE ${cursorName} CURSOR FOR ${query}`,
      fetchQuery: `FETCH ${options.limit ?? 1000} FROM ${cursorName}`,
      closeCursor: `CLOSE ${cursorName}`,
      params,
    };
  }
}
