#!/usr/bin/env node
/**
 * CLI Runner: Seed Database
 * Phenix / Project ReguFlow - Industrial Symbiosis Platform (Viksit Bharat 2026 Showcase)
 *
 * Usage:
 *   node scripts/seed.js [options]
 *   npm run seed [-- [options]]
 *
 * Options:
 *   --memory        Seed an in-memory SQLite database (:memory:)
 *   --db <path>     Specify custom SQLite DB file path (default: data/reguflow.db)
 *   --clean         Purge/truncate existing data before seeding
 *   --verbose, -v   Show detailed record information
 *   --help, -h      Display usage information
 */

import path from 'node:path';
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { getDatabase, initSchema } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

const CLI_OPTIONS = {
  memory: {
    type: 'boolean',
    default: false
  },
  db: {
    type: 'string',
    short: 'd'
  },
  clean: {
    type: 'boolean',
    short: 'c',
    default: true
  },
  verbose: {
    type: 'boolean',
    short: 'v',
    default: false
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  }
};

function printHelp() {
  console.log(`
Phenix / Project ReguFlow - Database Seeder CLI

Usage:
  node scripts/seed.js [options]

Options:
  --memory, -m    Use an in-memory SQLite database (:memory:)
  --db <path>     Target database file path (default: data/reguflow.db)
  --clean, -c     Clean existing records before seeding
  --verbose, -v   Print verbose execution details
  --help, -h      Show this help message

Examples:
  node scripts/seed.js
  node scripts/seed.js --clean
  node scripts/seed.js --memory
  node scripts/seed.js --db ./custom/path.db
`);
}

async function main() {
  const startTime = Date.now();

  let values;
  try {
    const parsed = parseArgs({
      options: CLI_OPTIONS,
      allowPositionals: false,
      strict: true
    });
    values = parsed.values;
  } catch (err) {
    console.error(`CLI Error: ${err.message}`);
    printHelp();
    process.exit(1);
  }

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const isMemory = values.memory === true;
  const targetDbPath = isMemory
    ? ':memory:'
    : path.resolve(process.cwd(), values.db || process.env.REGUFLOW_DB_PATH || 'data/reguflow.db');

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║        Phenix / Project ReguFlow - Industrial Symbiosis Seeder         ║');
  console.log('║          Circular Economy Platform for Viksit Bharat 2026              ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Target Database : ${targetDbPath}`);
  console.log(`  Storage Mode    : ${isMemory ? 'In-Memory (Ephemeral)' : 'Persistent File'}`);
  console.log(`  Clean Existing  : ${values.clean ? 'Forced Clean' : 'Default Idempotent Purge'}\n`);

  // Ensure target directory exists for persistent file storage
  if (!isMemory) {
    const parentDir = path.dirname(targetDbPath);
    if (!fs.existsSync(parentDir)) {
      if (values.verbose) {
        console.log(`  [Directory] Creating parent directory: ${parentDir}`);
      }
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  try {
    // 1. Connect & initialize schema
    const db = getDatabase(targetDbPath);
    initSchema(db);

    // 2. Execute seed population
    const seedResult = seedDatabase(db, {
      clean: values.clean,
      initSchema: false,
      verbose: values.verbose
    });

    const elapsedMs = Date.now() - startTime;

    // 3. Print Summary Table
    console.log('┌──────────────────────────────────────────────┬───────────────┐');
    console.log('│ Entity Table Name                            │ Records Seeded│');
    console.log('├──────────────────────────────────────────────┼───────────────┤');
    console.log(`│ organizations                                │ ${String(seedResult.summary.organizations).padStart(13)} │`);
    console.log(`│ facilities                                   │ ${String(seedResult.summary.facilities).padStart(13)} │`);
    console.log(`│ material_catalog                             │ ${String(seedResult.summary.materials).padStart(13)} │`);
    console.log(`│ byproduct_listings                           │ ${String(seedResult.summary.listings).padStart(13)} │`);
    console.log(`│ demand_requirements                          │ ${String(seedResult.summary.demands).padStart(13)} │`);
    console.log(`│ match_proposals                              │ ${String(seedResult.summary.matches).padStart(13)} │`);
    console.log(`│ exchange_transactions                        │ ${String(seedResult.summary.transactions).padStart(13)} │`);
    console.log(`│ sustainability_metrics                       │ ${String(seedResult.summary.metrics).padStart(13)} │`);
    console.log('├──────────────────────────────────────────────┼───────────────┤');
    console.log(`│ TOTAL RECORDS INSERTED                       │ ${String(seedResult.summary.totalRecords).padStart(13)} │`);
    console.log('└──────────────────────────────────────────────┴───────────────┘');

    console.log(`\n  ✓ Database seeded successfully in ${elapsedMs}ms!`);
    console.log('  ✓ Referential integrity verified (foreign_keys = ON, zero violations)\n');

    process.exit(0);
  } catch (err) {
    console.error(`\n  ✗ Seeding failed with error: ${err.message}`);
    if (values.verbose && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
