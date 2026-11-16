# E2E Test Infra: Phenix / Project ReguFlow (Viksit Bharat 2026 Showcase)

## Test Philosophy
- **Opaque-box, requirement-driven**: Tests validate interface contracts, business invariants, and deliverable specifications derived from `ORIGINAL_REQUEST.md` and `PROJECT.md`, without relying on internal private implementations.
- **Pure Node.js v24 Execution**: Zero external npm dependencies. Built using native `node:test`, `node:assert`, `node:sqlite` (DatabaseSync), `node:crypto`, and `node:fs`.
- **Systematic 4-Tier Test Architecture**:
  1. **Tier 1 — Feature Coverage**: Minimum 5 tests per feature for all 10 features from `PROJECT.md § Feature Inventory` (≥ 50 tests total).
  2. **Tier 2 — Boundary & Corner Cases**: Minimum 5 boundary/edge tests per feature (coordinates boundaries [-90,90], antipodal distance, zero distance, purity 0%/100%, negative values rejected, extreme quantities) (≥ 50 tests total).
  3. **Tier 3 — Cross-Feature Combinations**: Pairwise interactions testing cross-module state and data flow (Listing + Geolocation, Matchmaking + Logistics Cost, Transaction + ESG Metrics, Schema + Queries) (≥ 10 tests).
  4. **Tier 4 — Real-World Application Scenarios**: Multi-feature end-to-end industrial workflows across Indian manufacturing corridors (Gujarat, Maharashtra, Tamil Nadu, Jharkhand) (≥ 5 complex scenarios).

## Feature Inventory
| # | Feature | Description | Source | Tier 1 (≥5) | Tier 2 (≥5) | Tier 3 (Pairwise) | Tier 4 (Workloads) |
|---|---------|-------------|--------|:-----------:|:-----------:|:-----------------:|:------------------:|
| F1 | Repository & Workspace Setup | Package metadata, dual repo structure, team configuration, zero-dep Node v24 environment | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F2 | DBMS CP1: Normalization | Relational normalization, functional dependencies, 1NF->2NF->3NF->BCNF proofs | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | DBMS CP2: ER Diagram & Schema DDL | 10 entity relations, UUID/SERIAL keys, domain CHECK constraints, spatial indexes | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F4 | DBMS CP3: Core Platform Queries | 8 production SQL workflows (matchmaking, Haversine, atomic transaction, cluster ESG) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F5 | DBMS CP4: Execution Plans & Benchmarks | EXPLAIN ANALYZE execution plans, scan types (Seq vs Index), buffer reads, speedups | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F6 | Domain Models & Entity Schemas | Organizations, Facilities, Material Catalog, Listings, Demands, Transactions, ESG | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F7 | Matchmaking Engine | Multi-attribute scoring ($S_{mat}, S_{qty}, S_{dist}, S_{esg}$), ranking, hard rejection filters | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F8 | Geolocation & Distance Calculation | High-precision WGS84 Haversine distance, coordinate validation, bounding box, hazmat logistics | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F9 | Realistic Industrial Seed Data | Authentic Indian industrial corridors (Dahej, Pune, Coimbatore, Jamshedpur) and byproduct pairs | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F10 | E2E Test Suite & Coverage Hardening | Master test runner, pass/fail semantics, exit code integrity, diagnostic reporting | Acceptance Criteria | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: `node tests/e2e/runner.js` or `node --test tests/e2e/*.test.js`
- **Invocation Environment**: Node.js v24 (`node:test`, `node:assert`, `node:sqlite`, `node:crypto`)
- **Pass/Fail Semantics**:
  - All test assertions must pass with exit code `0`.
  - Any failed assertion, unhandled rejection, or schema integrity violation halts with exit code `1`.
  - Detailed tap/spec diagnostic summary detailing total tests, passed, failed, and duration.
- **Directory Layout**:
  ```
  tests/e2e/
  ├── runner.js                  # Master test runner orchestrating all tiers with timing & summary
  ├── tier1_features.test.js     # Tier 1: ≥ 50 feature coverage tests (≥ 5 per feature across F1-F10)
  ├── tier2_boundaries.test.js   # Tier 2: ≥ 50 boundary & corner tests (≥ 5 per feature across F1-F10)
  ├── tier3_combinations.test.js # Tier 3: ≥ 10 cross-feature pairwise integration tests
  └── tier4_scenarios.test.js    # Tier 4: ≥ 5 comprehensive industrial corridor end-to-end scenarios
  ```

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Corridors & Industrial Byproduct Streams | Features Exercised | Complexity |
|---|----------|------------------------------------------|--------------------|------------|
| 1 | Gujarat Chemical Symbiosis | Dahej Chlor-Alkali Spent Sulfuric Acid $\to$ Bharuch SSP Fertilizer synthesis | F3, F4, F6, F7, F8, F9 | High |
| 2 | Kutch Pozzolana Circular Cement | Dahej Phosphogypsum $\to$ Mundra Kutch Pozzolana Cement clinker retarding | F3, F4, F6, F7, F8, F9 | High |
| 3 | Maharashtra Auto Foundry Loop | Chakan Automotive Foundry Silica Sand & Slag $\to$ Talegaon Green Paver Brick plant | F3, F6, F7, F8, F9 | Medium |
| 4 | Jharkhand Steel Belt GGBS Exchange | Jamshedpur Blast Furnace Slag (GGBS) $\to$ Chaibasa Ready-Mix Infrastructure with ESG Scope 3 | F3, F4, F6, F7, F8, F9 | High |
| 5 | Tamil Nadu Textile Sludge to Co-Processing | Tirupur Dyeing Effluent Sludge $\to$ Coimbatore Industrial Kiln with Hazmat transit & Cryptographic Audit | F3, F4, F6, F7, F8, F9 | High |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥ 5 isolated happy-path tests per feature $\times 10 = \mathbf{50}$ tests minimum.
- **Tier 2 (Boundary & Corner Cases)**: ≥ 5 boundary, edge, domain rejection tests per feature $\times 10 = \mathbf{50}$ tests minimum.
- **Tier 3 (Cross-Feature Combinations)**: Major pairwise feature interactions $= \mathbf{10}$ tests minimum.
- **Tier 4 (Real-World Application Scenarios)**: Authentic Indian industrial corridor scenarios $= \mathbf{5}$ scenarios minimum.
- **Total Suite Minimum**: $\mathbf{115}$ automated tests.
