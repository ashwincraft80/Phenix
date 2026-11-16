# Project: ReguFlow (Viksit Bharat 2026 Hackathon)

## Architecture
ReguFlow is a statutory regulatory workflow and compliance automation platform built for the Viksit Bharat 2026 initiative (Ease of Doing Business, MSME regulatory streamlining, and automated governance).
The system adopts an explainable, zero-external-dependency modular architecture powered by Node.js (v24 native runtime with built-in `node:http`, `node:sqlite`, and `node:test`) and ANSI SQL / SQLite / PostgreSQL dual-compatible relational storage.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Member 1: Core Service & Gateway                     │
│        (REST API Gateway, HTTP Server, Frontend Dashboard, Auth)       │
└───────────────┬────────────────────────┬──────────────────────┬────────┘
                │                        │                      │
                ▼                        ▼                      ▼
┌─────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐
│ Member 2: Rules Engine  │  │ Member 3: DBMS Core   │  │Member 4: Audit │
│  - Policy Validator     │  │  - Schema & DDL       │  │  - Audit Logs  │
│  - Threshold Evaluator  │  │  - Normalization (3NF)│  │  - Lifecycle   │
│  - Compliance Scoring   │  │  - Query Optimizer    │  │  - Analytics   │
│  - Statutory Logic      │  │  - Execution Plans    │  │  - Exec Summary│
└─────────────────────────┘  └───────────────────────┘  └────────────────┘
```

### Team 0010 Contributor Boundaries & Directory Ownership
1. **Member 1 (Ashwin Maurya / ashwincraft80 — Group Lead)**:
   - Module: Core Service, HTTP / REST API Gateway, Frontend UI Dashboard, Project Config.
   - Files: `src/server.js`, `src/routes/api.js`, `public/*`, `package.json`, `README.md`.
   - Branch: `feature/member-1-core-gateway` | Commit prefix: `feat(core):`, `feat(gateway):`, `feat(ui):`.
2. **Member 2 (Arnav Gupta / WhiteShadow005 — Repo Owner)**:
   - Module: Enterprise & Filing Lifecycle Management, Statutory Policies.
   - Files: `src/modules/enterprises/`, `src/modules/filings/`, `src/rules/`.
   - Branch: `feature/member-2-rules-engine` | Commit prefix: `feat(enterprise):`, `feat(filing):`, `feat(rules):`.
3. **Member 3 (Shaurya Pratap Singh / sps-exe — Local User)**:
   - Module: Compliance Evaluation Engine, DBMS Architecture, CP1 Normalization, CP2 ER Diagram & Schema.
   - Files: `src/engine/evaluator.js`, `dbms/01_normalization.md`, `dbms/02_er_diagram.*`, `dbms/03_schema.sql`, `src/db/`.
   - Branch: `feature/member-3-dbms-architecture` | Commit prefix: `feat(engine):`, `feat(dbms):`, `docs(dbms):`.
4. **Member 4 (Yashvardhan Mundhra)**:
   - Module: Officer Review Workflow, Immutable Audit Ledger, CP3 Queries, CP4 Timing & Execution Plans.
   - Files: `src/modules/officers/`, `src/modules/audit/`, `src/modules/analytics/`, `dbms/04_queries.sql`, `dbms/05_query_timings.md`, `dbms/plans/`.
   - Branch: `feature/member-4-audit-lifecycle` | Commit prefix: `feat(officers):`, `feat(audit):`, `perf(dbms):`.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Problem Statement & Repo Research | Comprehensive synthesis of `ashwincraft80/Phenix` and `WhiteShadow005/Project_ReguFlow_AP_2026` | M1 | Survey |
| 2 | 4-Member Modular Architecture Plan | Detailed division of responsibilities, directory boundaries, and Git workflow | M1 | Survey |
| 3 | Team Briefing Prompt | Copy-pasteable prompt instructing the 3 team members on their assigned roles | M1 | Survey |
| 4 | DBMS CP1: Database Normalization | Formal 1NF -> 2NF -> 3NF/BCNF proofs with explicit functional dependencies | M1 | Survey / CHECKPOINTS.md |
| 5 | DBMS CP2: ER Diagram & DDL Schema | Complete Mermaid/visual ER diagram and production-grade SQL DDL with constraints and indexes | M1 | Survey / CHECKPOINTS.md |
| 6 | DBMS CP3: Core Transaction & Reporting Queries | 8+ SQL queries labeled R1-Rn, W1-Wn with JOINs, aggregations, window functions, CTEs | M1 | Survey / CHECKPOINTS.md |
| 7 | DBMS CP4: Query Timings & Execution Plans | Performance benchmark table (3 runs, avg, scan type) and plans in `dbms/plans/` | M1 | Survey / CHECKPOINTS.md |
| 8 | Explainable Node.js Backend Service | Native Node.js REST API with zero external npm dependencies and auto-seeding | M2 | ORIGINAL_REQUEST §R3 |
| 9 | Relational Database Integration | Integrated SQLite backend using Node.js v24 `node:sqlite` with ANSI SQL compatibility | M2 | ORIGINAL_REQUEST §R3 |
| 10 | Lightweight Frontend Dashboard | Single-page HTML/CSS/JS dashboard for Member 1 displaying live metrics and evaluation trigger | M2 | ORIGINAL_REQUEST §R3 |
| 11 | Local Git Repository Initialization | Local Git setup with `main` branch and remote `origin` pointing to target GitHub repo | M3 | ORIGINAL_REQUEST §R4 |
| 12 | Modular Commit History | Clean, organized Git commits partitioned across the 4 member boundaries | M3 | ORIGINAL_REQUEST §R4 |
| 13 | E2E Verification & Test Suite | Automated test suite validating all REST endpoints, DB constraints, and queries | M3 | Acceptance Criteria |
| 14 | Forensic Integrity Audit | Systematic anti-cheating, static analysis, and runtime verification | M3 | Integrity Forensics |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Research, Architecture & DBMS Checkpoints CP1–CP4 | R1 docs (`docs/`) & complete DBMS assets (`dbms/`) | none | IN_PROGRESS |
| 2 | Node.js Backend Service & Lightweight UI | R3 explainable Node.js REST API (`src/`), auto-seeding DB, and UI (`public/`) | M1 | PLANNED |
| 3 | Git Repository Setup, Modular History & E2E Gate | R4 Git setup, modular commit history by member, E2E verification (`tests/`, `TEST_READY.md`) | M1, M2 | PLANNED |

---

## Interface Contracts

### Gateway (`src/server.js`, `src/routes/api.js`) ↔ Modules
- **Health Check**: `GET /api/health` -> `{ status: "ok", timestamp: ISO8601, database: "connected", version: "1.0.0" }`
- **Enterprises**: `GET /api/enterprises` -> `[{ enterprise_id, registration_number, company_name, industry_sector, compliance_score }, ...]`
- **Filings**: `GET /api/filings` -> `[{ filing_id, enterprise_id, company_name, regulation_id, regulation_code, filing_reference, status, submission_date }, ...]`
- **Filing Evaluation**: `POST /api/filings/:id/evaluate` -> `{ filing_id, previous_status, new_status, risk_score, evaluations: [{ rule_code, outcome, evaluated_value, target_value }], audit_log_id }`
- **Analytics Summary**: `GET /api/analytics/summary` -> `{ total_filings, compliance_rate, high_risk_count, sector_distribution: [...] }`
- **Audit Logs**: `GET /api/audit-logs` -> `[{ log_id, filing_id, action, performed_by, previous_state, new_state, timestamp, checksum }, ...]`

### Rules Engine (`src/engine/evaluator.js`) ↔ Database Layer (`src/db/connection.js`)
- `evaluateFilingRules(filingId, db)`:
  - Input: `filingId: number`, `db: DatabaseSync`
  - Output: `{ passed: boolean, riskScore: number, outcomes: Array<{ ruleId, ruleCode, paramKey, declaredValue, targetValue, operator, outcome, violationDetails }> }`
  - Error handling: Throws Error if filing or rules not found; atomic execution.

### Audit Logger (`src/modules/audit/logger.js`) ↔ Database Layer
- `recordAuditEntry(db, { filingId, action, performedBy, previousState, newState, details })`:
  - Input: Parameters object with transition states
  - Computes SHA-256 checksum over `{ filingId, action, previousState, newState, timestamp, details }`
  - Output: `{ logId: number, checksum: string }`

---

## Code Layout
```
c:\Users\spsso\OneDrive\Desktop\AP - Project\
├── .gitignore
├── README.md
├── package.json
├── team.json
├── docs/
│   ├── RESEARCH_SUMMARY.md
│   ├── ARCHITECTURE_PLAN.md
│   └── TEAM_BRIEFING_PROMPT.md
├── dbms/
│   ├── 01_normalization.md
│   ├── 02_er_diagram.mmd
│   ├── 02_er_diagram.svg
│   ├── 03_schema.sql
│   ├── 04_queries.sql
│   ├── 05_query_timings.md
│   └── plans/
│       ├── R1_enterprise_history.plan.txt
│       ├── R2_officer_queue.plan.txt
│       ├── R3_sector_compliance.plan.txt
│       ├── R4_authority_tat.plan.txt
│       ├── R5_violation_breakdown.plan.txt
│       ├── R6_high_risk_cte.plan.txt
│       ├── R7_officer_workload_window.plan.txt
│       ├── R8_filing_dossier_join.plan.txt
│       ├── W1_create_filing.plan.txt
│       └── W2_record_evaluation.plan.txt
├── src/
│   ├── server.js
│   ├── db/
│   │   ├── connection.js
│   │   └── seed.sql
│   ├── engine/
│   │   └── evaluator.js
│   ├── modules/
│   │   ├── enterprises/
│   │   ├── filings/
│   │   ├── rules/
│   │   ├── officers/
│   │   ├── audit/
│   │   └── analytics/
│   └── routes/
│       └── api.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── tests/
    ├── api.test.js
    ├── db.test.js
    └── e2e.test.js
```
