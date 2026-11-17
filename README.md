# Phenix / Project ReguFlow 🌿🔄
> **Viksit Bharat 2026 Showcase**: End-to-End B2B Circular Economy Platform for Industrial Byproduct Matching, Resource Exchange, and Impact Analytics.

[![Node.js](https://img.shields.io/badge/Node.js-v24.0.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Architecture](https://img.shields.io/badge/Zero--External--Dependencies-Native%20StdLib-blueviolet)](#architecture--technology-stack)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Project Overview

**Phenix / Project ReguFlow** is an enterprise-grade industrial symbiosis and circular economy exchange engineered to accelerate India's transition to sustainable manufacturing under the **Viksit Bharat 2026** national mission.

Industrial manufacturing produces millions of metric tons of mineral, chemical, and organic byproducts annually—fly ash from thermal power plants, blast furnace slag from steel mills, phosphogypsum from fertilizer plants, spent acids from chemical complexes, and bagasse from sugar refineries. Historically, these valuable secondary materials are either landfilled at high environmental and fiscal cost or transported inefficiently over long distances.

**ReguFlow** bridges industrial supply and demand:
1. **Algorithmic Industrial Symbiosis**: Automatically pairs industrial byproduct supply streams with compatible downstream manufacturing demands (e.g., fly ash to cement clinker replacement, spent acid to chemical neutralization).
2. **Geodetic Proximity Optimization**: Implements high-precision WGS84 spherical Haversine logistics math and spatial bounding box indexing to minimize heavy-freight transit distances and transportation carbon footprints.
3. **Automated Carbon Accounting & ESG Analytics**: Quantifies embodied $CO_2e$ avoided, landfill tonnage diverted, and material circularity indicator (MCI) metrics across Indian industrial corridors.
4. **Verifiable Data Integrity**: Built on a mathematically proven Boyce-Codd Normal Form (BCNF) relational core with transactional ACID guarantees for byproduct exchange contracts and settlement.

---

## 2. Team T0010 Details

| Attribute | Details |
|---|---|
| **Team Number** | `T0010` |
| **Group Lead** | **Ashwin Maurya** (Enrollment: `2501010099`, GitHub: [`WhiteShadow005`](https://github.com/WhiteShadow005)) |
| **Member 1 (Lead)** | Ashwin Maurya (`2501010099`) — Core Service, Gateway, Domain Schemas & Matchmaking |
| **Member 2** | Arnav Gupta (`2501010080`, GitHub: [`WhiteShadow005`](https://github.com/WhiteShadow005)) — Logistics Optimization, Deal State Machine & ESG Impact Engine |
| **Member 3** | Shaurya Pratap Singh (`2501010591`, GitHub: [`sps-exe`](https://github.com/sps-exe)) — Geolocation & Spatial Indexing |
| **Member 4** | Yashvardhan Mundhra (`2501010527`) — ESG Analytics & Impact Accounting |
| **Target DBMS Engine** | PostgreSQL 16 (Dual ANSI SQL / SQLite 3.38+ compatible) |
| **Benchmark Hardware** | MacBook Pro M4 |

---

## 3. Architecture & Technology Stack

Project ReguFlow follows a zero-external-dependency architectural paradigm running natively on modern **Node.js v24**.

```
┌────────────────────────────────────────────────────────────────────────┐
│               Member 1: Core Backend & Matchmaking Gateway             │
│        (REST Services, Domain Schemas, Matchmaking, Geolocation)       │
└───────────────┬────────────────────────┬──────────────────────┬────────┘
                │                        │                      │
                ▼                        ▼                      ▼
┌─────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐
│   Geolocation Service   │  │   Matchmaking Engine  │  │   Seed Data    │
│  - WGS84 Haversine Math │  │  - Material Compat    │  │  - 4 Clusters  │
│  - Bounding Box Pruning │  │  - Quantity Power Curve│  │  - Materials   │
│  - Hazmat Freight Model │  │  - Proximity Decay     │  │  - Listings    │
│  - Distance & Transit   │  │  - ESG Reliability    │  │  - Transactions│
└─────────────────────────┘  └───────────────────────┘  └────────────────┘
                │                        │                      │
                └────────────────┬───────┴──────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DBMS Core Layer (PostgreSQL 16)                      │
│  - CP1: 1NF -> 2NF -> 3NF -> BCNF Lossless Decomposition Proofs       │
│  - CP2: Complete ER Diagram (SVG/Mermaid) & Production DDL (10 Tables) │
│  - CP3: 8 Core SQL Workflows (Matchmaking, Haversine, Atomic TX, ESG)  │
│  - CP4: Execution Plans (EXPLAIN ANALYZE) & Index Benchmark Suite     │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Characteristics
- **Pure Node.js v24 Standard Library**: No external runtime `npm` dependencies. Leverages:
  - `node:http`: Low-overhead HTTP/REST Gateway and API router.
  - `node:sqlite` (`DatabaseSync`): Embedded relational database execution for instant local validation and deterministic testing.
  - `node:crypto`: Cryptographic UUIDv4 generation and content hashing.
  - `node:test` & `node:assert`: Built-in, high-speed test harness.
- **Dual ANSI SQL / PostgreSQL 14+ / SQLite Compatibility**: Schema DDL and SQL query workflows are authored to execute identically against PostgreSQL 16 production instances and SQLite embedded engines.

---

## 4. Member 1 Backend Core Services & Matchmaking Gateway

As specified for Member 1, the core backend implements four foundational services:

### 4.1 Domain Models & Schemas
- **Organizations**: Industrial enterprises categorized by industry sector (Chemicals, Metallurgy, Cement, Power, Textiles) with CIN, GSTIN, and validated ESG rating ($0-100$).
- **Facilities**: Physical production sites with WGS84 decimal coordinates (`latitude`, `longitude`), corridor assignment, and environmental clearance status.
- **Material Catalog**: Standardized byproduct taxonomy mapping physical states (`SOLID`, `LIQUID`, `GAS`, `SLURRY`), UN hazard classifications, and baseline embodied carbon offset coefficients ($\text{kg } CO_2e / \text{ton}$).
- **Byproduct Supply Listings**: Real-time batch listings with purity percentages, minimum order quantities (MOQ), unit pricing, and chemical composition profiles.
- **Demand Requirements**: Offtake tenders specifying acceptable purity ranges, quantity requirements, and maximum allowable logistics radii.
- **Matches & Exchanges**: Proposed and accepted matchmaking pairings with contractual unit prices, Incoterms, and settlement status.
- **Sustainability Metrics**: Computed life-cycle impact records ($CO_2e$ avoided, landfill mass diverted, and Material Circularity Indicator).

### 4.2 Algorithmic Matchmaking Engine
The matching engine ranks candidate byproduct listings against demand requirements using a multi-attribute weighted scoring algorithm:

$$\text{NetScore} = w_m \cdot S_{\text{mat}} + w_q \cdot S_{\text{qty}} + w_d \cdot S_{\text{dist}} + w_e \cdot S_{\text{esg}}$$

Where:
1. **Material Compatibility ($S_{\text{mat}}$)**: Enforces physical state parity, hazard tier admissibility, and purity satisfaction. If minimum purity is not met or physical states conflict, $S_{\text{mat}} = 0$ (hard prune).
2. **Quantity Satisfaction ($S_{\text{qty}}$)**: A non-linear power curve modeling fulfillment capacity:
   $$S_{\text{qty}} = \min\left(1.0, \left(\frac{Q_{\text{supply}}}{Q_{\text{demand}}}\right)^{0.8}\right)$$
3. **Logistics Proximity Decay ($S_{\text{dist}}$)**: An exponential distance decay function that penalizes long-haul transport emissions:
   $$S_{\text{dist}} = \max\left(0, \exp\left(-\frac{d}{d_0}\right)\right) \quad \text{where } d_0 = 300\text{ km}$$
4. **ESG & Reliability Composite ($S_{\text{esg}}$)**: Weighted harmonic mean of counter-party corporate ESG ratings and transaction completion track records.

### 4.3 Geolocation & Logistics Service
- **WGS84 Great-Circle Haversine Formula**:
  $$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
  $$d = 2 R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right) \quad (R = 6371.0088\text{ km})$$
- **Spatial Bounding Box Pruning**: Efficient lat/lon envelope pre-filtering ($\pm \Delta\phi, \pm \Delta\lambda$) to eliminate out-of-range facilities prior to trigonometric evaluation.
- **Hazmat Freight Cost & Transit Model**: Dynamic calculation of transport duration (incorporating Indian commercial vehicle average speeds) and tier-based freight pricing (incorporating Class A/B hazardous material surcharge multipliers).

### 4.4 Realistic Industrial Seed Data
Populates authentic industrial ecosystems across four premier Indian manufacturing corridors:
1. **Dahej & Ankleshwar (Gujarat)**: Petroleum refining, chlor-alkali, spent acid neutralization, and dyes/pigments.
2. **Pune-Chakan (Maharashtra)**: Automotive stamping, casting, machine tooling, and foundry slag.
3. **Coimbatore-Tirupur (Tamil Nadu)**: Textile processing, fly ash brick manufacturing, and textile effluent gypsum.
4. **Jamshedpur-Kalinganagar (Jharkhand / Odisha)**: Blast furnace slag, steel fabrication scrap, and coal power fly ash.

---

## 5. DBMS Academic & Industry Deliverables

All course project checkpoints for DBMS are consolidated under `dbms/`:

| Checkpoint | File Path | Focus & Deliverable Description |
|---|---|---|
| **CP1: Normalization** | `dbms/01_normalization.md` | Formal 1NF, 2NF, 3NF, and BCNF normalization proofs with minimal functional dependency bases ($\mathcal{F}_c$), candidate key derivations, and lossless-join / dependency-preservation verification for all 10 platform relations. |
| **CP2: ER Diagram & Schema** | `dbms/02_er_diagram.mmd`<br>`dbms/02_er_diagram.svg`<br>`dbms/03_schema.sql` | Conceptual, logical, and physical entity-relationship representations. Production PostgreSQL 16 DDL defining 10 tables, UUID PKs, referential integrity cascades, domain `CHECK` constraints, and composite B-tree / spatial bounding indexes. |
| **CP3: Platform SQL Queries** | `dbms/04_queries.sql` | 8 production SQL workflows: multi-criteria matchmaking, spatial Haversine proximity calculation, atomic exchange transaction with stock deduction, and regional ESG impact analytics. |
| **CP4: Execution Plans & Benchmarks** | `dbms/05_query_timings.md`<br>`dbms/plans/*.txt` | Raw PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` query plans comparing unindexed baseline scans vs index-accelerated executions, accompanied by runtime timing benchmarks on MacBook Pro M4. |

---

## 6. Directory Structure

```
c:\Users\spsso\OneDrive\Desktop\AP - Project\
├── .gitignore                     # Git ignore specifications
├── package.json                   # Zero-dependency Node.js v24 manifest & scripts
├── team.json                      # Academic team metadata (T0010)
├── README.md                      # Comprehensive project documentation
├── PROJECT.md                     # Architecture specification & module ownership
├── TEST_INFRA.md                  # Test runner & verification standards
├── dbms/
│   ├── 01_normalization.md        # CP1: Relational normalization proofs
│   ├── 02_er_diagram.mmd          # CP2: Mermaid ER diagram source
│   ├── 02_er_diagram.svg          # CP2: Vector SVG diagram rendering
│   ├── 03_schema.sql              # CP2: PostgreSQL / ANSI SQL production DDL
│   ├── 04_queries.sql             # CP3: 8 core production SQL queries
│   ├── 05_query_timings.md        # CP4: Execution timing & benchmark report
│   └── plans/                     # CP4: EXPLAIN (ANALYZE, BUFFERS) query plans
├── docs/
│   ├── ARCHITECTURE_PLAN.md       # High-level architecture and design document
│   ├── RESEARCH_SUMMARY.md        # Research notes on industrial byproduct markets
│   └── TEAM_BRIEFING_PROMPT.md    # Member coordination brief
├── src/
│   ├── index.js                   # Application entry point
│   ├── db/
│   │   ├── database.js            # SQLite / PostgreSQL database connection manager
│   │   └── schema.js              # Database initialization & DDL runner
│   ├── models/                    # Pure JS domain entities and validation rules
│   │   ├── organization.js
│   │   ├── facility.js
│   │   ├── material.js
│   │   ├── listing.js
│   │   ├── demand.js
│   │   ├── match.js
│   │   ├── transaction.js
│   │   └── esg.js
│   └── services/
│       ├── geolocation.js         # Geodesy math, bounding box & logistics costing
│       └── matchmaking.js         # Multi-criteria matchmaking & ranking algorithm
├── scripts/
│   ├── seed.js                    # Deterministic Indian industrial corridor seeder
│   ├── verify_dbms.js             # DDL and SQL query verification harness
│   └── benchmark.js               # Latency & throughput benchmarking script
└── tests/
    ├── unit/
    │   ├── geolocation.test.js    # Unit tests for Haversine & logistics
    │   ├── matchmaking.test.js    # Unit tests for matching algorithms
    │   └── schema.test.js         # Unit tests for domain models & constraints
    └── e2e/
        ├── runner.js              # E2E test runner orchestrator
        ├── tier1_features.test.js # Core workflow acceptance tests
        ├── tier2_boundaries.test.js# Geodesy & purity boundary tests
        ├── tier3_combinations.test.js # Multi-criteria matchmaking tests
        └── tier4_scenarios.test.js # Industrial corridor symbiosis scenarios
```

---

## 7. Setup & Execution Instructions

### Prerequisites
- **Node.js**: Version `24.0.0` or higher (verified with Node.js v24.22.0).
- **External Dependencies**: None required (Zero `npm install` necessary).

### Repository Remotes
This workspace is aligned with two designated repositories:
- `origin`: [`https://github.com/WhiteShadow005/Project_ReguFlow_AP_2026.git`](https://github.com/WhiteShadow005/Project_ReguFlow_AP_2026.git) (Project ReguFlow AP Deliverables)
- `phenix`: [`https://github.com/ashwincraft80/Phenix.git`](https://github.com/ashwincraft80/Phenix.git) (Phenix Core Platform)

### Verification & Testing Commands

#### 1. Validate Project Manifests
Verify JSON syntax and schema compliance for `package.json` and `team.json`:
```powershell
node -e "JSON.parse(require('fs').readFileSync('package.json')); JSON.parse(require('fs').readFileSync('team.json')); console.log('JSON VALID')"
```

#### 2. Run Database Seeding
Populate the 4 Indian industrial corridors with authentic organizations, materials, listings, and demands:
```powershell
node scripts/seed.js
```

#### 3. Run Automated Test Suites
Execute the entire test suite using Node.js native test runner:
```powershell
node --test tests/unit/*.test.js tests/e2e/*.test.js
```

Run unit tests exclusively:
```powershell
node --test tests/unit/*.test.js
```

Run end-to-end integration tests:
```powershell
node --test tests/e2e/*.test.js
```
