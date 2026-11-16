/**
 * Phenix / Project ReguFlow - Database Schema DDL
 * Dual-Compatible: ANSI SQL / SQLite 3.38+ / PostgreSQL 14+
 */

export const SCHEMA_SQL = `
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
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Material Catalog
CREATE TABLE IF NOT EXISTS material_catalog (
    material_id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_code VARCHAR(64) NOT NULL UNIQUE,
    material_name VARCHAR(255) NOT NULL,
    primary_category VARCHAR(100) NOT NULL,
    physical_state VARCHAR(20) NOT NULL CHECK (physical_state IN ('SOLID', 'LIQUID', 'GAS', 'SLURRY')),
    default_hazard_tier VARCHAR(30) NOT NULL CHECK (default_hazard_tier IN ('NON_HAZARDOUS', 'HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B', 'TOXIC_CORROSIVE')),
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
    physical_state VARCHAR(20) NOT NULL CHECK (physical_state IN ('SOLID', 'LIQUID', 'GAS', 'SLURRY')),
    hazard_tier VARCHAR(30) NOT NULL CHECK (hazard_tier IN ('NON_HAZARDOUS', 'HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B', 'TOXIC_CORROSIVE')),
    chemical_composition TEXT NOT NULL,
    purity_percentage REAL NOT NULL CHECK (purity_percentage BETWEEN 0.0 AND 100.0),
    total_quantity REAL NOT NULL CHECK (total_quantity > 0),
    available_quantity REAL NOT NULL CHECK (available_quantity >= 0),
    quantity_unit VARCHAR(20) NOT NULL DEFAULT 'MT',
    price_per_unit_inr REAL NOT NULL DEFAULT 0.0 CHECK (price_per_unit_inr >= 0),
    minimum_order_quantity REAL NOT NULL DEFAULT 1.0 CHECK (minimum_order_quantity > 0),
    available_from DATE NOT NULL,
    available_until DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'RESERVED', 'DEPLETED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material_catalog(material_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. Demand Requirements
CREATE TABLE IF NOT EXISTS demand_requirements (
    demand_id INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    demand_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    required_physical_state VARCHAR(20) NOT NULL CHECK (required_physical_state IN ('SOLID', 'LIQUID', 'GAS', 'SLURRY')),
    minimum_purity_percentage REAL NOT NULL CHECK (minimum_purity_percentage BETWEEN 0.0 AND 100.0),
    acceptable_hazard_tiers TEXT NOT NULL,
    required_quantity REAL NOT NULL CHECK (required_quantity > 0),
    quantity_unit VARCHAR(20) NOT NULL DEFAULT 'MT',
    max_price_per_unit_inr REAL CHECK (max_price_per_unit_inr >= 0),
    frequency VARCHAR(30) NOT NULL CHECK (frequency IN ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'CONTINUOUS')),
    max_logistics_distance_km REAL CHECK (max_logistics_distance_km > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE RESTRICT ON UPDATE CASCADE,
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
        CHECK (status IN ('PROPOSED', 'ACCEPTED_SUPPLIER', 'ACCEPTED_BUYER', 'MUTUALLY_ACCEPTED', 'REJECTED', 'EXPIRED')),
    rejection_reason TEXT,
    proposed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (supply_listing_id) REFERENCES byproduct_listings(listing_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (demand_requirement_id) REFERENCES demand_requirements(demand_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (supply_listing_id, demand_requirement_id)
);

-- 7. Exchange Transactions
CREATE TABLE IF NOT EXISTS exchange_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL UNIQUE,
    contract_reference VARCHAR(64) NOT NULL UNIQUE,
    agreed_quantity REAL NOT NULL CHECK (agreed_quantity > 0),
    agreed_price_per_unit_inr REAL NOT NULL CHECK (agreed_price_per_unit_inr >= 0),
    total_transaction_value_inr REAL NOT NULL CHECK (total_transaction_value_inr >= 0),
    delivery_terms VARCHAR(20) NOT NULL DEFAULT 'EXW' CHECK (delivery_terms IN ('EXW', 'FOB', 'DAP', 'DDP')),
    logistics_provider VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'CONTRACT_SIGNED'
        CHECK (status IN ('CONTRACT_SIGNED', 'IN_TRANSIT', 'DELIVERED', 'INSPECTED_ACCEPTED', 'SETTLED', 'DISPUTED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES match_proposals(match_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. Sustainability & ESG Impact Metrics
CREATE TABLE IF NOT EXISTS sustainability_metrics (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL UNIQUE,
    embodied_carbon_offset_kg REAL NOT NULL DEFAULT 0.0 CHECK (embodied_carbon_offset_kg >= 0),
    landfill_diversion_tons REAL NOT NULL DEFAULT 0.0 CHECK (landfill_diversion_tons >= 0),
    circularity_coefficient REAL NOT NULL DEFAULT 0.0 CHECK (circularity_coefficient BETWEEN 0.0 AND 1.0),
    water_saved_kl REAL NOT NULL DEFAULT 0.0 CHECK (water_saved_kl >= 0),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES exchange_transactions(transaction_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_facilities_cluster ON facilities(cluster_name);
CREATE INDEX IF NOT EXISTS idx_listings_material_status ON byproduct_listings(material_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_facility ON byproduct_listings(facility_id);
CREATE INDEX IF NOT EXISTS idx_demand_material_status ON demand_requirements(material_id, status);
CREATE INDEX IF NOT EXISTS idx_demand_facility ON demand_requirements(facility_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON match_proposals(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_pair ON match_proposals(supply_listing_id, demand_requirement_id);
CREATE INDEX IF NOT EXISTS idx_tx_match ON exchange_transactions(match_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON exchange_transactions(status);
`;
