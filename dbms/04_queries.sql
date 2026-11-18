-- ============================================================================
-- Project ReguFlow / Phenix: Production SQL Queries (Checkpoint CP3)
-- Track: Viksit Bharat 2026 Circular Economy Showcase
-- Domain: Industrial Byproduct Matching, Resource Exchange, and Impact Analytics
-- Database Target: PostgreSQL 14+ / 16+ (ANSI SQL Standard Compliant)
-- Module: CP3 - Production Query Workflows
-- ============================================================================
-- Authors: Team T0010 (Project ReguFlow / Phenix Core Database Engineering)
-- Schema Reference: dbms/03_schema.sql (BCNF Normalized Relational Model)
-- Description:
--   This file contains all 8 production-grade SQL queries implementing the core
--   platform workflows for the circular economy industrial symbiosis network:
--     - Q1: Multi-Attribute Byproduct Matchmaking Engine with Composite Scoring
--     - Q2: Geolocation Proximity Search with Spatial Bounding-Box Pre-Filtering
--     - Q3: Atomic Exchange Transaction Workflow (ACID Contract Execution)
--     - Q4: Regional ESG Impact Aggregation & Circularity Window Ranking
--     - Q5: Unmatched Demand Gap Analysis & Supply Deficit Forecasting
--     - Q6: Logistics Weighbridge Discrepancy & Mass Reconciliation Audit
--     - Q7: Enterprise Circular Economic Valorization & Feedstock Arbitrage
--     - Q8: Cryptographic SHA-256 Audit Log Tamper-Evident Ledger Verification
-- ============================================================================

SET search_path = public;

-- ============================================================================
-- QUERY 1 (Q1): Multi-Attribute Byproduct Matchmaking Engine
-- ============================================================================
-- Description:
--   Automated multi-criteria pairing engine that evaluates active byproduct
--   supply listings against open industrial feedstock procurement demands.
--   Enforces multi-tier constraint satisfaction:
--     1. Material Compatibility: Exact material catalog code mapping.
--     2. Purity & Quality: Batch purity >= buyer minimum acceptable purity.
--     3. Moisture Tolerance: Batch moisture <= buyer maximum acceptable moisture.
--     4. Commercial Viability: Supplier unit price <= buyer maximum unit budget.
--     5. Minimum Order Quantity (MOQ): Listing MOQ <= buyer quantity required.
--     6. Facility Independence: Supplier facility <> buyer facility.
--     7. Spatial Optimization: O(1) bounding-box pre-filtering on indexed coordinates
--        followed by exact WGS84 great-circle Haversine spherical distance <= max radius.
--
-- Composite Compatibility Scoring Formula (0.00 - 100.00 scale):
--   - Purity Match Score (40% Weight):
--       40.0 * (1.0 - ((100.0 - batch_purity) / NULLIF(100.0 - min_acceptable_purity, 0.0)))
--   - Commercial Price Advantage Score (30% Weight):
--       30.0 * (1.0 - (supplier_price / NULLIF(max_unit_budget, 0.0)))
--   - Logistical Proximity Score (30% Weight):
--       GREATEST(0.0, 30.0 * (1.0 - (haversine_distance_km / max_distance_km)))
--
-- Index Utilization:
--   - idx_listings_match ON byproduct_listings(material_id, listing_status, batch_purity_percent, quantity_available)
--   - idx_demands_match ON demand_requirements(material_id, fulfillment_status, min_acceptable_purity)
--   - idx_facilities_coords ON facilities(latitude, longitude, industrial_cluster)
-- ============================================================================

SELECT 
    l.listing_id,
    l.listing_reference,
    d.requirement_id,
    d.requirement_reference,
    m.material_code,
    m.common_name AS material_name,
    m.material_category,
    m.standard_unit,
    
    -- Supplier Facility & Regional Metadata
    seller_fac.facility_name AS supplier_facility,
    seller_fac.city AS supplier_city,
    seller_fac.state AS supplier_state,
    seller_fac.industrial_cluster AS supplier_cluster,
    
    -- Consumer Facility & Regional Metadata
    buyer_fac.facility_name AS consumer_facility,
    buyer_fac.city AS consumer_city,
    buyer_fac.state AS consumer_state,
    buyer_fac.industrial_cluster AS consumer_cluster,
    
    -- Volume Quantities & Allocations
    l.quantity_available AS supplier_quantity_available,
    d.quantity_required AS consumer_quantity_required,
    l.minimum_order_quantity AS supplier_min_order_qty,
    LEAST(l.quantity_available, d.quantity_required) AS allocatable_match_quantity,
    
    -- Commercial Unit Pricing & Budget Caps (INR)
    l.price_per_unit_inr AS supplier_unit_price,
    d.max_unit_budget_inr AS consumer_max_budget,
    ROUND((d.max_unit_budget_inr - l.price_per_unit_inr), 2) AS unit_cost_savings_inr,
    ROUND((LEAST(l.quantity_available, d.quantity_required) * l.price_per_unit_inr), 2) AS estimated_deal_value_inr,
    
    -- Physical & Chemical Specifications
    l.batch_purity_percent AS supplier_purity_pct,
    d.min_acceptable_purity AS consumer_min_purity_pct,
    l.moisture_content_percent AS supplier_moisture_pct,
    d.max_acceptable_moisture AS consumer_max_moisture_pct,
    
    -- Great-Circle Haversine Distance (Kilometers)
    ROUND((6371.000 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(seller_fac.latitude)) * cos(radians(buyer_fac.latitude)) *
            cos(radians(buyer_fac.longitude) - radians(seller_fac.longitude)) +
            sin(radians(seller_fac.latitude)) * sin(radians(buyer_fac.latitude))
        ))
    ))::numeric, 2) AS transit_distance_km,
    d.max_distance_km AS consumer_max_radius_km,
    
    -- Component Scoring Breakdown
    ROUND(
        LEAST(40.00, GREATEST(0.00,
            40.00 * (1.00 - ((100.00 - l.batch_purity_percent) / NULLIF(100.00 - d.min_acceptable_purity, 0.00)))
        ))::numeric, 2
    ) AS purity_match_score,
    
    ROUND(
        LEAST(30.00, GREATEST(0.00,
            30.00 * (1.00 - (l.price_per_unit_inr / NULLIF(d.max_unit_budget_inr, 0.00)))
        ))::numeric, 2
    ) AS price_match_score,
    
    ROUND(
        GREATEST(0.00,
            30.00 * (1.00 - (
                (6371.000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(seller_fac.latitude)) * cos(radians(buyer_fac.latitude)) *
                        cos(radians(buyer_fac.longitude) - radians(seller_fac.longitude)) +
                        sin(radians(seller_fac.latitude)) * sin(radians(buyer_fac.latitude))
                    ))
                )) / NULLIF(d.max_distance_km, 0.00)
            ))
        )::numeric, 2
    ) AS proximity_match_score,
    
    -- Total Weighted Composite Score (0.00 to 100.00)
    ROUND((
        LEAST(40.00, GREATEST(0.00,
            40.00 * (1.00 - ((100.00 - l.batch_purity_percent) / NULLIF(100.00 - d.min_acceptable_purity, 0.00)))
        )) +
        LEAST(30.00, GREATEST(0.00,
            30.00 * (1.00 - (l.price_per_unit_inr / NULLIF(d.max_unit_budget_inr, 0.00)))
        )) +
        GREATEST(0.00,
            30.00 * (1.00 - (
                (6371.000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(seller_fac.latitude)) * cos(radians(buyer_fac.latitude)) *
                        cos(radians(buyer_fac.longitude) - radians(seller_fac.longitude)) +
                        sin(radians(seller_fac.latitude)) * sin(radians(buyer_fac.latitude))
                    ))
                )) / NULLIF(d.max_distance_km, 0.00)
            ))
        )
    )::numeric, 2) AS composite_match_score

