/**
 * Tier 3: Pairwise Cross-Feature Combinations Tests
 * Phenix / Project ReguFlow (Viksit Bharat 2026 Showcase)
 *
 * Verifies cross-module interactions and multi-component state flows:
 * - C1: Listing Creation + Geolocation Bounding Box Pruning (F6 + F8)
 * - C2: Matchmaking Scoring + Hazmat Freight Logistics Cost Multiplier (F7 + F8)
 * - C3: Exchange Transaction Execution + ESG Metric Calculation (F4 + F6)
 * - C4: Relational Schema DDL + Analytical Query Workflows Q1-Q4 (F3 + F4)
 * - C5: Seed Data Ingestion + Spatial Matchmaking Ranking (F9 + F7)
 * - C6: Cryptographic Audit Log SHA-256 Hashing + Transaction State Machine (F3 + F4)
 * - C7: Demand Requirement Purity Threshold + Material Taxonomy Compatibility (F6 + F7)
 * - C8: Quantity Fulfillment Curve + Freight Weight Tiering (F7 + F8)
 * - C9: Organization ESG Rating + Matchmaking Score Weighting (F6 + F7)
 * - C10: Multi-Facility Cluster Proximity + Secondary Byproduct Substitution (F8 + F9)
 * - C11: Atomic Inventory Decrement + High-Throughput Multi-Buyer Contention (F4 + F7)
 * - C12: Weighbridge Discrepancy Detection + Audit Event Logging (F3 + F4)
 * Total: 12 tests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

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

// ===========================================================================
// C1: Listing Creation + Geolocation Bounding Box Pruning (F6 + F8)
// ===========================================================================

test('C1: Listing Creation with GPS coordinates enables spatial bounding box pruning', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Dahej center: (21.7122, 72.5873)
  const centerLat = 21.7122;
  const centerLon = 72.5873;
  const radiusKm = 60.0;
  const bbox = computeBoundingBox(centerLat, centerLon, radiusKm);

  // Query facilities having active listings inside bounding box
  const query = `
    SELECT f.facility_code, f.cluster_name, bl.listing_code, bl.total_quantity,
           round(6371.0088 * acos(min(1.0, max(-1.0,
             cos(radians(?)) * cos(radians(f.latitude)) *
             cos(radians(f.longitude) - radians(?)) +
             sin(radians(?)) * sin(radians(f.latitude))
           ))), 3) AS distance_km
    FROM facilities f
    JOIN byproduct_listings bl ON f.facility_id = bl.facility_id
    WHERE f.latitude BETWEEN ? AND ? AND f.longitude BETWEEN ? AND ?
      AND bl.status = 'ACTIVE'
    ORDER BY distance_km ASC;
  `;

  const results = db.prepare(query).all(
    centerLat, centerLon, centerLat,
    bbox.minLat, bbox.maxLat, bbox.minLon, bbox.maxLon
  );

  assert.ok(results.length >= 2, 'Should find active listings in Dahej and nearby cluster');
  for (const r of results) {
    assert.ok(r.distance_km <= radiusKm, `Distance ${r.distance_km} must not exceed ${radiusKm} km`);
  }
});

// ===========================================================================
// C2: Matchmaking Scoring + Hazmat Freight Logistics Cost Multiplier (F7 + F8)
// ===========================================================================

test('C2: Matchmaking score and freight logistics interact across hazard tiers', () => {
  // Supply: Spent Sulfuric Acid (HAZARDOUS_CLASS_A, multiplier 1.8x)
  const supplyAcid = {
    material_id: 1,
    physical_state: 'LIQUID',
    purity_percentage: 78.4,
    hazard_tier: 'HAZARDOUS_CLASS_A',
    available_quantity: 1500.0,
    minimum_order_quantity: 50.0
  };
  const demandAcid = {
    material_id: 1,
    required_physical_state: 'LIQUID',
    minimum_purity_percentage: 70.0,
    acceptable_hazard_tiers: ['HAZARDOUS_CLASS_A'],
    required_quantity: 1200.0,
    max_logistics_distance_km: 100.0
  };

  const distanceKm = 42.2; // Dahej to Bharuch
  const matchResult = calculateMatchScore(supplyAcid, demandAcid, distanceKm, { esg_score: 82.5, reliability_rating: 4.6 }, { esg_score: 79.0, reliability_rating: 4.4 });
  assert.strictEqual(matchResult.eligible, true, 'Match must be eligible');
  assert.ok(matchResult.netScore > 0.88, 'Match score should be high due to proximity');

  // Calculate freight logistics for this exact matched transaction (1200 tons, 42.2 km)
  const logistics = calculateLogistics(distanceKm, 1200.0, supplyAcid.hazard_tier);
  // Base: 1500 + 42.2 * 8.50 * 1.8 * 1200 = 1500 + 774792 = 776,292.00 INR
  assert.strictEqual(logistics.estimatedCostINR, 776292.00, 'Hazmat multiplier 1.8x must be factored into logistics');
  assert.strictEqual(logistics.routeFeasible, true);
});

// ===========================================================================
// C3: Exchange Transaction Execution + ESG Metric Calculation (F4 + F6)
// ===========================================================================

test('C3: Contract execution triggers automatic CO2e avoided and landfill diversion accounting', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Proposal for 1500 MT of Spent H2SO4 (MAT-CHEM-01: carbon offset factor 145 kg/MT, landfill factor 1.0 ton/MT)
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.94, 1.0, 0.95, 0.98, 0.85, 42.2) RETURNING match_id
  `).get();

  const agreedTons = 1200.0;
  const agreedPrice = 1250.0;
  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: agreedTons,
    agreedUnitPrice: agreedPrice,
    waybillNumber: 'WB-ESG-TEST-001',
    grossKg: 35000,
    tareKg: 15000
  });

  const metric = db.prepare('SELECT * FROM sustainability_metrics WHERE transaction_id = ?').get(tx.transactionId);
  assert.ok(metric, 'Sustainability metrics must be created for executed transaction');
  // 1200 tons * 145 kg/ton = 174,000 kg CO2e offset
  assert.strictEqual(metric.embodied_carbon_offset_kg, 174000.0, 'Embodied carbon offset must be 174,000 kg');
  // 1200 tons landfill diversion
  assert.strictEqual(metric.landfill_diversion_tons, 1200.0, 'Landfill diversion must equal 1,200 tons');
  assert.strictEqual(metric.economic_value_saved_inr, agreedTons * 500.0, 'Economic savings must equal 600,000 INR');
});

// ===========================================================================
// C4: Relational Schema DDL + Analytical Query Workflows Q1-Q4 (F3 + F4)
// ===========================================================================

test('C4: Full DDL schema seamlessly supports end-to-end analytical workflow Q1 through Q4', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Step 1: Execute Q1 matchmaking
  const q1Results = executeQ1MatchmakingQuery(db);
  assert.ok(q1Results.length > 0, 'Q1 produces matchmaking candidate pairs');
  const candidate = q1Results[0];

  // Step 2: Execute Q2 proximity around candidate seller facility
  const sellerFac = db.prepare('SELECT latitude, longitude FROM facilities WHERE facility_name = ?').get(candidate.supplier_facility);
  const q2Results = executeQ2ProximityQuery(db, sellerFac.latitude, sellerFac.longitude, 100.0);
  assert.ok(q2Results.length > 0, 'Q2 identifies candidate facilities in neighborhood');

  // Step 3: Insert Proposal and execute Q3 atomic contract binding
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (?, ?, 0.95, 1.0, 0.95, 0.98, 0.85, ?) RETURNING match_id
  `).get(candidate.listing_id, candidate.demand_id, candidate.distance_km);

  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: candidate.potential_match_quantity,
    agreedUnitPrice: candidate.supplier_price
  });
  assert.ok(tx.transactionId > 0, 'Q3 executes contract reservation');

  // Step 4: Execute Q4 regional ESG cluster ranking
  const q4Results = executeQ4ClusterEsgAnalytics(db);
  assert.ok(q4Results.length > 0, 'Q4 produces cluster ESG summaries');
  assert.strictEqual(q4Results[0].settled_transactions_count, 1, 'Cluster summary includes executed transaction');
});

// ===========================================================================
// C5: Seed Data Ingestion + Spatial Matchmaking Ranking (F9 + F7)
// ===========================================================================

test('C5: Ingested industrial seed dataset drives candidate ranking across all 4 corridors', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  const listings = db.prepare('SELECT * FROM byproduct_listings').all();
  const demands = db.prepare('SELECT * FROM demand_requirements').all();
  const facilities = db.prepare('SELECT * FROM facilities').all();
  const orgs = db.prepare('SELECT * FROM organizations').all();

  const facilitiesMap = Object.fromEntries(facilities.map(f => [f.facility_id, f]));
  const orgsMap = Object.fromEntries(orgs.map(o => [o.organization_id, o]));

  // Test ranking for Chakan Foundry Sand demand (DMD-TALE-SAND-01)
  const sandDemand = demands.find(d => d.demand_code === 'DMD-TALE-SAND-01');
  assert.ok(sandDemand, 'Foundry sand demand must be present');

  const ranked = rankCandidates(sandDemand, listings, facilitiesMap, orgsMap);
  assert.ok(ranked.length > 0, 'Candidates must be evaluated');

  const topCandidate = ranked[0];
  assert.strictEqual(topCandidate.listing.listing_code, 'LST-CHAK-SAND-01', 'Chakan foundry sand must rank #1');
  assert.strictEqual(topCandidate.eligible, true, 'Top candidate must be eligible');
  assert.ok(topCandidate.netScore > 0.90, 'Close distance (~19 km) should yield net score > 0.90');
});

// ===========================================================================
// C6: Cryptographic Audit Log SHA-256 Hashing + Transaction State Machine (F3 + F4)
// ===========================================================================

test('C6: Sequential transactions form an unbroken SHA-256 cryptographic audit chain', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Execute Txn 1
  const mp1 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp1.match_id, agreedQuantity: 100.0, agreedUnitPrice: 1000.0 });

  // Execute Txn 2
  const mp2 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (2, 2, 0.85, 1.0, 0.8, 0.8, 0.8, 320.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp2.match_id, agreedQuantity: 5000.0, agreedUnitPrice: 450.0 });

  // Execute Txn 3
  const mp3 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (3, 3, 0.95, 1.0, 0.95, 0.98, 0.85, 19.3) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp3.match_id, agreedQuantity: 2000.0, agreedUnitPrice: 380.0 });

  const auditStatus = verifyAuditChain(db);
  assert.strictEqual(auditStatus.valid, true, 'Audit chain across 3 transactions must be cryptographically valid');
  assert.strictEqual(auditStatus.totalChecked, 3, 'All 3 audit entries must be verified');
  assert.strictEqual(auditStatus.brokenAtLogId, null, 'No broken links');
});

// ===========================================================================
// C7: Demand Requirement Purity Threshold + Material Taxonomy Compatibility (F6 + F7)
// ===========================================================================

test('C7: Purity threshold drop penalizes material compatibility according to steep penalty function', () => {
  const supply = {
    material_id: 1,
    physical_state: 'LIQUID',
    purity_percentage: 72.0, // below 85.0%
    available_quantity: 1000.0,
    minimum_order_quantity: 50.0
  };
  const demand = {
    material_id: 1,
    required_physical_state: 'LIQUID',
    minimum_purity_percentage: 85.0,
    required_quantity: 500.0
  };

  const result = calculateMatchScore(supply, demand, 20.0);
  // C_purity = 1.0 - 3.0 * (85 - 72)/85 = 1.0 - 3.0 * 13/85 = 1.0 - 0.4588 = 0.5412
  const expectedPurity = Number((1.0 - 3.0 * (13 / 85)).toFixed(4));
  assert.strictEqual(result.breakdown.materialScore, expectedPurity, 'Purity compatibility must follow steep decay curve');
  assert.strictEqual(result.eligible, true, 'S_mat 0.5412 >= 0.50 threshold, so still eligible');

  // Even steeper drop: purity 60% vs min 85% -> 1.0 - 3.0 * (25/85) = 1.0 - 0.8824 = 0.1176 (< 0.50 -> hard ineligible)
  const lowPuritySupply = { ...supply, purity_percentage: 60.0 };
  const lowResult = calculateMatchScore(lowPuritySupply, demand, 20.0);
  assert.strictEqual(lowResult.eligible, false, 'S_mat < 0.50 must cause match ineligibility');
  assert.strictEqual(lowResult.netScore, 0.0, 'Net score must drop to 0.0');
});

// ===========================================================================
// C8: Quantity Fulfillment Curve + Freight Weight Tiering (F7 + F8)
// ===========================================================================

test('C8: Quantity fulfillment score correlates with freight weight tiers', () => {
  const demandReq = { required_quantity: 1000.0, material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 80.0 };
  const distanceKm = 100.0;

  // Partial fulfillment: 250 MT (25%)
  const partialSupply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 250.0, minimum_order_quantity: 50.0 };
  const partialScore = calculateMatchScore(partialSupply, demandReq, distanceKm);
  const partialLogistics = calculateLogistics(distanceKm, 250.0);

  // Complete fulfillment: 1000 MT (100%)
  const fullSupply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 1000.0, minimum_order_quantity: 50.0 };
  const fullScore = calculateMatchScore(fullSupply, demandReq, distanceKm);
  const fullLogistics = calculateLogistics(distanceKm, 1000.0);

  assert.ok(fullScore.breakdown.quantityScore > partialScore.breakdown.quantityScore, 'Full fulfillment quantity score must exceed partial');
  assert.ok(fullLogistics.estimatedCostINR > partialLogistics.estimatedCostINR, 'Logistics freight cost must scale with cargo tonnage');
  assert.strictEqual(partialLogistics.estimatedCostINR, 1500 + 100 * 8.5 * 250, 'Partial cost matches ton-km calculation');
  assert.strictEqual(fullLogistics.estimatedCostINR, 1500 + 100 * 8.5 * 1000, 'Full cost matches ton-km calculation');
});

// ===========================================================================
// C9: Organization ESG Rating + Matchmaking Score Weighting (F6 + F7)
// ===========================================================================

test('C9: Superior ESG ratings boost composite match score under heavy ESG weighting', () => {
  const supply = { material_id: 1, physical_state: 'SOLID', purity_percentage: 90.0, available_quantity: 1000.0, minimum_order_quantity: 50.0 };
  const demand = { material_id: 1, required_physical_state: 'SOLID', minimum_purity_percentage: 80.0, required_quantity: 1000.0 };
  const distanceKm = 100.0;

  const lowEsgSupp = { esg_score: 30.0, reliability_rating: 2.0 };
  const lowEsgRec = { esg_score: 40.0, reliability_rating: 2.5 };
  const highEsgSupp = { esg_score: 95.0, reliability_rating: 4.8 };
  const highEsgRec = { esg_score: 92.0, reliability_rating: 4.7 };

  // Score with heavy ESG weight (50% ESG)
  const esgHeavyWeights = { material: 0.25, quantity: 0.15, distance: 0.10, esg: 0.50 };

  const lowScore = calculateMatchScore(supply, demand, distanceKm, lowEsgSupp, lowEsgRec, esgHeavyWeights);
  const highScore = calculateMatchScore(supply, demand, distanceKm, highEsgSupp, highEsgRec, esgHeavyWeights);

  assert.ok(highScore.netScore > lowScore.netScore + 0.20, 'High ESG counter-parties must gain significant score advantage');
  assert.ok(highScore.breakdown.esgScore > 0.90, 'High ESG composite score should exceed 0.90');
  assert.ok(lowScore.breakdown.esgScore < 0.40, 'Low ESG composite score should be below 0.40');
});

// ===========================================================================
// C10: Multi-Facility Cluster Proximity + Secondary Byproduct Substitution (F8 + F9)
// ===========================================================================

test('C10: Co-located cluster facilities achieve high proximity score facilitating byproduct substitution', () => {
  const seed = getCorridorSeedData();
  // Dahej (21.7122, 72.5873) and Bharuch (21.7051, 72.9959)
  const dahejFac = seed.facilities.find(f => f.facility_code === 'FAC-DAHEJ-01');
  const bharuchFac = seed.facilities.find(f => f.facility_code === 'FAC-BHAR-01');

  const distance = haversineDistance(dahejFac.latitude, dahejFac.longitude, bharuchFac.latitude, bharuchFac.longitude);
  assert.ok(distance < 50.0, `Dahej to Bharuch distance ${distance} km is within local cluster`);

  // Evaluate proximity score S_dist
  const d0 = 300.0;
  const sDist = 1.0 / (1.0 + Math.pow(distance / d0, 2));
  assert.ok(sDist > 0.95, `Proximity score ${sDist} must be > 0.95 for intra-cluster haulage`);
});

// ===========================================================================
// C11: Atomic Inventory Decrement + High-Throughput Multi-Buyer Contention (F4 + F7)
// ===========================================================================

test('C11: Atomic transaction prevents inventory over-allocation under sequential demand execution', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // Listing 1 has 2500 MT available
  const initialAvail = db.prepare('SELECT available_quantity FROM byproduct_listings WHERE listing_id = 1').get().available_quantity;
  assert.strictEqual(initialAvail, 2500.0);

  // Buyer 1 reserves 1500 MT
  const mp1 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();
  executeQ3AtomicTransaction(db, { proposalId: mp1.match_id, agreedQuantity: 1500.0, agreedUnitPrice: 1250.0 });

  const midAvail = db.prepare('SELECT available_quantity, status FROM byproduct_listings WHERE listing_id = 1').get();
  assert.strictEqual(midAvail.available_quantity, 1000.0);
  assert.strictEqual(midAvail.status, 'PARTIALLY_FULFILLED');

  // Buyer 2 reserves remaining 1000 MT
  // Use a second demand requirement to satisfy UNIQUE (supply_listing_id, demand_requirement_id)
  const dr2 = db.prepare(`
    INSERT INTO demand_requirements (
      facility_id, material_id, demand_code, title, required_physical_state,
      minimum_purity_percentage, acceptable_hazard_tiers, required_quantity, status
    ) VALUES (3, 1, 'DMD-BUYER2', 'Buyer 2 Demand', 'LIQUID', 70.0, '["HAZARDOUS_CLASS_A"]', 1000.0, 'OPEN')
    RETURNING demand_id
  `).get();

  const mp2 = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, ?, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get(dr2.demand_id);
  executeQ3AtomicTransaction(db, { proposalId: mp2.match_id, agreedQuantity: 1000.0, agreedUnitPrice: 1250.0 });

  const finalAvail = db.prepare('SELECT available_quantity, status FROM byproduct_listings WHERE listing_id = 1').get();
  assert.strictEqual(finalAvail.available_quantity, 0.0);
  assert.strictEqual(finalAvail.status, 'FULFILLED');
});

// ===========================================================================
// C12: Weighbridge Discrepancy Detection + Audit Event Logging (F3 + F4)
// ===========================================================================

test('C12: Weighbridge net weight generation and discrepancy detection log audit trail', () => {
  const db = getTestDatabase();
  seedDatabase(db);
  const mp = db.prepare(`
    INSERT INTO match_proposals (supply_listing_id, demand_requirement_id, match_score, score_material_compat, score_quantity_compat, score_proximity, score_esg_reliability, distance_km)
    VALUES (1, 1, 0.9, 1.0, 0.9, 0.9, 0.8, 42.0) RETURNING match_id
  `).get();

  // Agreed 50 MT = 50,000 kg. Actual net: Gross 65,000 - Tare 12,000 = 53,000 kg (6% discrepancy > 2%)
  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 50.0,
    agreedUnitPrice: 1250.0,
    waybillNumber: 'WB-DISCREP-AUDIT',
    grossKg: 65000.0,
    tareKg: 12000.0
  });

  const discrepancies = executeQ6LogisticsDiscrepancy(db, 0.02);
  assert.strictEqual(discrepancies.length, 1);
  assert.strictEqual(discrepancies[0].variance_kg, 3000.0);

  // Check audit trail recorded for this transaction
  const log = db.prepare('SELECT * FROM audit_logs WHERE entity_id = ?').get(String(tx.transactionId));
  assert.ok(log, 'Audit log must record transaction execution');
  assert.strictEqual(log.action, 'CONTRACT_EXECUTE');
});
