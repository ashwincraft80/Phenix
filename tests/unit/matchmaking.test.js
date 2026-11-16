/**
 * Unit Tests: Algorithmic Matchmaking Engine
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_WEIGHTS,
  normalizeWeights,
  calculateMaterialScore,
  calculateQuantityScore,
  calculateProximityScore,
  calculateEsgScore,
  calculateMatchScore,
  rankCandidates
} from '../../src/services/matchmaking.js';

describe('Matchmaking Engine: Sub-Scorers & Formulas', () => {
  test('Weight Normalization: normalizes arbitrary positive weights to sum to 1.0', () => {
    // Custom weights sum = 2.0
    const custom = { material: 0.70, quantity: 0.50, proximity: 0.50, esg: 0.30 };
    const normalized = normalizeWeights(custom);

    assert.strictEqual(normalized.material, 0.35);
    assert.strictEqual(normalized.quantity, 0.25);
    assert.strictEqual(normalized.proximity, 0.25);
    assert.strictEqual(normalized.esg, 0.15);

    const sum = normalized.material + normalized.quantity + normalized.proximity + normalized.esg;
    assert.ok(Math.abs(sum - 1.0) < 1e-9);
  });

  test('Weight Normalization: supports zero proximity weight for distance-independent scoring', () => {
    const zeroDistance = { material: 0.50, quantity: 0.30, proximity: 0.0, esg: 0.20 };
    const normalized = normalizeWeights(zeroDistance);

    assert.strictEqual(normalized.proximity, 0.0);
    assert.strictEqual(normalized.material, 0.50);
    assert.strictEqual(normalized.quantity, 0.30);
    assert.strictEqual(normalized.esg, 0.20);
  });

  test('Material Compatibility: exact material match with matching state, purity, and hazard yields S_mat = 1.0', () => {
    const supply = {
      material_id: 101,
      physical_state: 'SOLID',
      purity_percentage: 95.0,
      hazard_tier: 'NON_HAZARDOUS'
    };
    const demand = {
      material_id: 101,
      required_physical_state: 'SOLID',
      minimum_purity_percentage: 90.0,
      acceptable_hazard_tiers: ['NON_HAZARDOUS', 'HAZARDOUS_CLASS_B']
    };

    const res = calculateMaterialScore(supply, demand);
    assert.strictEqual(res.score, 1.0);
    assert.strictEqual(res.cTax, 1.0);
    assert.strictEqual(res.cState, 1.0);
    assert.strictEqual(res.cPurity, 1.0);
    assert.strictEqual(res.cHazard, 1.0);
  });

  test('Material Compatibility: physical state mismatch yields S_mat = 0.0', () => {
    const supply = {
      material_id: 101,
      physical_state: 'LIQUID', // Spent acid
      purity_percentage: 95.0,
      hazard_tier: 'NON_HAZARDOUS'
    };
    const demand = {
      material_id: 101,
      required_physical_state: 'SOLID', // Rock phosphate
      minimum_purity_percentage: 90.0,
      acceptable_hazard_tiers: ['NON_HAZARDOUS']
    };

    const res = calculateMaterialScore(supply, demand);
    assert.strictEqual(res.score, 0.0);
    assert.strictEqual(res.cState, 0.0);
  });

  test('Material Compatibility: hazard tier mismatch yields S_mat = 0.0', () => {
    const supply = {
      material_id: 101,
      physical_state: 'SOLID',
      purity_percentage: 95.0,
      hazard_tier: 'HAZARDOUS_CLASS_A'
    };
    const demand = {
      material_id: 101,
      required_physical_state: 'SOLID',
      minimum_purity_percentage: 90.0,
      acceptable_hazard_tiers: ['NON_HAZARDOUS'] // Class A not allowed
    };

    const res = calculateMaterialScore(supply, demand);
    assert.strictEqual(res.score, 0.0);
    assert.strictEqual(res.cHazard, 0.0);
  });

  test('Material Compatibility: purity degradation formula matches specification', () => {
    const supply = {
      material_id: 101,
      physical_state: 'SOLID',
      purity_percentage: 85.0,
      hazard_tier: 'NON_HAZARDOUS'
    };
    const demand = {
      material_id: 101,
      required_physical_state: 'SOLID',
      minimum_purity_percentage: 100.0, // 15% deficit -> 1 - 3*(15/100) = 1 - 0.45 = 0.55
      acceptable_hazard_tiers: ['NON_HAZARDOUS']
    };

    const res = calculateMaterialScore(supply, demand);
    assert.strictEqual(res.cTax, 1.0);
    assert.strictEqual(res.cState, 1.0);
    assert.strictEqual(res.cHazard, 1.0);
    assert.ok(Math.abs(res.cPurity - 0.55) < 1e-4, `Expected cPurity ~0.55, got ${res.cPurity}`);
    assert.ok(Math.abs(res.score - 0.55) < 1e-4);

    // Severe purity deficit (>33.3% deficit) must clamp cPurity to 0.0
    const severeSupply = { ...supply, purity_percentage: 60.0 };
    const severeRes = calculateMaterialScore(severeSupply, demand);
    assert.strictEqual(severeRes.cPurity, 0.0);
    assert.strictEqual(severeRes.score, 0.0);
  });

  test('Quantity Satisfaction: zero available quantity or below MOQ yields S_qty = 0.0', () => {
    const demand = { required_quantity: 100.0 };

    // Zero quantity
    const zeroSupply = { available_quantity: 0.0, minimum_order_quantity: 10.0 };
    assert.strictEqual(calculateQuantityScore(zeroSupply, demand).score, 0.0);

    // Below MOQ
    const belowMoqSupply = { available_quantity: 5.0, minimum_order_quantity: 10.0 };
    assert.strictEqual(calculateQuantityScore(belowMoqSupply, demand).score, 0.0);
  });

  test('Quantity Satisfaction: complete fulfillment (Q_S >= Q_D) applies slight dampening on extreme oversupply', () => {
    const demand = { required_quantity: 100.0 };

    // Exact fulfillment: Q_S == Q_D -> 1.0
    const exactSupply = { available_quantity: 100.0, minimum_order_quantity: 10.0 };
    assert.strictEqual(calculateQuantityScore(exactSupply, demand).score, 1.0);

    // Oversupply 10x: ratio = 10 -> oversupplyTerm = 9/11 ≈ 0.818 -> score ≈ 1.0 - 0.0818 ≈ 0.918
    const overSupply = { available_quantity: 1000.0, minimum_order_quantity: 10.0 };
    const overResult = calculateQuantityScore(overSupply, demand);
    assert.ok(overResult.score >= 0.90 && overResult.score <= 0.95, `Expected ~0.918, got ${overResult.score}`);
  });

  test('Quantity Satisfaction: partial fulfillment (0 < Q_S < Q_D) applies power curve (Q_S / Q_D)^0.80', () => {
    const demand = { required_quantity: 100.0 };
    // Q_S = 50.0 -> (0.5)^0.80 ≈ 0.5743
    const halfSupply = { available_quantity: 50.0, minimum_order_quantity: 10.0 };
    const partialResult = calculateQuantityScore(halfSupply, demand);
    const expected = Math.pow(0.5, 0.80);
    assert.ok(Math.abs(partialResult.score - expected) < 1e-4, `Expected ${expected}, got ${partialResult.score}`);
  });

  test('Proximity Decay: evaluates half-life decay at 0 km (1.0), 300 km (0.5), and cutoffs beyond max distance', () => {
    const demand = { max_logistics_distance_km: 500.0 };

    // At 0 km: S_prox = 1.0 / (1 + 0) = 1.0
    assert.strictEqual(calculateProximityScore(0.0, demand).score, 1.0);

    // At 300 km: S_prox = 1.0 / (1 + (300/300)^2) = 1.0 / 2.0 = 0.50
    assert.strictEqual(calculateProximityScore(300.0, demand).score, 0.50);

    // At 600 km: Exceeds demand max_logistics_distance_km (500 km) -> S_prox = 0.0
    assert.strictEqual(calculateProximityScore(600.0, demand).score, 0.0);
  });

  test('ESG & Reliability: aggregates counterparty ratings and provides default neutral prior', () => {
    // Both rated: Supplier ESG=80, Rel=4.0; Receiver ESG=60, Rel=3.0
    // Supplier: 0.60 * 0.8 + 0.40 * (4/5) = 0.48 + 0.32 = 0.80
    // Receiver: 0.60 * 0.6 + 0.40 * (3/5) = 0.36 + 0.24 = 0.60
    // Avg = (0.80 + 0.60) / 2 = 0.70
    const rated = calculateEsgScore(
      { esg_score: 80, reliability_rating: 4.0 },
      { esg_score: 60, reliability_rating: 3.0 }
    );
    assert.ok(Math.abs(rated.score - 0.70) < 1e-4);

    // Unrated (null): defaults to 50 ESG and 3.0 Rel -> composite = 0.60*0.5 + 0.40*0.6 = 0.54
    const unrated = calculateEsgScore(null, null);
    assert.ok(Math.abs(unrated.score - 0.54) < 1e-4);
  });
});

describe('Matchmaking Engine: Composite Match Score & Candidate Ranking', () => {
  const perfectListing = {
    listing_id: 1,
    facility_id: 10,
    material_id: 50,
    physical_state: 'SOLID',
    purity_percentage: 95.0,
    hazard_tier: 'NON_HAZARDOUS',
    available_quantity: 500.0,
    minimum_order_quantity: 10.0
  };

  const perfectDemand = {
    demand_id: 1,
    facility_id: 20,
    material_id: 50,
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 90.0,
    acceptable_hazard_tiers: ['NON_HAZARDOUS'],
    required_quantity: 500.0,
    max_logistics_distance_km: 1000.0
  };

  const highEsgOrg1 = { organization_id: 100, esg_score: 90.0, reliability_rating: 5.0 };
  const highEsgOrg2 = { organization_id: 200, esg_score: 85.0, reliability_rating: 4.5 };

  test('evaluates near-perfect match scoring at 0 km distance', () => {
    const result = calculateMatchScore(
      perfectListing,
      perfectDemand,
      0.0,
      highEsgOrg1,
      highEsgOrg2
    );

    assert.strictEqual(result.eligible, true);
    assert.ok(result.netScore >= 0.95 && result.netScore <= 1.0, `Expected >= 0.95, got ${result.netScore}`);
    assert.strictEqual(result.breakdown.materialScore, 1.0);
    assert.strictEqual(result.breakdown.quantityScore, 1.0);
    assert.strictEqual(result.breakdown.distanceScore, 1.0);
  });

  test('hard zero rule: material compatibility below 0.50 yields netScore = 0 and eligible = false', () => {
    // Physical state mismatch makes S_mat = 0.0 < 0.50
    const stateMismatchListing = { ...perfectListing, physical_state: 'LIQUID' };
    const result = calculateMatchScore(
      stateMismatchListing,
      perfectDemand,
      50.0,
      highEsgOrg1,
      highEsgOrg2
    );

    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.netScore, 0.0);
    assert.strictEqual(result.breakdown.materialScore, 0.0);
    assert.ok(result.reasons.some(r => r.includes('Hard incompatibility')));
  });

  test('rankCandidates orders proposals descending by composite netScore', () => {
    const demand = {
      demand_id: 1,
      facility_id: 1,
      material_id: 100,
      required_physical_state: 'SOLID',
      minimum_purity_percentage: 85.0,
      acceptable_hazard_tiers: ['NON_HAZARDOUS'],
      required_quantity: 100.0,
      max_logistics_distance_km: 500.0
    };

    const facilitiesMap = {
      1: { facility_id: 1, organization_id: 10, latitude: 21.7122, longitude: 72.5873 }, // Dahej
      2: { facility_id: 2, organization_id: 20, latitude: 21.6264, longitude: 73.0152 }, // Ankleshwar (45 km)
      3: { facility_id: 3, organization_id: 30, latitude: 18.7606, longitude: 73.8636 }  // Chakan (350 km)
    };

    const organizationsMap = {
      10: { organization_id: 10, esg_score: 80, reliability_rating: 4.5 },
      20: { organization_id: 20, esg_score: 85, reliability_rating: 4.8 },
      30: { organization_id: 30, esg_score: 70, reliability_rating: 3.5 }
    };

    const listings = [
      // Listing A: Far away (Chakan ~350 km), lower purity
      {
        listing_id: 'L_CHAKAN',
        facility_id: 3,
        material_id: 100,
        physical_state: 'SOLID',
        purity_percentage: 88.0,
        hazard_tier: 'NON_HAZARDOUS',
        available_quantity: 100.0,
        minimum_order_quantity: 10.0
      },
      // Listing B: Close (Ankleshwar ~45 km), high purity
      {
        listing_id: 'L_ANKLESHWAR',
        facility_id: 2,
        material_id: 100,
        physical_state: 'SOLID',
        purity_percentage: 95.0,
        hazard_tier: 'NON_HAZARDOUS',
        available_quantity: 100.0,
        minimum_order_quantity: 10.0
      },
      // Listing C: Incompatible (Liquid)
      {
        listing_id: 'L_INCOMPATIBLE',
        facility_id: 2,
        material_id: 100,
        physical_state: 'LIQUID',
        purity_percentage: 95.0,
        hazard_tier: 'NON_HAZARDOUS',
        available_quantity: 100.0,
        minimum_order_quantity: 10.0
      }
    ];

    const ranked = rankCandidates(demand, listings, facilitiesMap, organizationsMap);

    assert.strictEqual(ranked.length, 3);
    // Highest score must be Ankleshwar (~45 km away, high purity)
    assert.strictEqual(ranked[0].listing.listing_id, 'L_ANKLESHWAR');
    // Second must be Chakan (~350 km away, lower proximity score)
    assert.strictEqual(ranked[1].listing.listing_id, 'L_CHAKAN');
    // Third must be incompatible with netScore = 0.0
    assert.strictEqual(ranked[2].listing.listing_id, 'L_INCOMPATIBLE');
    assert.strictEqual(ranked[2].netScore, 0.0);
    assert.strictEqual(ranked[2].eligible, false);

    assert.ok(ranked[0].netScore > ranked[1].netScore);
  });
});