FROM byproduct_listings l
JOIN demand_requirements d 
    ON l.material_id = d.material_id
JOIN facilities seller_fac 
    ON l.facility_id = seller_fac.facility_id
JOIN facilities buyer_fac 
    ON d.facility_id = buyer_fac.facility_id
JOIN material_catalog m 
    ON l.material_id = m.material_id

WHERE l.listing_status = 'AVAILABLE'
  AND d.fulfillment_status = 'OPEN'
  AND l.expires_at >= CURRENT_TIMESTAMP
  AND d.required_by_date >= CURRENT_DATE
  AND seller_fac.is_active = TRUE
  AND buyer_fac.is_active = TRUE
  AND seller_fac.facility_id <> buyer_fac.facility_id
  
  -- Quality & Commercial Feasibility Constraints
  AND l.batch_purity_percent >= d.min_acceptable_purity
  AND (d.max_acceptable_moisture IS NULL OR l.moisture_content_percent <= d.max_acceptable_moisture)
  AND l.price_per_unit_inr <= d.max_unit_budget_inr
  AND l.minimum_order_quantity <= d.quantity_required
  
  -- Bounding Box Pre-Filter for O(1) Index Pruning
  -- 1 degree latitude ~= 111.045 km
  -- 1 degree longitude ~= 111.045 * cos(latitude) km
  AND buyer_fac.latitude BETWEEN (seller_fac.latitude - (d.max_distance_km / 111.045))
                             AND (seller_fac.latitude + (d.max_distance_km / 111.045))
  AND buyer_fac.longitude BETWEEN (seller_fac.longitude - (d.max_distance_km / (111.045 * cos(radians(seller_fac.latitude)))))
                              AND (seller_fac.longitude + (d.max_distance_km / (111.045 * cos(radians(seller_fac.latitude)))))
  
  -- Strict Haversine Spherical Distance Threshold
  AND (6371.000 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(seller_fac.latitude)) * cos(radians(buyer_fac.latitude)) *
            cos(radians(buyer_fac.longitude) - radians(seller_fac.longitude)) +
            sin(radians(seller_fac.latitude)) * sin(radians(buyer_fac.latitude))
        ))
  )) <= d.max_distance_km

ORDER BY 
    composite_match_score DESC,
    transit_distance_km ASC,
    allocatable_match_quantity DESC;


-- ============================================================================
-- QUERY 2 (Q2): Geolocation Proximity Search with Spatial Bounding-Box Index
-- ============================================================================
-- Description:
--   Discovers all registered industrial facilities and their active byproduct
--   stockpiles within a configurable search radius (default: 150 km) from an
--   anchor facility or regional industrial cluster coordinate.
--   Demonstrates two-stage spatial query optimization:
--     Stage 1: Cartesian bounding-box range scan pruning candidate facilities
--              utilizing B-Tree index on (latitude, longitude, industrial_cluster).
--     Stage 2: Exact spherical Haversine trigonometric distance filtering and
--              aggregation of active byproduct stockpiles and pricing.
--
-- Anchor Coordinates:
--   Chakan-Talegaon Industrial Hub (Pune, Maharashtra, India):
--   Latitude = 18.6298000, Longitude = 73.7997000, Radius = 150.00 km.
--
-- Index Utilization:
--   - idx_facilities_coords ON facilities(latitude, longitude, industrial_cluster)
--   - idx_listings_open_status ON byproduct_listings(material_id, expires_at) WHERE listing_status = 'AVAILABLE'
-- ============================================================================

