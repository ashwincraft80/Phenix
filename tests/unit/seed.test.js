/**
 * Unit & Integration Tests: Seed Data Generation & Database Population
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDatabase } from '../../src/db/database.js';
import {
  ORGANIZATIONS,
  FACILITIES,
  MATERIALS,
  LISTINGS,
  DEMANDS,
  MATCHES,
  TRANSACTIONS,
  METRICS,
  seedDatabase
} from '../../src/db/seed.js';
import { validateOrganization } from '../../src/models/organization.js';
import { validateFacility } from '../../src/models/facility.js';
import { validateMaterial } from '../../src/models/material.js';
import { validateListing } from '../../src/models/listing.js';
import { validateDemand } from '../../src/models/demand.js';
import { validateMatch } from '../../src/models/match.js';
import { validateTransaction } from '../../src/models/transaction.js';
import { validateMetrics } from '../../src/models/metrics.js';

describe('Seed Data Definitions & Domain Validation', () => {
  it('exports at least 12 valid organizations matching domain requirements', () => {
    assert.ok(ORGANIZATIONS.length >= 12, `Expected >= 12 organizations, got ${ORGANIZATIONS.length}`);

    for (const org of ORGANIZATIONS) {
      assert.doesNotThrow(() => validateOrganization(org));
      assert.ok(org.registration_number, 'Organization must have a registration_number');
      assert.ok(org.legal_name, 'Organization must have a legal_name');
      assert.ok(org.esg_score >= 0 && org.esg_score <= 100, 'ESG score between 0 and 100');
      assert.ok(org.reliability_rating >= 0 && org.reliability_rating <= 5, 'Reliability between 0 and 5');
    }
  });

  it('exports at least 16 valid facilities spanning all 4 major industrial corridors', () => {
    assert.ok(FACILITIES.length >= 16, `Expected >= 16 facilities, got ${FACILITIES.length}`);

    const corridors = new Set(FACILITIES.map(f => f.cluster_name));
    assert.ok(corridors.has('Dahej PCPIR'), 'Must include Dahej PCPIR');
    assert.ok(corridors.has('Ankleshwar GIDC'), 'Must include Ankleshwar GIDC');
    assert.ok(corridors.has('Bharuch Industrial Estate'), 'Must include Bharuch Industrial Estate');
    assert.ok(corridors.has('Vadodara Petrochemical Complex'), 'Must include Vadodara Petrochemical Complex');
    assert.ok(corridors.has('Pune - Chakan MIDC'), 'Must include Pune - Chakan MIDC');
    assert.ok(corridors.has('Pimpri-Chinchwad Industrial Area'), 'Must include Pimpri-Chinchwad Industrial Area');
    assert.ok(corridors.has('Talegaon MIDC'), 'Must include Talegaon MIDC');
    assert.ok(corridors.has('Coimbatore Foundry & Pump Hub'), 'Must include Coimbatore Foundry & Pump Hub');
    assert.ok(corridors.has('Tirupur Textile Processing Cluster'), 'Must include Tirupur Textile Processing Cluster');
    assert.ok(corridors.has('Sriperumbudur Industrial Corridor'), 'Must include Sriperumbudur Industrial Corridor');
    assert.ok(corridors.has('Jamshedpur Steel Zone'), 'Must include Jamshedpur Steel Zone');
    assert.ok(corridors.has('Rourkela Steel Corridor'), 'Must include Rourkela Steel Corridor');
    assert.ok(corridors.has('Chaibasa Cement / Mineral Zone'), 'Must include Chaibasa Cement / Mineral Zone');

    for (const fac of FACILITIES) {
      assert.doesNotThrow(() => validateFacility(fac));
      assert.ok(fac.latitude >= -90 && fac.latitude <= 90, 'Valid latitude');
      assert.ok(fac.longitude >= -180 && fac.longitude <= 180, 'Valid longitude');
      assert.ok(fac.pincode && fac.pincode.length >= 6, 'Valid Indian PIN code');
    }
  });

  it('exports at least 8 standardized material taxonomy items covering 6 byproduct pairs', () => {
    assert.ok(MATERIALS.length >= 8, `Expected >= 8 materials, got ${MATERIALS.length}`);

    const codes = new Set(MATERIALS.map(m => m.material_code));
    assert.ok(codes.has('MAT-SULF-ACID'), 'Must include Spent Sulfuric Acid');
    assert.ok(codes.has('MAT-PHOSPHO-GYP'), 'Must include Phosphogypsum');
    assert.ok(codes.has('MAT-SLAG-GGBS'), 'Must include Blast Furnace Slag GGBS');
    assert.ok(codes.has('MAT-FOUNDRY-SAND'), 'Must include Spent Foundry Silica Sand');
    assert.ok(codes.has('MAT-SUGAR-BAGASSE'), 'Must include Sugarcane Bagasse');
    assert.ok(codes.has('MAT-TEXTILE-SLUDGE'), 'Must include Textile CETP Sludge');
    assert.ok(codes.has('MAT-FLY-ASH'), 'Must include Fly Ash');
    assert.ok(codes.has('MAT-RECOV-SOLVENT'), 'Must include Recovered Solvents');

    for (const mat of MATERIALS) {
      assert.doesNotThrow(() => validateMaterial(mat));
      assert.ok(mat.carbon_offset_factor_kg_per_unit >= 0, 'Non-negative carbon offset factor');
      assert.ok(mat.landfill_diversion_factor_tons_per_unit >= 0, 'Non-negative landfill factor');
    }
  });

  it('exports at least 12 supply listings and 10 demand requirements passing validation', () => {
    assert.ok(LISTINGS.length >= 12, `Expected >= 12 listings, got ${LISTINGS.length}`);
    assert.ok(DEMANDS.length >= 10, `Expected >= 10 demands, got ${DEMANDS.length}`);

    for (const lst of LISTINGS) {
      assert.doesNotThrow(() => validateListing(lst));
      assert.ok(lst.purity_percentage >= 0 && lst.purity_percentage <= 100);
      assert.ok(lst.available_quantity <= lst.total_quantity);
      assert.ok(lst.price_per_unit_inr >= 0);
    }

    for (const dmd of DEMANDS) {
      assert.doesNotThrow(() => validateDemand(dmd));
      assert.ok(dmd.required_quantity > 0);
      assert.ok(dmd.minimum_purity_percentage >= 0 && dmd.minimum_purity_percentage <= 100);
    }
  });

  it('exports at least 8 match proposals, 4 transactions, and 4 sustainability metrics', () => {
    assert.ok(MATCHES.length >= 8, `Expected >= 8 matches, got ${MATCHES.length}`);
    assert.ok(TRANSACTIONS.length >= 4, `Expected >= 4 transactions, got ${TRANSACTIONS.length}`);
    assert.ok(METRICS.length >= 4, `Expected >= 4 metrics, got ${METRICS.length}`);

    for (const mtch of MATCHES) {
      assert.doesNotThrow(() => validateMatch(mtch));
      assert.ok(mtch.match_score >= 0 && mtch.match_score <= 1.0);
      assert.ok(mtch.distance_km >= 0);
    }

    for (const tx of TRANSACTIONS) {
      assert.doesNotThrow(() => validateTransaction(tx));
      assert.ok(tx.contract_reference);
      assert.ok(tx.agreed_quantity > 0);
    }

    for (const met of METRICS) {
      assert.doesNotThrow(() => validateMetrics(met));
      assert.ok(met.embodied_carbon_offset_kg >= 0);
      assert.ok(met.landfill_diversion_tons >= 0);
      assert.ok(met.circularity_coefficient >= 0 && met.circularity_coefficient <= 1.0);
    }
  });
});

describe('Database Seeding & Foreign Key Integrity', () => {
  it('cleanly inserts all records with zero foreign key violations', () => {
    const db = getDatabase(':memory:');
    const result = seedDatabase(db);

    assert.ok(result.summary.totalRecords >= 70, `Expected >= 70 total records, got ${result.summary.totalRecords}`);
    assert.equal(result.summary.organizations, ORGANIZATIONS.length);
    assert.equal(result.summary.facilities, FACILITIES.length);
    assert.equal(result.summary.materials, MATERIALS.length);
    assert.equal(result.summary.listings, LISTINGS.length);
    assert.equal(result.summary.demands, DEMANDS.length);
    assert.equal(result.summary.matches, MATCHES.length);
    assert.equal(result.summary.transactions, TRANSACTIONS.length);
    assert.equal(result.summary.metrics, METRICS.length);

    // Verify foreign keys
    const fkErrors = db.prepare('PRAGMA foreign_key_check;').all();
    assert.equal(fkErrors.length, 0, `Expected 0 foreign key violations, got ${JSON.stringify(fkErrors)}`);

    // Verify record counts in DB tables directly
    const orgCount = db.prepare('SELECT COUNT(*) as c FROM organizations').get().c;
    const facCount = db.prepare('SELECT COUNT(*) as c FROM facilities').get().c;
    const matCount = db.prepare('SELECT COUNT(*) as c FROM material_catalog').get().c;
    const lstCount = db.prepare('SELECT COUNT(*) as c FROM byproduct_listings').get().c;
    const dmdCount = db.prepare('SELECT COUNT(*) as c FROM demand_requirements').get().c;
    const mtchCount = db.prepare('SELECT COUNT(*) as c FROM match_proposals').get().c;
    const txCount = db.prepare('SELECT COUNT(*) as c FROM exchange_transactions').get().c;
    const metCount = db.prepare('SELECT COUNT(*) as c FROM sustainability_metrics').get().c;

    assert.equal(orgCount, ORGANIZATIONS.length);
    assert.equal(facCount, FACILITIES.length);
    assert.equal(matCount, MATERIALS.length);
    assert.equal(lstCount, LISTINGS.length);
    assert.equal(dmdCount, DEMANDS.length);
    assert.equal(mtchCount, MATCHES.length);
    assert.equal(txCount, TRANSACTIONS.length);
    assert.equal(metCount, METRICS.length);
  });

  it('supports clean: true option to purge and re-seed idempotently', () => {
    const db = getDatabase(':memory:');

    // First seed
    seedDatabase(db);

    // Second seed with clean: true
    const reseedResult = seedDatabase(db, { clean: true });
    assert.equal(reseedResult.summary.totalRecords, 90);

    const fkErrors = db.prepare('PRAGMA foreign_key_check;').all();
    assert.equal(fkErrors.length, 0);

    const orgCount = db.prepare('SELECT COUNT(*) as c FROM organizations').get().c;
    assert.equal(orgCount, ORGANIZATIONS.length);
  });

  it('creates default in-memory database when db parameter is omitted', () => {
    const result = seedDatabase();
    assert.ok(result);
    assert.equal(result.summary.totalRecords, 90);
  });
});
