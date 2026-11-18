-- ============================================================================
-- Project ReguFlow / Phenix: Production Relational DDL Schema (BCNF Normalized)
-- Track: Viksit Bharat 2026 Circular Economy Showcase
-- Domain: Industrial Byproduct Matching, Resource Exchange, and Impact Analytics
-- Target Database: PostgreSQL 14+ (ANSI SQL Standard Compliant)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Required Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- Clean Teardown (Reverse Dependency Order)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_logistics_transits_updated_at ON logistics_transits;
DROP TRIGGER IF EXISTS trg_exchange_transactions_updated_at ON exchange_transactions;
DROP TRIGGER IF EXISTS trg_match_proposals_updated_at ON match_proposals;
DROP TRIGGER IF EXISTS trg_demand_requirements_updated_at ON demand_requirements;
DROP TRIGGER IF EXISTS trg_byproduct_listings_updated_at ON byproduct_listings;
DROP TRIGGER IF EXISTS trg_facilities_updated_at ON facilities;
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
DROP FUNCTION IF EXISTS update_timestamp_column();

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS esg_impact_metrics CASCADE;
DROP TABLE IF EXISTS logistics_transits CASCADE;
DROP TABLE IF EXISTS exchange_transactions CASCADE;
DROP TABLE IF EXISTS match_proposals CASCADE;
DROP TABLE IF EXISTS demand_requirements CASCADE;
DROP TABLE IF EXISTS byproduct_listings CASCADE;
DROP TABLE IF EXISTS material_catalog CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- 1. Organizations Master Table
-- Registered corporate entities (manufacturers, recyclers, haulers, regulators)
-- ============================================================================
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_code VARCHAR(32) NOT NULL UNIQUE,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    tax_identifier VARCHAR(64) NOT NULL UNIQUE, -- GSTIN / Corporate Tax ID
    industry_sector VARCHAR(50) NOT NULL CHECK (
        industry_sector IN (
            'IRON_AND_STEEL',
            'CEMENT_AND_CONCRETE',
            'CHEMICALS_AND_FERTILIZERS',
            'THERMAL_POWER',
            'MINING_AND_MINERALS',
            'PULP_AND_PAPER',
            'ALUMINUM_AND_NONFERROUS',
            'RENEWABLE_ENERGY',
            'WASTE_MANAGEMENT',
            'OTHER'
        )
    ),
    organization_type VARCHAR(32) NOT NULL CHECK (
        organization_type IN (
            'PRODUCER',
            'CONSUMER',
            'PROSUMER',
            'RECYCLER',
            'LOGISTICS_CARRIER',
            'REGULATOR'
        )
    ),
    esg_rating_score NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (
        esg_rating_score BETWEEN 0.00 AND 100.00
    ),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. Facilities Geospatial Master Table
-- Physical manufacturing plants, smelting units, and resource depots
-- ============================================================================
CREATE TABLE facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    facility_code VARCHAR(32) NOT NULL UNIQUE,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL CHECK (
        facility_type IN (
            'INTEGRATED_STEEL_PLANT',
            'CEMENT_GRINDING_UNIT',
            'THERMAL_POWER_STATION',
            'FERTILIZER_COMPLEX',
            'CHEMICAL_SYNTHESIS_PLANT',
            'RECYCLING_REFINERY',
            'STORAGE_TERMINAL',
            'OTHER_MANUFACTURING'
        )
    ),
    industrial_cluster VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90.0000000 AND 90.0000000),
    longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180.0000000 AND 180.0000000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. Material Catalog Taxonomy Table
