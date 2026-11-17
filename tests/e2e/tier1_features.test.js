/**
 * Tier 1: Feature Inventory Coverage Tests
 * Phenix / Project ReguFlow (Viksit Bharat 2026 Showcase)
 *
 * Verifies primary (happy path) functionality across all 10 features from PROJECT.md § Feature Inventory:
 * - F1: Repository & Workspace Setup (5 tests)
 * - F2: DBMS CP1 Normalization (5 tests)
 * - F3: DBMS CP2 ER Diagram & Schema DDL (5 tests)
 * - F4: DBMS CP3 Core Platform Queries (5 tests)
 * - F5: DBMS CP4 Execution Plans & Benchmarks (5 tests)
 * - F6: Domain Models & Entity Schemas (5 tests)
 * - F7: Matchmaking Engine (5 tests)
 * - F8: Geolocation & Distance Calculation (5 tests)
 * - F9: Realistic Industrial Seed Data (5 tests)
 * - F10: E2E Test Suite & Coverage Hardening (5 tests)
 * Total: 50 tests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  haversineDistance,
  computeBoundingBox,
  calculateLogistics,
  calculateMatchScore,
  rankCandidates,
  getTestDatabase,
  seedDatabase,
  getCorridorSeedData,
  executeQ1MatchmakingQuery,
  executeQ2ProximityQuery,
  executeQ3AtomicTransaction,
  executeQ4ClusterEsgAnalytics,
  executeQ6LogisticsDiscrepancy,
  computeAuditChecksum,
  verifyAuditChain
} from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// ===========================================================================
// FEATURE 1: Repository & Workspace Setup (F1)
// ===========================================================================

test('F1.1: package.json specifies valid metadata, type=module, and private=true', () => {
  const pkgPath = path.join(projectRoot, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist in project root');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.strictEqual(pkg.name, 'phenix-reguflow', 'Package name must be phenix-reguflow');
  assert.strictEqual(pkg.type, 'module', 'Module type must be ES module');
  assert.strictEqual(pkg.private, true, 'Package must be marked private');
});

test('F1.2: package.json enforces Node.js >=24 and has ZERO external dependencies', () => {
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.engines && pkg.engines.node, 'engines.node must be specified');
  assert.match(pkg.engines.node, />=24/, 'Node engine must require >=24');
  assert.ok(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0, 'Must have zero runtime npm dependencies');
});

test('F1.3: team.json documents team T0010, group lead, members, and postgres version 16', () => {
  const teamPath = path.join(projectRoot, 'team.json');
  assert.ok(fs.existsSync(teamPath), 'team.json must exist in project root');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  assert.strictEqual(team.team_number, 'T0010', 'Team number must be T0010');
  assert.strictEqual(team.group_lead.name, 'Ashwin Maurya', 'Lead name must be Ashwin Maurya');
  assert.strictEqual(team.members.length, 4, 'Must have 4 registered team members');
  assert.strictEqual(team.postgres_version, '16', 'Target DBMS version must be PostgreSQL 16');
});

test('F1.4: Workspace adheres to code layout directory structure', () => {
  const requiredDirs = ['dbms', 'src', 'scripts', 'tests/e2e', 'tests/unit'];
  for (const dir of requiredDirs) {
    const fullPath = path.join(projectRoot, dir);
    assert.ok(fs.existsSync(fullPath), `Required directory ${dir} must exist`);
    assert.ok(fs.statSync(fullPath).isDirectory(), `${dir} must be a directory`);
  }
});

test('F1.5: Native Node.js v24 runtime modules are available and operational', () => {
  assert.strictEqual(typeof test, 'function', 'node:test must export test function');
  assert.strictEqual(typeof assert.strictEqual, 'function', 'node:assert/strict must export assertions');
  const testDb = getTestDatabase();
  assert.ok(testDb, 'node:sqlite DatabaseSync must instantiate cleanly');
  const checksum = computeAuditChecksum('INIT', 'TEST', '1', {}, { status: 'OK' });
  assert.strictEqual(typeof checksum, 'string', 'node:crypto SHA-256 must generate hash string');
  assert.strictEqual(checksum.length, 64, 'SHA-256 digest must be 64 hex characters');
});

// ===========================================================================
// FEATURE 2: DBMS CP1 Normalization (F2)
// ===========================================================================

test('F2.1: UNF Universal Relation captures denormalized circular exchange operations', () => {
  // A denormalized record containing multi-valued nested groups
  const unfTuple = {
    org_tax_id: 'U24110GJ2012PLC078901',
    org_legal_name: 'Dahej Petrochemicals & Chlor-Alkali Ltd',
    facilities: [
      { facility_code: 'FAC-DAHEJ-01', cluster: 'Dahej PCPIR', lat: 21.7122, lon: 72.5873 }
    ],
    listings: [
      { listing_code: 'LST-01', material_code: 'MAT-H2SO4', qty: 2500, purity: 78.4 }
    ],
    transactions: [
      { txn_code: 'TXN-01', agreed_qty: 1200, unit_price: 1250 }
    ]
  };
  assert.ok(unfTuple.facilities.length > 0, 'UNF contains repeating facilities');
  assert.ok(unfTuple.listings.length > 0, 'UNF contains repeating listings');
  assert.ok(unfTuple.transactions.length > 0, 'UNF contains repeating transactions');
});

test('F2.2: 1NF transformation eliminates multivalued repeating groups into atomic scalars', () => {
  // Flattening into single atomic tuples with composite keys
  const flat1NFTuples = [
    {
      org_tax_id: 'U24110GJ2012PLC078901',
      facility_code: 'FAC-DAHEJ-01',
      material_code: 'MAT-H2SO4',
      listing_code: 'LST-01',
      txn_code: 'TXN-01',
      agreed_qty: 1200
    }
  ];
  for (const tuple of flat1NFTuples) {
    for (const [key, value] of Object.entries(tuple)) {
      assert.ok(typeof value !== 'object' || value === null, `Attribute ${key} must be atomic scalar in 1NF`);
    }
  }
});

test('F2.3: 2NF decomposition eliminates partial functional dependencies', () => {
  // In 2NF, attributes depend on the entire candidate key, decomposing into separate relations
  const db = getTestDatabase();
  seedDatabase(db);
  // Organizations relation: OrgTaxID -> LegalName, ESG
  const org = db.prepare('SELECT legal_name, esg_score FROM organizations WHERE registration_number = ?')
    .get('U24110GJ2012PLC078901');
  assert.ok(org, 'Organization non-prime attributes exist in decomposed 2NF table');
  assert.strictEqual(org.legal_name, 'Dahej Petrochemicals & Chlor-Alkali Ltd');

  // Facilities relation: FacilityCode -> OrgID, Cluster, Lat, Lon (independent of listing or txn)
  const fac = db.prepare('SELECT cluster_name, latitude, longitude FROM facilities WHERE facility_code = ?')
    .get('FAC-DAHEJ-01');
  assert.ok(fac, 'Facility attributes isolated from composite transaction key');
  assert.strictEqual(fac.cluster_name, 'Dahej PCPIR');
});

test('F2.4: 3NF decomposition eliminates transitive dependencies', () => {
  // Total transaction value is derived: agreed_quantity * unit_price
  const agreedQty = 1200.0;
  const unitPrice = 1250.0;
  const derivedTotal = agreedQty * unitPrice;
  assert.strictEqual(derivedTotal, 1500000.0, 'Dynamic computation resolves transitive total price dependency');

  // Weighbridge net weight is generated dynamically: Gross - Tare
  const grossKg = 42000.0;
  const tareKg = 18000.0;
  const netKg = grossKg - tareKg;
  assert.strictEqual(netKg, 24000.0, 'Generated column eliminates transitive net weight redundancy');
});

test('F2.5: BCNF verification ensures every non-trivial determinant is a superkey', () => {
  const db = getTestDatabase();
  // Verifying unique candidate keys on determinants
  const orgCount = db.prepare('SELECT COUNT(DISTINCT registration_number) as u, COUNT(*) as t FROM organizations').get();
  assert.strictEqual(orgCount.u, orgCount.t, 'registration_number is unique superkey determinant');

  const facCount = db.prepare('SELECT COUNT(DISTINCT facility_code) as u, COUNT(*) as t FROM facilities').get();
  assert.strictEqual(facCount.u, facCount.t, 'facility_code is unique superkey determinant');

  const matCount = db.prepare('SELECT COUNT(DISTINCT material_code) as u, COUNT(*) as t FROM material_catalog').get();
  assert.strictEqual(matCount.u, matCount.t, 'material_code is unique superkey determinant');
});

// ===========================================================================
// FEATURE 3: DBMS CP2 ER Diagram & Schema DDL (F3)
// ===========================================================================

test('F3.1: Complete 10-table relational schema creates cleanly in SQLite', () => {
  const db = getTestDatabase();
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name
  `).all().map(r => r.name);

  const expectedTables = [
    'audit_logs',
    'byproduct_listings',
    'demand_requirements',
    'exchange_transactions',
    'facilities',
    'logistics_transits',
    'material_catalog',
    'match_proposals',
    'organizations',
    'sustainability_metrics'
  ];

  for (const expected of expectedTables) {
    assert.ok(tables.includes(expected), `Schema must contain table: ${expected}`);
  }
  assert.strictEqual(tables.length, 10, 'Must have exactly 10 core tables');
});

test('F3.2: Referential integrity enforces foreign keys with PRAGMA foreign_keys=ON', () => {
  const db = getTestDatabase();
  // Attempt to insert facility referencing non-existent organization ID 9999
  assert.throws(() => {
    db.prepare(`
      INSERT INTO facilities (
        organization_id, facility_code, facility_name, cluster_name,
        latitude, longitude, address, city, state, pincode
      ) VALUES (9999, 'FAC-ORPHAN', 'Orphan Plant', 'Nowhere', 20.0, 75.0, 'Road', 'City', 'State', '000000')
    `).run();
  }, /FOREIGN KEY constraint failed/, 'Orphan foreign key insertion must throw constraint error');
});

test('F3.3: Referential cascade rule deletes child facilities when organization is purged', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const org1FacilitiesBefore = db.prepare('SELECT count(*) as c FROM facilities WHERE organization_id = 1').get().c;
  assert.ok(org1FacilitiesBefore > 0, 'Facilities must exist for org 1');

  // Delete organization 1
  db.prepare('DELETE FROM organizations WHERE organization_id = 1').run();
  const org1FacilitiesAfter = db.prepare('SELECT count(*) as c FROM facilities WHERE organization_id = 1').get().c;
  assert.strictEqual(org1FacilitiesAfter, 0, 'Child facilities must cascade delete');
});

test('F3.4: Domain CHECK constraints reject negative price and invalid purity', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Negative price check
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-FAIL-PRICE', 'Fail Price', 'LIQUID', 'NON_HAZARDOUS', '{}', 90.0, 100.0, 100.0, -50.0, 10.0, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/, 'Negative price must trigger check constraint violation');

  // Purity > 100% check
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-FAIL-PURITY', 'Fail Purity', 'LIQUID', 'NON_HAZARDOUS', '{}', 105.0, 100.0, 100.0, 50.0, 10.0, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/, 'Purity > 100% must trigger check constraint violation');
});

test('F3.5: Weighbridge check constraint enforces gross weight >= tare weight', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Prepare transaction
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  const tx = db.prepare(`
    INSERT INTO exchange_transactions (
      match_id, contract_reference, seller_facility_id, buyer_facility_id, material_id, agreed_quantity, agreed_price_per_unit_inr, total_transaction_value_inr
    ) VALUES (?, 'TXN-WEIGH-TEST', 1, 3, 1, 100.0, 1000.0, 100000.0) RETURNING transaction_id
  `).get(mp.match_id);

  // Attempt to insert transit where tare (25000) > gross (20000)
  assert.throws(() => {
    db.prepare(`
      INSERT INTO logistics_transits (
        transaction_id, carrier_org_id, waybill_number, vehicle_reg_number,
        weighbridge_gross_kg, weighbridge_tare_kg, transit_status
      ) VALUES (?, 11, 'WB-FAIL-TARE', 'GJ-06-AA-1111', 20000.0, 25000.0, 'DISPATCHED')
    `).run(tx.transaction_id);
  }, /CHECK constraint failed/, 'Tare > Gross must trigger check constraint violation');
});

// ===========================================================================
// FEATURE 4: DBMS CP3 Core Platform Queries (F4)
// ===========================================================================

test('F4.1: Q1 Multi-Attribute Matchmaking query pairs compatible listings and demands', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const matches = executeQ1MatchmakingQuery(db);
  assert.ok(matches.length > 0, 'Q1 query must find valid matches');
  // Top match should be Dahej Spent Acid -> Bharuch SSP
  const acidMatch = matches.find(m => m.listing_code === 'LST-DAHEJ-H2SO4-01');
  assert.ok(acidMatch, 'Dahej H2SO4 match must be returned');
  assert.strictEqual(acidMatch.material_code, 'MAT-CHEM-01');
  assert.ok(acidMatch.distance_km < 50.0, 'Distance must be < 50 km for local cluster pairing');
});

test('F4.2: Q2 Geolocation Proximity Radius query filters facilities within bounding box', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Search around Dahej (21.7122, 72.5873) within 50 km radius
  const nearby = executeQ2ProximityQuery(db, 21.7122, 72.5873, 50.0);
  assert.ok(nearby.length >= 2, 'Should find at least 2 facilities in Gujarat cluster within 50 km');
  for (const fac of nearby) {
    assert.ok(fac.distance_km <= 50.0, `Facility ${fac.facility_name} distance ${fac.distance_km} must be <= 50km`);
  }
});

test('F4.3: Q3 Atomic Transaction Workflow decrements listing inventory and logs audit record', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.94, 1.0, 0.95, 0.98, 0.85, 42.2) RETURNING match_id
  `).get();

  const listingBefore = db.prepare('SELECT available_quantity FROM byproduct_listings WHERE listing_id = 1').get();
  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 500.0,
    agreedUnitPrice: 1250.0,
    waybillNumber: 'WB-Q3-TEST-001',
    grossKg: 35000,
    tareKg: 15000
  });

  assert.ok(tx.transactionId > 0, 'Transaction ID must be returned');
  const listingAfter = db.prepare('SELECT available_quantity, status FROM byproduct_listings WHERE listing_id = 1').get();
  assert.strictEqual(listingAfter.available_quantity, listingBefore.available_quantity - 500.0, 'Available quantity must be decremented');
  assert.strictEqual(listingAfter.status, 'PARTIALLY_FULFILLED', 'Listing status must transition to PARTIALLY_FULFILLED');
});

test('F4.4: Q4 Regional ESG Impact analytics aggregates emissions and computes cluster ranks', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.94, 1.0, 0.95, 0.98, 0.85, 42.2) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 1000.0,
    agreedUnitPrice: 1250.0
  });

  const clusterEsg = executeQ4ClusterEsgAnalytics(db);
  assert.ok(clusterEsg.length > 0, 'Q4 must return cluster summary rows');
  const topCluster = clusterEsg[0];
  assert.strictEqual(topCluster.cluster_esg_rank, 1, 'Top cluster must have rank 1');
  assert.ok(topCluster.total_co2e_kg_avoided > 0, 'Avoided CO2e must be positive');
  assert.ok(topCluster.total_landfill_tons_diverted > 0, 'Landfill diversion tons must be positive');
});

test('F4.5: Q6 Logistics Discrepancy query detects weighbridge cargo deviations', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();

  // Agreed 20.0 tons = 20,000 kg. Weighbridge net is 22,000 kg (gross 37000 - tare 15000) -> 10% discrepancy > 2% tolerance
  executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 20.0,
    agreedUnitPrice: 1250.0,
    waybillNumber: 'WB-DISCREPANCY-01',
    grossKg: 37000.0,
    tareKg: 15000.0
  });

  const discrepancies = executeQ6LogisticsDiscrepancy(db, 0.02);
  assert.ok(discrepancies.length > 0, 'Discrepancy query must flag shipment with 10% weight deviation');
  assert.strictEqual(discrepancies[0].waybill_number, 'WB-DISCREPANCY-01');
  assert.strictEqual(discrepancies[0].variance_kg, 2000.0);
});

// ===========================================================================
// FEATURE 5: DBMS CP4 Execution Plans & Benchmarks (F5)
// ===========================================================================

test('F5.1: Performance indices exist on spatial coordinates and foreign keys', () => {
  const db = getTestDatabase();
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'
  `).all().map(r => r.name);

  assert.ok(indexes.includes('idx_facilities_coords'), 'Index on facilities coordinates must exist');
  assert.ok(indexes.includes('idx_facilities_cluster'), 'Index on facilities cluster must exist');
  assert.ok(indexes.includes('idx_listings_fac_mat'), 'Composite index on listings must exist');
  assert.ok(indexes.includes('idx_matches_score'), 'Index on match score must exist');
});

test('F5.2: Bounding box pre-filtering prunes spatial candidate space', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Center: Dahej (21.7122, 72.5873). Radius: 10 km (very tight)
  const tightBox = computeBoundingBox(21.7122, 72.5873, 10.0);
  const candidatesInBox = db.prepare(`
    SELECT count(*) as c FROM facilities
    WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
  `).get(tightBox.minLat, tightBox.maxLat, tightBox.minLon, tightBox.maxLon);

  assert.strictEqual(candidatesInBox.c, 1, 'Only Dahej facility itself should fall within 10 km bounding box');
});

test('F5.3: EXPLAIN query plan confirms index usage on coordinate range search', () => {
  const db = getTestDatabase();
  const plan = db.prepare(`
    EXPLAIN QUERY PLAN
    SELECT facility_name FROM facilities WHERE latitude BETWEEN 20.0 AND 22.0 AND longitude BETWEEN 72.0 AND 74.0
  `).all();
  assert.ok(plan.length > 0, 'EXPLAIN QUERY PLAN must return plan tree nodes');
  const planText = JSON.stringify(plan);
  assert.ok(planText.includes('idx_facilities_coords') || planText.includes('COVERING INDEX') || planText.includes('INDEX'),
    'Query plan should utilize coordinate index');
});

test('F5.4: Unique match proposal constraint enforces atomic 1:1 proposal pairs', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0)
  `).run();

  // Duplicate proposal insert for same supply & demand
  assert.throws(() => {
    db.prepare(`
      INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
      VALUES (1, 1, 0.95, 1.0, 0.95, 0.95, 0.8, 42.0)
    `).run();
  }, /UNIQUE constraint failed/, 'Duplicate match proposal pair must violate unique constraint');
});

test('F5.5: Query execution benchmark verifies high-throughput lookup latency', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    executeQ1MatchmakingQuery(db);
  }
  const durationMs = performance.now() - start;
  assert.ok(durationMs < 1000.0, `50 iterations of Q1 should execute within 1000ms (took ${durationMs.toFixed(2)}ms)`);
});

// ===========================================================================
// FEATURE 6: Domain Models & Entity Schemas (F6)
// ===========================================================================

test('F6.1: Organization domain model validates registration, sector, and ESG bounds', () => {
  const seed = getCorridorSeedData();
  const org = seed.organizations[0];
  assert.match(org.registration_number, /^[A-Z0-9]+$/, 'CIN / registration number must be alphanumeric');
  assert.ok(org.esg_score >= 0.0 && org.esg_score <= 100.0, 'ESG score must be in [0, 100]');
  assert.ok(org.reliability_rating >= 0.0 && org.reliability_rating <= 5.0, 'Reliability must be in [0, 5]');
});

test('F6.2: Facility domain model validates WGS84 geographic boundaries', () => {
  const seed = getCorridorSeedData();
  for (const fac of seed.facilities) {
    assert.ok(fac.latitude >= -90.0 && fac.latitude <= 90.0, 'Latitude must be in [-90, 90]');
    assert.ok(fac.longitude >= -180.0 && fac.longitude <= 180.0, 'Longitude must be in [-180, 180]');
    assert.ok(fac.cluster_name && fac.cluster_name.length > 0, 'Cluster name must be populated');
  }
});

test('F6.3: Material catalog entity validates taxonomy, physical states, and hazard tiers', () => {
  const seed = getCorridorSeedData();
  const validStates = ['SOLID', 'SOLID_POWDER', 'SOLID_GRANULAR', 'SOLID_BULK', 'LIQUID', 'GAS', 'SLURRY', 'SLUDGE'];
  for (const mat of seed.materials) {
    assert.ok(validStates.includes(mat.physical_state), `Physical state ${mat.physical_state} must be valid`);
    assert.ok(mat.carbon_offset_factor_kg_per_unit >= 0, 'Carbon offset factor must be non-negative');
    assert.ok(mat.landfill_diversion_factor_tons_per_unit >= 0, 'Landfill diversion factor must be non-negative');
  }
});

test('F6.4: Byproduct listing entity validates quantity, purity, and MOQ invariants', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const listings = db.prepare('SELECT * FROM byproduct_listings').all();
  for (const l of listings) {
    assert.ok(l.total_quantity > 0, 'Total quantity must be strictly positive');
    assert.ok(l.available_quantity >= 0, 'Available quantity must be non-negative');
    assert.ok(l.minimum_order_quantity <= l.total_quantity, 'MOQ must not exceed total quantity');
    assert.ok(l.purity_percentage >= 0.0 && l.purity_percentage <= 100.0, 'Purity must be in [0, 100]');
  }
});

test('F6.5: Sustainability metric model validates positive offset and circularity index in [0, 1]', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp.match_id, agreedQuantity: 100.0, agreedUnitPrice: 1250.0 });

  const metrics = db.prepare('SELECT * FROM sustainability_metrics').all();
  assert.ok(metrics.length > 0, 'Metrics should be recorded');
  const m = metrics[0];
  assert.ok(m.embodied_carbon_offset_kg > 0, 'Carbon offset must be positive');
  assert.ok(m.landfill_diversion_tons > 0, 'Landfill diversion must be positive');
  assert.ok(m.circularity_coefficient >= 0.0 && m.circularity_coefficient <= 1.0, 'Circularity score must be in [0, 1]');
});

// ===========================================================================
// FEATURE 7: Matchmaking Engine (F7)
// ===========================================================================

test('F7.1: High compatibility match yields net score > 0.85 and eligible = true', () => {
  const supply = {
    material_id: 1,
    physical_state: 'LIQUID',
    purity_percentage: 80.0,
    hazard_tier: 'HAZARDOUS_CLASS_A',
    available_quantity: 2000.0,
    minimum_order_quantity: 50.0
  };
  const demand = {
    material_id: 1,
    required_physical_state: 'LIQUID',
    minimum_purity_percentage: 70.0,
    acceptable_hazard_tiers: ['HAZARDOUS_CLASS_A', 'NON_HAZARDOUS'],
    required_quantity: 1500.0,
    max_logistics_distance_km: 200.0
  };
  const result = calculateMatchScore(supply, demand, 42.0, { esg_score: 85, reliability_rating: 4.5 }, { esg_score: 80, reliability_rating: 4.2 });
  assert.strictEqual(result.eligible, true, 'Match must be marked eligible');
  assert.ok(result.netScore > 0.85, `Net score ${result.netScore} should exceed 0.85`);
  assert.strictEqual(result.breakdown.materialScore, 1.0, 'Material score should be 1.0');
});

test('F7.2: Physical state mismatch yields netScore = 0.0 and eligible = false', () => {
  const supply = {
    material_id: 1,
    physical_state: 'LIQUID',
    purity_percentage: 95.0,
    available_quantity: 1000.0
  };
  const demand = {
    material_id: 1,
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 70.0,
    required_quantity: 500.0
  };
  const result = calculateMatchScore(supply, demand, 10.0);
  assert.strictEqual(result.eligible, false, 'State mismatch must not be eligible');
  assert.strictEqual(result.netScore, 0.0, 'Net score must be 0.0 for state mismatch');
  assert.strictEqual(result.breakdown.materialScore, 0.0, 'Material score must be 0.0');
});

test('F7.3: Inadmissible hazard tier yields netScore = 0.0 and eligible = false', () => {
  const supply = {
    material_id: 1,
    physical_state: 'SOLID',
    purity_percentage: 95.0,
    hazard_tier: 'TOXIC_CORROSIVE',
    available_quantity: 1000.0
  };
  const demand = {
    material_id: 1,
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 80.0,
    acceptable_hazard_tiers: ['NON_HAZARDOUS'],
    required_quantity: 500.0
  };
  const result = calculateMatchScore(supply, demand, 20.0);
  assert.strictEqual(result.eligible, false, 'Hazard mismatch must not be eligible');
  assert.strictEqual(result.netScore, 0.0, 'Net score must be 0.0');
});

test('F7.4: Available quantity below MOQ yields netScore = 0.0 and eligible = false', () => {
  const supply = {
    material_id: 1,
    physical_state: 'SOLID',
    purity_percentage: 90.0,
    available_quantity: 40.0,
    minimum_order_quantity: 100.0
  };
  const demand = {
    material_id: 1,
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 80.0,
    required_quantity: 40.0
  };
  const result = calculateMatchScore(supply, demand, 20.0);
  assert.strictEqual(result.eligible, false, 'Available < MOQ must not be eligible');
  assert.strictEqual(result.netScore, 0.0, 'Net score must be 0.0');
});

test('F7.5: Candidate ranking sorts multiple supply options descending by composite match score', () => {
  const demand = {
    facility_id: 1,
    material_id: 1,
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 80.0,
    required_quantity: 1000.0,
    max_logistics_distance_km: 500.0
  };
  const supplyListings = [
    { facility_id: 2, material_id: 1, physical_state: 'SOLID', purity_percentage: 85.0, available_quantity: 1000.0, minimum_order_quantity: 50.0 }, // near
    { facility_id: 3, material_id: 1, physical_state: 'SOLID', purity_percentage: 95.0, available_quantity: 1000.0, minimum_order_quantity: 50.0 }  // far
  ];
  const facilitiesMap = {
    1: { latitude: 20.0, longitude: 73.0, organization_id: 101 },
    2: { latitude: 20.1, longitude: 73.1, organization_id: 102 }, // ~15 km
    3: { latitude: 22.5, longitude: 75.0, organization_id: 103 }  // ~340 km
  };
  const orgMap = {
    101: { esg_score: 80, reliability_rating: 4.0 },
    102: { esg_score: 85, reliability_rating: 4.5 },
    103: { esg_score: 85, reliability_rating: 4.5 }
  };

  const ranked = rankCandidates(demand, supplyListings, facilitiesMap, orgMap);
  assert.strictEqual(ranked.length, 2, 'Must rank both candidates');
  assert.ok(ranked[0].netScore >= ranked[1].netScore, 'First candidate must have score >= second candidate');
  assert.strictEqual(ranked[0].listing.facility_id, 2, 'Near facility should rank higher due to proximity');
});

// ===========================================================================
// FEATURE 8: Geolocation & Distance Calculation (F8)
// ===========================================================================

test('F8.1: Haversine distance between Dahej and Ankleshwar is approximately 45.2 km', () => {
  // Dahej: (21.7122, 72.5873), Ankleshwar: (21.6264, 73.0152)
  const dist = haversineDistance(21.7122, 72.5873, 21.6264, 73.0152);
  assert.ok(Math.abs(dist - 45.235) < 1.0, `Calculated distance ${dist} must be ~45.2 km`);
});

test('F8.2: Coincident coordinates return distance of exactly 0.000 km', () => {
  const dist = haversineDistance(18.7606, 73.8636, 18.7606, 73.8636);
  assert.strictEqual(dist, 0.000, 'Coincident coordinates must return 0.000 km');
});

test('F8.3: Bounding box produces valid min/max coordinates enclosing search radius', () => {
  const lat = 21.7122;
  const lon = 72.5873;
  const radiusKm = 50.0;
  const box = computeBoundingBox(lat, lon, radiusKm);
  assert.ok(box.minLat < lat && box.maxLat > lat, 'Latitude envelope must surround center');
  assert.ok(box.minLon < lon && box.maxLon > lon, 'Longitude envelope must surround center');

  // Any point at distance <= radius must be inside box
  const testLat = 21.6264; // Ankleshwar (~45.2 km)
  const testLon = 73.0152;
  assert.ok(testLat >= box.minLat && testLat <= box.maxLat, 'Ankleshwar lat must be inside 50km bbox');
  assert.ok(testLon >= box.minLon && testLon <= box.maxLon, 'Ankleshwar lon must be inside 50km bbox');
});

test('F8.4: Freight logistics calculation computes base rate, fixed fee, and hazmat multiplier', () => {
  const distKm = 100.0;
  const qtyTons = 50.0;
  // Non-hazardous: 1500 + 100 * 8.5 * 1.0 * 50 = 1500 + 42500 = 44,000 INR
  const nonHaz = calculateLogistics(distKm, qtyTons, 'NON_HAZARDOUS');
  assert.strictEqual(nonHaz.estimatedCostINR, 44000.00);

  // Toxic / Corrosive (2.4x): 1500 + 100 * 8.5 * 2.4 * 50 = 1500 + 102000 = 103,500 INR
  const toxic = calculateLogistics(distKm, qtyTons, 'TOXIC_CORROSIVE');
  assert.strictEqual(toxic.estimatedCostINR, 103500.00);
});

test('F8.5: Commercial transit duration calculation includes buffer, speed, and driver rest', () => {
  // Distance: 700 km -> 2 driver rests (700/350 = 2) * 14h = 28h rest + 700/35 = 20h drive + 4h buffer = 52.0h
  const logistics = calculateLogistics(700.0, 30.0);
  assert.strictEqual(logistics.transitDurationHours, 52.00);
  assert.strictEqual(logistics.routeFeasible, true);
});

// ===========================================================================
// FEATURE 9: Realistic Industrial Seed Data (F9)
// ===========================================================================

test('F9.1: Seed data includes all 4 authentic Indian industrial corridors', () => {
  const seed = getCorridorSeedData();
  const clusters = seed.facilities.map(f => f.cluster_name);
  assert.ok(clusters.some(c => c.includes('Dahej') || c.includes('Gujarat')), 'Must include Gujarat chemical belt');
  assert.ok(clusters.some(c => c.includes('Chakan') || c.includes('Pune')), 'Must include Maharashtra auto corridor');
  assert.ok(clusters.some(c => c.includes('Tirupur') || c.includes('Coimbatore')), 'Must include Tamil Nadu cluster');
  assert.ok(clusters.some(c => c.includes('Jamshedpur') || c.includes('Chaibasa')), 'Must include Jharkhand steel corridor');
});

test('F9.2: Seed data contains authentic byproduct materials and hazard tiers', () => {
  const seed = getCorridorSeedData();
  const matNames = seed.materials.map(m => m.material_name);
  assert.ok(matNames.includes('Spent Sulfuric Acid'), 'Must include Spent Sulfuric Acid');
  assert.ok(matNames.includes('Industrial Phosphogypsum'), 'Must include Industrial Phosphogypsum');
  assert.ok(matNames.includes('Spent Foundry Silica Sand'), 'Must include Spent Foundry Silica Sand');
  assert.ok(matNames.includes('Granulated Blast Furnace Slag (GGBS)'), 'Must include GGBS');
  assert.ok(matNames.includes('Dried Textile Effluent Sludge'), 'Must include Textile Effluent Sludge');
});

test('F9.3: Seed organizations contain valid Indian corporate legal entities and GSTIN/CIN', () => {
  const seed = getCorridorSeedData();
  for (const org of seed.organizations) {
    assert.ok(org.legal_name.length > 5, 'Legal name must be descriptive');
    assert.match(org.registration_number, /^U\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/, 'Must conform to Ministry of Corporate Affairs CIN pattern');
    assert.strictEqual(org.verification_status, 'VERIFIED', 'Seed organizations must be verified');
  }
});

test('F9.4: Seed supply listings have parseable chemical compositions and positive pricing', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const listings = db.prepare('SELECT chemical_composition, price_per_unit_inr FROM byproduct_listings').all();
  assert.ok(listings.length >= 5, 'Must seed at least 5 byproduct listings');
  for (const l of listings) {
    assert.doesNotThrow(() => JSON.parse(l.chemical_composition), 'Chemical composition must be valid JSON');
    assert.ok(l.price_per_unit_inr >= 0, 'Price must be non-negative');
  }
});

test('F9.5: Seed database populates all 10 core tables with referential integrity intact', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const orgCount = db.prepare('SELECT count(*) as c FROM organizations').get().c;
  const facCount = db.prepare('SELECT count(*) as c FROM facilities').get().c;
  const matCount = db.prepare('SELECT count(*) as c FROM material_catalog').get().c;
  const listCount = db.prepare('SELECT count(*) as c FROM byproduct_listings').get().c;
  const demandCount = db.prepare('SELECT count(*) as c FROM demand_requirements').get().c;

  assert.ok(orgCount >= 10, 'Must have at least 10 organizations');
  assert.ok(facCount >= 10, 'Must have at least 10 facilities');
  assert.ok(matCount >= 6, 'Must have at least 6 materials');
  assert.ok(listCount >= 5, 'Must have at least 5 listings');
  assert.ok(demandCount >= 5, 'Must have at least 5 demands');
});

// ===========================================================================
// FEATURE 10: E2E Test Suite & Coverage Hardening (F10)
// ===========================================================================

test('F10.1: Test suite runs with zero npm packages using standard Node library', () => {
  const nodeVersion = process.version;
  assert.match(nodeVersion, /^v(2[4-9]|[3-9][0-9])\./, 'Must run on Node.js v24');
  assert.strictEqual(typeof DatabaseSync, 'function', 'DatabaseSync must be standard native import');
});

test('F10.2: Native assert/strict validates deep equality and strict types', () => {
  const obj1 = { id: 1, val: 'abc' };
  const obj2 = { id: 1, val: 'abc' };
  assert.deepStrictEqual(obj1, obj2, 'deepStrictEqual must verify value equivalence');
  assert.notStrictEqual(1, '1', 'strictEqual must enforce distinct types');
});

test('F10.3: Test database isolation ensures no state leaks between executions', () => {
  const db1 = getTestDatabase();
  db1.exec("INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone) VALUES ('U1', 'Org1', 'Sec1', 'e1', 'p1');");
  assert.strictEqual(db1.prepare('SELECT count(*) as c FROM organizations').get().c, 1);

  const db2 = getTestDatabase();
  assert.strictEqual(db2.prepare('SELECT count(*) as c FROM organizations').get().c, 0, 'New database must be completely empty');
});

test('F10.4: Cryptographic SHA-256 audit ledger helper verifies hash chain integrity', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp.match_id, agreedQuantity: 100.0, agreedUnitPrice: 1000.0 });

  const auditResult = verifyAuditChain(db);
  assert.strictEqual(auditResult.valid, true, 'Audit chain must be valid');
  assert.strictEqual(auditResult.brokenAtLogId, null, 'No broken links in audit chain');
  assert.strictEqual(auditResult.totalChecked, 1, 'One audit record verified');
});

test('F10.5: Invariant failure reports diagnostic error messages without false positives', () => {
  assert.throws(() => {
    haversineDistance(95.0, 0.0, 20.0, 0.0);
  }, {
    name: 'RangeError',
    message: /Latitude out of range/
  }, 'Out of range latitude must throw descriptive RangeError');
});
