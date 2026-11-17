/**
 * Unit Tests: Member 2 Logistics, Deal Lifecycle & ESG Impact Engine
 * Phenix / Project ReguFlow - Member 2 Deliverables
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ESG_BENCHMARKS,
  resolveBenchmark,
  calculateDealImpact,
  DealService,
  ImpactService
} from '../../src/index.js';

describe('Member 2: ESG Formulas Engine', () => {
  test('resolves Blast Furnace Slag to Industrial Slag benchmark (800 kg CO2e/t)', () => {
    const factor = resolveBenchmark('Blast Furnace Slag');
    assert.strictEqual(factor.category, 'Industrial Slag');
    assert.strictEqual(factor.co2eAvoidedPerTon, 800);
    assert.strictEqual(factor.virginPricePerTonInr, 4500);
  });

  test('resolves Fly Ash Class F benchmark (820 kg CO2e/t)', () => {
    const factor = resolveBenchmark('Class F Fly Ash');
    assert.strictEqual(factor.category, 'Fly Ash');
    assert.strictEqual(factor.co2eAvoidedPerTon, 820);
  });

  test('resolves Post-Industrial HDPE/PP polymers benchmark (1500 kg CO2e/t)', () => {
    const factor = resolveBenchmark('Post-Industrial HDPE/PP');
    assert.strictEqual(factor.category, 'Polymers/Scrap');
    assert.strictEqual(factor.co2eAvoidedPerTon, 1500);
  });

  test('calculates 500 Tons Slag with 42.5 km transport freight deduction', () => {
    const res = calculateDealImpact({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantityTons: 500,
      distanceKm: 42.5,
      agreedPricePerTon: 850
    });

    assert.strictEqual(res.wasteDivertedTons, 500);
    assert.strictEqual(res.grossCo2eAvoidedKg, 400000);
    assert.strictEqual(res.grossCo2eAvoidedTons, 400);
    assert.strictEqual(res.transportCo2eKg, 1743);
    assert.strictEqual(res.netCo2AvoidedKg, 398257);
    assert.strictEqual(res.netCo2AvoidedTons, 398.26);
    assert.strictEqual(res.waterSavedLitres, 75000);
    assert.strictEqual(res.landfillVolumeSavedM3, 425);
    assert.ok(res.economicSavingsInr > 1500000);
    assert.strictEqual(res.virginMaterialReplaced, 'Portland Clinker / Limestone');
  });
});

describe('Member 2: Deal State Machine & Lifecycle Transitions', () => {
  test('creates new deal in INITIATED stage with automatic DL-2026 code', () => {
    const dealService = new DealService();
    const deal = dealService.createDeal({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantity: 500,
      pricePerTon: 850,
      logistics: { distanceKm: 42.5 }
    });

    assert.ok(deal.dealCode.startsWith('DL-2026-'));
    assert.strictEqual(deal.status, 'INITIATED');
    assert.strictEqual(deal.stageIndex, 0);
    assert.strictEqual(deal.quantity, 500);
    assert.strictEqual(deal.timeline.length, 1);
  });

  test('simulates escrow handshake moving deal to IN_NEGOTIATION', () => {
    const dealService = new DealService();
    const deal = dealService.createDeal({
      material: 'Fly Ash Class F',
      materialCategory: 'Fly Ash',
      quantity: 450,
      pricePerTon: 600
    });

    const updated = dealService.simulateEscrowHandshake(deal._id, {
      escrowAmount: 270000,
      notes: '100% escrow protection locked'
    });

    assert.strictEqual(updated.status, 'IN_NEGOTIATION');
    assert.strictEqual(updated.stageIndex, 1);
  });

  test('advances stage to LOGISTICS_DISPATCHED with gate pass and digital manifest', () => {
    const dealService = new DealService();
    const deal = dealService.createDeal({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantity: 500,
      pricePerTon: 850
    });

    const dispatched = dealService.advanceDealStatus(deal._id, {
      status: 'LOGISTICS_DISPATCHED',
      vehicleNumber: 'JH-05-CD-4421',
      notes: 'Gate pass generated'
    });

    assert.strictEqual(dispatched.status, 'LOGISTICS_DISPATCHED');
    assert.strictEqual(dispatched.stageIndex, 2);
    assert.ok(dispatched.logistics.gatePassNumber.startsWith('GP-'));
    assert.ok(dispatched.logistics.consignmentManifestCode.startsWith('MNF-SYM-'));
    assert.strictEqual(dispatched.logistics.vehicleNumber, 'JH-05-CD-4421');
  });

  test('advances stage to DELIVERED_VERIFIED with weighbridge verification and SHA-256 hash', () => {
    const dealService = new DealService();
    const deal = dealService.createDeal({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantity: 500,
      pricePerTon: 850
    });

    dealService.advanceDealStatus(deal._id, { status: 'IN_NEGOTIATION' });
    dealService.advanceDealStatus(deal._id, { status: 'LOGISTICS_DISPATCHED' });

    const verified = dealService.advanceDealStatus(deal._id, {
      status: 'DELIVERED_VERIFIED',
      verifiedTonnage: 500,
      weighbridgeSlipNumber: 'WB-CHAIBASA-8812',
      notes: '500T net verified'
    });

    assert.strictEqual(verified.status, 'DELIVERED_VERIFIED');
    assert.strictEqual(verified.stageIndex, 3);
    assert.strictEqual(verified.verification.netVerifiedQuantity, 500);
    assert.strictEqual(verified.verification.digitalCertificateHash.length, 64);
  });

  test('rejects invalid deal status with descriptive Error', () => {
    const dealService = new DealService();
    const deal = dealService.createDeal({ material: 'Test', quantity: 10 });
    assert.throws(() => {
      dealService.advanceDealStatus(deal._id, { status: 'BOGUS_STAGE' });
    }, /Invalid deal status 'BOGUS_STAGE'/);
  });
});

describe('Member 2: ESG Impact Aggregator & SEBI BRSR Certificate', () => {
  test('aggregates verified deals and updates live metrics', () => {
    const dealService = new DealService();
    const impactService = new ImpactService(dealService);

    // Initial state
    const initial = impactService.getAggregateImpact();
    assert.strictEqual(initial.totalWasteDivertedTons, 0);

    // Create and verify deal 1 (800T Slag -> 640t CO2e)
    const deal1 = dealService.createDeal({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantity: 800,
      pricePerTon: 850,
      logistics: { distanceKm: 42.5 }
    });
    dealService.advanceDealStatus(deal1._id, { status: 'DELIVERED_VERIFIED', verifiedTonnage: 800 });

    // Create and verify deal 2 (450T Fly Ash -> ~360t CO2e)
    const deal2 = dealService.createDeal({
      material: 'Fly Ash Class F',
      materialCategory: 'Fly Ash',
      quantity: 450,
      pricePerTon: 600,
      logistics: { distanceKm: 140 }
    });
    dealService.advanceDealStatus(deal2._id, { status: 'DELIVERED_VERIFIED', verifiedTonnage: 450 });

    const agg = impactService.getAggregateImpact();
    assert.strictEqual(agg.totalWasteDivertedTons, 1250);
    assert.ok(agg.netCo2AvoidedTons > 950);
    assert.strictEqual(agg.dealsSummary.verifiedDeals, 2);
    assert.ok(agg.materialBreakdown.some(m => m.category === 'Industrial Slag'));
  });

  test('generates valid SEBI BRSR certificate with digital proof', () => {
    const dealService = new DealService();
    const impactService = new ImpactService(dealService);

    const deal = dealService.createDeal({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantity: 500,
      pricePerTon: 850
    });
    dealService.advanceDealStatus(deal._id, { status: 'DELIVERED_VERIFIED', verifiedTonnage: 500 });

    const cert = impactService.generateEsgCertificate(deal._id);
    assert.ok(cert.certificateId.startsWith('BRSR-'));
    assert.strictEqual(cert.isVerified, true);
    assert.strictEqual(cert.exchangeSummary.material, 'Blast Furnace Slag');
    assert.ok(cert.digitalVerificationProof.digitalCertificateHash.length === 64);
    assert.ok(cert.regulatoryFrameworkAlignment.sebiBrsrCore);
  });
});