-- Ontology of industrial byproducts, hazard classifications, and CO2 factors
-- ============================================================================
CREATE TABLE material_catalog (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code VARCHAR(32) NOT NULL UNIQUE,
    common_name VARCHAR(150) NOT NULL,
    cas_registry_number VARCHAR(32),
    material_category VARCHAR(50) NOT NULL CHECK (
        material_category IN (
            'BLAST_FURNACE_SLAG',
            'FLY_ASH',
            'PHOSPHOGYPSUM',
            'RED_MUD_BAUXITE',
            'CHEMICAL_SLUDGE',
            'FOUNDRY_SAND',
            'SILICA_FUME',
            'RECYCLED_AGGREGATE',
            'BIOMASS_RESIDUE',
            'SPENT_CATALYST',
            'OTHER'
        )
    ),
    physical_state VARCHAR(20) NOT NULL CHECK (
        physical_state IN (
            'SOLID_POWDER',
            'SOLID_GRANULAR',
            'SOLID_BULK',
            'LIQUID',
            'SLUDGE',
            'GAS'
        )
    ),
    hazard_classification VARCHAR(50) NOT NULL DEFAULT 'NON_HAZARDOUS' CHECK (
        hazard_classification IN (
            'NON_HAZARDOUS',
            'HAZARDOUS_CLASS_1_TOXIC',
            'HAZARDOUS_CLASS_2_FLAMMABLE',
            'HAZARDOUS_CLASS_3_CORROSIVE',
            'HAZARDOUS_CLASS_4_REACTIVE'
        )
    ),
    standard_unit VARCHAR(20) NOT NULL DEFAULT 'METRIC_TONNE' CHECK (
        standard_unit IN ('METRIC_TONNE', 'KILOGRAM', 'LITRE', 'CUBIC_METER')
    ),
    co2e_factor_kg_per_unit NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (
        co2e_factor_kg_per_unit >= 0
    ),
    circular_potential_score NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (
        circular_potential_score BETWEEN 0.00 AND 100.00
    ),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. Byproduct Listings (Supply) Table
-- Secondary raw materials and byproducts offered by generating plants
-- ============================================================================
CREATE TABLE byproduct_listings (
    listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES material_catalog(material_id) ON DELETE RESTRICT,
    listing_reference VARCHAR(32) NOT NULL UNIQUE,
    quantity_available NUMERIC(14,3) NOT NULL CHECK (quantity_available > 0),
    minimum_order_quantity NUMERIC(14,3) NOT NULL CHECK (
        minimum_order_quantity > 0 AND minimum_order_quantity <= quantity_available
    ),
    batch_purity_percent NUMERIC(5,2) NOT NULL CHECK (
        batch_purity_percent BETWEEN 0.00 AND 100.00
    ),
    moisture_content_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (
        moisture_content_percent BETWEEN 0.00 AND 100.00
    ),
    price_per_unit_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (
        price_per_unit_inr >= 0
    ),
    storage_condition VARCHAR(50) NOT NULL DEFAULT 'COVERED_SHED' CHECK (
        storage_condition IN ('SILO', 'OPEN_YARD', 'COVERED_SHED', 'BUNDED_TANK', 'CONTAINER')
    ),
    listing_status VARCHAR(24) NOT NULL DEFAULT 'AVAILABLE' CHECK (
        listing_status IN (
            'AVAILABLE',
            'RESERVED',
            'PARTIALLY_FULFILLED',
            'FULFILLED',
            'EXPIRED',
            'WITHDRAWN'
        )
    ),
    available_from DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_listings_expiry CHECK (expires_at >= created_at)
);

-- ============================================================================
-- 5. Demand Requirements (Procurement) Table
-- Feedstock procurement requirements from consuming industrial facilities
-- ============================================================================
CREATE TABLE demand_requirements (
    requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES material_catalog(material_id) ON DELETE RESTRICT,
    requirement_reference VARCHAR(32) NOT NULL UNIQUE,
    quantity_required NUMERIC(14,3) NOT NULL CHECK (quantity_required > 0),
    min_acceptable_purity NUMERIC(5,2) NOT NULL CHECK (
        min_acceptable_purity BETWEEN 0.00 AND 100.00
    ),
    max_acceptable_moisture NUMERIC(5,2) CHECK (
        max_acceptable_moisture IS NULL OR (max_acceptable_moisture BETWEEN 0.00 AND 100.00)
    ),
    max_unit_budget_inr NUMERIC(12,2) NOT NULL CHECK (max_unit_budget_inr >= 0),
    max_distance_km NUMERIC(8,2) NOT NULL CHECK (max_distance_km > 0),
    fulfillment_status VARCHAR(24) NOT NULL DEFAULT 'OPEN' CHECK (
        fulfillment_status IN (
            'OPEN',
            'PARTIALLY_MATCHED',
            'MATCHED',
            'FULFILLED',
            'CANCELLED',
            'EXPIRED'
        )
    ),
    required_by_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. Match Proposals Table
-- Algorithmic multi-criteria pairings between supply listings and demands
-- ============================================================================
CREATE TABLE match_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES byproduct_listings(listing_id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES demand_requirements(requirement_id) ON DELETE CASCADE,
    proposed_quantity NUMERIC(14,3) NOT NULL CHECK (proposed_quantity > 0),
    unit_price_inr NUMERIC(12,2) NOT NULL CHECK (unit_price_inr >= 0),
    calculated_distance_km NUMERIC(8,2) NOT NULL CHECK (calculated_distance_km >= 0),
    purity_match_score NUMERIC(5,2) NOT NULL CHECK (
        purity_match_score BETWEEN 0.00 AND 100.00
    ),
    distance_match_score NUMERIC(5,2) NOT NULL CHECK (
        distance_match_score BETWEEN 0.00 AND 100.00
    ),
    price_match_score NUMERIC(5,2) NOT NULL CHECK (
        price_match_score BETWEEN 0.00 AND 100.00
    ),
    compatibility_score NUMERIC(5,2) NOT NULL CHECK (
        compatibility_score BETWEEN 0.00 AND 100.00
    ),
    proposal_status VARCHAR(24) NOT NULL DEFAULT 'OFFERED' CHECK (
        proposal_status IN (
            'OFFERED',
            'UNDER_REVIEW',
            'ACCEPTED',
            'CONFIRMED',
            'REJECTED',
            'EXPIRED'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_match_proposals_listing_req UNIQUE (listing_id, requirement_id)
);

-- ============================================================================
-- 7. Exchange Transactions Table
-- Legally binding commercial contracts and settlement escrow
-- ============================================================================
CREATE TABLE exchange_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL UNIQUE REFERENCES match_proposals(proposal_id) ON DELETE RESTRICT,
    seller_facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    buyer_facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    material_id UUID NOT NULL REFERENCES material_catalog(material_id) ON DELETE RESTRICT,
    transaction_reference VARCHAR(32) NOT NULL UNIQUE,
    agreed_quantity NUMERIC(14,3) NOT NULL CHECK (agreed_quantity > 0),
    agreed_unit_price_inr NUMERIC(12,2) NOT NULL CHECK (agreed_unit_price_inr >= 0),
    agreed_total_inr NUMERIC(14,2) NOT NULL CHECK (agreed_total_inr >= 0),
    transaction_status VARCHAR(24) NOT NULL DEFAULT 'INITIATED' CHECK (
        transaction_status IN (
            'INITIATED',
            'CONFIRMED',
            'ESCROW_FUNDED',
            'IN_TRANSIT',
            'DELIVERED',
            'SETTLED',
            'DISPUTED',
            'CANCELLED'
        )
    ),
    payment_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (
        payment_status IN (
            'PENDING',
            'HELD_IN_ESCROW',
            'RELEASED_TO_SELLER',
            'REFUNDED_TO_BUYER',
            'DISPUTED_ESCROW'
        )
    ),
    contract_signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_distinct_trading_facilities CHECK (seller_facility_id <> buyer_facility_id),
    CONSTRAINT chk_txn_total_math CHECK (agreed_total_inr = ROUND(agreed_quantity * agreed_unit_price_inr, 2))
);

-- ============================================================================
-- 8. Logistics Transits Table
-- Physical transit haulage, e-way bills, and weighbridge mass reconciliation
-- ============================================================================
CREATE TABLE logistics_transits (
    transit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES exchange_transactions(transaction_id) ON DELETE RESTRICT,
    carrier_org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
    transit_reference VARCHAR(32) NOT NULL UNIQUE,
    e_way_bill_number VARCHAR(32) NOT NULL UNIQUE, -- Statutory GST E-Way Bill
    vehicle_registration_number VARCHAR(32) NOT NULL,
    dispatch_date TIMESTAMPTZ NOT NULL,
    delivery_date TIMESTAMPTZ,
    transit_status VARCHAR(24) NOT NULL DEFAULT 'SCHEDULED' CHECK (
        transit_status IN (
            'SCHEDULED',
            'DISPATCHED',
            'IN_TRANSIT',
            'AT_WEIGHBRIDGE',
            'DELIVERED',
            'DISCREPANCY_FLAGGED',
            'CANCELLED'
        )
    ),
    weighbridge_gross_kg NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (weighbridge_gross_kg >= 0),
    weighbridge_tare_kg NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (weighbridge_tare_kg >= 0),
    weighbridge_net_kg NUMERIC(14,2) GENERATED ALWAYS AS (weighbridge_gross_kg - weighbridge_tare_kg) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_weighbridge_tare_gross CHECK (weighbridge_gross_kg >= weighbridge_tare_kg),
    CONSTRAINT chk_transit_dates CHECK (delivery_date IS NULL OR delivery_date >= dispatch_date)
);

-- ============================================================================
-- 9. ESG Impact Metrics Table
-- Certified sustainability accounting: GHG avoidance and circularity indices
-- ============================================================================
CREATE TABLE esg_impact_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES exchange_transactions(transaction_id) ON DELETE CASCADE,
    landfill_tonnes_diverted NUMERIC(12,4) NOT NULL DEFAULT 0.0000 CHECK (landfill_tonnes_diverted >= 0),
    co2e_tonnes_avoided NUMERIC(12,4) NOT NULL DEFAULT 0.0000 CHECK (co2e_tonnes_avoided >= 0),
    virgin_raw_material_saved_tonnes NUMERIC(12,4) NOT NULL DEFAULT 0.0000 CHECK (virgin_raw_material_saved_tonnes >= 0),
    water_cubic_meters_saved NUMERIC(12,4) NOT NULL DEFAULT 0.0000 CHECK (water_cubic_meters_saved >= 0),
    economic_value_saved_inr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (economic_value_saved_inr >= 0),
    circularity_index_score NUMERIC(5,2) NOT NULL CHECK (
        circularity_index_score BETWEEN 0.00 AND 100.00
    ),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. Immutable Cryptographic Audit Logs Table
-- Append-only tamper-evident blockchain-style hash chain ledger
-- ============================================================================
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    performed_by_org_id UUID REFERENCES organizations(org_id) ON DELETE SET NULL,
    previous_state JSONB,
    new_state JSONB NOT NULL,
    sha256_checksum CHAR(64) NOT NULL UNIQUE CHECK (length(sha256_checksum) = 64),
    previous_log_checksum CHAR(64) CHECK (previous_log_checksum IS NULL OR length(previous_log_checksum) = 64),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Trigger Function for Automatic updated_at Timestamping
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers to all mutable tables
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_byproduct_listings_updated_at
    BEFORE UPDATE ON byproduct_listings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_demand_requirements_updated_at
    BEFORE UPDATE ON demand_requirements
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_match_proposals_updated_at
    BEFORE UPDATE ON match_proposals
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_exchange_transactions_updated_at
    BEFORE UPDATE ON exchange_transactions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_logistics_transits_updated_at
    BEFORE UPDATE ON logistics_transits
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Foreign Key B-Tree Indexes
CREATE INDEX idx_facilities_org_id ON facilities(org_id);
CREATE INDEX idx_listings_facility_id ON byproduct_listings(facility_id);
CREATE INDEX idx_listings_material_id ON byproduct_listings(material_id);
CREATE INDEX idx_demands_facility_id ON demand_requirements(facility_id);
CREATE INDEX idx_demands_material_id ON demand_requirements(material_id);
CREATE INDEX idx_proposals_listing_id ON match_proposals(listing_id);
CREATE INDEX idx_proposals_requirement_id ON match_proposals(requirement_id);
CREATE INDEX idx_transactions_proposal_id ON exchange_transactions(proposal_id);
CREATE INDEX idx_transactions_seller_facility ON exchange_transactions(seller_facility_id);
CREATE INDEX idx_transactions_buyer_facility ON exchange_transactions(buyer_facility_id);
CREATE INDEX idx_transactions_material_id ON exchange_transactions(material_id);
CREATE INDEX idx_transits_transaction_id ON logistics_transits(transaction_id);
CREATE INDEX idx_transits_carrier_org_id ON logistics_transits(carrier_org_id);
CREATE INDEX idx_esg_transaction_id ON esg_impact_metrics(transaction_id);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by_org_id);

-- Composite Matchmaking Indexes
CREATE INDEX idx_listings_match ON byproduct_listings(
    material_id,
    listing_status,
    batch_purity_percent,
    quantity_available
);

CREATE INDEX idx_demands_match ON demand_requirements(
    material_id,
    fulfillment_status,
    min_acceptable_purity
);

CREATE INDEX idx_proposals_status_score ON match_proposals(
    proposal_status,
    compatibility_score DESC
);

-- Geospatial Bounding-Box Composite Index
CREATE INDEX idx_facilities_coords ON facilities(
    latitude,
    longitude,
    industrial_cluster
);

-- Operational Partial Indexes for High-Throughput Matching
CREATE INDEX idx_listings_open_status ON byproduct_listings(material_id, expires_at)
    WHERE listing_status = 'AVAILABLE';

CREATE INDEX idx_demands_open_status ON demand_requirements(material_id, required_by_date)
    WHERE fulfillment_status = 'OPEN';

CREATE INDEX idx_transactions_active ON exchange_transactions(transaction_status)
    WHERE transaction_status IN ('INITIATED', 'CONFIRMED', 'ESCROW_FUNDED', 'IN_TRANSIT');

-- Audit Log Entity Index
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, logged_at DESC);
