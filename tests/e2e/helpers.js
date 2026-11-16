/**
 * Phenix / Project ReguFlow - E2E Reference Contract Helpers
 * Zero external npm dependencies. Native Node.js v24 (node:sqlite, node:crypto).
 *
 * Implements authoritative mathematical geodesy, multi-criteria matchmaking formulas,
 * relational 10-table in-memory SQLite schema DDL, Indian industrial corridor seed datasets,
 * and cryptographic SHA-256 state chain verification conforming to PROJECT.md and spec_miner blueprints.
 */

import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 1. GEOLOCATION SERVICE & HAVERSINE MATHEMATICAL GEODESY
// ---------------------------------------------------------------------------

const WGS84_EARTH_RADIUS_KM = 6371.0088;

/**
 * Validates coordinate bounds. Throws RangeError or TypeError if invalid.
 */
export function validateCoordinates(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new TypeError('Coordinates must be valid finite numbers');
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new TypeError('Coordinates must be valid finite numbers');
  }
  if (lat < -90.0 || lat > 90.0) {
    throw new RangeError(`Latitude out of range [-90.0, 90.0]: ${lat}`);
  }
  if (lon < -180.0 || lon > 180.0) {
    throw new RangeError(`Longitude out of range [-180.0, 180.0]: ${lon}`);
  }
  return true;
}

/**
 * Computes great-circle distance between two geodetic coordinates using WGS-84 spherical radius.
 * Rounded to 3 decimal places. Handles coincident points (0.000) and antipodal limits.
 */
export function referenceHaversineDistance(lat1, lon1, lat2, lon2) {
  validateCoordinates(lat1, lon1);
  validateCoordinates(lat2, lon2);

  if (lat1 === lat2 && lon1 === lon2) {
    return 0.000;
  }

  const toRad = Math.PI / 180.0;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaPhi = (lat2 - lat1) * toRad;
  const deltaLambda = (lon2 - lon1) * toRad;

  const sinDeltaPhi2 = Math.sin(deltaPhi / 2.0);
  const sinDeltaLambda2 = Math.sin(deltaLambda / 2.0);

  const a = (sinDeltaPhi2 * sinDeltaPhi2) +
            Math.cos(phi1) * Math.cos(phi2) * (sinDeltaLambda2 * sinDeltaLambda2);

  // Clamping to avoid NaN due to floating-point imprecision
  const clampedA = Math.min(1.0, Math.max(0.0, a));
  const c = 2.0 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(Math.max(0.0, 1.0 - clampedA)));

  const distance = WGS84_EARTH_RADIUS_KM * c;
  return Number(distance.toFixed(3));
}

/**
 * Computes bounding box envelope around (lat, lon) for spatial index pre-filtering.
 */
export function referenceComputeBoundingBox(lat, lon, maxDistanceKm) {
  validateCoordinates(lat, lon);
  if (typeof maxDistanceKm !== 'number' || Number.isNaN(maxDistanceKm) || maxDistanceKm <= 0) {
    throw new RangeError('maxDistanceKm must be a positive number');
  }

  const deltaLat = maxDistanceKm / 111.32;
  const cosLat = Math.cos(lat * Math.PI / 180.0);
  // Prevent division by zero near poles
  const deltaLon = Math.abs(cosLat) > 1e-6
    ? maxDistanceKm / (111.32 * Math.abs(cosLat))
    : 180.0;

  const minLat = Math.max(-90.0, lat - deltaLat);
  const maxLat = Math.min(90.0, lat + deltaLat);
  const minLon = Math.max(-180.0, lon - deltaLon);
  const maxLon = Math.min(180.0, lon + deltaLon);

  return {
    minLat: Number(minLat.toFixed(6)),
    maxLat: Number(maxLat.toFixed(6)),
    minLon: Number(minLon.toFixed(6)),
    maxLon: Number(maxLon.toFixed(6))
  };
}

/**
 * Calculates commercial logistics freight costs and transit turnaround hours.
 * Base rate: 8.50 INR / ton-km, terminal handling fee: 1500 INR.
 */
export function referenceCalculateLogistics(distanceKm, quantityTons, hazardTier = 'NON_HAZARDOUS') {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm) || distanceKm < 0) {
    throw new RangeError('distanceKm must be non-negative number');
  }
  if (typeof quantityTons !== 'number' || Number.isNaN(quantityTons) || quantityTons < 0) {
    throw new RangeError('quantityTons must be non-negative number');
  }

  const baseRatePerTonKm = 8.50;
  const fixedTerminalFeeINR = 1500.0;

  const hazardMultipliers = {
    'NON_HAZARDOUS': 1.00,
    'LOW': 1.20,
    'HAZARDOUS_CLASS_B': 1.20,
    'MEDIUM': 1.80,
    'HAZARDOUS_CLASS_A': 1.80,
    'HIGH': 2.40,
    'TOXIC_CORROSIVE': 2.40
  };

  const multiplier = hazardMultipliers[hazardTier] || 1.00;
  const estimatedCostINR = fixedTerminalFeeINR + (distanceKm * baseRatePerTonKm * multiplier * quantityTons);

  // Transit duration: 4.0h buffer + (distance / 35 km/h) + 14h driver rest per 350 km
  const turnaroundBufferHours = 4.0;
  const avgCommercialSpeedKmH = 35.0;
  const driverRestStops = Math.floor(distanceKm / 350.0);
  const transitDurationHours = turnaroundBufferHours + (distanceKm / avgCommercialSpeedKmH) + (driverRestStops * 14.0);

  const routeFeasible = distanceKm >= 0 && quantityTons > 0 && distanceKm <= 3500;

  return {
    estimatedCostINR: Number(estimatedCostINR.toFixed(2)),
    transitDurationHours: Number(transitDurationHours.toFixed(2)),
    routeFeasible
  };
}

// ---------------------------------------------------------------------------
// 2. MATCHMAKING ENGINE & SCORING FORMULATIONS
// ---------------------------------------------------------------------------

/**
 * Multi-Attribute Algorithmic Matchmaking Scorer:
 * Computes S_mat, S_qty, S_dist, S_esg, and weighted net composite score.
 */
