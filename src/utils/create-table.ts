import { pgTableCreator } from "drizzle-orm/pg-core";

const prefix = ""; // Add a prefix to all table names to avoid conflicts with other applications

export const createTable = pgTableCreator((name) => `${prefix}${name}`);
