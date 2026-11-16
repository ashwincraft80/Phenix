/**
 * SQLite Database Connector using Node.js v24 Native DatabaseSync
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema.js';

/**
 * Creates or connects to a SQLite database instance using native Node.js DatabaseSync
 *
 * @param {string|object} [dbPathOrOptions=':memory:'] Path to SQLite DB file or options object
 * @returns {DatabaseSync}
 */
export function getDatabase(dbPathOrOptions = ':memory:') {
  let dbPath = ':memory:';

  if (typeof dbPathOrOptions === 'string') {
    dbPath = dbPathOrOptions;
  } else if (dbPathOrOptions && typeof dbPathOrOptions === 'object') {
    dbPath = dbPathOrOptions.path ?? dbPathOrOptions.dbPath ?? ':memory:';
  }

  const db = new DatabaseSync(dbPath);
  // Ensure foreign keys are enabled
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Executes the DDL schema on the provided SQLite DatabaseSync instance
 *
 * @param {DatabaseSync} db DatabaseSync instance
 * @param {string} [ddl=SCHEMA_SQL] Optional custom DDL SQL script
 * @returns {DatabaseSync} The initialized database instance
 */
export function initSchema(db, ddl = SCHEMA_SQL) {
  if (!db || typeof db.exec !== 'function') {
    throw new TypeError('Valid DatabaseSync instance with an exec() method is required');
  }

  db.exec(ddl);
  return db;
}

/**
 * Alias for initSchema for PROJECT.md contract compatibility
 */
export const runSchema = initSchema;