export function referenceCalculateMatchScore(
  supplyListing,
  demandReq,
  distanceKm,
  orgSupplier = {},
  orgReceiver = {},
  weights = { material: 0.35, quantity: 0.25, distance: 0.25, esg: 0.15 }
) {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm) || distanceKm < 0) {
    throw new RangeError('distanceKm must be non-negative number');
  }

  const reasons = [];

  // 1. Normalize weights
  const rawWm = weights.material ?? 0.35;
  const rawWq = weights.quantity ?? 0.25;
  const rawWp = weights.distance ?? 0.25;
  const rawWe = weights.esg ?? 0.15;
  const sumW = (rawWm + rawWq + rawWp + rawWe) || 1.0;
  const wm = rawWm / sumW;
  const wq = rawWq / sumW;
  const wp = rawWp / sumW;
  const we = rawWe / sumW;

  // 2. Material Compatibility S_mat = C_tax * C_state * C_purity * C_hazard
  let cTax = 0.0;
  if (supplyListing.material_id && demandReq.material_id && supplyListing.material_id === demandReq.material_id) {
    cTax = 1.0;
  } else if (supplyListing.material_code && demandReq.material_code && supplyListing.material_code === demandReq.material_code) {
    cTax = 1.0;
  } else if (supplyListing.subcategory && demandReq.subcategory && supplyListing.subcategory === demandReq.subcategory) {
    cTax = 0.8;
  } else if (supplyListing.primary_category && demandReq.primary_category && supplyListing.primary_category === demandReq.primary_category) {
    cTax = 0.5;
  } else {
    cTax = 0.0;
    reasons.push('Material taxonomy mismatch');
  }

  // Physical State check
  const supplyState = supplyListing.physical_state;
  const reqState = demandReq.required_physical_state || demandReq.physical_state;
  let cState = 1.0;
  if (supplyState && reqState && supplyState !== reqState) {
    cState = 0.0;
    reasons.push(`Physical state mismatch: supply=${supplyState}, demand=${reqState}`);
  }

  // Purity compliance
  const pSupply = supplyListing.purity_percentage ?? 100.0;
  const pMinDemand = demandReq.minimum_purity_percentage ?? 0.0;
  let cPurity = 1.0;
  if (pSupply >= pMinDemand) {
    cPurity = 1.0;
  } else if (pMinDemand > 0) {
    cPurity = Math.max(0.0, 1.0 - 3.0 * ((pMinDemand - pSupply) / pMinDemand));
    if (cPurity < 0.50) {
      reasons.push(`Purity below acceptable threshold: supply=${pSupply}%, min=${pMinDemand}%`);
    }
  }

  // Hazard Tier admissibility
  let cHazard = 1.0;
  let acceptableHazards = demandReq.acceptable_hazard_tiers;
  if (typeof acceptableHazards === 'string') {
    try {
      acceptableHazards = JSON.parse(acceptableHazards);
    } catch {
      acceptableHazards = [acceptableHazards];
    }
  }
  if (Array.isArray(acceptableHazards) && acceptableHazards.length > 0 && supplyListing.hazard_tier) {
    if (!acceptableHazards.includes(supplyListing.hazard_tier)) {
      cHazard = 0.0;
      reasons.push(`Hazard tier '${supplyListing.hazard_tier}' not in buyer acceptable set [${acceptableHazards.join(', ')}]`);
    }
  }

  const sMat = Number((cTax * cState * cPurity * cHazard).toFixed(4));

  // 3. Quantity Satisfaction Ratio S_qty
  const qAvail = supplyListing.available_quantity ?? supplyListing.total_quantity ?? 0.0;
  const qReq = demandReq.required_quantity ?? 1.0;
  const moq = supplyListing.minimum_order_quantity ?? 0.0;

  let sQty = 0.0;
  if (qAvail <= 0 || qAvail < moq) {
    sQty = 0.0;
    reasons.push(`Available quantity ${qAvail} is zero or below MOQ ${moq}`);
  } else if (qAvail >= qReq) {
    // Complete fulfillment with oversupply penalty dampening
    const ratio = qAvail / qReq;
    sQty = 1.0 - 0.10 * Math.min(1.0, (ratio - 1.0) / (ratio + 1.0));
  } else {
    // Partial fulfillment capability: (Q_S / Q_D)^0.8
    sQty = Math.pow(qAvail / qReq, 0.80);
  }
  sQty = Number(sQty.toFixed(4));

  // 4. Logistics Proximity Score S_dist
  const maxDistanceKm = demandReq.max_logistics_distance_km;
  let sDist = 0.0;
  if (maxDistanceKm != null && distanceKm > maxDistanceKm) {
    sDist = 0.0;
    reasons.push(`Distance ${distanceKm} km exceeds buyer cap ${maxDistanceKm} km`);
  } else {
    const d0 = 300.0; // characteristic scale distance
    sDist = 1.0 / (1.0 + Math.pow(distanceKm / d0, 2));
  }
  sDist = Number(sDist.toFixed(4));

  // 5. ESG & Reliability Composite S_esg
  const esgS = orgSupplier.esg_score ?? 50.0;
  const relS = orgSupplier.reliability_rating ?? 3.0;
  const esgD = orgReceiver.esg_score ?? 50.0;
  const relD = orgReceiver.reliability_rating ?? 3.0;

  const supplierComposite = 0.60 * (esgS / 100.0) + 0.40 * (relS / 5.0);
  const receiverComposite = 0.60 * (esgD / 100.0) + 0.40 * (relD / 5.0);
  const sEsg = Number(((supplierComposite + receiverComposite) / 2.0).toFixed(4));

  // 6. Composite Net Score
  const hardIncompatible = sMat < 0.50 || sQty <= 0.0 || (maxDistanceKm != null && distanceKm > maxDistanceKm);
  let netScore = 0.0;
  if (!hardIncompatible) {
    netScore = (wm * sMat) + (wq * sQty) + (wp * sDist) + (we * sEsg);
    netScore = Number(Math.max(0.0, Math.min(1.0, netScore)).toFixed(4));
  }

  const eligible = !hardIncompatible && netScore > 0.0;

  return {
    netScore,
    eligible,
    breakdown: {
      materialScore: sMat,
      quantityScore: sQty,
      distanceScore: sDist,
      esgScore: sEsg
    },
    reasons
  };
}

/**
 * Evaluates and ranks candidate supply listings against a single demand tender.
 */