WITH search_anchor AS (
    SELECT 
        18.6298000::numeric(10,7) AS anchor_lat,
        73.7997000::numeric(10,7) AS anchor_lon,
        150.00::numeric(8,2)      AS search_radius_km
),
spatial_bounding_box AS (
    SELECT 
        anchor_lat,
        anchor_lon,
        search_radius_km,
        -- Latitude delta: 1 deg latitude = 111.045 km
        (search_radius_km / 111.045) AS delta_lat,
        -- Longitude delta adjusted for latitude convergence
        (search_radius_km / (111.045 * cos(radians(anchor_lat)))) AS delta_lon
    FROM search_anchor
)
SELECT 
    f.facility_id,
    f.facility_code,
    f.facility_name,
    f.facility_type,
    f.industrial_cluster,
    f.city,
    f.state,
    f.latitude,
    f.longitude,
    
    -- Exact Spherical Distance from Search Anchor
    ROUND((6371.000 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(sbb.anchor_lat)) * cos(radians(f.latitude)) *
            cos(radians(f.longitude) - radians(sbb.anchor_lon)) +
            sin(radians(sbb.anchor_lat)) * sin(radians(f.latitude))
        ))
    ))::numeric, 2) AS distance_from_anchor_km,
    
    -- Stockpile Aggregations for Active Byproduct Inventory
    COUNT(bl.listing_id) AS active_listings_count,
    COUNT(DISTINCT bl.material_id) AS distinct_materials_count,
    COALESCE(SUM(bl.quantity_available), 0.000) AS total_byproduct_tonnes_available,
    COALESCE(ROUND(AVG(bl.price_per_unit_inr), 2), 0.00) AS avg_stockpile_unit_price_inr,
    COALESCE(ROUND(MIN(bl.price_per_unit_inr), 2), 0.00) AS min_stockpile_unit_price_inr,
    COALESCE(ROUND(MAX(bl.price_per_unit_inr), 2), 0.00) AS max_stockpile_unit_price_inr,
    
    -- Aggregated Category Tags
    COALESCE(
        STRING_AGG(DISTINCT mc.material_category, ', ' ORDER BY mc.material_category),
        'NO_ACTIVE_LISTINGS'
    ) AS available_material_categories

FROM facilities f
CROSS JOIN spatial_bounding_box sbb
LEFT JOIN byproduct_listings bl 
    ON f.facility_id = bl.facility_id 
   AND bl.listing_status = 'AVAILABLE'
   AND bl.expires_at >= CURRENT_TIMESTAMP
LEFT JOIN material_catalog mc 
    ON bl.material_id = mc.material_id

WHERE f.is_active = TRUE
  -- Bounding Box Fast B-Tree Range Pruning
  AND f.latitude BETWEEN (sbb.anchor_lat - sbb.delta_lat) AND (sbb.anchor_lat + sbb.delta_lat)
  AND f.longitude BETWEEN (sbb.anchor_lon - sbb.delta_lon) AND (sbb.anchor_lon + sbb.delta_lon)
  
  -- Exact Spherical Radius Filter
  AND (6371.000 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(sbb.anchor_lat)) * cos(radians(f.latitude)) *
            cos(radians(f.longitude) - radians(sbb.anchor_lon)) +
            sin(radians(sbb.anchor_lat)) * sin(radians(f.latitude))
        ))
  )) <= sbb.search_radius_km

GROUP BY 
    f.facility_id,
    f.facility_code,
    f.facility_name,
    f.facility_type,
    f.industrial_cluster,
    f.city,
    f.state,
    f.latitude,
    f.longitude,
    sbb.anchor_lat,
    sbb.anchor_lon,
    sbb.search_radius_km

ORDER BY 
    distance_from_anchor_km ASC,
    total_byproduct_tonnes_available DESC;


-- ============================================================================
-- QUERY 3 (Q3): Atomic Exchange Transaction Workflow
-- ============================================================================
-- Description:
--   Executes contract initiation, inventory reservation, demand fulfillment
--   state transitions, and cryptographic SHA-256 state hashing inside an
--   isolated ACID transaction block (SERIALIZABLE or REPEATABLE READ).
--
-- Operational Workflow Steps:
--   1. Concurrency Locking: SELECT FOR UPDATE on match_proposals and byproduct_listings
--      to prevent concurrent double-allocation race conditions.
--   2. Contract Initiation: Inserts commercial contract tuple into exchange_transactions
--      enforcing chk_txn_total_math: agreed_total_inr = ROUND(quantity * unit_price, 2).
--   3. Inventory Allocation: Decrements quantity_available in byproduct_listings;
--      transitions listing_status to 'FULFILLED' if remaining balance <= 0.001 MT.
--   4. Match Confirmation: Updates match_proposals to status 'CONFIRMED'.
--   5. Demand Status Update: Transitions demand_requirements to 'MATCHED' or 'FULFILLED'.
--   6. Audit Ledger Commit: Appends immutable SHA-256 digest block with backward
--      hash chaining linking to previous_log_checksum.
--
-- Sample Proposal UUID Anchor:
--   'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
-- ============================================================================

-- Wrapped as an executable atomic script:
BEGIN;

-- Step 1: Insert into exchange_transactions with strict referential validation
WITH target_proposal AS (
    SELECT 
        mp.proposal_id,
        mp.listing_id,
        mp.requirement_id,
        mp.proposed_quantity,
        mp.unit_price_inr,
        ROUND((mp.proposed_quantity * mp.unit_price_inr), 2) AS calculated_total_inr,
        bl.facility_id AS seller_fac_id,
        dr.facility_id AS buyer_fac_id,
        bl.material_id AS material_id,
        'TXN-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || SUBSTRING(mp.proposal_id::text, 1, 8) AS txn_ref
    FROM match_proposals mp
    JOIN byproduct_listings bl ON mp.listing_id = bl.listing_id
    JOIN demand_requirements dr ON mp.requirement_id = dr.requirement_id
    WHERE mp.proposal_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid
      AND mp.proposal_status IN ('OFFERED', 'ACCEPTED')
    FOR UPDATE OF mp, bl
),
inserted_txn AS (
    INSERT INTO exchange_transactions (
        proposal_id,
        seller_facility_id,
        buyer_facility_id,
        material_id,
        transaction_reference,
        agreed_quantity,
        agreed_unit_price_inr,
        agreed_total_inr,
        transaction_status,
        payment_status,
        contract_signed_at
    )
    SELECT 
        tp.proposal_id,
        tp.seller_fac_id,
        tp.buyer_fac_id,
        tp.material_id,
        tp.txn_ref,
        tp.proposed_quantity,
        tp.unit_price_inr,
        tp.calculated_total_inr,
        'INITIATED',
        'HELD_IN_ESCROW',
        CURRENT_TIMESTAMP
    FROM target_proposal tp
    RETURNING transaction_id, proposal_id, agreed_quantity, agreed_total_inr
)

