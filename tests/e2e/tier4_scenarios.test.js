/**
 * Tier 4: Real-World Industrial Application Scenarios
 * Phenix / Project ReguFlow (Viksit Bharat 2026 Showcase)
 *
 * Comprehensive end-to-end multi-feature workflows across Indian manufacturing corridors:
 * - Scenario 1: Gujarat Chemical Symbiosis (Dahej Spent Sulfuric Acid -> Bharuch SSP Fertilizer)
 * - Scenario 2: Kutch Pozzolana Circular Cement (Dahej Phosphogypsum -> Mundra Pozzolana Cement)
 * - Scenario 3: Maharashtra Auto Foundry Loop (Chakan Automotive Foundry Sand -> Talegaon Green Paver Blocks)
 * - Scenario 4: Jharkhand Steel Belt GGBS (Jamshedpur Blast Furnace Slag -> Chaibasa Ready-Mix Infrastructure)
 * - Scenario 5: Tamil Nadu Textile Sludge Co-Processing (Tirupur Dyeing Effluent Sludge -> Coimbatore Thermal Kiln)
 * Total: 5 scenarios.
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
  executeQ1MatchmakingQuery,
  executeQ2ProximityQuery,
  executeQ3AtomicTransaction,
  executeQ4ClusterEsgAnalytics,
  executeQ6LogisticsDiscrepancy,
  verifyAuditChain
} from './helpers.js';

// ===========================================================================
// SCENARIO 1: Gujarat Chemical Symbiosis
// Dahej PCPIR Chlor-Alkali Spent Sulfuric Acid -> Bharuch SSP Fertilizer Plant
// ===========================================================================

test('Scenario 1: Gujarat Chemical Symbiosis — Dahej Chlor-Alkali to Bharuch SSP Fertilizer', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // 1. Geodesy & Distance
  // Dahej: (21.7122, 72.5873) to Bharuch: (21.7051, 72.9959)
  const distanceKm = haversineDistance(21.7122, 72.5873, 21.7051, 72.9959);
  assert.ok(Math.abs(distanceKm - 42.219) < 0.5, `Dahej-Bharuch distance must be ~42.2 km (got ${distanceKm})`);

  // 2. Fetch Listing and Demand
  const listing = db.prepare("SELECT * FROM byproduct_listings WHERE listing_code = 'LST-DAHEJ-H2SO4-01'").get();
  const demand = db.prepare("SELECT * FROM demand_requirements WHERE demand_code = 'DMD-BHAR-H2SO4-01'").get();
  assert.ok(listing && demand, 'Listing and demand must exist in seed database');

  // 3. Matchmaking Scoring
  const supplierOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(listing.facility_id);
  const buyerOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(demand.facility_id);

  const match = calculateMatchScore(listing, demand, distanceKm, supplierOrg, buyerOrg);
  assert.strictEqual(match.eligible, true, 'Symbiosis pairing must be eligible');
  assert.strictEqual(match.breakdown.materialScore, 1.0, 'Material score must be 1.0 (78.4% purity > 70% min)');
  assert.ok(match.netScore > 0.90, `Composite match score ${match.netScore} must exceed 0.90`);

  // 4. Logistics Freight Assessment (1200 MT, Hazmat Class A)
  const logistics = calculateLogistics(distanceKm, 1200.0, listing.hazard_tier);
  assert.ok(logistics.estimatedCostINR > 700000.0, 'Logistics cost accounts for 1.8x hazmat factor');
  assert.ok(logistics.transitDurationHours < 10.0, 'Local 42 km transit turnaround should be < 10 hours');

  // 5. Atomic Contract Execution
  const mp = db.prepare(`
    INSERT INTO match_proposals (
      supply_listing_id, demand_requirement_id, match_score, score_material_compat,
      score_quantity_compat, score_proximity, score_esg_reliability, distance_km,
      estimated_transit_cost_inr, estimated_transit_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING match_id
  `).get(
    listing.listing_id, demand.demand_id, match.netScore,
    match.breakdown.materialScore, match.breakdown.quantityScore,
    match.breakdown.distanceScore, match.breakdown.esgScore,
    distanceKm, logistics.estimatedCostINR, logistics.transitDurationHours
  );

  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 1200.0,
    agreedUnitPrice: listing.price_per_unit_inr,
    contractReference: 'TXN-GUJ-H2SO4-2026-001',
    waybillNumber: 'EWAY-GJ-8921829101',
    grossKg: 42000.0,
    tareKg: 18000.0
  });

  assert.ok(tx.transactionId > 0, 'Transaction created');
  assert.strictEqual(tx.agreedQty, 1200.0);

  // 6. ESG Impact Verification (1200 MT * 145 kg/MT = 174,000 kg CO2e)
  const esg = db.prepare('SELECT * FROM sustainability_metrics WHERE transaction_id = ?').get(tx.transactionId);
  assert.strictEqual(esg.embodied_carbon_offset_kg, 174000.0);
  assert.strictEqual(esg.landfill_diversion_tons, 1200.0);

  // 7. Audit Chain Continuity
  const audit = verifyAuditChain(db);
  assert.strictEqual(audit.valid, true);
});

// ===========================================================================
// SCENARIO 2: Kutch Pozzolana Circular Cement
// Dahej Phosphogypsum -> Mundra Kutch Pozzolana Cement Plant
// ===========================================================================

test('Scenario 2: Kutch Pozzolana Circular Cement — Dahej Phosphogypsum to Mundra Cement', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // 1. Geodesy: Dahej (21.7122, 72.5873) to Mundra (22.8396, 69.7111) across Gulf of Kutch
  const distanceKm = haversineDistance(21.7122, 72.5873, 22.8396, 69.7111);
  assert.ok(Math.abs(distanceKm - 321.396) < 1.0, `Dahej-Mundra distance must be ~321.4 km (got ${distanceKm})`);

  // 2. Fetch Listing and Demand
  const listing = db.prepare("SELECT * FROM byproduct_listings WHERE listing_code = 'LST-DAHEJ-GYP-01'").get();
  const demand = db.prepare("SELECT * FROM demand_requirements WHERE demand_code = 'DMD-MUND-GYP-01'").get();
  assert.ok(listing && demand);

  // 3. Matchmaking Scoring (Buyer distance cap is 450 km > 321 km)
  const supplierOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(listing.facility_id);
  const buyerOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(demand.facility_id);

  const match = calculateMatchScore(listing, demand, distanceKm, supplierOrg, buyerOrg);
  assert.strictEqual(match.eligible, true, '321 km is within 450 km cap');
  assert.ok(match.netScore > 0.75, `Net score ${match.netScore} must exceed 0.75`);
  assert.strictEqual(match.breakdown.materialScore, 1.0, 'Phosphogypsum 92.1% purity > 85% min requirement');

  // 4. Logistics (20,000 MT bulk transport, Non-hazardous)
  const logistics = calculateLogistics(distanceKm, 20000.0, listing.hazard_tier);
  assert.strictEqual(logistics.routeFeasible, true);
  // Transit duration: 4.0h buffer + (321.4 / 35 km/h = 9.18h) + 0 driver rests (<350 km) = ~13.18h
  assert.ok(logistics.transitDurationHours > 12.0 && logistics.transitDurationHours < 15.0);

  // 5. Contract Execution for 20,000 MT
  const mp = db.prepare(`
    INSERT INTO match_proposals (
      supply_listing_id, demand_requirement_id, match_score, score_material_compat,
      score_quantity_compat, score_proximity, score_esg_reliability, distance_km
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING match_id
  `).get(
    listing.listing_id, demand.demand_id, match.netScore,
    match.breakdown.materialScore, match.breakdown.quantityScore,
    match.breakdown.distanceScore, match.breakdown.esgScore,
    distanceKm
  );

  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 20000.0,
    agreedUnitPrice: listing.price_per_unit_inr,
    contractReference: 'TXN-KUTCH-GYP-2026-002',
    waybillNumber: 'EWAY-GJ-9912384756',
    grossKg: 50000.0,
    tareKg: 15000.0
  });

  // Verify remaining quantity: 45,000 - 20,000 = 25,000 MT
  const listingAfter = db.prepare('SELECT available_quantity, status FROM byproduct_listings WHERE listing_id = ?').get(listing.listing_id);
  assert.strictEqual(listingAfter.available_quantity, 25000.0);
  assert.strictEqual(listingAfter.status, 'PARTIALLY_FULFILLED');

  // ESG Impact: 20,000 MT * 85 kg CO2e/MT = 1,700,000 kg CO2e offset
  const esg = db.prepare('SELECT * FROM sustainability_metrics WHERE transaction_id = ?').get(tx.transactionId);
  assert.strictEqual(esg.embodied_carbon_offset_kg, 1700000.0);
  assert.strictEqual(esg.landfill_diversion_tons, 20000.0);
});

// ===========================================================================
// SCENARIO 3: Maharashtra Auto Foundry Loop
// Chakan Auto Foundry Silica Sand -> Talegaon Eco Paver Blocks
// ===========================================================================

test('Scenario 3: Maharashtra Auto Foundry Loop — Chakan Foundry Sand to Talegaon Green Infra', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // 1. Geodesy: Chakan (18.7606, 73.8636) to Talegaon (18.7297, 73.6828)
  const distanceKm = haversineDistance(18.7606, 73.8636, 18.7297, 73.6828);
  assert.ok(Math.abs(distanceKm - 19.345) < 0.5, `Chakan-Talegaon distance must be ~19.3 km (got ${distanceKm})`);

  // 2. Fetch Listing and Demand
  const listing = db.prepare("SELECT * FROM byproduct_listings WHERE listing_code = 'LST-CHAK-SAND-01'").get();
  const demand = db.prepare("SELECT * FROM demand_requirements WHERE demand_code = 'DMD-TALE-SAND-01'").get();
  assert.ok(listing && demand);

  // 3. Matchmaking Scoring
  const supplierOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(listing.facility_id);
  const buyerOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(demand.facility_id);

  const match = calculateMatchScore(listing, demand, distanceKm, supplierOrg, buyerOrg);
  assert.strictEqual(match.eligible, true);
  assert.ok(match.netScore > 0.92, `Very close proximity (~19 km) must yield score > 0.92 (got ${match.netScore})`);

  // 4. Logistics for 5000 MT
  const logistics = calculateLogistics(distanceKm, 5000.0, listing.hazard_tier);
  assert.ok(logistics.transitDurationHours < 5.0, 'Intra-district transit turnaround should be < 5 hours');

  // 5. Contract Execution for 5000 MT
  const mp = db.prepare(`
    INSERT INTO match_proposals (
      supply_listing_id, demand_requirement_id, match_score, score_material_compat,
      score_quantity_compat, score_proximity, score_esg_reliability, distance_km
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING match_id
  `).get(
    listing.listing_id, demand.demand_id, match.netScore,
    match.breakdown.materialScore, match.breakdown.quantityScore,
    match.breakdown.distanceScore, match.breakdown.esgScore,
    distanceKm
  );

  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 5000.0,
    agreedUnitPrice: listing.price_per_unit_inr,
    contractReference: 'TXN-PUNE-SAND-2026-003',
    waybillNumber: 'EWAY-MH-7711223344',
    grossKg: 38000.0,
    tareKg: 14000.0
  });

  // ESG Impact: 5000 MT * 45 kg CO2e/MT = 225,000 kg CO2e offset
  const esg = db.prepare('SELECT * FROM sustainability_metrics WHERE transaction_id = ?').get(tx.transactionId);
  assert.strictEqual(esg.embodied_carbon_offset_kg, 225000.0);
  assert.strictEqual(esg.landfill_diversion_tons, 5000.0);
});

// ===========================================================================
// SCENARIO 4: Jharkhand Steel Belt GGBS Exchange
// Jamshedpur Blast Furnace Slag -> Chaibasa Ready-Mix Cement
// ===========================================================================

test('Scenario 4: Jharkhand Steel Belt GGBS — Jamshedpur Slag to Chaibasa Infrastructure Concrete', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // 1. Geodesy: Jamshedpur (22.8046, 86.2029) to Chaibasa (22.5532, 85.8086)
  const distanceKm = haversineDistance(22.8046, 86.2029, 22.5532, 85.8086);
  assert.ok(Math.abs(distanceKm - 49.173) < 0.5, `Jamshedpur-Chaibasa distance must be ~49.2 km (got ${distanceKm})`);

  // 2. Fetch Listing and Demand
  const listing = db.prepare("SELECT * FROM byproduct_listings WHERE listing_code = 'LST-JAMS-GGBS-01'").get();
  const demand = db.prepare("SELECT * FROM demand_requirements WHERE demand_code = 'DMD-CHAI-GGBS-01'").get();
  assert.ok(listing && demand);

  // 3. Matchmaking Scoring
  const supplierOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(listing.facility_id);
  const buyerOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(demand.facility_id);

  const match = calculateMatchScore(listing, demand, distanceKm, supplierOrg, buyerOrg);
  assert.strictEqual(match.eligible, true);
  assert.ok(match.netScore > 0.90);
  assert.strictEqual(match.breakdown.materialScore, 1.0, 'GGBS Grade 120 purity 96.5% > 90% min');

  // 4. Contract Execution for 30,000 MT
  const mp = db.prepare(`
    INSERT INTO match_proposals (
      supply_listing_id, demand_requirement_id, match_score, score_material_compat,
      score_quantity_compat, score_proximity, score_esg_reliability, distance_km
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING match_id
  `).get(
    listing.listing_id, demand.demand_id, match.netScore,
    match.breakdown.materialScore, match.breakdown.quantityScore,
    match.breakdown.distanceScore, match.breakdown.esgScore,
    distanceKm
  );

  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 30000.0,
    agreedUnitPrice: listing.price_per_unit_inr,
    contractReference: 'TXN-JH-GGBS-2026-004',
    waybillNumber: 'EWAY-JH-5544332211',
    grossKg: 52000.0,
    tareKg: 17000.0
  });

  // 5. Massive Clinker Offset: 30,000 MT * 720 kg CO2e/MT = 21,600,000 kg CO2e offset!
  const esg = db.prepare('SELECT * FROM sustainability_metrics WHERE transaction_id = ?').get(tx.transactionId);
  assert.strictEqual(esg.embodied_carbon_offset_kg, 21600000.0, 'Major Scope 3 carbon reduction from clinker displacement');
  assert.strictEqual(esg.landfill_diversion_tons, 30000.0);
});

// ===========================================================================
// SCENARIO 5: Tamil Nadu Textile Sludge to Thermal Kiln Co-Processing
// Tirupur CETP Dyeing Sludge -> Coimbatore Industrial Kilns
// ===========================================================================

test('Scenario 5: Tamil Nadu Textile Sludge — Tirupur Dyeing Sludge to Coimbatore Co-Processing Kilns', () => {
  const db = getTestDatabase();
  seedDatabase(db);

  // 1. Geodesy: Tirupur (11.1085, 77.3411) to Coimbatore (11.0168, 76.9558)
  const distanceKm = haversineDistance(11.1085, 77.3411, 11.0168, 76.9558);
  assert.ok(Math.abs(distanceKm - 43.266) < 0.5, `Tirupur-Coimbatore distance must be ~43.3 km (got ${distanceKm})`);

  // 2. Fetch Listing and Demand
  const listing = db.prepare("SELECT * FROM byproduct_listings WHERE listing_code = 'LST-TIRU-SLUD-01'").get();
  const demand = db.prepare("SELECT * FROM demand_requirements WHERE demand_code = 'DMD-COIM-SLUD-01'").get();
  assert.ok(listing && demand);

  // 3. Matchmaking Scoring (Hazard Tier: HAZARDOUS_CLASS_B accepted by kiln)
  const supplierOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(listing.facility_id);
  const buyerOrg = db.prepare('SELECT * FROM organizations WHERE organization_id = (SELECT organization_id FROM facilities WHERE facility_id = ?)').get(demand.facility_id);

  const match = calculateMatchScore(listing, demand, distanceKm, supplierOrg, buyerOrg);
  assert.strictEqual(match.eligible, true, 'Kiln AFR acceptance allows HAZARDOUS_CLASS_B sludge');
  assert.ok(match.netScore > 0.85);

  // 4. Logistics with Hazmat Class B multiplier (1.2x)
  const logistics = calculateLogistics(distanceKm, 2500.0, listing.hazard_tier);
  assert.strictEqual(logistics.routeFeasible, true);

  // 5. Contract Execution
  const mp = db.prepare(`
    INSERT INTO match_proposals (
      supply_listing_id, demand_requirement_id, match_score, score_material_compat,
      score_quantity_compat, score_proximity, score_esg_reliability, distance_km
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING match_id
  `).get(
    listing.listing_id, demand.demand_id, match.netScore,
    match.breakdown.materialScore, match.breakdown.quantityScore,
    match.breakdown.distanceScore, match.breakdown.esgScore,
    distanceKm
  );

  const tx = executeQ3AtomicTransaction(db, {
    proposalId: mp.match_id,
    agreedQuantity: 2500.0,
    agreedUnitPrice: listing.price_per_unit_inr,
    contractReference: 'TXN-TN-SLUDGE-2026-005',
    waybillNumber: 'EWAY-TN-1122998877',
    grossKg: 32000.0,
    tareKg: 12000.0
  });

  // ESG Impact: 2500 MT * 210 kg CO2e/MT = 525,000 kg CO2e offset
  const esg = db.prepare('SELECT * FROM sustainability_metrics WHERE transaction_id = ?').get(tx.transactionId);
  assert.strictEqual(esg.embodied_carbon_offset_kg, 525000.0);
  assert.strictEqual(esg.landfill_diversion_tons, 2500.0);

  // 6. Regional Cluster ESG Ranking
  const clusterEsg = executeQ4ClusterEsgAnalytics(db);
  assert.ok(clusterEsg.length > 0);
  const tirupurCluster = clusterEsg.find(c => c.cluster_name === 'Tirupur Textile Hub');
  assert.ok(tirupurCluster, 'Tirupur cluster must be present in ESG leaderboard');
  assert.strictEqual(tirupurCluster.total_landfill_tons_diverted, 2500.0);

  // 7. Full Cryptographic Audit Chain Verification
  const audit = verifyAuditChain(db);
  assert.strictEqual(audit.valid, true, 'Audit log chain across full scenario must remain untampered');
});