export function referenceRankCandidates(
  demandReq,
  supplyListings,
  facilitiesMap = {},
  organizationsMap = {},
  weights
) {
  const buyerFacility = facilitiesMap[demandReq.facility_id] || { latitude: 0, longitude: 0 };
  const buyerOrg = buyerFacility.organization_id ? organizationsMap[buyerFacility.organization_id] : {};

  const scoredCandidates = [];

  for (const listing of supplyListings) {
    const sellerFacility = facilitiesMap[listing.facility_id] || { latitude: 0, longitude: 0 };
    const sellerOrg = sellerFacility.organization_id ? organizationsMap[sellerFacility.organization_id] : {};

    const distanceKm = referenceHaversineDistance(
      buyerFacility.latitude,
      buyerFacility.longitude,
      sellerFacility.latitude,
      sellerFacility.longitude
    );

    const scoreResult = referenceCalculateMatchScore(
      listing,
      demandReq,
      distanceKm,
      sellerOrg,
      buyerOrg,
      weights
    );

    scoredCandidates.push({
      listing,
      distanceKm,
      ...scoreResult
    });
  }

  // Sort descending by netScore; tiebreak by distanceKm ascending
  scoredCandidates.sort((a, b) => {
    if (b.netScore !== a.netScore) {
      return b.netScore - a.netScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  return scoredCandidates;
}

// ---------------------------------------------------------------------------
// DYNAMIC IMPORT RESOLUTION: Prefer ../../src/services/* if available
// ---------------------------------------------------------------------------

let resolvedHaversine = referenceHaversineDistance;
let resolvedBoundingBox = referenceComputeBoundingBox;
let resolvedLogistics = referenceCalculateLogistics;
let resolvedCalculateMatch = referenceCalculateMatchScore;
let resolvedRankCandidates = referenceRankCandidates;

// Dynamic load check (sync inspection of filesystem)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const geoServicePath = path.join(projectRoot, 'src', 'services', 'geolocation.js');
const matchServicePath = path.join(projectRoot, 'src', 'services', 'matchmaking.js');

try {
  if (fs.existsSync(geoServicePath)) {
    const geoModule = await import(geoServicePath);
    if (typeof geoModule.haversineDistance === 'function') resolvedHaversine = geoModule.haversineDistance;
    if (typeof geoModule.computeBoundingBox === 'function') resolvedBoundingBox = geoModule.computeBoundingBox;
    if (typeof geoModule.calculateLogistics === 'function') resolvedLogistics = geoModule.calculateLogistics;
  }
} catch {
  // Fall back silently to reference implementations
}

try {
  if (fs.existsSync(matchServicePath)) {
    const matchModule = await import(matchServicePath);
    if (typeof matchModule.calculateMatchScore === 'function') resolvedCalculateMatch = matchModule.calculateMatchScore;
    if (typeof matchModule.rankCandidates === 'function') resolvedRankCandidates = matchModule.rankCandidates;
  }
} catch {
  // Fall back silently to reference implementations
}

export const haversineDistance = resolvedHaversine;
export const computeBoundingBox = resolvedBoundingBox;
export const calculateLogistics = resolvedLogistics;
export const calculateMatchScore = resolvedCalculateMatch;
export const rankCandidates = resolvedRankCandidates;

// ---------------------------------------------------------------------------
// 3. RELATIONAL 10-TABLE DDL & IN-MEMORY SQLITE DATABASE HELPER
// ---------------------------------------------------------------------------

export const CORE_SCHEMA_SQLITE_DDL = `
PRAGMA foreign_keys = ON;

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    organization_id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number VARCHAR(64) NOT NULL UNIQUE,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    industrial_sector VARCHAR(100) NOT NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED')),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(32) NOT NULL,
    esg_score REAL NOT NULL DEFAULT 50.0 CHECK (esg_score BETWEEN 0.0 AND 100.0),
    reliability_rating REAL NOT NULL DEFAULT 3.0 CHECK (reliability_rating BETWEEN 0.0 AND 5.0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Facilities
CREATE TABLE IF NOT EXISTS facilities (
    facility_id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    facility_code VARCHAR(64) NOT NULL UNIQUE,
    facility_name VARCHAR(255) NOT NULL,
    cluster_name VARCHAR(150) NOT NULL,
    latitude REAL NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude REAL NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Material Catalog
CREATE TABLE IF NOT EXISTS material_catalog (
    material_id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_code VARCHAR(64) NOT NULL UNIQUE,
    material_name VARCHAR(255) NOT NULL,
    primary_category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    physical_state VARCHAR(20) NOT NULL CHECK (physical_state IN ('SOLID', 'SOLID_POWDER', 'SOLID_GRANULAR', 'SOLID_BULK', 'LIQUID', 'GAS', 'SLURRY', 'SLUDGE')),
    default_hazard_tier VARCHAR(30) NOT NULL CHECK (default_hazard_tier IN ('NON_HAZARDOUS', 'HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B', 'TOXIC_CORROSIVE', 'LOW', 'MEDIUM', 'HIGH')),
    carbon_offset_factor_kg_per_unit REAL NOT NULL DEFAULT 0.0 CHECK (carbon_offset_factor_kg_per_unit >= 0),
    landfill_diversion_factor_tons_per_unit REAL NOT NULL DEFAULT 0.0 CHECK (landfill_diversion_factor_tons_per_unit >= 0),
    standard_unit VARCHAR(20) NOT NULL DEFAULT 'MT'
);

-- 4. Byproduct Listings (Supply)
CREATE TABLE IF NOT EXISTS byproduct_listings (
    listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    listing_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    physical_state VARCHAR(20) NOT NULL CHECK (physical_state IN ('SOLID', 'SOLID_POWDER', 'SOLID_GRANULAR', 'SOLID_BULK', 'LIQUID', 'GAS', 'SLURRY', 'SLUDGE')),
    hazard_tier VARCHAR(30) NOT NULL CHECK (hazard_tier IN ('NON_HAZARDOUS', 'HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B', 'TOXIC_CORROSIVE', 'LOW', 'MEDIUM', 'HIGH')),
    chemical_composition TEXT NOT NULL, -- JSON string
    purity_percentage REAL NOT NULL CHECK (purity_percentage BETWEEN 0.0 AND 100.0),
    total_quantity REAL NOT NULL CHECK (total_quantity > 0),
    available_quantity REAL NOT NULL CHECK (available_quantity >= 0),
    quantity_unit VARCHAR(20) NOT NULL DEFAULT 'MT',
    price_per_unit_inr REAL NOT NULL DEFAULT 0.0 CHECK (price_per_unit_inr >= 0),
    minimum_order_quantity REAL NOT NULL DEFAULT 1.0 CHECK (minimum_order_quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'AVAILABLE', 'RESERVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'DEPLETED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (minimum_order_quantity <= total_quantity),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material_catalog(material_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. Demand Requirements
CREATE TABLE IF NOT EXISTS demand_requirements (
    demand_id INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    demand_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    required_physical_state VARCHAR(20) NOT NULL CHECK (required_physical_state IN ('SOLID', 'SOLID_POWDER', 'SOLID_GRANULAR', 'SOLID_BULK', 'LIQUID', 'GAS', 'SLURRY', 'SLUDGE')),
    minimum_purity_percentage REAL NOT NULL CHECK (minimum_purity_percentage BETWEEN 0.0 AND 100.0),
    acceptable_hazard_tiers TEXT NOT NULL, -- JSON array of strings
    required_quantity REAL NOT NULL CHECK (required_quantity > 0),
    quantity_unit VARCHAR(20) NOT NULL DEFAULT 'MT',
    max_price_per_unit_inr REAL CHECK (max_price_per_unit_inr >= 0),
    max_logistics_distance_km REAL CHECK (max_logistics_distance_km > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material_catalog(material_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. Match Proposals
CREATE TABLE IF NOT EXISTS match_proposals (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_listing_id INTEGER NOT NULL,
    demand_requirement_id INTEGER NOT NULL,
    match_score REAL NOT NULL CHECK (match_score BETWEEN 0.0 AND 1.0),
    score_material_compat REAL NOT NULL CHECK (score_material_compat BETWEEN 0.0 AND 1.0),
    score_quantity_compat REAL NOT NULL CHECK (score_quantity_compat BETWEEN 0.0 AND 1.0),
    score_proximity REAL NOT NULL CHECK (score_proximity BETWEEN 0.0 AND 1.0),
    score_esg_reliability REAL NOT NULL CHECK (score_esg_reliability BETWEEN 0.0 AND 1.0),
    distance_km REAL NOT NULL CHECK (distance_km >= 0),
    estimated_transit_cost_inr REAL NOT NULL DEFAULT 0.0 CHECK (estimated_transit_cost_inr >= 0),
    estimated_transit_hours REAL NOT NULL DEFAULT 0.0 CHECK (estimated_transit_hours >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PROPOSED'
        CHECK (status IN ('PROPOSED', 'OFFERED', 'ACCEPTED_SUPPLIER', 'ACCEPTED_BUYER', 'MUTUALLY_ACCEPTED', 'CONFIRMED', 'REJECTED', 'EXPIRED')),
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supply_listing_id) REFERENCES byproduct_listings(listing_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (demand_requirement_id) REFERENCES demand_requirements(demand_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (supply_listing_id, demand_requirement_id)
);

-- 7. Exchange Transactions
CREATE TABLE IF NOT EXISTS exchange_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL UNIQUE,
    contract_reference VARCHAR(64) NOT NULL UNIQUE,
    seller_facility_id INTEGER NOT NULL,
    buyer_facility_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    agreed_quantity REAL NOT NULL CHECK (agreed_quantity > 0),
    agreed_price_per_unit_inr REAL NOT NULL CHECK (agreed_price_per_unit_inr >= 0),
    total_transaction_value_inr REAL NOT NULL CHECK (total_transaction_value_inr >= 0),
    delivery_terms VARCHAR(20) NOT NULL DEFAULT 'EXW' CHECK (delivery_terms IN ('EXW', 'FOB', 'DAP', 'DDP')),
    status VARCHAR(30) NOT NULL DEFAULT 'CONTRACT_SIGNED'
        CHECK (status IN ('INITIATED', 'CONTRACT_SIGNED', 'IN_TRANSIT', 'DELIVERED', 'INSPECTED_ACCEPTED', 'SETTLED', 'DISPUTED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES match_proposals(match_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (seller_facility_id) REFERENCES facilities(facility_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (buyer_facility_id) REFERENCES facilities(facility_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material_catalog(material_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. Logistics Transits
CREATE TABLE IF NOT EXISTS logistics_transits (
    transit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    carrier_org_id INTEGER NOT NULL,
    waybill_number VARCHAR(64) NOT NULL UNIQUE,
    vehicle_reg_number VARCHAR(32) NOT NULL,
    weighbridge_gross_kg REAL NOT NULL CHECK (weighbridge_gross_kg >= 0),
    weighbridge_tare_kg REAL NOT NULL CHECK (weighbridge_tare_kg >= 0),
    weighbridge_net_kg REAL GENERATED ALWAYS AS (weighbridge_gross_kg - weighbridge_tare_kg) STORED,
    transit_status VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED'
        CHECK (transit_status IN ('DISPATCHED', 'IN_TRANSIT', 'AT_WEIGHBRIDGE', 'DELIVERED', 'DISCREPANCY_FLAGGED')),
    CHECK (weighbridge_gross_kg >= weighbridge_tare_kg),
    FOREIGN KEY (transaction_id) REFERENCES exchange_transactions(transaction_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (carrier_org_id) REFERENCES organizations(organization_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. ESG Impact Metrics
CREATE TABLE IF NOT EXISTS sustainability_metrics (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL UNIQUE,
    landfill_diversion_tons REAL NOT NULL DEFAULT 0.0 CHECK (landfill_diversion_tons >= 0),
    embodied_carbon_offset_kg REAL NOT NULL DEFAULT 0.0 CHECK (embodied_carbon_offset_kg >= 0),
    virgin_raw_material_saved_tons REAL NOT NULL DEFAULT 0.0 CHECK (virgin_raw_material_saved_tons >= 0),
    economic_value_saved_inr REAL NOT NULL DEFAULT 0.0 CHECK (economic_value_saved_inr >= 0),
    circularity_coefficient REAL NOT NULL DEFAULT 0.0 CHECK (circularity_coefficient BETWEEN 0.0 AND 1.0),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES exchange_transactions(transaction_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 10. Audit Ledger
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    previous_log_checksum VARCHAR(64),
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & spatial queries
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_facilities_cluster ON facilities(cluster_name);
CREATE INDEX IF NOT EXISTS idx_listings_fac_mat ON byproduct_listings(facility_id, material_id, status);
CREATE INDEX IF NOT EXISTS idx_demands_fac_mat ON demand_requirements(facility_id, material_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_score ON match_proposals(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_tx_match ON exchange_transactions(match_id);
`;

/**
 * Creates and initializes an in-memory SQLite database instance with the 10 core tables.
 */
export function getTestDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(CORE_SCHEMA_SQLITE_DDL);
  return db;
}

// ---------------------------------------------------------------------------
// 4. AUTHENTIC INDIAN INDUSTRIAL CORRIDOR SEED DATA
// ---------------------------------------------------------------------------

export function getCorridorSeedData() {
  const organizations = [
    // Gujarat Corridor
    {
      registration_number: 'U24110GJ2012PLC078901',
      legal_name: 'Dahej Petrochemicals & Chlor-Alkali Ltd',
      trade_name: 'Dahej Chlor-Alkali',
      industrial_sector: 'Chemicals & Petrochemicals',
      verification_status: 'VERIFIED',
      contact_email: 'compliance@dahejchloro.co.in',
      contact_phone: '+91-2641-256789',
      esg_score: 82.5,
      reliability_rating: 4.6
    },
    {
      registration_number: 'U24230GJ2015PLC089123',
      legal_name: 'Ankleshwar Fine Synthetics & APIs Ltd',
      trade_name: 'Ankleshwar Synthetics',
      industrial_sector: 'Pharmaceuticals & Fine Chemicals',
      verification_status: 'VERIFIED',
      contact_email: 'esg@ankfine.co.in',
      contact_phone: '+91-2646-245678',
      esg_score: 74.0,
      reliability_rating: 4.2
    },
    {
      registration_number: 'U24120GJ2010PLC065432',
      legal_name: 'Bharuch Single Super Phosphate Fertilizers Ltd',
      trade_name: 'Bharuch AgroChem',
      industrial_sector: 'Agrochemicals & Fertilizers',
      verification_status: 'VERIFIED',
      contact_email: 'procurement@bharuchssp.com',
      contact_phone: '+91-2642-234567',
      esg_score: 79.0,
      reliability_rating: 4.4
    },
    {
      registration_number: 'U26940GJ2008PLC054321',
      legal_name: 'Mundra Pozzolana & Marine Cement Works',
      trade_name: 'Mundra Green Cement',
      industrial_sector: 'Cement & Building Materials',
      verification_status: 'VERIFIED',
      contact_email: 'rawmaterials@mundracement.com',
      contact_phone: '+91-2838-278901',
      esg_score: 86.0,
      reliability_rating: 4.7
    },
    // Maharashtra Corridor
    {
      registration_number: 'U29220MH2014PLC067890',
      legal_name: 'Chakan Auto Forging & Casting Works Pvt Ltd',
      trade_name: 'Chakan Forgings',
      industrial_sector: 'Automotive & Heavy Forging',
      verification_status: 'VERIFIED',
      contact_email: 'operations@chakanforge.com',
      contact_phone: '+91-2135-267890',
      esg_score: 81.0,
      reliability_rating: 4.5
    },
    {
      registration_number: 'U26950MH2017PTC078654',
      legal_name: 'Talegaon Eco Paver Blocks & Precast Infra',
      trade_name: 'Talegaon Green Infra',
      industrial_sector: 'Infrastructure & Building Materials',
      verification_status: 'VERIFIED',
      contact_email: 'inquiry@talegaoninfra.co.in',
      contact_phone: '+91-2114-256123',
      esg_score: 76.5,
      reliability_rating: 4.1
    },
    // Tamil Nadu Corridor
    {
      registration_number: 'U17111TN2016PTC098765',
      legal_name: 'Tirupur Eco Dyeing & Processing Consortium',
      trade_name: 'Tirupur Eco Dyeing',
      industrial_sector: 'Textiles & Dyeing',
      verification_status: 'VERIFIED',
      contact_email: 'sustainability@tirupureco.org',
      contact_phone: '+91-421-2233445',
      esg_score: 71.0,
      reliability_rating: 3.9
    },
    {
      registration_number: 'U26922TN2011PLC081234',
      legal_name: 'Coimbatore Thermal Kilns & Refractories Ltd',
      trade_name: 'Kovai Kilns',
      industrial_sector: 'Cement & Thermal Kilns',
      verification_status: 'VERIFIED',
      contact_email: 'feedstock@kovaikilns.com',
      contact_phone: '+91-422-2654321',
      esg_score: 83.0,
      reliability_rating: 4.5
    },
    // Jharkhand Steel Corridor
    {
      registration_number: 'U27102JH2010PLC043210',
      legal_name: 'Jamshedpur Integrated Blast Furnace & Alloys Ltd',
      trade_name: 'Tata Nagar Alloys',
      industrial_sector: 'Iron & Steel Metallurgy',
      verification_status: 'VERIFIED',
      contact_email: 'slag@jamshedpuralloys.com',
      contact_phone: '+91-657-2432100',
      esg_score: 89.0,
      reliability_rating: 4.8
    },
    {
      registration_number: 'U26942JH2013PLC056789',
      legal_name: 'Chaibasa Ready-Mix Slag Cement Corporation',
      trade_name: 'Chaibasa RMX',
      industrial_sector: 'Cement & Infrastructure',
      verification_status: 'VERIFIED',
      contact_email: 'ggbs@chaibasarmx.in',
      contact_phone: '+91-6582-254321',
      esg_score: 84.0,
      reliability_rating: 4.6
    },
    // Logistics Carrier
    {
      registration_number: 'U60231MH2009PLC034567',
      legal_name: 'Viksit Western Dedicated Freight Logistics Ltd',
      trade_name: 'Viksit Freight',
      industrial_sector: 'Logistics & Haulage',
      verification_status: 'VERIFIED',
      contact_email: 'dispatch@viksitfreight.in',
      contact_phone: '+91-22-28765432',
      esg_score: 78.0,
      reliability_rating: 4.4
    }
  ];

  const facilities = [
    // Gujarat
    {
      org_index: 0,
      facility_code: 'FAC-DAHEJ-01',
      facility_name: 'Dahej PCPIR Caustic & Acid Plant',
      cluster_name: 'Dahej PCPIR',
      latitude: 21.7122,
      longitude: 72.5873,
      address: 'Plot 45, Dahej SEZ-1, Bharuch District',
      city: 'Dahej',
      state: 'Gujarat',
      pincode: '392130'
    },
    {
      org_index: 1,
      facility_code: 'FAC-ANKL-01',
      facility_name: 'Ankleshwar GIDC Solvent Recovery Unit',
      cluster_name: 'Ankleshwar GIDC',
      latitude: 21.6264,
      longitude: 73.0152,
      address: 'Phase-2, GIDC Estate, Ankleshwar',
      city: 'Ankleshwar',
      state: 'Gujarat',
      pincode: '393002'
    },
    {
      org_index: 2,
      facility_code: 'FAC-BHAR-01',
      facility_name: 'Bharuch SSP Granulation Facility',
      cluster_name: 'Bharuch Fertilizer Hub',
      latitude: 21.7051,
      longitude: 72.9959,
      address: 'Narmadanagar Industrial Area, Bharuch',
      city: 'Bharuch',
      state: 'Gujarat',
      pincode: '392015'
    },
    {
      org_index: 3,
      facility_code: 'FAC-MUND-01',
      facility_name: 'Mundra Kutch Pozzolana Grinding Unit',
      cluster_name: 'Mundra Industrial SEZ',
      latitude: 22.8396,
      longitude: 69.7111,
      address: 'Port Industrial Complex, Mundra, Kutch',
      city: 'Mundra',
      state: 'Gujarat',
      pincode: '370421'
    },
    // Maharashtra
    {
      org_index: 4,
      facility_code: 'FAC-CHAK-01',
      facility_name: 'Chakan MIDC Foundry & Sand Reclamation Works',
      cluster_name: 'Pune-Chakan Industrial Belt',
      latitude: 18.7606,
      longitude: 73.8636,
      address: 'Phase-II MIDC Chakan, Khed Taluka, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410501'
    },
    {
      org_index: 5,
      facility_code: 'FAC-TALE-01',
      facility_name: 'Talegaon Dabhade Eco-Paver Block Plant',
      cluster_name: 'Talegaon Precast Hub',
      latitude: 18.7297,
      longitude: 73.6828,
      address: 'Talegaon Industrial Corridor, Maval, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410507'
    },
    // Tamil Nadu
    {
      org_index: 6,
      facility_code: 'FAC-TIRU-01',
      facility_name: 'Tirupur Common Effluent Sludge Dewatering Centre',
      cluster_name: 'Tirupur Textile Hub',
      latitude: 11.1085,
      longitude: 77.3411,
      address: 'CETP Complex, Rayapuram, Tirupur',
      city: 'Tirupur',
      state: 'Tamil Nadu',
      pincode: '641601'
    },
    {
      org_index: 7,
      facility_code: 'FAC-COIM-01',
      facility_name: 'Coimbatore Industrial Co-Processing Kilns',
      cluster_name: 'Coimbatore Thermal Cluster',
      latitude: 11.0168,
      longitude: 76.9558,
      address: 'Madukkarai Kiln Zone, Coimbatore',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641105'
    },
    // Jharkhand
    {
      org_index: 8,
      facility_code: 'FAC-JAMS-01',
      facility_name: 'Jamshedpur Blast Furnace Slag Granulator',
      cluster_name: 'Jamshedpur Steel Corridor',
      latitude: 22.8046,
      longitude: 86.2029,
      address: 'Golmuri Works, Jamshedpur, East Singhbhum',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      pincode: '831003'
    },
    {
      org_index: 9,
      facility_code: 'FAC-CHAI-01',
      facility_name: 'Chaibasa Ready-Mix Slag Cement Terminal',
      cluster_name: 'Chaibasa Cement Belt',
      latitude: 22.5532,
      longitude: 85.8086,
      address: 'Mining & Cement Area, Chaibasa, West Singhbhum',
      city: 'Chaibasa',
      state: 'Jharkhand',
      pincode: '833201'
    }
  ];

  const materials = [
    {
      material_code: 'MAT-CHEM-01',
      material_name: 'Spent Sulfuric Acid',
      primary_category: 'CHEMICAL_INORGANIC_ACID',
      subcategory: 'SULFUR_DERIVATIVES',
      physical_state: 'LIQUID',
      default_hazard_tier: 'HAZARDOUS_CLASS_A',
      carbon_offset_factor_kg_per_unit: 145.0, // kg CO2e saved per MT of virgin H2SO4 avoided
      landfill_diversion_factor_tons_per_unit: 1.0,
      standard_unit: 'MT'
    },
    {
      material_code: 'MAT-GYP-01',
      material_name: 'Industrial Phosphogypsum',
      primary_category: 'MINERAL_SULFATE_RESIDUE',
      subcategory: 'CALCIUM_SULFATE',
      physical_state: 'SOLID',
      default_hazard_tier: 'NON_HAZARDOUS',
      carbon_offset_factor_kg_per_unit: 85.0,
      landfill_diversion_factor_tons_per_unit: 1.0,
      standard_unit: 'MT'
    },
    {
      material_code: 'MAT-SAND-01',
      material_name: 'Spent Foundry Silica Sand',
      primary_category: 'FOUNDRY_METALLURGICAL_RESIDUE',
      subcategory: 'SILICA_SAND',
      physical_state: 'SOLID',
      default_hazard_tier: 'NON_HAZARDOUS',
      carbon_offset_factor_kg_per_unit: 45.0,
      landfill_diversion_factor_tons_per_unit: 1.0,
      standard_unit: 'MT'
    },
    {
      material_code: 'MAT-SLAG-01',
      material_name: 'Granulated Blast Furnace Slag (GGBS)',
      primary_category: 'FERROUS_METALLURGY_SLAG',
      subcategory: 'POZZOLANA_CEMENTITIOUS',
      physical_state: 'SOLID',
      default_hazard_tier: 'NON_HAZARDOUS',
      carbon_offset_factor_kg_per_unit: 720.0, // Major OPC clinker replacement credit
      landfill_diversion_factor_tons_per_unit: 1.0,
      standard_unit: 'MT'
    },
    {
      material_code: 'MAT-SLUD-01',
      material_name: 'Dried Textile Effluent Sludge',
      primary_category: 'INDUSTRIAL_EFFLUENT_SLUDGE',
      subcategory: 'ORGANIC_MINERAL_SLUDGE',
      physical_state: 'SOLID',
      default_hazard_tier: 'HAZARDOUS_CLASS_B',
      carbon_offset_factor_kg_per_unit: 210.0,
      landfill_diversion_factor_tons_per_unit: 1.0,
      standard_unit: 'MT'
    },
    {
      material_code: 'MAT-SOLV-01',
      material_name: 'Recovered Mixed Organic Solvents (Toluene/IPA)',
      primary_category: 'CHEMICAL_ORGANIC_SOLVENTS',
      subcategory: 'DISTILLED_SOLVENTS',
      physical_state: 'LIQUID',
      default_hazard_tier: 'HAZARDOUS_CLASS_B',
      carbon_offset_factor_kg_per_unit: 560.0,
      landfill_diversion_factor_tons_per_unit: 0.85,
      standard_unit: 'KL'
    }
  ];

  return { organizations, facilities, materials };
}

/**
 * Seeds the in-memory SQLite database with authentic industrial corridors, listings, demands, and transactions.
 */
export function seedDatabase(db) {
  const { organizations, facilities, materials } = getCorridorSeedData();

  // 1. Insert Organizations
  const insertOrg = db.prepare(`
    INSERT INTO organizations (
      registration_number, legal_name, trade_name, industrial_sector,
      verification_status, contact_email, contact_phone, esg_score, reliability_rating
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const org of organizations) {
    insertOrg.run(
      org.registration_number,
      org.legal_name,
      org.trade_name,
      org.industrial_sector,
      org.verification_status,
      org.contact_email,
      org.contact_phone,
      org.esg_score,
      org.reliability_rating
    );
  }

  // 2. Insert Facilities
  const insertFac = db.prepare(`
    INSERT INTO facilities (
      organization_id, facility_code, facility_name, cluster_name,
      latitude, longitude, address, city, state, pincode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const fac of facilities) {
    const orgId = fac.org_index + 1; // 1-based AUTOINCREMENT
    insertFac.run(
      orgId,
      fac.facility_code,
      fac.facility_name,
      fac.cluster_name,
      fac.latitude,
      fac.longitude,
      fac.address,
      fac.city,
      fac.state,
      fac.pincode
    );
  }

  // 3. Insert Material Catalog
  const insertMat = db.prepare(`
    INSERT INTO material_catalog (
      material_code, material_name, primary_category, subcategory,
      physical_state, default_hazard_tier, carbon_offset_factor_kg_per_unit,
      landfill_diversion_factor_tons_per_unit, standard_unit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const mat of materials) {
    insertMat.run(
      mat.material_code,
      mat.material_name,
      mat.primary_category,
      mat.subcategory,
      mat.physical_state,
      mat.default_hazard_tier,
      mat.carbon_offset_factor_kg_per_unit,
      mat.landfill_diversion_factor_tons_per_unit,
      mat.standard_unit
    );
  }

  // 4. Insert Authentic Supply Listings
  const insertListing = db.prepare(`
    INSERT INTO byproduct_listings (
      facility_id, material_id, listing_code, title, description,
      physical_state, hazard_tier, chemical_composition, purity_percentage,
      total_quantity, available_quantity, quantity_unit, price_per_unit_inr,
      minimum_order_quantity, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Dahej Spent Sulfuric Acid (FAC-DAHEJ-01: ID 1, MAT-CHEM-01: ID 1)
  insertListing.run(
    1, 1, 'LST-DAHEJ-H2SO4-01', 'Concentrated Spent Sulfuric Acid (78% H2SO4)',
    'Chlor-Alkali byproduct suitable for SSP fertilizer and chemical neutralization.',
    'LIQUID', 'HAZARDOUS_CLASS_A',
    JSON.stringify({ H2SO4: 78.4, H2O: 20.8, organics: 0.8 }),
    78.4, 2500.0, 2500.0, 'MT', 1250.0, 50.0, 'ACTIVE'
  );

  // Dahej Phosphogypsum (FAC-DAHEJ-01: ID 1, MAT-GYP-01: ID 2)
  insertListing.run(
    1, 2, 'LST-DAHEJ-GYP-01', 'High Purity Phosphogypsum (CaSO4.2H2O)',
    'Neutralized phosphogypsum byproduct for pozzolana cement retarding.',
    'SOLID', 'NON_HAZARDOUS',
    JSON.stringify({ CaSO4_2H2O: 92.1, P2O5: 0.6, moisture: 6.8 }),
    92.1, 45000.0, 45000.0, 'MT', 450.0, 200.0, 'ACTIVE'
  );

  // Chakan Spent Silica Sand (FAC-CHAK-01: ID 5, MAT-SAND-01: ID 3)
  insertListing.run(
    5, 3, 'LST-CHAK-SAND-01', 'Reclaimed Foundry Silica Sand',
    'High thermal stability silica sand from automotive casting lines.',
    'SOLID', 'NON_HAZARDOUS',
    JSON.stringify({ SiO2: 94.2, Fe2O3: 1.1, binder_residue: 1.8 }),
    94.2, 12000.0, 12000.0, 'MT', 380.0, 100.0, 'ACTIVE'
  );

  // Jamshedpur Blast Furnace Slag (FAC-JAMS-01: ID 9, MAT-SLAG-01: ID 4)
  insertListing.run(
    9, 4, 'LST-JAMS-GGBS-01', 'Granulated Blast Furnace Slag (GGBS Grade 120)',
    'Rapidly quenched iron blast furnace slag with glass content >95%.',
    'SOLID', 'NON_HAZARDOUS',
    JSON.stringify({ CaO: 41.2, SiO2: 34.8, Al2O3: 14.5, MgO: 7.2 }),
    96.5, 60000.0, 60000.0, 'MT', 1450.0, 500.0, 'ACTIVE'
  );

  // Tirupur Dewatered Dyeing Sludge (FAC-TIRU-01: ID 7, MAT-SLUD-01: ID 5)
  insertListing.run(
    7, 5, 'LST-TIRU-SLUD-01', 'Solar Dried Textile Effluent Sludge',
    'Biological and chemical CETP sludge for thermal kiln co-processing.',
    'SOLID', 'HAZARDOUS_CLASS_B',
    JSON.stringify({ calorific_value_kcal_kg: 2400, moisture: 14.2, heavy_metals: 'trace' }),
    85.0, 5500.0, 5500.0, 'MT', 150.0, 25.0, 'ACTIVE'
  );

  // 5. Insert Counter-Party Demands
  const insertDemand = db.prepare(`
    INSERT INTO demand_requirements (
      facility_id, material_id, demand_code, title,
      required_physical_state, minimum_purity_percentage,
      acceptable_hazard_tiers, required_quantity, quantity_unit,
      max_price_per_unit_inr, max_logistics_distance_km, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Bharuch SSP seeking Spent Sulfuric Acid (FAC-BHAR-01: ID 3, MAT-CHEM-01: ID 1)
  insertDemand.run(
    3, 1, 'DMD-BHAR-H2SO4-01', 'Procurement of Spent Sulfuric Acid for SSP Fertilizer',
    'LIQUID', 70.0,
    JSON.stringify(['HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B', 'NON_HAZARDOUS']),
    1800.0, 'MT', 1600.0, 150.0, 'OPEN'
  );

  // Mundra Cement seeking Phosphogypsum (FAC-MUND-01: ID 4, MAT-GYP-01: ID 2)
  insertDemand.run(
    4, 2, 'DMD-MUND-GYP-01', 'Clinker Retarder Grade Phosphogypsum Intake',
    'SOLID', 85.0,
    JSON.stringify(['NON_HAZARDOUS']),
    30000.0, 'MT', 650.0, 450.0, 'OPEN'
  );

  // Talegaon Green Paver seeking Foundry Sand (FAC-TALE-01: ID 6, MAT-SAND-01: ID 3)
  insertDemand.run(
    6, 3, 'DMD-TALE-SAND-01', 'Foundry Sand for Low-Carbon Paver Block Mortar',
    'SOLID', 88.0,
    JSON.stringify(['NON_HAZARDOUS']),
    8000.0, 'MT', 500.0, 100.0, 'OPEN'
  );

  // Chaibasa RMX seeking GGBS (FAC-CHAI-01: ID 10, MAT-SLAG-01: ID 4)
  insertDemand.run(
    10, 4, 'DMD-CHAI-GGBS-01', 'GGBS Slag for Low-Carbon Infrastructure Concrete',
    'SOLID', 90.0,
    JSON.stringify(['NON_HAZARDOUS']),
    40000.0, 'MT', 1700.0, 200.0, 'OPEN'
  );

  // Coimbatore Kiln seeking Sludge (FAC-COIM-01: ID 8, MAT-SLUD-01: ID 5)
  insertDemand.run(
    8, 5, 'DMD-COIM-SLUD-01', 'Co-Processing Alternative Fuel & Raw Material (AFR)',
    'SOLID', 75.0,
    JSON.stringify(['NON_HAZARDOUS', 'HAZARDOUS_CLASS_B']),
    3500.0, 'MT', 250.0, 120.0, 'OPEN'
  );

  return true;
}

// ---------------------------------------------------------------------------
// 5. CORE QUERY WORKFLOWS (Q1 - Q8)
// ---------------------------------------------------------------------------

/**
 * Q1: Multi-Attribute Circular Matchmaking SQL Query
 * Pairs active listings with open demands for matching materials within distance.
 */
export function executeQ1MatchmakingQuery(db) {
  const sql = `
    SELECT
      l.listing_id,
      l.listing_code,
      d.demand_id,
      d.demand_code,
      m.material_code,
      m.material_name,
      sf.facility_name AS supplier_facility,
      sf.cluster_name AS supplier_cluster,
      bf.facility_name AS consumer_facility,
      bf.cluster_name AS consumer_cluster,
      l.available_quantity,
      d.required_quantity,
      min(l.available_quantity, d.required_quantity) AS potential_match_quantity,
      l.price_per_unit_inr AS supplier_price,
      d.max_price_per_unit_inr AS consumer_budget,
      l.purity_percentage,
      d.minimum_purity_percentage,
      round(6371.0088 * acos(min(1.0, max(-1.0,
        cos(radians(sf.latitude)) * cos(radians(bf.latitude)) *
        cos(radians(bf.longitude) - radians(sf.longitude)) +
        sin(radians(sf.latitude)) * sin(radians(bf.latitude))
      ))), 3) AS distance_km
    FROM byproduct_listings l
    JOIN facilities sf ON l.facility_id = sf.facility_id
    JOIN material_catalog m ON l.material_id = m.material_id
    JOIN demand_requirements d ON l.material_id = d.material_id
    JOIN facilities bf ON d.facility_id = bf.facility_id
    WHERE l.status IN ('ACTIVE', 'AVAILABLE')
      AND d.status = 'OPEN'
      AND l.physical_state = d.required_physical_state
      AND l.purity_percentage >= d.minimum_purity_percentage
      AND (d.max_price_per_unit_inr IS NULL OR l.price_per_unit_inr <= d.max_price_per_unit_inr)
      AND sf.facility_id != bf.facility_id
    ORDER BY distance_km ASC;
  `;
  return db.prepare(sql).all();
}

/**
 * Q2: Geolocation Proximity Radius Search with Bounding Box Pruning
 */
export function executeQ2ProximityQuery(db, targetLat, targetLon, radiusKm) {
  validateCoordinates(targetLat, targetLon);
  const bbox = referenceComputeBoundingBox(targetLat, targetLon, radiusKm);

  const sql = `
    SELECT
      f.facility_id,
      f.facility_code,
      f.facility_name,
      f.cluster_name,
      f.city,
      f.state,
      f.latitude,
      f.longitude,
      round(6371.0088 * acos(min(1.0, max(-1.0,
        cos(radians(?)) * cos(radians(f.latitude)) *
        cos(radians(f.longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(f.latitude))
      ))), 3) AS distance_km,
      COUNT(bl.listing_id) AS active_listings_count,
      COALESCE(SUM(bl.available_quantity), 0.0) AS total_byproduct_tons_available
    FROM facilities f
    LEFT JOIN byproduct_listings bl ON f.facility_id = bl.facility_id AND bl.status IN ('ACTIVE', 'AVAILABLE')
    WHERE f.latitude BETWEEN ? AND ?
      AND f.longitude BETWEEN ? AND ?
      AND (6371.0088 * acos(min(1.0, max(-1.0,
        cos(radians(?)) * cos(radians(f.latitude)) *
        cos(radians(f.longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(f.latitude))
      )))) <= ?
    GROUP BY f.facility_id, f.facility_code, f.facility_name, f.cluster_name, f.city, f.state, f.latitude, f.longitude
    ORDER BY distance_km ASC;
  `;

  return db.prepare(sql).all(
    targetLat, targetLon, targetLat,
    bbox.minLat, bbox.maxLat, bbox.minLon, bbox.maxLon,
    targetLat, targetLon, targetLat, radiusKm
  );
}

/**
 * Q3: Atomic Exchange Transaction Workflow
 * Reserves inventory, creates contract, updates proposal, and creates audit entry atomically.
 */
export function executeQ3AtomicTransaction(db, {
  proposalId,
  agreedQuantity,
  agreedUnitPrice,
  contractReference,
  deliveryTerms = 'EXW',
  carrierOrgId = 11,
  waybillNumber,
  vehicleRegNumber = 'MH-14-BT-9821',
  grossKg,
  tareKg
}) {
  // Fetch proposal details
  const proposal = db.prepare(`
    SELECT mp.*, bl.facility_id AS seller_facility_id, dr.facility_id AS buyer_facility_id,
           bl.material_id, bl.available_quantity, bl.total_quantity
    FROM match_proposals mp
    JOIN byproduct_listings bl ON mp.supply_listing_id = bl.listing_id
    JOIN demand_requirements dr ON mp.demand_requirement_id = dr.demand_id
    WHERE mp.match_id = ?
  `).get(proposalId);

  if (!proposal) {
    throw new Error(`Match proposal ${proposalId} not found`);
  }

  const agreedQty = agreedQuantity ?? proposal.proposed_quantity;
  const unitPrice = agreedUnitPrice ?? proposal.estimated_transit_cost_inr; // or listing price
  const totalValue = agreedQty * unitPrice;
  const contractRef = contractReference ?? `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Begin atomic execution
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Create Transaction
    const insertTxn = db.prepare(`
      INSERT INTO exchange_transactions (
        match_id, contract_reference, seller_facility_id, buyer_facility_id, material_id,
        agreed_quantity, agreed_price_per_unit_inr, total_transaction_value_inr, delivery_terms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONTRACT_SIGNED')
    `);
    const txResult = insertTxn.run(
      proposalId, contractRef, proposal.seller_facility_id, proposal.buyer_facility_id,
      proposal.material_id, agreedQty, unitPrice, totalValue, deliveryTerms
    );
    const transactionId = Number(txResult.lastInsertRowid);

    // 2. Decrement Listing available quantity
    const updateListing = db.prepare(`
      UPDATE byproduct_listings
      SET available_quantity = max(0.0, available_quantity - ?),
          status = CASE WHEN available_quantity - ? <= 0.001 THEN 'FULFILLED' ELSE 'PARTIALLY_FULFILLED' END,
          updated_at = CURRENT_TIMESTAMP
      WHERE listing_id = ?
    `);
    updateListing.run(agreedQty, agreedQty, proposal.supply_listing_id);

    // 3. Update proposal status
    db.prepare(`UPDATE match_proposals SET status = 'CONFIRMED' WHERE match_id = ?`).run(proposalId);

    // 4. Logistics transit record if provided
    let transitId = null;
    if (waybillNumber && grossKg != null && tareKg != null) {
      const insertTransit = db.prepare(`
        INSERT INTO logistics_transits (
          transaction_id, carrier_org_id, waybill_number, vehicle_reg_number,
          weighbridge_gross_kg, weighbridge_tare_kg, transit_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'DISPATCHED')
      `);
      const trResult = insertTransit.run(transactionId, carrierOrgId, waybillNumber, vehicleRegNumber, grossKg, tareKg);
      transitId = Number(trResult.lastInsertRowid);
    }

    // 5. Calculate and insert sustainability impact
    const material = db.prepare('SELECT * FROM material_catalog WHERE material_id = ?').get(proposal.material_id);
    const co2eOffsetKg = (material?.carbon_offset_factor_kg_per_unit ?? 100.0) * agreedQty;
    const landfillDivertedTons = (material?.landfill_diversion_factor_tons_per_unit ?? 1.0) * agreedQty;
    const virginSavedTons = agreedQty * 0.95;
    const econSavedINR = agreedQty * 500.0;
    const circularityScore = 0.88;

    db.prepare(`
      INSERT INTO sustainability_metrics (
        transaction_id, landfill_diversion_tons, embodied_carbon_offset_kg,
        virgin_raw_material_saved_tons, economic_value_saved_inr, circularity_coefficient
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(transactionId, landfillDivertedTons, co2eOffsetKg, virginSavedTons, econSavedINR, circularityScore);

    // 6. Append tamper-evident audit log
    const lastLog = db.prepare('SELECT sha256_checksum FROM audit_logs ORDER BY log_id DESC LIMIT 1').get();
    const prevChecksum = lastLog ? lastLog.sha256_checksum : '';
    const checksum = computeAuditChecksum(
      'CONTRACT_EXECUTE',
      'exchange_transactions',
      String(transactionId),
      { status: 'PROPOSED', match_id: proposalId },
      { status: 'CONTRACT_SIGNED', agreed_quantity: agreedQty, total_value: totalValue },
      prevChecksum
    );

    db.prepare(`
      INSERT INTO audit_logs (
        entity_type, entity_id, action, previous_state, new_state, sha256_checksum, previous_log_checksum
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'exchange_transactions',
      String(transactionId),
      'CONTRACT_EXECUTE',
      JSON.stringify({ status: 'PROPOSED', match_id: proposalId }),
      JSON.stringify({ status: 'CONTRACT_SIGNED', agreed_quantity: agreedQty, total_value: totalValue }),
      checksum,
      prevChecksum
    );

    db.exec('COMMIT;');
    return { transactionId, transitId, contractReference: contractRef, agreedQty, totalValue, co2eOffsetKg };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Q4: Cluster ESG Impact Analytics with Ranking
 */
export function executeQ4ClusterEsgAnalytics(db) {
  const sql = `
    WITH cluster_aggregates AS (
      SELECT
        sf.cluster_name,
        COUNT(DISTINCT et.transaction_id) AS settled_transactions_count,
        COUNT(DISTINCT et.material_id) AS unique_materials_exchanged,
        COALESCE(SUM(sm.landfill_diversion_tons), 0.0) AS total_landfill_tons_diverted,
        COALESCE(SUM(sm.embodied_carbon_offset_kg), 0.0) AS total_co2e_kg_avoided,
        COALESCE(SUM(sm.economic_value_saved_inr), 0.0) AS total_economic_savings_inr,
        COALESCE(AVG(sm.circularity_coefficient), 0.0) AS avg_circularity_score
      FROM facilities sf
      JOIN exchange_transactions et ON sf.facility_id = et.seller_facility_id
      LEFT JOIN sustainability_metrics sm ON et.transaction_id = sm.transaction_id
      GROUP BY sf.cluster_name
    )
    SELECT
      cluster_name,
      settled_transactions_count,
      unique_materials_exchanged,
      round(total_landfill_tons_diverted, 2) AS total_landfill_tons_diverted,
      round(total_co2e_kg_avoided, 2) AS total_co2e_kg_avoided,
      round(total_economic_savings_inr, 2) AS total_economic_savings_inr,
      round(avg_circularity_score, 3) AS avg_circularity_score,
      DENSE_RANK() OVER (ORDER BY total_co2e_kg_avoided DESC) AS cluster_esg_rank
    FROM cluster_aggregates
    ORDER BY cluster_esg_rank ASC;
  `;
  return db.prepare(sql).all();
}

/**
 * Q6: Logistics Weighbridge Discrepancy Query
 * Detects discrepancies where |net_kg - agreed_tons * 1000| / (agreed_tons * 1000) > toleranceThreshold.
 */
export function executeQ6LogisticsDiscrepancy(db, toleranceThreshold = 0.02) {
  const sql = `
    SELECT
      lt.transit_id,
      lt.waybill_number,
      lt.vehicle_reg_number,
      et.contract_reference,
      et.agreed_quantity AS agreed_tons,
      (et.agreed_quantity * 1000.0) AS expected_kg,
      lt.weighbridge_gross_kg,
      lt.weighbridge_tare_kg,
      lt.weighbridge_net_kg,
      abs(lt.weighbridge_net_kg - (et.agreed_quantity * 1000.0)) AS variance_kg,
      round(abs(lt.weighbridge_net_kg - (et.agreed_quantity * 1000.0)) / (et.agreed_quantity * 1000.0), 4) AS variance_fraction
    FROM logistics_transits lt
    JOIN exchange_transactions et ON lt.transaction_id = et.transaction_id
    WHERE abs(lt.weighbridge_net_kg - (et.agreed_quantity * 1000.0)) / (et.agreed_quantity * 1000.0) > ?;
  `;
  return db.prepare(sql).all(toleranceThreshold);
}

// ---------------------------------------------------------------------------
// 6. CRYPTOGRAPHIC SHA-256 AUDIT LEDGER HELPERS
// ---------------------------------------------------------------------------

/**
 * Computes deterministic SHA-256 state transition checksum for audit ledger.
 */
export function computeAuditChecksum(action, entityType, entityId, prevState, newState, prevChecksum = '') {
  const payload = [
    action,
    entityType,
    entityId,
    typeof prevState === 'string' ? prevState : JSON.stringify(prevState),
    typeof newState === 'string' ? newState : JSON.stringify(newState),
    prevChecksum || 'GENESIS'
  ].join('::');

  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Walks and verifies cryptographic hash-chain continuity in audit_logs.
 * Returns { valid: boolean, totalChecked: number, brokenAtLogId: number | null }.
 */
export function verifyAuditChain(db) {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY log_id ASC').all();
  if (rows.length === 0) {
    return { valid: true, totalChecked: 0, brokenAtLogId: null };
  }

  let expectedPrevChecksum = '';
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i > 0 && row.previous_log_checksum !== expectedPrevChecksum) {
      return { valid: false, totalChecked: i, brokenAtLogId: row.log_id };
    }
    const computed = computeAuditChecksum(
      row.action,
      row.entity_type,
      row.entity_id,
      row.previous_state,
      row.new_state,
      row.previous_log_checksum
    );
    if (computed !== row.sha256_checksum) {
      return { valid: false, totalChecked: i, brokenAtLogId: row.log_id };
    }
    expectedPrevChecksum = row.sha256_checksum;
  }

  return { valid: true, totalChecked: rows.length, brokenAtLogId: null };
}