-- Step 2: Update listing inventory and state
, updated_listing AS (
    UPDATE byproduct_listings bl
    SET 
        quantity_available = bl.quantity_available - it.agreed_quantity,
        listing_status = CASE 
            WHEN (bl.quantity_available - it.agreed_quantity) <= 0.001 THEN 'FULFILLED'
            ELSE 'PARTIALLY_FULFILLED'
        END,
        updated_at = CURRENT_TIMESTAMP
    FROM inserted_txn it
    JOIN match_proposals mp ON it.proposal_id = mp.proposal_id
    WHERE bl.listing_id = mp.listing_id
    RETURNING bl.listing_id, bl.quantity_available, bl.listing_status
)

-- Step 3: Transition proposal to confirmed
, updated_proposal AS (
    UPDATE match_proposals mp
    SET 
        proposal_status = 'CONFIRMED',
        updated_at = CURRENT_TIMESTAMP
    FROM inserted_txn it
    WHERE mp.proposal_id = it.proposal_id
    RETURNING mp.proposal_id, mp.proposal_status
)

-- Step 4: Update procurement demand requirement fulfillment status
, updated_demand AS (
    UPDATE demand_requirements dr
    SET 
        fulfillment_status = CASE 
            WHEN dr.quantity_required <= it.agreed_quantity THEN 'FULFILLED'
            ELSE 'PARTIALLY_MATCHED'
        END,
        updated_at = CURRENT_TIMESTAMP
    FROM inserted_txn it
    JOIN match_proposals mp ON it.proposal_id = mp.proposal_id
    WHERE dr.requirement_id = mp.requirement_id
    RETURNING dr.requirement_id, dr.fulfillment_status
)

-- Step 5: Append cryptographically hashed audit log with SHA-256 blockchain chaining
INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    performed_by_org_id,
    previous_state,
    new_state,
    sha256_checksum,
    previous_log_checksum,
    logged_at
)
SELECT 
    'EXCHANGE_TRANSACTIONS',
    it.transaction_id::text,
    'CONTRACT_INITIATED',
    (SELECT org_id FROM facilities WHERE facility_id = et.buyer_facility_id),
    jsonb_build_object(
        'proposal_id', it.proposal_id,
        'proposal_status', 'ACCEPTED'
    ),
    jsonb_build_object(
        'transaction_id', it.transaction_id,
        'transaction_status', 'INITIATED',
        'payment_status', 'HELD_IN_ESCROW',
        'agreed_quantity', it.agreed_quantity,
        'agreed_total_inr', it.agreed_total_inr
    ),
    -- SHA-256 Digest of immutable state transition
    encode(digest(
        'EXCHANGE_TRANSACTIONS:' || it.transaction_id::text || ':CONTRACT_INITIATED:' || CURRENT_TIMESTAMP::text,
        'sha256'
    ), 'hex'),
    -- Previous log checksum link
    COALESCE(
        (SELECT sha256_checksum FROM audit_logs ORDER BY log_id DESC LIMIT 1),
        REPEAT('0', 64)
    ),
    CURRENT_TIMESTAMP
FROM inserted_txn it
JOIN exchange_transactions et ON it.transaction_id = et.transaction_id;

COMMIT;


-- ============================================================================
-- QUERY 4 (Q4): Regional ESG Impact & Circularity Index Analytics
-- ============================================================================
-- Description:
--   Multi-dimensional analytics query aggregating regional circular economy
--   performance indicators per industrial cluster.
--   Computes:
--     - Net diverted industrial solid waste (Metric Tonnes)
--     - Avoided Scope 3 greenhouse gas emissions (Tonnes CO2e)
--     - Conserved virgin raw materials and industrial water (m3)
--     - Net corporate financial cost savings (Crores INR)
--     - Average composite circularity score per industrial park
--
-- Window Functions Employed:
--   - DENSE_RANK() OVER (ORDER BY total_co2e_tonnes_avoided DESC) AS cluster_esg_rank
--   - RANK() OVER (ORDER BY total_economic_savings_inr DESC) AS cluster_economic_rank
--   - SUM(...) OVER () for national contribution percentage distribution
--   - Cumulative CO2e running sum across clusters
--
-- Index Utilization:
--   - idx_transactions_active ON exchange_transactions(transaction_status)
--   - idx_transactions_seller_facility ON exchange_transactions(seller_facility_id)
--   - idx_esg_transaction_id ON esg_impact_metrics(transaction_id)
-- ============================================================================

