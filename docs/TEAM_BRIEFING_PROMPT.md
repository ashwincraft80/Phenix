# ReguFlow Team Briefing Prompt (Team T0010)

> **Instructions for Use**: Copy and paste the prompt below into your team communication channel or subagent dispatch to brief Ashwin Maurya, Arnav Gupta, and Yashvardhan Mundhra on their respective development boundaries, Git branch conventions, and deliverable commitments for the Viksit Bharat 2026 Hackathon.

---

```markdown
# Team T0010 Briefing: ReguFlow Statutory Compliance Platform (Viksit Bharat 2026)

Welcome Team T0010! This briefing outlines our architectural division, file ownership boundaries, interface contracts, and Git workflow for **ReguFlow** — our statutory regulatory compliance automation platform built for Viksit Bharat 2026.

We are adhering to a strict **modular isolation architecture** with **zero external runtime dependencies** (Node.js v24 native: `node:http`, `node:sqlite`, `node:crypto`, `node:test`). Every member owns a dedicated branch, directory tree, and commit prefix. **Do NOT edit files assigned to another member without coordination.**

---

## 👥 Contributor Assignments & Module Boundaries

### 🔹 Member 1: Ashwin Maurya (@ashwincraft80 — Group Lead)
- **Assigned Module**: Core HTTP Service Gateway, Route Dispatcher, Web UI Dashboard, Project Config.
- **Git Branch**: `feature/member-1-core-gateway`
- **Authorized Files**:
  - `src/server.js` (HTTP server instance, port listener, route wiring)
  - `src/routes/api.js` (REST route definitions for health, enterprises, filings, evaluation, analytics, audit)
  - `public/index.html` (Responsive regulatory dashboard layout)
  - `public/style.css` (Clean CSS styling, typography, status badges)
  - `public/app.js` (Fetch client, dynamic DOM rendering, filing trigger handler)
  - `package.json` & `README.md`
- **Commit Prefixes**: `feat(core):`, `feat(gateway):`, `feat(ui):`, `docs(readme):`
- **Primary Integration**: Connect `/api/*` endpoints to the service methods implemented by Members 2, 3, and 4. Ensure `GET /api/health` returns `{ status: "ok", timestamp: ..., database: "connected", version: "1.0.0" }`.

---

### 🔹 Member 2: Arnav Gupta (@WhiteShadow005 — Repo Owner)
- **Assigned Module**: Enterprise Directory & Filing Lifecycle Management, Statutory Policy Definitions.
- **Git Branch**: `feature/member-2-rules-engine`
- **Authorized Files**:
  - `src/modules/enterprises/service.js` (Enterprise querying, registration, turnover logic)
  - `src/modules/enterprises/validation.js` (CIN / Registration number formatting and validation)
  - `src/modules/filings/service.js` (Filing draft creation, status transitions, dossier assembly)
  - `src/modules/filings/status.js` (Status enum: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, FLAGGED_VIOLATION)
  - `src/rules/policy_registry.js` (Statutory rule catalog: CPCB/SPCB Air & Water standards, MCA thresholds)
- **Commit Prefixes**: `feat(enterprise):`, `feat(filing):`, `feat(rules):`
- **Primary Interface**: Provide `EnterpriseService.listAll(db)`, `EnterpriseService.getById(id, db)`, and `FilingService.listAll(db)`.

---

### 🔹 Member 3: Shaurya Pratap Singh (@sps-exe — Local Engineering Lead)
- **Assigned Module**: Compliance Rules Evaluation Engine, Relational Database Layer, DBMS Checkpoints CP1 & CP2.
- **Git Branch**: `feature/member-3-dbms-architecture`
- **Authorized Files**:
  - `src/engine/evaluator.js` (Deterministic rule evaluation against declared parameters, risk scoring)
  - `src/engine/scoring.js` (Enterprise compliance score calculation)
  - `src/db/connection.js` (SQLite connection pooling using `node:sqlite` DatabaseSync)
  - `src/db/seed.sql` (Seed dataset containing master regulations, authorities, sample filings, rules)
  - `dbms/01_normalization.md` (Formal 1NF -> 2NF -> 3NF -> BCNF mathematical proofs)
  - `dbms/02_er_diagram.mmd` & `dbms/02_er_diagram.svg` (Visual ER diagrams)
  - `dbms/03_schema.sql` (Relational DDL with tables, FK cascades, CHECK constraints, B-Tree indexes)
- **Commit Prefixes**: `feat(engine):`, `feat(dbms):`, `docs(dbms):`
- **Primary Interface**: Provide `evaluateFilingRules(filingId, db)` and export the initialized `DatabaseSync` instance from `src/db/connection.js`.

---

### 🔹 Member 4: Yashvardhan Mundhra
- **Assigned Module**: Regulatory Officer Review Workflow, Immutable Audit Ledger, DBMS Checkpoints CP3 & CP4.
- **Git Branch**: `feature/member-4-audit-lifecycle`
- **Authorized Files**:
  - `src/modules/officers/service.js` (Officer queue management, active case balancing, manual review sign-off)
  - `src/modules/audit/logger.js` (Cryptographic audit ledger with SHA-256 state hashing)
  - `src/modules/audit/verifier.js` (Hash chain integrity verification)
  - `src/modules/analytics/summary.js` (Executive analytics: compliance rate, high-risk counts, sector breakdown)
  - `dbms/04_queries.sql` (SQL queries R1-R8, W1-W2)
  - `dbms/05_query_timings.md` (Query timing benchmarks across 3 runs)
  - `dbms/plans/` (Standalone `EXPLAIN QUERY PLAN` outputs)
- **Commit Prefixes**: `feat(officers):`, `feat(audit):`, `perf(dbms):`
- **Primary Interface**: Provide `recordAuditEntry(db, entry)` and `AnalyticsService.getSummary(db)`.

---

## 🛠️ Git Workflow & Integration Sequence

1. **Clone & Checkout Your Branch**:
   ```bash
   git clone https://github.com/WhiteShadow005/Project_ReguFlow_AP_2026.git
   cd Project_ReguFlow_AP_2026
   git checkout -b <your-feature-branch>
   ```
2. **Make Atomic Commits** using your authorized commit prefixes (e.g. `feat(enterprise): add CIN validation`).
3. **Run Pre-Merge Verification**:
   ```bash
   node --test tests/*.test.js
   ```
4. **Integration Order into `main`**:
   - Step 1: Member 3 merges `feature/member-3-dbms-architecture` (DDL & DB Connection).
   - Step 2: Member 2 merges `feature/member-2-rules-engine` (Enterprise & Filing Lifecycle).
   - Step 3: Member 4 merges `feature/member-4-audit-lifecycle` (Audit Ledger & Officer Workflow).
   - Step 4: Member 1 merges `feature/member-1-core-gateway` (REST Routes & Dashboard UI).

Let's build a stellar, explainable platform for Viksit Bharat 2026!
```
