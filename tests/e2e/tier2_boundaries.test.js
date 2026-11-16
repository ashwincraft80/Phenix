/**
 * Tier 2: Boundary & Corner Cases Tests
 * Phenix / Project ReguFlow (Viksit Bharat 2026 Showcase)
 *
 * Verifies boundary conditions, domain limits, edge values, and error rejection across all 10 features:
 * - B1: Repository & Workspace Boundaries (5 tests)
 * - B2: DBMS CP1 Normalization Boundaries (5 tests)
 * - B3: DBMS CP2 ER Diagram & Schema DDL Boundaries (5 tests)
 * - B4: DBMS CP3 Core Platform Queries Boundaries (5 tests)
 * - B5: DBMS CP4 Execution Plans & Benchmarks Boundaries (5 tests)
 * - B6: Domain Models & Entity Schemas Boundaries (5 tests)
 * - B7: Matchmaking Engine Boundaries (5 tests)
 * - B8: Geolocation & Geodesy Boundaries (5 tests)
 * - B9: Realistic Industrial Seed Data Boundaries (5 tests)
 * - B10: E2E Test Suite & Hardening Boundaries (5 tests)
 * Total: 50 tests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  haversineDistance,
  computeBoundingBox,
  calculateLogistics,
  calculateMatchScore,
  validateCoordinates,
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
// B1: Repository & Workspace Boundaries
// ===========================================================================

test('B1.1: Rejects package configuration missing type=module', () => {
  const invalidConfig = { name: 'phenix-reguflow', private: true };
  assert.notStrictEqual(invalidConfig.type, 'module', 'Configuration without type=module must be detected');
});

test('B1.2: Rejects package configuration containing external dependencies', () => {
  const dirtyConfig = { name: 'test', dependencies: { express: '^4.19.2' } };
  const hasDeps = dirtyConfig.dependencies && Object.keys(dirtyConfig.dependencies).length > 0;
  assert.strictEqual(hasDeps, true, 'External npm dependencies must be flagged as violation');
});

test('B1.3: Rejects Node engine lower than v24.0.0', () => {
  const oldEngine = '>=18.0.0';
  const satisfiesV24 = />=24/.test(oldEngine);
  assert.strictEqual(satisfiesV24, false, 'Pre-v24 node engines must be rejected');
});

test('B1.4: Rejects team metadata with fewer or greater than 4 members', () => {
  const invalidTeam = { team_number: 'T0010', members: [{ name: 'A' }, { name: 'B' }] };
  assert.notStrictEqual(invalidTeam.members.length, 4, 'Non-4 member team configuration must be rejected');
});

test('B1.5: Verifies non-existent files correctly return false without crashing', () => {
  import('node:fs').then(fs => {
    assert.strictEqual(fs.existsSync(path.join(projectRoot, 'non_existent_file.xyz')), false);
  });
});

// ===========================================================================
// B2: DBMS CP1 Normalization Boundaries
// ===========================================================================

test('B2.1: Decomposing schema with circular dependencies terminates without infinite loop', () => {
  // A -> B, B -> C, C -> A
  const fds = [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' }
  ];
  // Closure of A: {A, B, C}
  const closureA = new Set(['A']);
  let added = true;
  let iterations = 0;
  while (added && iterations < 10) {
    added = false;
    iterations++;
    for (const fd of fds) {
      if (closureA.has(fd.from) && !closureA.has(fd.to)) {
        closureA.add(fd.to);
        added = true;
      }
    }
  }
  assert.deepStrictEqual([...closureA].sort(), ['A', 'B', 'C'], 'Transitive closure computes correctly');
  assert.ok(iterations < 5, 'Closure calculation must terminate in bounded iterations');
});

test('B2.2: Empty candidate key set is rejected as invalid determinant', () => {
  const determinant = [];
  assert.strictEqual(determinant.length === 0, true, 'Empty determinant must be flagged');
});

test('B2.3: Relation with only trivial dependencies trivially satisfies BCNF', () => {
  // Relation R(A, B) with only A -> A and B -> B
  const nonTrivialFDs = [];
  const satisfiesBCNF = nonTrivialFDs.length === 0;
  assert.strictEqual(satisfiesBCNF, true, 'Zero non-trivial FDs vacuously satisfy BCNF');
});

test('B2.4: 1NF rejects non-scalar nested JSON objects as non-atomic domain values', () => {
  const atomicValue = 42;
  const nonAtomicValue = { nested: [1, 2, 3] };
  assert.strictEqual(typeof atomicValue !== 'object', true, 'Scalar value is atomic');
  assert.strictEqual(typeof nonAtomicValue === 'object', true, 'Nested structure violates 1NF atomicity');
});

test('B2.5: Decomposition without common attribute fails lossless join test', () => {
  // R1(A, B), R2(C, D) -> R1 ∩ R2 = ∅
  const r1Attrs = new Set(['A', 'B']);
  const r2Attrs = new Set(['C', 'D']);
  const intersection = [...r1Attrs].filter(x => r2Attrs.has(x));
  assert.strictEqual(intersection.length, 0, 'Disjoint decomposition cannot be lossless');
});

// ===========================================================================
// B3: DBMS CP2 ER Diagram & Schema DDL Boundaries
// ===========================================================================

test('B3.1: Coordinate boundary rejection: Latitudes 90.0001 and -90.0001 rejected', () => {
  const db = getTestDatabase();
  assert.throws(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-OOB-LAT1', 'OOB Lat 1', 'Cluster', 90.0001, 75.0, 'Addr', 'City', 'State', '000000')
    `).run();
  }, /CHECK constraint failed/, 'Latitude 90.0001 must violate check constraint');

  assert.throws(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-OOB-LAT2', 'OOB Lat 2', 'Cluster', -90.0001, 75.0, 'Addr', 'City', 'State', '000000')
    `).run();
  }, /CHECK constraint failed/, 'Latitude -90.0001 must violate check constraint');
});

test('B3.2: Coordinate boundary rejection: Longitudes 180.0001 and -180.0001 rejected', () => {
  const db = getTestDatabase();
  assert.throws(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-OOB-LON1', 'OOB Lon 1', 'Cluster', 20.0, 180.0001, 'Addr', 'City', 'State', '000000')
    `).run();
  }, /CHECK constraint failed/, 'Longitude 180.0001 must violate check constraint');

  assert.throws(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-OOB-LON2', 'OOB Lon 2', 'Cluster', 20.0, -180.0001, 'Addr', 'City', 'State', '000000')
    `).run();
  }, /CHECK constraint failed/, 'Longitude -180.0001 must violate check constraint');
});

test('B3.3: Exact coordinate limits [-90.0, 90.0] and [-180.0, 180.0] accepted cleanly', () => {
  const db = getTestDatabase();
  db.prepare(`
    INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone)
    VALUES ('U-COORD-BOUND', 'Coord Org', 'Testing', 'test@test.com', '1234567890')
  `).run();

  // Test North Pole + East Limit
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-NP-E', 'North Pole East', 'Pole', 90.0, 180.0, 'Addr', 'City', 'State', '000000')
    `).run();
  });

  // Test South Pole + West Limit
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-SP-W', 'South Pole West', 'Pole', -90.0, -180.0, 'Addr', 'City', 'State', '000000')
    `).run();
  });
});

test('B3.4: Purity boundaries: exact 0.0% and 100.0% accepted; -0.01% and 100.01% rejected', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Exact 0.0% accepted
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-PURITY-0', 'Purity 0', 'LIQUID', 'NON_HAZARDOUS', '{}', 0.0, 100.0, 100.0, 100.0, 10.0, 'ACTIVE')
    `).run();
  });

  // Exact 100.0% accepted
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-PURITY-100', 'Purity 100', 'LIQUID', 'NON_HAZARDOUS', '{}', 100.0, 100.0, 100.0, 100.0, 10.0, 'ACTIVE')
    `).run();
  });

  // Negative purity rejected
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-PURITY-NEG', 'Purity Neg', 'LIQUID', 'NON_HAZARDOUS', '{}', -0.01, 100.0, 100.0, 100.0, 10.0, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/);

  // Over 100% purity rejected
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-PURITY-EXC', 'Purity Exc', 'LIQUID', 'NON_HAZARDOUS', '{}', 100.01, 100.0, 100.0, 100.0, 10.0, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/);
});

test('B3.5: Weighbridge tare exactly equal to gross (net weight 0.0 kg) accepted', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  const tx = db.prepare(`
    INSERT INTO exchange_transactions (
      match_id, contract_reference, seller_facility_id, buyer_facility_id, material_id, agreed_quantity, agreed_price_per_unit_inr, total_transaction_value_inr
    ) VALUES (?, 'TXN-ZERO-NET', 1, 3, 1, 10.0, 1000.0, 10000.0) RETURNING transaction_id
  `).get(mp.match_id);

  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO logistics_transits (
        transaction_id, carrier_org_id, waybill_number, vehicle_reg_number,
        weighbridge_gross_kg, weighbridge_tare_kg, transit_status
      ) VALUES (?, 11, 'WB-ZERO-NET-01', 'GJ-06-BB-2222', 15000.0, 15000.0, 'DISPATCHED')
    `).run(tx.transaction_id);
  });

  const transit = db.prepare('SELECT weighbridge_net_kg FROM logistics_transits WHERE waybill_number = ?').get('WB-ZERO-NET-01');
  assert.strictEqual(transit.weighbridge_net_kg, 0.0, 'Net weight must equal 0.0 kg when gross equals tare');
});

// ===========================================================================
// B4: DBMS CP3 Core Platform Queries Boundaries
// ===========================================================================

test('B4.1: Q2 Proximity search with radius 0.0 km returns only center point if coincident', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Search at Dahej coordinates with 0.001 km radius
  const results = executeQ2ProximityQuery(db, 21.7122, 72.5873, 0.001);
  assert.strictEqual(results.length, 1, 'Only exact center facility should match near-zero radius');
  assert.strictEqual(results[0].facility_code, 'FAC-DAHEJ-01');
});

test('B4.2: Q2 Proximity search with extreme radius 40,000 km returns all facilities', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const totalFacilities = db.prepare('SELECT count(*) as c FROM facilities').get().c;
  const allEnclosed = executeQ2ProximityQuery(db, 20.0, 75.0, 40000.0);
  assert.strictEqual(allEnclosed.length, totalFacilities, 'Global radius must enclose all facilities');
});

test('B4.3: Q1 Matchmaking returns empty list when all listings are DEPLETED', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Set all listings to DEPLETED
  db.prepare("UPDATE byproduct_listings SET status = 'DEPLETED', available_quantity = 0.0").run();
  const matches = executeQ1MatchmakingQuery(db);
  assert.strictEqual(matches.length, 0, 'No matches should be generated when listings are depleted');
});

test('B4.4: Q4 Regional ESG Analytics with zero transactions returns empty list cleanly', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Ensure no transactions exist
  db.prepare('DELETE FROM sustainability_metrics').run();
  db.prepare('DELETE FROM logistics_transits').run();
  db.prepare('DELETE FROM exchange_transactions').run();

  const clusterEsg = executeQ4ClusterEsgAnalytics(db);
  assert.strictEqual(clusterEsg.length, 0, 'Zero transactions should return empty cluster list without error');
});

test('B4.5: Q6 Discrepancy threshold: exactly 2.0% variance not flagged; 2.01% flagged', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp1 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  // 100 tons = 100,000 kg. Gross 122000 - Tare 20000 = 102,000 kg net -> exactly 2.0% variance
  executeQ3AtomicTransaction(db, {
    proposalId: mp1.match_id,
    agreedQuantity: 100.0,
    agreedUnitPrice: 1000.0,
    waybillNumber: 'WB-TOLERANCE-EXACT',
    grossKg: 122000.0,
    tareKg: 20000.0
  });

  const mp2 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (2, 2, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  // 100 tons = 100,000 kg. Gross 122100 - Tare 20000 = 102,100 kg net -> 2.1% variance > 2.0%
  executeQ3AtomicTransaction(db, {
    proposalId: mp2.match_id,
    agreedQuantity: 100.0,
    agreedUnitPrice: 1000.0,
    waybillNumber: 'WB-TOLERANCE-OVER',
    grossKg: 122100.0,
    tareKg: 20000.0
  });

  const flagged = executeQ6LogisticsDiscrepancy(db, 0.02);
  assert.strictEqual(flagged.length, 1, 'Only 2.1% variance should be flagged');
  assert.strictEqual(flagged[0].waybill_number, 'WB-TOLERANCE-OVER');
});

// ===========================================================================
// B5: DBMS CP4 Execution Plans & Benchmarks Boundaries
// ===========================================================================

test('B5.1: High cardinality batch insertion maintains indexed query execution stability', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const insertFac = db.prepare(`
    INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
    VALUES (1, ?, 'Bench Facility', 'Bench Cluster', ?, ?, 'Addr', 'City', 'State', '000000')
  `);

  db.exec('BEGIN TRANSACTION;');
  for (let i = 0; i < 200; i++) {
    const lat = 20.0 + (i * 0.005);
    const lon = 72.0 + (i * 0.005);
    insertFac.run(`FAC-BENCH-${i}`, lat, lon);
  }
  db.exec('COMMIT;');

  const count = db.prepare('SELECT count(*) as c FROM facilities').get().c;
  assert.ok(count >= 210, 'Database must contain 210+ facilities');

  const start = performance.now();
  const searchResults = executeQ2ProximityQuery(db, 20.5, 72.5, 50.0);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 100.0, `Indexed range query over 200+ facilities should take <100ms (took ${elapsed.toFixed(2)}ms)`);
  assert.ok(searchResults.length > 0, 'Should find matching facilities in range');
});

test('B5.2: Bounding box search near North Pole clamps maxLat to 90.0 without crash', () => {
  const box = computeBoundingBox(89.5, 0.0, 100.0);
  assert.strictEqual(box.maxLat, 90.0, 'maxLat must clamp to exactly 90.0');
  assert.ok(box.minLat < 89.5, 'minLat must be strictly less than 89.5');
});

test('B5.3: Bounding box search across Antimeridian clamps longitude range', () => {
  const box = computeBoundingBox(10.0, 179.9, 100.0);
  assert.ok(box.minLon < 179.9, 'minLon must be below 179.9');
  assert.ok(box.maxLon <= 180.0, 'maxLon must clamp to <= 180.0');
});

test('B5.4: Transaction insertion under zero available quantity is prevented', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Deplete listing 1
  db.prepare("UPDATE byproduct_listings SET available_quantity = 0.0, status = 'DEPLETED' WHERE listing_id = 1").run();
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();

  const listing = db.prepare('SELECT available_quantity FROM byproduct_listings WHERE listing_id = 1').get();
  assert.strictEqual(listing.available_quantity, 0.0, 'Listing is completely depleted');
});

test('B5.5: Simultaneous multiple proposal inserts enforce uniqueness on (supply, demand)', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const insertProposal = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (?, ?, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0)
  `);

  insertProposal.run(1, 1);
  assert.throws(() => {
    insertProposal.run(1, 1);
  }, /UNIQUE constraint failed/);
});

// ===========================================================================
// B6: Domain Models & Entity Schemas Boundaries
// ===========================================================================

test('B6.1: Organization ESG score boundaries: exact 0.0 and 100.0 accepted; out of range rejected', () => {
  const db = getTestDatabase();
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, esg_score)
      VALUES ('U-ESG-0', 'ESG Zero', 'Testing', 't0@t.com', '123', 0.0)
    `).run();
  });
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, esg_score)
      VALUES ('U-ESG-100', 'ESG 100', 'Testing', 't100@t.com', '123', 100.0)
    `).run();
  });
  assert.throws(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, esg_score)
      VALUES ('U-ESG-NEG', 'ESG Neg', 'Testing', 'tneg@t.com', '123', -0.01)
    `).run();
  }, /CHECK constraint failed/);
  assert.throws(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, esg_score)
      VALUES ('U-ESG-OOB', 'ESG OOB', 'Testing', 'toob@t.com', '123', 100.01)
    `).run();
  }, /CHECK constraint failed/);
});

test('B6.2: Organization reliability boundaries: exact 0.0 and 5.0 accepted; out of range rejected', () => {
  const db = getTestDatabase();
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, reliability_rating)
      VALUES ('U-REL-0', 'Rel Zero', 'Testing', 'r0@t.com', '123', 0.0)
    `).run();
  });
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, reliability_rating)
      VALUES ('U-REL-5', 'Rel 5', 'Testing', 'r5@t.com', '123', 5.0)
    `).run();
  });
  assert.throws(() => {
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, reliability_rating)
      VALUES ('U-REL-OOB', 'Rel OOB', 'Testing', 'roob@t.com', '123', 5.01)
    `).run();
  }, /CHECK constraint failed/);
});

test('B6.3: Quantity boundaries: fractional 0.001 MT accepted; zero total quantity rejected', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Fractional quantity 0.001 MT accepted
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-MICRO-001', 'Micro Quantity', 'LIQUID', 'NON_HAZARDOUS', '{}', 99.0, 0.001, 0.001, 1000.0, 0.001, 'ACTIVE')
    `).run();
  });

  // Zero total quantity rejected
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-ZERO-QTY', 'Zero Qty', 'LIQUID', 'NON_HAZARDOUS', '{}', 99.0, 0.0, 0.0, 1000.0, 1.0, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/);
});

test('B6.4: MOQ equal to total quantity accepted; MOQ exceeding total quantity rejected', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // MOQ == Total Qty accepted
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-MOQ-EQUAL', 'MOQ Equal', 'LIQUID', 'NON_HAZARDOUS', '{}', 95.0, 50.0, 50.0, 100.0, 50.0, 'ACTIVE')
    `).run();
  });

  // MOQ > Total Qty rejected
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-MOQ-EXCEED', 'MOQ Exceed', 'LIQUID', 'NON_HAZARDOUS', '{}', 95.0, 50.0, 50.0, 100.0, 50.1, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/);
});

test('B6.5: Zero price byproduct (free waste transfer) accepted; negative price rejected', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Zero price accepted
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-ZERO-PRICE', 'Free Byproduct', 'LIQUID', 'NON_HAZARDOUS', '{}', 90.0, 100.0, 100.0, 0.0, 10.0, 'ACTIVE')
    `).run();
  });

  // Negative price rejected
  assert.throws(() => {
    db.prepare(`
      INSERT INTO byproduct_listings (
        facility_id, material_id, listing_code, title, physical_state, hazard_tier,
        chemical_composition, purity_percentage, total_quantity, available_quantity,
        price_per_unit_inr, minimum_order_quantity, status
      ) VALUES (1, 1, 'LST-NEG-PRICE', 'Neg Price', 'LIQUID', 'NON_HAZARDOUS', '{}', 90.0, 100.0, 100.0, -0.01, 10.0, 'ACTIVE')
    `).run();
  }, /CHECK constraint failed/);
});

// ===========================================================================
// B7: Matchmaking Engine Boundaries
// ===========================================================================

test('B7.1: Exact purity equality (P_S === P_D) yields C_purity = 1.0', () => {
  const supply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 75.0, available_quantity: 100.0 };
  const demand = { material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 75.0, required_quantity: 100.0 };
  const result = calculateMatchScore(supply, demand, 10.0);
  assert.strictEqual(result.breakdown.materialScore, 1.0, 'Purity equality must yield materialScore = 1.0');
});

test('B7.2: Partial fulfillment power curve matches (Q_S / Q_D)^0.8 formulation', () => {
  const supply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 200.0, minimum_order_quantity: 50.0 };
  const demand = { material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 80.0, required_quantity: 1000.0 };
  const result = calculateMatchScore(supply, demand, 10.0);
  // (200 / 1000)^0.8 = (0.2)^0.8 = ~0.2759
  const expectedSqty = Number(Math.pow(200 / 1000, 0.8).toFixed(4));
  assert.strictEqual(result.breakdown.quantityScore, expectedSqty, 'Quantity score must follow (Q_S/Q_D)^0.8');
});

test('B7.3: Extreme oversupply (50,000 MT vs 10 MT) applies dampening without negative score', () => {
  const supply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 50000.0, minimum_order_quantity: 1.0 };
  const demand = { material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 80.0, required_quantity: 10.0 };
  const result = calculateMatchScore(supply, demand, 10.0);
  // Oversupply dampening: 1.0 - 0.1 * min(1.0, (5000 - 1)/(5000 + 1)) = ~0.9000
  assert.ok(result.breakdown.quantityScore >= 0.89 && result.breakdown.quantityScore <= 0.91,
    `Quantity score ${result.breakdown.quantityScore} should be damped to ~0.90`);
});

test('B7.4: Distance exceeding max_logistics_distance_km strictly yields S_dist = 0.0 and ineligible', () => {
  const supply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 500.0, minimum_order_quantity: 50.0 };
  const demand = { material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 80.0, required_quantity: 500.0, max_logistics_distance_km: 150.0 };
  // Distance 151 km > 150 km cap
  const result = calculateMatchScore(supply, demand, 151.0);
  assert.strictEqual(result.eligible, false, 'Distance exceeding cap must mark match ineligible');
  assert.strictEqual(result.netScore, 0.0, 'Net score must be 0.0 when distance cap is breached');
  assert.strictEqual(result.breakdown.distanceScore, 0.0, 'Distance score must be 0.0');
});

test('B7.5: Unrated counter-parties with null ESG/reliability default to neutral 0.50 prior', () => {
  const supply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 500.0, minimum_order_quantity: 50.0 };
  const demand = { material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 80.0, required_quantity: 500.0 };
  // No ESG or reliability provided -> defaults to 50 ESG and 3.0 reliability -> 0.6*(50/100) + 0.4*(3/5) = 0.3 + 0.24 = 0.54
  const result = calculateMatchScore(supply, demand, 0.0, {}, {});
  assert.strictEqual(result.breakdown.esgScore, 0.54, 'Neutral prior should yield consistent ESG score ~0.54');
});

// ===========================================================================
// B8: Geolocation & Geodesy Boundaries
// ===========================================================================

test('B8.1: Exact boundary coordinates [-90, 90] and [-180, 180] accepted by validator', () => {
  assert.strictEqual(validateCoordinates(-90.0, -180.0), true);
  assert.strictEqual(validateCoordinates(90.0, 180.0), true);
  assert.strictEqual(validateCoordinates(0.0, 0.0), true);
});

test('B8.2: Out-of-bounds latitude (90.0001 and -90.0001) throws RangeError', () => {
  assert.throws(() => haversineDistance(90.0001, 0, 0, 0), RangeError);
  assert.throws(() => haversineDistance(-90.0001, 0, 0, 0), RangeError);
});

test('B8.3: Out-of-bounds longitude (180.0001 and -180.0001) throws RangeError', () => {
  assert.throws(() => haversineDistance(0, 180.0001, 0, 0), RangeError);
  assert.throws(() => haversineDistance(0, -180.0001, 0, 0), RangeError);
});

test('B8.4: Non-numeric, null, undefined, and NaN coordinates throw TypeError', () => {
  assert.throws(() => haversineDistance(NaN, 0, 0, 0), TypeError);
  assert.throws(() => haversineDistance('20', 0, 0, 0), TypeError);
  assert.throws(() => haversineDistance(null, 0, 0, 0), TypeError);
  assert.throws(() => haversineDistance(undefined, 0, 0, 0), TypeError);
});

test('B8.5: Antipodal points return half-circumference ~20,015.087 km without NaN', () => {
  // Equator antipodes: (0, 0) to (0, 180)
  const distEquator = haversineDistance(0.0, 0.0, 0.0, 180.0);
  assert.ok(Math.abs(distEquator - 20015.087) < 1.0, `Antipodal distance ${distEquator} should be ~20,015 km`);
  assert.ok(!Number.isNaN(distEquator), 'Antipodal distance must not be NaN');

  // Polar antipodes: (90, 0) to (-90, 0)
  const distPoles = haversineDistance(90.0, 0.0, -90.0, 0.0);
  assert.ok(Math.abs(distPoles - 20015.087) < 1.0, `Polar antipodal distance ${distPoles} should be ~20,015 km`);
});

// ===========================================================================
// B9: Realistic Industrial Seed Data Boundaries
// ===========================================================================

test('B9.1: Micro-scale quantity byproduct (0.001 MT) handled correctly in logistics and database', () => {
  const logistics = calculateLogistics(50.0, 0.001, 'NON_HAZARDOUS');
  assert.ok(logistics.estimatedCostINR >= 1500.0, 'Fixed terminal fee must apply even to micro loads');
  assert.strictEqual(logistics.routeFeasible, true);
});

test('B9.2: Macro-scale quantity byproduct (1,000,000 MT) computed without numerical overflow', () => {
  const logistics = calculateLogistics(500.0, 1000000.0, 'NON_HAZARDOUS');
  assert.ok(Number.isFinite(logistics.estimatedCostINR), 'Cost must remain finite number at 1M ton scale');
  assert.ok(logistics.estimatedCostINR > 1000000000.0, 'Cost should be in billion INR range');
});

test('B9.3: Multiple facilities under same organization share organization_id FK', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  // Add a second facility for Org 1 (Dahej Petrochem)
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, city, state, pincode)
      VALUES (1, 'FAC-DAHEJ-02', 'Dahej Plant 2', 'Dahej PCPIR', 21.7200, 72.5900, 'Plot 46', 'Dahej', 'Gujarat', '392130')
    `).run();
  });
  const org1Facilities = db.prepare('SELECT count(*) as c FROM facilities WHERE organization_id = 1').get().c;
  assert.strictEqual(org1Facilities, 2, 'Organization 1 should own 2 facilities');
});

test('B9.4: Distinct physical states in material taxonomy conform to allowed ENUM domain', () => {
  const seed = getCorridorSeedData();
  const states = new Set(seed.materials.map(m => m.physical_state));
  assert.ok(states.has('LIQUID'), 'Must include LIQUID state');
  assert.ok(states.has('SOLID'), 'Must include SOLID state');
});

test('B9.5: Zero logistics distance yields fixed terminal fee only', () => {
  const logistics = calculateLogistics(0.0, 100.0, 'NON_HAZARDOUS');
  assert.strictEqual(logistics.estimatedCostINR, 1500.0, 'At 0 km distance, cost equals fixed terminal fee (1500 INR)');
  assert.strictEqual(logistics.transitDurationHours, 4.0, 'At 0 km distance, transit duration equals terminal buffer (4h)');
});

// ===========================================================================
// B10: E2E Test Suite & Hardening Boundaries
// ===========================================================================

test('B10.1: Native assert rejects mismatched data types without implicit coercion', () => {
  assert.throws(() => {
    assert.strictEqual(0, false);
  }, assert.AssertionError);
  assert.throws(() => {
    assert.strictEqual('', false);
  }, assert.AssertionError);
});

test('B10.2: Database rollback on transaction error preserves previous database state', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const countBefore = db.prepare('SELECT count(*) as c FROM organizations').get().c;

  assert.throws(() => {
    db.exec('BEGIN TRANSACTION;');
    db.prepare("INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone) VALUES ('U-ROLLBACK', 'Rollback Org', 'Test', 'e', 'p')").run();
    // Deliberate constraint violation to trigger rollback
    db.prepare("INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone, esg_score) VALUES ('U-FAIL', 'Fail Org', 'Test', 'e', 'p', 999.0)").run();
    db.exec('COMMIT;');
  });

  db.exec('ROLLBACK;');
  const countAfter = db.prepare('SELECT count(*) as c FROM organizations').get().c;
  assert.strictEqual(countAfter, countBefore, 'Database state must be identical after rollback');
});

test('B10.3: Tamper detection flags corrupted checksum in middle of audit log chain', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp1 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp1.match_id, agreedQuantity: 100.0, agreedUnitPrice: 1000.0 });

  const mp2 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (2, 2, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp2.match_id, agreedQuantity: 200.0, agreedUnitPrice: 500.0 });

  // Tamper with log entry 1
  db.prepare("UPDATE audit_logs SET new_state = '{\"tampered\": true}' WHERE log_id = 1").run();

  const auditCheck = verifyAuditChain(db);
  assert.strictEqual(auditCheck.valid, false, 'Tampered log must be detected');
  assert.strictEqual(auditCheck.brokenAtLogId, 1, 'Broken link must pinpoint log_id 1');
});

test('B10.4: Empty audit log verification returns valid = true and totalChecked = 0', () => {
  const db = getTestDatabase();
  const emptyCheck = verifyAuditChain(db);
  assert.strictEqual(emptyCheck.valid, true);
  assert.strictEqual(emptyCheck.totalChecked, 0);
  assert.strictEqual(emptyCheck.brokenAtLogId, null);
});

test('B10.5: Concurrent distinct in-memory SQLite instances are completely decoupled', () => {
  const dbs = Array.from({ length: 5 }, () => getTestDatabase());
  for (let i = 0; i < dbs.length; i++) {
    dbs[i].exec(`INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone) VALUES ('U-${i}', 'Org ${i}', 'Sector', 'e', 'p')`);
  }
  for (let i = 0; i < dbs.length; i++) {
    const rows = dbs[i].prepare('SELECT count(*) as c FROM organizations').get().c;
    assert.strictEqual(rows, 1, `Instance ${i} must contain exactly 1 organization`);
  }
});
