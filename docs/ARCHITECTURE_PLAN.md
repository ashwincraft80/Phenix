# ReguFlow: Modular Codebase Architecture & Team Workflow Plan

**Hackathon Track**: Viksit Bharat 2026 — Regulatory Governance (Team T0010)  
**Document Version**: 1.0.0  
**Target Git Repository**: `WhiteShadow005/Project_ReguFlow_AP_2026`  

---

## 1. Architectural Philosophy

ReguFlow is structured around three core design tenets:
1. **Strict Modular Isolation**: Each contributor owns an independent functional subsystem with discrete file boundaries. Changes in one module cannot mutate private internal states of another module.
2. **Contract-First Communication**: Inter-module communication occurs strictly via documented interface signatures and relational database schema contracts.
3. **Zero-Dependency Native Standard**: The entire platform runs on native Node.js v24 (`node:http`, `node:sqlite`, `node:crypto`, `node:test`) and standard ANSI SQL, ensuring zero supply-chain vulnerabilities, lightning-fast boot times, and instant local verification without `npm install`.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Member 1: Core Service Gateway & Web UI                         │
│                    src/server.js, src/routes/api.js, public/*                          │
└───────────────┬────────────────────────────┬─────────────────────────────┬─────────────┘
                │                            │                             │
                ▼                            ▼                             ▼
┌──────────────────────────────┐ ┌───────────────────────────────┐ ┌─────────────────────┐
│  Member 2: Lifecycle Module  │ │    Member 3: Engine & DBMS    │ │   Member 4: Audit   │
│  - Enterprise Management     │ │  - Rules Evaluation Engine    │ │  - Officer Workflow │
│  - Filing Lifecycle State    │ │  - Relational Schema (CP2)    │ │  - Immutable Ledger │
│  - Statutory Policy Rules    │ │  - Normalization Proofs (CP1) │ │  - Queries (CP3)    │
│  src/modules/enterprises/    │ │  src/engine/, src/db/         │ │  - Plans & Perf(CP4)│
│  src/modules/filings/        │ │  dbms/01_*, 02_*, 03_*        │ │  src/modules/audit/ │
│  src/rules/                  │ │                               │ │  dbms/04_*, 05_*,.. │
└──────────────────────────────┘ └───────────────────────────────┘ └─────────────────────┘
```

---

## 2. Contributor Ownership, Directory Boundaries & File Map

To eliminate Git merge conflicts during concurrent development, all 4 contributors operate within non-overlapping directory trees:

### Contributor 1: Ashwin Maurya (`@ashwincraft80` — Group Lead)
- **Assigned Module**: Core HTTP Service Gateway, Routing, Administrative Frontend Dashboard, Project Configuration.
- **Dedicated File Boundaries**:
  - `src/server.js` (HTTP server bootstrap, graceful shutdown, request dispatcher)
  - `src/routes/api.js` (REST API route handlers, JSON serialization, HTTP error middleware)
  - `public/index.html` (Single-page dashboard layout, statutory analytics overview)
  - `public/style.css` (Clean responsive CSS styling, status badge themes)
  - `public/app.js` (Client-side API fetch client, dynamic table rendering, filing trigger)
  - `package.json` (Root project metadata and zero-dependency scripts)
  - `README.md` (Project overview, quickstart instructions, and submission guide)
- **Git Branch**: `feature/member-1-core-gateway`
- **Authorized Commit Prefixes**: `feat(core):`, `feat(gateway):`, `feat(ui):`, `docs(readme):`

---

### Contributor 2: Arnav Gupta (`@WhiteShadow005` — Repository Owner)
- **Assigned Module**: Enterprise Directory & Filing Lifecycle Management, Statutory Policy Definitions.
- **Dedicated File Boundaries**:
  - `src/modules/enterprises/service.js` (Enterprise registration, profile retrieval, turnover categorization)
  - `src/modules/enterprises/validation.js` (CIN/Registration validation, PAN formatting)
  - `src/modules/filings/service.js` (Filing draft creation, submission state transitions, dossier assembly)
  - `src/modules/filings/status.js` (Filing state machine: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED/REJECTED)
  - `src/rules/policy_registry.js` (Statutory rule catalogs: SPCB Air/Water limits, MCA corporate limits)
- **Git Branch**: `feature/member-2-rules-engine`
- **Authorized Commit Prefixes**: `feat(enterprise):`, `feat(filing):`, `feat(rules):`

---

### Contributor 3: Shaurya Pratap Singh (`@sps-exe` — Local Engineering Lead)
- **Assigned Module**: Compliance Rules Evaluation Engine, Relational Database Core, DBMS Checkpoints CP1 & CP2.
- **Dedicated File Boundaries**:
  - `src/engine/evaluator.js` (Algorithmic comparator engine: evaluates numeric & string parameters against rule thresholds)
  - `src/engine/scoring.js` (Enterprise risk scoring and compliance rating algorithms)
  - `src/db/connection.js` (SQLite connection manager using native `node:sqlite`, statement caching)
  - `src/db/seed.sql` (Comprehensive seed dataset containing authorities, regulations, rules, enterprises, sample filings)
  - `dbms/01_normalization.md` (CP1: Formal UNF -> 1NF -> 2NF -> 3NF -> BCNF mathematical proofs)
  - `dbms/02_er_diagram.mmd` (CP2: Complete Mermaid Entity-Relationship diagram)
  - `dbms/02_er_diagram.svg` (CP2: Scalable vector graphic ER diagram for graphical inspection)
  - `dbms/03_schema.sql` (CP2: Relational DDL with tables, PKs, FK cascades, constraints, and B-Tree indexes)
- **Git Branch**: `feature/member-3-dbms-architecture`
- **Authorized Commit Prefixes**: `feat(engine):`, `feat(dbms):`, `docs(dbms):`

---

### Contributor 4: Yashvardhan Mundhra
- **Assigned Module**: Regulatory Officer Workflow, Immutable Audit Ledger, Analytics Aggregation, DBMS Checkpoints CP3 & CP4.
- **Dedicated File Boundaries**:
  - `src/modules/officers/service.js` (Officer queue balancing, assignment algorithm, review approval/rejection)
  - `src/modules/audit/logger.js` (Cryptographic audit ledger with SHA-256 state hashing)
  - `src/modules/audit/verifier.js` (Audit hash chain integrity verification)
  - `src/modules/analytics/summary.js` (Executive compliance metrics, sector health aggregation)
  - `dbms/04_queries.sql` (CP3: Core business transactions and analytical reporting queries R1–R8, W1–W2)
  - `dbms/05_query_timings.md` (CP4: Query performance benchmark across 3 runs, scan analysis, index rationale)
  - `dbms/plans/` (CP4: Execution plans R1_*.plan.txt, W1_*.plan.txt exported from `EXPLAIN QUERY PLAN`)
- **Git Branch**: `feature/member-4-audit-lifecycle`
- **Authorized Commit Prefixes**: `feat(officers):`, `feat(audit):`, `perf(dbms):`

---

## 3. Strict Inter-Module Interface Contracts

### 3.1 Gateway (`src/server.js`) ↔ Modules Contract
Every API route in `src/routes/api.js` delegates to the underlying module service functions. Service functions must return plain JavaScript objects or throw typed `Error` instances:

| Route | HTTP Method | Handler / Module Call | Expected Response Body |
|---|---|---|---|
| `/api/health` | `GET` | Inline gateway check | `{ status: "ok", timestamp: ISO8601, database: "connected", version: "1.0.0" }` |
| `/api/enterprises` | `GET` | `EnterpriseService.listAll(db)` | `[{ enterprise_id, registration_number, company_name, industry_sector, compliance_score }, ...]` |
| `/api/filings` | `GET` | `FilingService.listAll(db)` | `[{ filing_id, enterprise_id, company_name, regulation_id, filing_reference, status, submission_date }, ...]` |
| `/api/filings/:id/evaluate` | `POST` | `EvaluationEngine.evaluateFilingRules(id, db)` | `{ filing_id, previous_status, new_status, risk_score, evaluations: [...], audit_log_id }` |
| `/api/analytics/summary` | `GET` | `AnalyticsService.getSummary(db)` | `{ total_filings, compliance_rate, high_risk_count, sector_distribution: [...] }` |
| `/api/audit-logs` | `GET` | `AuditLogger.listRecent(db)` | `[{ log_id, filing_id, action, performed_by, state_hash, created_at }, ...]` |

### 3.2 Evaluation Engine Contract (`src/engine/evaluator.js`)
```javascript
/**
 * Evaluates all declared parameters in a filing against active compliance rules.
 * @param {number} filingId - Database ID of compliance filing
 * @param {DatabaseSync} db - Native SQLite connection instance
 * @returns {{
 *   filingId: number,
 *   previousStatus: string,
 *   newStatus: string,
 *   riskScore: number,
 *   evaluations: Array<{
 *     ruleId: number,
 *     ruleCode: string,
 *     parameterKey: string,
 *     declaredValue: number,
 *     thresholdValue: number,
 *     operator: string,
 *     outcome: 'PASS' | 'FAIL' | 'WARNING',
 *     penaltyInr: number,
 *     violationDetails: string | null
 *   }>,
 *   auditLogId: number
 * }}
 */
