/**
 * Unit Tests: Domain Model Validation & SQLite Database Schema
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ValidationError,
  Organization,
  Facility,
  Material,
  Listing,
  Demand,
  Match,
  Transaction,
  SustainabilityMetrics,
  validateOrganization,
  validateFacility,
  validateMaterial,
  validateListing,
  validateDemand,
  validateMatch,
  validateTransaction,
  validateMetrics
} from '../../src/models/index.js';

import { getDatabase, initSchema } from '../../src/db/database.js';

describe('Domain Models: Input Validation Logic', () => {
  test('Organization: validates valid CIN registration and field bounds', () => {
    const validData = {
      registration_number: 'L24110GJ2012PLC078901',
      legal_name: 'Dahej Petrochemicals & Chlor-Alkali Ltd',
      industrial_sector: 'Chemicals & Petrochemicals',
      verification_status: 'VERIFIED',
      contact_email: 'compliance@dahejpetro.com',
      contact_phone: '+91-2641-289000',
      esg_score: 78.5,
      reliability_rating: 4.5
    };

    const org = new Organization(validData);
    assert.strictEqual(org.registration_number, 'L24110GJ2012PLC078901');
    assert.strictEqual(org.legal_name, 'Dahej Petrochemicals & Chlor-Alkali Ltd');
    assert.strictEqual(org.esg_score, 78.5);
    assert.strictEqual(org.reliability_rating, 4.5);
  });

  test('Organization: rejects out-of-range ESG score and invalid registration number', () => {
    const invalidEsg = {
      registration_number: 'L24110GJ2012PLC078901',
      legal_name: 'Test Corp',
      industrial_sector: 'Chemicals',
      contact_email: 'test@corp.com',
      contact_phone: '+91-1234567890',
      esg_score: 105.0 // > 100
    };
    assert.throws(() => validateOrganization(invalidEsg), ValidationError);

    const invalidReg = {
      ...invalidEsg,
      esg_score: 50.0,
      registration_number: 'bad' // too short
    };
    assert.throws(() => validateOrganization(invalidReg), ValidationError);
  });

  test('Facility: validates GPS coordinates and organization linkage', () => {
    const validFacility = {
      organization_id: 1,
      facility_code: 'FAC-DAHEJ-01',
      facility_name: 'Chlor-Alkali Synthesis Plant A',
      cluster_name: 'Dahej PCPIR',
      latitude: 21.7122,
      longitude: 72.5873,
      address: 'Plot 42, GIDC Industrial Estate, Dahej',
      state: 'Gujarat',
      pincode: '392130'
    };

    const fac = new Facility(validFacility);
    assert.strictEqual(fac.facility_code, 'FAC-DAHEJ-01');
    assert.strictEqual(fac.latitude, 21.7122);
    assert.strictEqual(fac.longitude, 72.5873);
  });

  test('Facility: rejects out-of-bound latitude/longitude and missing orgId', () => {
    const badCoords = {
      organization_id: 1,
      facility_code: 'FAC-01',
      facility_name: 'Bad Plant',
      cluster_name: 'Cluster',
      latitude: 95.0, // > 90
      longitude: 72.0,
      address: 'Test',
      state: 'State',
      pincode: '392130'
    };
    assert.throws(() => validateFacility(badCoords), ValidationError);

    const missingOrg = { ...badCoords, latitude: 20.0, organization_id: 0 };
    assert.throws(() => validateFacility(missingOrg), ValidationError);
  });

  test('Material: validates catalog taxonomy, state and hazard tiers', () => {
    const validMaterial = {
      material_code: 'MAT-SPENT-ACID-01',
      material_name: 'Spent Sulfuric Acid',
      primary_category: 'CHEMICAL_SPENT_ACID',
      physical_state: 'LIQUID',
      default_hazard_tier: 'HAZARDOUS_CLASS_A',
      carbon_offset_factor_kg_per_unit: 145.5,
      landfill_diversion_factor_tons_per_unit: 1.0,
      standard_unit: 'MT'
    };

    const mat = new Material(validMaterial);
    assert.strictEqual(mat.material_code, 'MAT-SPENT-ACID-01');
    assert.strictEqual(mat.physical_state, 'LIQUID');
    assert.strictEqual(mat.default_hazard_tier, 'HAZARDOUS_CLASS_A');
  });

  test('Material: rejects invalid physical state and negative offset factor', () => {
    const badState = {
      material_code: 'MAT-01',
      material_name: 'Plasma Gas',
      primary_category: 'ENERGY',
      physical_state: 'PLASMA', // Invalid
      default_hazard_tier: 'NON_HAZARDOUS'
    };
    assert.throws(() => validateMaterial(badState), ValidationError);

    const negativeFactor = {
      ...badState,
      physical_state: 'SOLID',
      carbon_offset_factor_kg_per_unit: -10.0
    };
    assert.throws(() => validateMaterial(negativeFactor), ValidationError);
  });

  test('Listing: validates purity, available vs total quantity, and chemical composition', () => {
    const validListing = {
      facility_id: 1,
      material_id: 1,
      listing_code: 'LST-2026-001',
      title: 'Spent Sulfuric Acid 78% Grade',
      physical_state: 'LIQUID',
      hazard_tier: 'HAZARDOUS_CLASS_A',
      chemical_composition: { H2SO4: 78.0, H2O: 20.5, Organics: 1.5 },
      purity_percentage: 78.0,
      total_quantity: 1500.0,
      available_quantity: 1200.0,
      quantity_unit: 'MT',
      price_per_unit_inr: 850.0,
      minimum_order_quantity: 50.0,
      available_from: '2026-01-01',
      available_until: '2026-12-31',
      status: 'ACTIVE'
    };

    const lst = new Listing(validListing);
    assert.strictEqual(lst.listing_code, 'LST-2026-001');
    assert.strictEqual(lst.purity_percentage, 78.0);
    assert.strictEqual(typeof lst.chemical_composition, 'string');
    assert.ok(lst.chemical_composition.includes('78'));
  });

  test('Listing: rejects purity > 100%, negative price, or available > total quantity', () => {
    const badPurity = {
      facility_id: 1,
      material_id: 1,
      listing_code: 'LST-BAD',
      purity_percentage: 105.0, // > 100
      total_quantity: 100,
      available_quantity: 100
    };
    assert.throws(() => validateListing(badPurity), ValidationError);

    const badAvailable = {
      ...badPurity,
      purity_percentage: 95.0,
      total_quantity: 100,
      available_quantity: 150 // available > total
    };
    assert.throws(() => validateListing(badAvailable), ValidationError);

    const negativePrice = {
      ...badPurity,
      purity_percentage: 95.0,
      available_quantity: 50,
      price_per_unit_inr: -50.0
    };
    assert.throws(() => validateListing(negativePrice), ValidationError);
  });

  test('Demand: validates demand requirement attributes and hazard tiers array', () => {
    const validDemand = {
      facility_id: 2,
      material_id: 1,
      demand_code: 'DMD-2026-001',
      title: 'Spent Acid for SSP Fertilizer Acidulation',
      required_physical_state: 'LIQUID',
      minimum_purity_percentage: 70.0,
      acceptable_hazard_tiers: ['NON_HAZARDOUS', 'HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B'],
      required_quantity: 1200.0,
      quantity_unit: 'MT',
      max_price_per_unit_inr: 950.0,
      frequency: 'MONTHLY',
      max_logistics_distance_km: 150.0,
      status: 'OPEN'
    };

    const dmd = new Demand(validDemand);
    assert.strictEqual(dmd.demand_code, 'DMD-2026-001');
    assert.strictEqual(dmd.minimum_purity_percentage, 70.0);
    assert.strictEqual(dmd.max_logistics_distance_km, 150.0);
  });

  test('Demand: rejects zero/negative required quantity or invalid frequency', () => {
    const zeroQty = {
      facility_id: 2,
      material_id: 1,
      demand_code: 'DMD-BAD',
      required_physical_state: 'LIQUID',
      minimum_purity_percentage: 70.0,
      acceptable_hazard_tiers: ['NON_HAZARDOUS'],
      required_quantity: 0.0 // <= 0
    };
    assert.throws(() => validateDemand(zeroQty), ValidationError);

    const badFreq = {
      ...zeroQty,
      required_quantity: 100.0,
      frequency: 'BIWEEKLY' // not in enum
    };
    assert.throws(() => validateDemand(badFreq), ValidationError);
  });

  test('Match Proposal & Exchange Transaction: validates match scores and contract values', () => {
    const validMatch = {
      supply_listing_id: 1,
      demand_requirement_id: 1,
      match_score: 0.945,
      score_material_compat: 1.0,
      score_quantity_compat: 0.95,
      score_proximity: 0.92,
      score_esg_reliability: 0.88,
      distance_km: 42.5,
      estimated_transit_cost_inr: 450000.0,
      estimated_transit_hours: 5.2,
      status: 'PROPOSED'
    };

    const match = new Match(validMatch);
    assert.strictEqual(match.match_score, 0.945);
    assert.strictEqual(match.distance_km, 42.5);

    const validTx = {
      match_id: 1,
      contract_reference: 'CTR-2026-DAHEJ-001',
      agreed_quantity: 1200.0,
      agreed_price_per_unit_inr: 820.0,
      total_transaction_value_inr: 984000.0,
      delivery_terms: 'DAP',
      status: 'CONTRACT_SIGNED'
    };

    const tx = new Transaction(validTx);
    assert.strictEqual(tx.contract_reference, 'CTR-2026-DAHEJ-001');
    assert.strictEqual(tx.total_transaction_value_inr, 984000.0);
  });

  test('Sustainability Metrics: validates circularity coefficient and carbon offset', () => {
    const validMetrics = {
      transaction_id: 1,
      embodied_carbon_offset_kg: 174600.0,
      landfill_diversion_tons: 1200.0,
      circularity_coefficient: 0.85,
      water_saved_kl: 450.0
    };

    const m = new SustainabilityMetrics(validMetrics);
    assert.strictEqual(m.embodied_carbon_offset_kg, 174600.0);
    assert.strictEqual(m.circularity_coefficient, 0.85);

    // Rejects circularity coefficient > 1.0
    assert.throws(() => validateMetrics({ ...validMetrics, circularity_coefficient: 1.5 }), ValidationError);
  });
});

describe('Database Layer: SQLite DatabaseSync Schema & Constraints', () => {
  let db;

  beforeEach(() => {
    db = getDatabase(':memory:');
    initSchema(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  test('initializes all 8 tables and indexes correctly', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").all();
    const tableNames = tables.map(t => t.name);

    assert.ok(tableNames.includes('organizations'));
    assert.ok(tableNames.includes('facilities'));
    assert.ok(tableNames.includes('material_catalog'));
    assert.ok(tableNames.includes('byproduct_listings'));
    assert.ok(tableNames.includes('demand_requirements'));
    assert.ok(tableNames.includes('match_proposals'));
    assert.ok(tableNames.includes('exchange_transactions'));
    assert.ok(tableNames.includes('sustainability_metrics'));
  });

  test('inserts valid records across master and transaction tables', () => {
    // 1. Organization
    db.prepare(`
      INSERT INTO organizations (registration_number, legal_name, industrial_sector, verification_status, contact_email, contact_phone, esg_score, reliability_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('L24110GJ2012PLC078901', 'Dahej Petrochem Ltd', 'Petrochemicals', 'VERIFIED', 'info@dahej.com', '+91-2641-289000', 82.0, 4.6);

    const org = db.prepare('SELECT * FROM organizations WHERE registration_number = ?').get('L24110GJ2012PLC078901');
    assert.strictEqual(org.legal_name, 'Dahej Petrochem Ltd');
    assert.strictEqual(org.esg_score, 82.0);

    // 2. Facility
    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(org.organization_id, 'FAC-DAHEJ-01', 'Dahej Plant 1', 'Dahej PCPIR', 21.7122, 72.5873, 'GIDC Dahej', 'Gujarat', '392130');

    const fac = db.prepare('SELECT * FROM facilities WHERE facility_code = ?').get('FAC-DAHEJ-01');
    assert.strictEqual(fac.cluster_name, 'Dahej PCPIR');
    assert.strictEqual(fac.latitude, 21.7122);

    // 3. Material
    db.prepare(`
      INSERT INTO material_catalog (material_code, material_name, primary_category, physical_state, default_hazard_tier, carbon_offset_factor_kg_per_unit, landfill_diversion_factor_tons_per_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('MAT-SULF-01', 'Spent Sulfuric Acid', 'CHEMICAL_SPENT_ACID', 'LIQUID', 'HAZARDOUS_CLASS_A', 145.0, 1.0);

    const mat = db.prepare('SELECT * FROM material_catalog WHERE material_code = ?').get('MAT-SULF-01');
    assert.strictEqual(mat.material_code, 'MAT-SULF-01');

    // 4. Byproduct Listing
    db.prepare(`
      INSERT INTO byproduct_listings (facility_id, material_id, listing_code, title, physical_state, hazard_tier, chemical_composition, purity_percentage, total_quantity, available_quantity, price_per_unit_inr, minimum_order_quantity, available_from, available_until, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fac.facility_id, mat.material_id, 'LST-001', 'Spent Acid 78%', 'LIQUID', 'HAZARDOUS_CLASS_A', '{"H2SO4":78}', 78.0, 1500.0, 1500.0, 850.0, 50.0, '2026-01-01', '2026-12-31', 'ACTIVE');

    const listing = db.prepare('SELECT * FROM byproduct_listings WHERE listing_code = ?').get('LST-001');
    assert.strictEqual(listing.total_quantity, 1500.0);
    assert.strictEqual(listing.purity_percentage, 78.0);
  });

  test('enforces CHECK constraint on negative price per unit', () => {
    // Insert valid org, facility, material
    db.prepare("INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone) VALUES ('REG-01', 'Org 1', 'Sector', 'a@a.com', '1234567');").run();
    db.prepare("INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, state, pincode) VALUES (1, 'F1', 'Fac 1', 'Cluster', 20.0, 70.0, 'Addr', 'State', '123456');").run();
    db.prepare("INSERT INTO material_catalog (material_code, material_name, primary_category, physical_state, default_hazard_tier) VALUES ('M1', 'Mat 1', 'Cat', 'SOLID', 'NON_HAZARDOUS');").run();

    // Inserting negative price must fail with CHECK constraint error
    assert.throws(() => {
      db.prepare(`
        INSERT INTO byproduct_listings (facility_id, material_id, listing_code, title, physical_state, hazard_tier, chemical_composition, purity_percentage, total_quantity, available_quantity, price_per_unit_inr, minimum_order_quantity, available_from, available_until)
        VALUES (1, 1, 'LST-NEG-PRICE', 'Title', 'SOLID', 'NON_HAZARDOUS', '{}', 90.0, 100.0, 100.0, -50.0, 10.0, '2026-01-01', '2026-12-31')
      `).run();
    }, /CHECK constraint failed/);
  });

  test('enforces CHECK constraint on invalid purity percentage (> 100% or < 0%)', () => {
    db.prepare("INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone) VALUES ('REG-02', 'Org 2', 'Sector', 'b@b.com', '1234567');").run();
    db.prepare("INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, state, pincode) VALUES (1, 'F2', 'Fac 2', 'Cluster', 20.0, 70.0, 'Addr', 'State', '123456');").run();
    db.prepare("INSERT INTO material_catalog (material_code, material_name, primary_category, physical_state, default_hazard_tier) VALUES ('M2', 'Mat 2', 'Cat', 'SOLID', 'NON_HAZARDOUS');").run();

    assert.throws(() => {
      db.prepare(`
        INSERT INTO byproduct_listings (facility_id, material_id, listing_code, title, physical_state, hazard_tier, chemical_composition, purity_percentage, total_quantity, available_quantity, price_per_unit_inr, minimum_order_quantity, available_from, available_until)
        VALUES (1, 1, 'LST-BAD-PURITY', 'Title', 'SOLID', 'NON_HAZARDOUS', '{}', 105.0, 100.0, 100.0, 50.0, 10.0, '2026-01-01', '2026-12-31')
      `).run();
    }, /CHECK constraint failed/);
  });

  test('enforces Foreign Key delete restriction on organizations with active facilities', () => {
    db.prepare("INSERT INTO organizations (registration_number, legal_name, industrial_sector, contact_email, contact_phone) VALUES ('REG-ORG-FK', 'Org FK', 'Sector', 'c@c.com', '1234567');").run();
    const org = db.prepare("SELECT organization_id FROM organizations WHERE registration_number = 'REG-ORG-FK'").get();

    db.prepare(`
      INSERT INTO facilities (organization_id, facility_code, facility_name, cluster_name, latitude, longitude, address, state, pincode)
      VALUES (?, 'F-FK', 'Fac FK', 'Cluster', 20.0, 70.0, 'Addr', 'State', '123456')
    `).run(org.organization_id);

    // Deleting the parent organization must fail due to ON DELETE RESTRICT
    assert.throws(() => {
      db.prepare('DELETE FROM organizations WHERE organization_id = ?').run(org.organization_id);
    }, /FOREIGN KEY constraint failed/);
  });
});