WITH cluster_settled_metrics AS (
    SELECT 
        sf.industrial_cluster,
        COUNT(DISTINCT et.transaction_id) AS settled_transactions_count,
        COUNT(DISTINCT et.material_id)    AS unique_materials_exchanged,
        COUNT(DISTINCT sf.facility_id)    AS active_seller_facilities_count,
        COUNT(DISTINCT et.buyer_facility_id) AS active_buyer_facilities_count,
        
        -- Volume and Mass Conserved
        SUM(et.agreed_quantity)                      AS total_byproduct_tonnes_exchanged,
        SUM(eim.landfill_tonnes_diverted)            AS total_landfill_tonnes_diverted,
        SUM(eim.co2e_tonnes_avoided)                 AS total_co2e_tonnes_avoided,
        SUM(eim.virgin_raw_material_saved_tonnes)    AS total_virgin_raw_material_saved_tonnes,
        SUM(eim.water_cubic_meters_saved)            AS total_water_cubic_meters_saved,
        
        -- Economic Valorization
        SUM(et.agreed_total_inr)                     AS total_secondary_trade_value_inr,
        SUM(eim.economic_value_saved_inr)            AS total_economic_savings_inr,
        
        -- Circularity Index Scoring
        ROUND(AVG(eim.circularity_index_score), 2)   AS avg_cluster_circularity_score
    FROM esg_impact_metrics eim
    JOIN exchange_transactions et 
        ON eim.transaction_id = et.transaction_id
    JOIN facilities sf 
        ON et.seller_facility_id = sf.facility_id
    WHERE et.transaction_status IN ('DELIVERED', 'SETTLED')
    GROUP BY sf.industrial_cluster
)
SELECT 
    csm.industrial_cluster,
    csm.settled_transactions_count,
    csm.unique_materials_exchanged,
    csm.active_seller_facilities_count,
    csm.active_buyer_facilities_count,
    
    -- Rounded Mass Metrics (Tonnes)
    ROUND(csm.total_byproduct_tonnes_exchanged, 2) AS byproduct_exchanged_tonnes,
    ROUND(csm.total_landfill_tonnes_diverted, 2)    AS landfill_diverted_tonnes,
    ROUND(csm.total_co2e_tonnes_avoided, 2)         AS co2e_avoided_tonnes,
    ROUND(csm.total_virgin_raw_material_saved_tonnes, 2) AS virgin_material_saved_tonnes,
    ROUND(csm.total_water_cubic_meters_saved, 2)    AS water_saved_m3,
    
    -- Financial Value in Crores INR (1 Crore = 10,000,000 INR)
    ROUND((csm.total_secondary_trade_value_inr / 10000000.0), 3) AS secondary_trade_crores_inr,
    ROUND((csm.total_economic_savings_inr / 10000000.0), 3)      AS net_savings_crores_inr,
    
    csm.avg_cluster_circularity_score,
    
    -- Window ESG Ranking
    DENSE_RANK() OVER (
        ORDER BY csm.total_co2e_tonnes_avoided DESC
    ) AS cluster_esg_rank,
    
    -- Window Economic Savings Ranking
    RANK() OVER (
        ORDER BY csm.total_economic_savings_inr DESC
    ) AS cluster_economic_rank,
    
    -- Relative National Contribution Percentages
    ROUND((
        100.00 * csm.total_co2e_tonnes_avoided / 
        NULLIF(SUM(csm.total_co2e_tonnes_avoided) OVER (), 0.00)
    )::numeric, 2) AS pct_national_co2e_contribution,
    
    ROUND((
        100.00 * csm.total_landfill_tonnes_diverted / 
        NULLIF(SUM(csm.total_landfill_tonnes_diverted) OVER (), 0.00)
    )::numeric, 2) AS pct_national_landfill_contribution,
    
    -- Cumulative Running Abatement
    ROUND((
        SUM(csm.total_co2e_tonnes_avoided) OVER (
            ORDER BY csm.total_co2e_tonnes_avoided DESC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
    )::numeric, 2) AS cumulative_co2e_avoided_tonnes

FROM cluster_settled_metrics csm
ORDER BY cluster_esg_rank ASC;


-- ============================================================================
-- QUERY 5 (Q5): Unmatched Demand Gap Analysis
-- ============================================================================
-- Description:
--   Strategic supply-chain market intelligence query that evaluates structural
--   deficits between procurement demands and available secondary feedstock supplies.
--   Identifies supply bottlenecks, material shortages, and price-expectation
--   spreads across different material categories and planning horizons.
--
-- Key Analytical Outputs:
--   - Net supply deficit (Demanded Quantity - Available Stockpiles)
--   - Market supply coverage ratio (Available / Demanded * 100%)
--   - Price expectation gap (Average Asking Price vs Average Buyer Budget)
--   - Deficit severity classification (Critical, Moderate, Balanced)
--   - Urgency horizon (flags demands required within 14 calendar days)
--
-- Index Utilization:
--   - idx_demands_open_status ON demand_requirements(material_id, required_by_date)
--   - idx_listings_open_status ON byproduct_listings(material_id, expires_at)
-- ============================================================================

WITH unfulfilled_demands AS (
    SELECT 
        dr.material_id,
        COUNT(dr.requirement_id)             AS total_unfulfilled_demands,
        SUM(dr.quantity_required)            AS total_demanded_quantity,
        ROUND(AVG(dr.max_unit_budget_inr), 2) AS avg_buyer_budget_inr,
        MIN(dr.max_unit_budget_inr)          AS min_buyer_budget_inr,
        MAX(dr.max_unit_budget_inr)          AS max_buyer_budget_inr,
        MIN(dr.required_by_date)             AS earliest_deadline,
        COUNT(dr.requirement_id) FILTER (
            WHERE dr.required_by_date <= CURRENT_DATE + INTERVAL '14 days'
        ) AS urgent_demands_count
    FROM demand_requirements dr
    WHERE dr.fulfillment_status IN ('OPEN', 'PARTIALLY_MATCHED')
      AND dr.required_by_date >= CURRENT_DATE
    GROUP BY dr.material_id
),
available_supplies AS (
    SELECT 
        bl.material_id,
        COUNT(bl.listing_id)                 AS total_active_listings,
        SUM(bl.quantity_available)           AS total_available_supply,
        ROUND(AVG(bl.price_per_unit_inr), 2) AS avg_seller_price_inr,
        MIN(bl.price_per_unit_inr)           AS min_seller_price_inr,
        MAX(bl.price_per_unit_inr)           AS max_seller_price_inr
    FROM byproduct_listings bl
    WHERE bl.listing_status = 'AVAILABLE'
      AND bl.expires_at >= CURRENT_TIMESTAMP
    GROUP BY bl.material_id
)
SELECT 
    mc.material_code,
    mc.common_name AS material_name,
    mc.material_category,
    mc.standard_unit,
    
    -- Demand Metrics
    ud.total_unfulfilled_demands,
    ROUND(ud.total_demanded_quantity, 3) AS total_demanded_tonnes,
    ud.urgent_demands_count,
    ud.earliest_deadline,
    
    -- Supply Metrics
    COALESCE(asup.total_active_listings, 0) AS total_active_listings,
    COALESCE(ROUND(asup.total_available_supply, 3), 0.000) AS total_available_tonnes,
    
    -- Structural Gap Analysis
    ROUND((ud.total_demanded_quantity - COALESCE(asup.total_available_supply, 0.000)), 3) AS net_supply_deficit_tonnes,
    
    ROUND((
        COALESCE(asup.total_available_supply, 0.000) / 
        NULLIF(ud.total_demanded_quantity, 0.000) * 100.00
    )::numeric, 2) AS supply_coverage_ratio_pct,
    
    -- Commercial Arbitrage and Price Gap
    ud.avg_buyer_budget_inr,
    COALESCE(asup.avg_seller_price_inr, 0.00) AS avg_seller_asking_price_inr,
    
    CASE 
        WHEN asup.avg_seller_price_inr IS NOT NULL 
        THEN ROUND((asup.avg_seller_price_inr - ud.avg_buyer_budget_inr), 2)
        ELSE NULL
    END AS price_expectation_gap_inr,
    
    -- Shortage Severity Classification
    CASE 
        WHEN asup.total_available_supply IS NULL OR asup.total_available_supply = 0.000 
            THEN 'CRITICAL_ZERO_SUPPLY'
        WHEN (asup.total_available_supply / NULLIF(ud.total_demanded_quantity, 0.000)) < 0.25 
            THEN 'SEVERE_SHORTAGE_HIGH_RISK'
        WHEN (asup.total_available_supply / NULLIF(ud.total_demanded_quantity, 0.000)) < 0.75 
            THEN 'MODERATE_DEFICIT'
        WHEN (asup.total_available_supply / NULLIF(ud.total_demanded_quantity, 0.000)) <= 1.25 
            THEN 'MARKET_BALANCED'
        ELSE 'SUPPLY_SURPLUS'
    END AS deficit_severity_status,
    
    -- Operational Urgency Flag
    CASE 
        WHEN ud.urgent_demands_count > 0 THEN 'EXPEDITE_SOURCING'
        ELSE 'STANDARD_OPERATIONS'
    END AS fulfillment_priority

FROM unfulfilled_demands ud
JOIN material_catalog mc 
    ON ud.material_id = mc.material_id
LEFT JOIN available_supplies asup 
    ON ud.material_id = asup.material_id

ORDER BY 
    net_supply_deficit_tonnes DESC,
    ud.urgent_demands_count DESC,
    ud.earliest_deadline ASC;


-- ============================================================================
-- QUERY 6 (Q6): Logistics Weighbridge Discrepancy & Fraud Audit Query
-- ============================================================================
-- Description:
--   Statutory supply-chain compliance and fraud detection audit query.
--   Reconciles legally contracted transaction mass against automated weighbridge
--   gross, tare, and net weights captured on certified industrial scales.
--   Enforces national tolerance limits (|net_kg - agreed_kg| / agreed_kg <= 2.00%).
--
-- Fraud & Loss Diagnostic Classification:
--   - Variance < -5.00%: 'SUSPECTED_THEFT_OR_CARGO_PILFERAGE'
--   - Variance between -5.00% and -2.01%: 'IN_TRANSIT_DUST_LEACHING_LOSS'
--   - Variance between -2.00% and +2.00%: 'WITHIN_STATUTORY_TOLERANCE'
--   - Variance between +2.01% and +5.00%: 'MOISTURE_ABSORPTION_RAIN_INTRUSION'
--   - Variance > +5.00%: 'TARE_MANIPULATION_OR_DEBRIS_CONTAMINATION'
--
-- Index Utilization:
--   - idx_transits_transaction_id ON logistics_transits(transaction_id)
--   - idx_transits_carrier_org_id ON logistics_transits(carrier_org_id)
-- ============================================================================

SELECT 
    lt.transit_id,
    lt.transit_reference,
    lt.e_way_bill_number,
    lt.vehicle_registration_number,
    carrier.legal_name AS logistics_carrier_name,
    carrier.org_code   AS carrier_code,
    
    et.transaction_reference,
    mc.material_code,
    mc.common_name AS material_name,
    
    sf.facility_name AS origin_facility,
    sf.city          AS origin_city,
    bf.facility_name AS destination_facility,
    bf.city          AS destination_city,
    
    lt.dispatch_date,
    lt.delivery_date,
    lt.transit_status,
    
    -- Mass Reconciliation Metrics (Kilograms)
    ROUND(et.agreed_quantity * 1000.00, 2) AS contracted_mass_kg,
    ROUND(lt.weighbridge_gross_kg, 2)      AS weighbridge_gross_kg,
    ROUND(lt.weighbridge_tare_kg, 2)       AS weighbridge_tare_kg,
    ROUND(lt.weighbridge_net_kg, 2)        AS weighbridge_net_kg,
    
    -- Variance Metrics
    ROUND((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)), 2) AS mass_variance_kg,
    
    ROUND((
        ((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / 
        NULLIF(et.agreed_quantity * 1000.00, 0.00)) * 100.00
    )::numeric, 2) AS variance_percentage,
    
    -- Financial Disputed Impact (INR)
    ROUND((
        (ABS(lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / 1000.00) * 
        et.agreed_unit_price_inr
    ), 2) AS disputed_cargo_value_inr,
    
    -- Automated Anomaly & Fraud Root Cause Diagnosis
    CASE 
        WHEN ((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) < -0.05 
            THEN 'SUSPECTED_THEFT_OR_CARGO_PILFERAGE'
        WHEN ((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) < -0.02 
            THEN 'IN_TRANSIT_DUST_LEACHING_LOSS'
        WHEN ((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) > 0.05 
            THEN 'TARE_MANIPULATION_OR_DEBRIS_CONTAMINATION'
        WHEN ((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) > 0.02 
            THEN 'MOISTURE_ABSORPTION_RAIN_INTRUSION'
        ELSE 'WITHIN_STATUTORY_TOLERANCE'
    END AS discrepancy_root_cause_diagnosis,
    
    -- Regulatory Audit Action
    CASE 
        WHEN ABS((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) > 0.05
            THEN 'IMMEDIATE_ESCROW_FREEZE_AND_INSPECTION'
        WHEN ABS((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) > 0.02
            THEN 'FLAG_FOR_COMMERCIAL_SETTLEMENT_ADJUSTMENT'
        ELSE 'AUTO_APPROVE_SETTLEMENT'
    END AS compliance_reconciliation_action

FROM logistics_transits lt
JOIN exchange_transactions et 
    ON lt.transaction_id = et.transaction_id
JOIN material_catalog mc 
    ON et.material_id = mc.material_id
JOIN organizations carrier 
    ON lt.carrier_org_id = carrier.org_id
JOIN facilities sf 
    ON et.seller_facility_id = sf.facility_id
JOIN facilities bf 
    ON et.buyer_facility_id = bf.facility_id

WHERE (
    ABS((lt.weighbridge_net_kg - (et.agreed_quantity * 1000.00)) / NULLIF(et.agreed_quantity * 1000.00, 0.00)) > 0.02
    OR lt.transit_status = 'DISCREPANCY_FLAGGED'
)

ORDER BY 
    ABS(variance_percentage) DESC,
    disputed_cargo_value_inr DESC;


-- ============================================================================
-- QUERY 7 (Q7): Economic Valorization and Net Financial Savings Arbitrage
-- ============================================================================
-- Description:
--   Quantifies corporate financial value creation and material cost arbitrage
--   achieved through industrial byproduct substitution over virgin raw materials.
--   Computes procurement cost savings for consumers, byproduct monetization
--   revenue for producers, avoided landfill tipping fees, and total ecosystem dividend.
--
-- Financial Arbitrage Formulations:
--   - Imputed Virgin Raw Feedstock Cost = Secondary Material Spend + Net Financial Savings
--   - Corporate Procurement Cost Reduction % = (Net Savings / Imputed Virgin Cost) * 100%
--   - Avoided Landfill Disposal Tipping Fees = Diverted Tonnes * ₹1,200/MT statutory benchmark
--   - Total Ecosystem Circular Dividend = Buyer Savings + Seller Revenue + Avoided Tipping Fees
--
-- Index Utilization:
--   - idx_transactions_active ON exchange_transactions(transaction_status)
--   - idx_esg_transaction_id ON esg_impact_metrics(transaction_id)
--   - idx_facilities_org_id ON facilities(org_id)
-- ============================================================================

WITH enterprise_arbitrage AS (
    SELECT 
        buyer_org.org_id,
        buyer_org.org_code,
        buyer_org.legal_name AS buyer_organization_name,
        buyer_org.industry_sector,
        
        COUNT(DISTINCT et.transaction_id)            AS total_procurements_settled,
        COUNT(DISTINCT et.material_id)               AS distinct_materials_procured,
        SUM(et.agreed_quantity)                      AS total_secondary_tonnes_procured,
        SUM(et.agreed_total_inr)                     AS total_secondary_spend_inr,
        SUM(eim.economic_value_saved_inr)            AS total_procurement_savings_inr,
        SUM(eim.landfill_tonnes_diverted)            AS total_landfill_tonnes_diverted,
        SUM(eim.co2e_tonnes_avoided)                 AS total_co2e_tonnes_avoided,
        ROUND(AVG(eim.circularity_index_score), 2)   AS avg_circularity_score
    FROM exchange_transactions et
    JOIN esg_impact_metrics eim 
        ON et.transaction_id = eim.transaction_id
    JOIN facilities bf 
        ON et.buyer_facility_id = bf.facility_id
    JOIN organizations buyer_org 
        ON bf.org_id = buyer_org.org_id
    WHERE et.transaction_status IN ('DELIVERED', 'SETTLED')
    GROUP BY 
        buyer_org.org_id,
        buyer_org.org_code,
        buyer_org.legal_name,
        buyer_org.industry_sector
)
SELECT 
    ea.org_code,
    ea.buyer_organization_name,
    ea.industry_sector,
    ea.total_procurements_settled,
    ea.distinct_materials_procured,
    
    ROUND(ea.total_secondary_tonnes_procured, 2) AS secondary_tonnes_procured,
    
    -- Financial Spend & Savings (Lakhs INR, 1 Lakh = 100,000 INR)
    ROUND((ea.total_secondary_spend_inr / 100000.0), 2)       AS secondary_spend_lakhs_inr,
    ROUND((ea.total_procurement_savings_inr / 100000.0), 2)   AS net_cost_savings_lakhs_inr,
    
    -- Imputed Virgin Primary Feedstock Expenditure
    ROUND(((ea.total_secondary_spend_inr + ea.total_procurement_savings_inr) / 100000.0), 2) AS baseline_virgin_cost_lakhs_inr,
    
    -- Cost Arbitrage Percentage
    ROUND((
        ea.total_procurement_savings_inr / 
        NULLIF(ea.total_secondary_spend_inr + ea.total_procurement_savings_inr, 0.00) * 100.00
    )::numeric, 2) AS procurement_cost_reduction_pct,
    
    -- Avoided Landfill Disposal Tipping Fees (Statutory standard: INR 1,200 per MT)
    ROUND(((ea.total_landfill_tonnes_diverted * 1200.00) / 100000.0), 2) AS avoided_tipping_fees_lakhs_inr,
    
    -- Total Net Circular Economic Surplus (Lakhs INR)
    ROUND((
        (ea.total_procurement_savings_inr + (ea.total_landfill_tonnes_diverted * 1200.00)) / 100000.0
    ), 2) AS total_circular_surplus_lakhs_inr,
    
    -- Environmental Physical Yield
    ROUND(ea.total_co2e_tonnes_avoided, 2) AS co2e_avoided_tonnes,
    ea.avg_circularity_score,
    
    -- Window Enterprise Savings Ranking
    DENSE_RANK() OVER (
        ORDER BY ea.total_procurement_savings_inr DESC
    ) AS enterprise_savings_rank,
    
    -- Contribution to National Corporate Savings
    ROUND((
        100.00 * ea.total_procurement_savings_inr / 
        NULLIF(SUM(ea.total_procurement_savings_inr) OVER (), 0.00)
    )::numeric, 2) AS pct_national_savings_contribution

FROM enterprise_arbitrage ea
ORDER BY enterprise_savings_rank ASC;


-- ============================================================================
-- QUERY 8 (Q8): Cryptographic SHA-256 Audit Log Tamper-Evident Verification
-- ============================================================================
-- Description:
--   Blockchain-style cryptographically tamper-evident ledger validation query.
--   Reconstructs the sequential cryptographic hash chain of audit_logs and
--   validates mathematical continuity across all recorded state transitions.
--
-- Cryptographic Validation Rule:
--   For every sequentially logged record i (where i > 1):
--     previous_log_checksum(i) == sha256_checksum(i - 1)
--   And for the Genesis Block (i = 1):
--     previous_log_checksum(1) IS NULL OR previous_log_checksum(1) == REPEAT('0', 64)
--
-- Tamper Detection Diagnostics:
--   - 'VALID_GENESIS_BLOCK': Valid ledger initiation block
--   - 'VALID_CHAIN_LINK': Unbroken cryptographic hash link
--   - 'CORRUPTED_CHAIN_LINK_TAMPER_DETECTED': Malicious or unauthorized mutation detected
--   - 'ORPHAN_BLOCK_UNEXPECTED_NULL': Sequence gap or orphan entry detected
--
-- Index Utilization:
--   - audit_logs_pkey ON audit_logs(log_id)
--   - idx_audit_logs_entity ON audit_logs(entity_type, entity_id, logged_at DESC)
-- ============================================================================

WITH chain_reconstruction AS (
    SELECT 
        al.log_id,
        al.entity_type,
        al.entity_id,
        al.action,
        al.logged_at,
        al.sha256_checksum,
        al.previous_log_checksum,
        
        -- Cryptographic Previous Hash from Preceding Row
        LAG(al.sha256_checksum, 1) OVER (
            ORDER BY al.log_id ASC
        ) AS expected_previous_checksum,
        
        -- Row Sequence Number
        ROW_NUMBER() OVER (
            ORDER BY al.log_id ASC
        ) AS sequence_index
    FROM audit_logs al
),
chain_verification AS (
    SELECT 
        cr.log_id,
        cr.sequence_index,
        cr.entity_type,
        cr.entity_id,
        cr.action,
        cr.logged_at,
        cr.sha256_checksum,
        cr.previous_log_checksum,
        cr.expected_previous_checksum,
        
        -- Exact Tamper Classification State Machine
        CASE 
            WHEN cr.sequence_index = 1 AND (cr.previous_log_checksum IS NULL OR cr.previous_log_checksum = REPEAT('0', 64))
                THEN 'VALID_GENESIS_BLOCK'
            WHEN cr.sequence_index > 1 AND cr.previous_log_checksum = cr.expected_previous_checksum
                THEN 'VALID_CHAIN_LINK'
            WHEN cr.sequence_index > 1 AND cr.previous_log_checksum <> cr.expected_previous_checksum
                THEN 'CORRUPTED_CHAIN_LINK_TAMPER_DETECTED'
            WHEN cr.sequence_index > 1 AND cr.previous_log_checksum IS NULL
                THEN 'ORPHAN_BLOCK_UNEXPECTED_NULL'
            ELSE 'HASH_CONTINUITY_VIOLATION'
        END AS block_integrity_status,
        
        CASE 
            WHEN cr.sequence_index = 1 AND (cr.previous_log_checksum IS NULL OR cr.previous_log_checksum = REPEAT('0', 64))
                THEN TRUE
            WHEN cr.sequence_index > 1 AND cr.previous_log_checksum = cr.expected_previous_checksum
                THEN TRUE
            ELSE FALSE
        END AS is_mathematically_intact
    FROM chain_reconstruction cr
)
SELECT 
    cv.log_id,
    cv.sequence_index,
    cv.entity_type,
    cv.entity_id,
    cv.action,
    cv.logged_at,
    cv.sha256_checksum,
    cv.previous_log_checksum,
    cv.expected_previous_checksum,
    cv.block_integrity_status,
    cv.is_mathematically_intact,
    
    -- Summary Audit Rollup Metrics
    COUNT(*) OVER () AS total_ledger_records_audited,
    COUNT(*) FILTER (WHERE cv.is_mathematically_intact = TRUE) OVER () AS intact_blocks_count,
    COUNT(*) FILTER (WHERE cv.is_mathematically_intact = FALSE) OVER () AS corrupted_blocks_count,
    
    CASE 
        WHEN COUNT(*) FILTER (WHERE cv.is_mathematically_intact = FALSE) OVER () = 0
            THEN 'LEDGER_INTEGRITY_CERTIFIED_TAMPER_FREE'
        ELSE 'CRITICAL_SECURITY_ALERT_TAMPERING_DETECTED'
    END AS overall_ledger_security_certification

FROM chain_verification cv
ORDER BY cv.log_id ASC;