function evaluateFilingRules(filingId, db);
```

### 3.3 Cryptographic Audit Logger Contract (`src/modules/audit/logger.js`)
```javascript
/**
 * Writes an immutable audit log record with a cryptographic SHA-256 state hash.
 * @param {DatabaseSync} db
 * @param {{
 *   filingId: number | null,
 *   action: string,
 *   performedBy: string,
 *   previousState: string | object,
 *   newState: string | object,
 *   details?: string
 * }} entry
 * @returns {{ logId: number, stateHash: string }}
 */
function recordAuditEntry(db, entry);
```

---

## 4. Git Branch Conventions, Merge Strategy & Integration Order

### 4.1 Integration Order
Dependencies mandate a sequential merge sequence:
1. **Phase 1 (Base Layer)**: Merge `feature/member-3-dbms-architecture`
   - Supplies foundational DDL schema (`dbms/03_schema.sql`), database connection (`src/db/connection.js`), seed dataset (`src/db/seed.sql`), and CP1/CP2 deliverables.
2. **Phase 2 (Lifecycle & Policies)**: Merge `feature/member-2-rules-engine`
   - Leverages schema tables to implement enterprise & filing lifecycle services and statutory rule catalogs.
3. **Phase 3 (Audit, Workflow & Analytics)**: Merge `feature/member-4-audit-lifecycle`
   - Integrates officer review balancing, cryptographic audit logging, and CP3/CP4 query execution plans.
4. **Phase 4 (Gateway & Presentation)**: Merge `feature/member-1-core-gateway`
   - Binds all module endpoints to REST routes in `src/routes/api.js`, serves static assets from `public/`, and initiates server bootstrap.

### 4.2 Branching Rules & Pull Request Standard
- No direct commits to `main`.
- All branch merges must use standard non-fast-forward merge:
  ```bash
  git checkout main
  git merge --no-ff feature/member-X-... -m "merge(member-X): integrate <module-name> into main"
  ```
- Before creating a pull request or merge, every member must run:
  ```bash
  node --test tests/*.test.js
  ```
  Zero failed tests is a hard requirement for merge eligibility.
