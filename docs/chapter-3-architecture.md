# Chapter 3 — System Analysis and Design (Reference Extract)

Source: "Designing a Web-Based Application Platform for Internship Placement
and Training for LASU Students" — Chapter 3. This file extracts the parts of
Chapter 3 that the build agent needs as working context. It is a reference,
not a replacement for the full chapter — if anything here seems to conflict
with the original PDF, the PDF is authoritative and the user should be asked.

---

## 3.1 Research Methodology (summary)

The platform is the LASU Internship Management and Development Platform — a
web-based system for internship placement and competency tracking across all
SIWES disciplines. The chapter covers system development approach,
architectural design, tools/technologies, UML modelling, database design,
and security considerations. The system must be scalable, secure, and
user-friendly, meeting the needs of LASU students, academic supervisors,
industry partners, and administrators in a fair and transparent framework.

## 3.2 System Development Methodology

Agile methodology with the Scrum framework. Agile was chosen specifically
because it supports iterative refinement of complex features: the Weighted
Sum Model matching algorithm, competency-based progress tracking, the
unified assessment framework, and the real-time monitoring system.
Development proceeds in sprints; each sprint delivers specific
functionality, ends with a working prototype tested and reviewed with
stakeholders (students, academic supervisors, industry partners,
administrators), and feeds continuous refinement.

**Implication for the build agent:** build and verify in small, demoable
increments per phase — this mirrors the same sprint logic the project
itself was designed under, and is consistent with the phased build plan in
AGENTS.md.

## 3.3 System Requirements

### 3.3.1 Functional Requirements

**FR1 — Student Onboarding (8-Step Wizard)**
- FR1.1: Collect student personal and academic information.
- FR1.2: Present 10 Job Families; after selection, display relevant
  sub-roles (single-select).
- FR1.3: Dynamically adapt suggested courses, skills, and experience
  prompts based on the selected Job Family.
- FR1.4: Compute and display a preliminary Fit Score after profile
  completion.

**FR2 — Student Skill Verification**
- FR2.1: Allow self-assessment of technical and soft skills using a
  5-level scale.
- FR2.2: Administer automated diagnostic tasks per Job Family (MCQ, coding
  challenges, scenario questions).
- FR2.3: Generate a verified skill profile showing discrepancies between
  claimed and verified levels.
- FR2.4: Direct students with skill gaps to recommended learning pathways.

**FR3 — Company Onboarding & Internship Posting**
- FR3.1: Company registration and admin verification.
- FR3.2: Post internships with title, description, location, duration,
  stipend, deadline.
- FR3.3: Specify required skill levels per Job Family and sub-role.
- FR3.4: Choose track type (Competitive or Equity/Developmental) for each
  posting; system enforces cycle-level minimum Equity quota (dynamic
  15-25% based on total slots offered and previous Fair Participation
  Score).

**FR4 — Rotation Benefits Engine**
- FR4.1: Require companies to accept a balanced mix of Tier 1, 2, and 3
  students within each track (enforced by the Fair Allocation Engine at
  cycle level).
- FR4.2: Display benefit banners explaining the value of Equity Track
  participation.
- FR4.3: Auto-generate an end-of-internship performance report (CSV or
  printable HTML) with intern metrics, team benchmarks, and mentorship
  effectiveness.
- FR4.4: Display reputation badges (Fair Participation Score, Intern
  Satisfaction, Full-Time Offer Rate) on company profiles, visible to all
  LASU students.

**FR5 — Intelligent Matching & Fair Allocation**
- FR5.1: Calculate category-aware Fit Score using weights that vary by Job
  Family.
- FR5.2: Implement Dual-Track Fair Allocation — strict skill filter only on
  the Competitive Track; forced T1→T2→T3 interleaving on the Equity Track
  with cycle-level quota enforcement.
- FR5.3: Only show companies students from tiers the company has agreed to
  accept (balanced mix enforced).
- FR5.4: Display gap analysis for each recommendation.

**FR6 — Evidence Goals & Pulse Dashboard**
- FR6.1: Allow students to set 1-3 SMART micro-goals each Monday, linked
  to verified skills.
- FR6.2: Provide a "+ Pin evidence" button to submit URLs (or files) tagged
  to goals/skills.
- FR6.3: Prompt a Sunday pulse check (hit/miss toggle + one-sentence
  reflection, max 140 characters).
- FR6.4: Store all pulses in a `weekly_pulse` table.
- FR6.5: Allow industry supervisors to endorse, flag, or add coaching tips.
- FR6.6: Provide academic supervisors with trend charts and early-warning
  alerts.

**FR7 — Unified Assessment Framework (Approval-Based)**
- FR7.1: Store static internship learning objectives for each LASU
  department (pre-defined).
- FR7.2: When an internship is approved, automatically send department
  objectives to the host company.
- FR7.3: Company representative (Industry Supervisor) creates
  company-specific objectives using the university objectives as a guide.
- FR7.4: System merges both sets into a single unified framework with
  balanced counts (e.g. 5+5, 4+4).
- FR7.5: Academic supervisor reviews and approves or requests changes.
- FR7.6: Once approved, the unified framework is displayed on student,
  industry supervisor, and academic supervisor dashboards.
- FR7.7: The framework serves as the reference for weekly pulse and final
  assessment.

### 3.3.2 Non-Functional Requirements

1. **Security and Access Control** — RBAC restricts internship posting,
   application approval, and framework editing to authorised personnel.
   Authentication is stateless via JWT. All sensitive data encrypted in
   transit and at rest.
2. **Scalability** — must accommodate future expansion to additional Job
   Families and sub-roles, and scale to up to 10,000 students, without
   architectural redesign. Performance must not degrade as data volume
   grows.
3. **Usability** — interface must be intuitive for all user groups
   (students, companies, supervisors, admins) without extensive training.
   Onboarding and pulse submission specifically must be self-explanatory.
4. **Performance and Responsiveness** — Fit Score calculations must
   complete within 30 minutes to 1 hour for up to 100 active internships.
   Pulse submissions and supervisor endorsements must reflect in dashboards
   within 5-10 minutes. Alert generation must trigger within 24-48 hours
   of a missed pulse.
5. **Data Integrity and Accuracy** — validate all inputs (CGPA ranges,
   skill levels, week numbers, reflection length) to prevent erroneous data
   from corrupting matching, fair allocation, or assessment. All database
   transactions must be ACID compliant.
6. **Reliability and Availability** — 99.5% uptime during internship
   periods, automated daily backups, and recovery that restores the last
   consistent state without corruption.
7. **Maintainability** — MVC architecture with clear separation of
   concerns, so future developers can add Job Families or adjust fair
   allocation parameters without touching core logic.
8. **Compliance and Auditability** — log critical actions (application
   status changes, framework approvals, evidence flags) for SIWES
   compliance and dispute resolution; logs accessible to LASU
   administrators.

## 3.4 System Design — Modules

| Module | Description | Key Functions |
|---|---|---|
| Authentication & RBAC | User login, registration, role management | JWT issuance, password hashing, role-based routing |
| Job Family Manager | Manages 10 families, sub-roles, competency rubrics | CRUD operations; dynamic loading of family-specific data |
| Onboarding Wizard | 8-step dynamic form | Step progression, conditional fields, preliminary Fit Score |
| Skill Verification Engine | Adaptive tests per Job Family | MCQ & coding challenge auto-grading; manual verification fallback |
| Company Manager | Company registration, verification, profile | Admin verification, profile editing |
| Internship Posting | Posting with requirements, tier acceptance, track type | Form validation, storage, cycle-level quota enforcement |
| Rotation Benefits Engine | Balanced tier acceptance, performance reports, badges | Enforce balanced mix, generate CSV/HTML reports, display badges |
| Intelligent Matching Engine | Category-aware WSM, Dual-Track Fair Allocation, tier interleaving, gap analysis | Fit Score calculation, split into Competitive/Equity pools, interleaving |
| Pulse Dashboard | Weekly micro-goals, evidence pins, reflections | Goal setting, pin upload (URLs), hit/miss toggle, supervisor endorsement |
| Unified Assessment | Static department objectives, company objectives, approval workflow | Send objectives to company, merge, academic approval, framework display |
| Admin Panel | System configuration, user management, analytics | Verify companies, manage Job Families, configure Fair Allocation, view Equity Track analytics |

## 3.5 System Architecture

Client-server architecture. Client is a responsive, installable Progressive
Web Application built with **React.js and Tailwind CSS** — works across
desktop and mobile without app-store installation.

Server is built with backend services organised as:

- **Authentication Service** — JWT-based login, registration, RBAC.
- **Matching Engine** — category-aware Weighted Sum Model (WSM) for Fit
  Score calculation.
- **Fair Allocation Engine** — Dual-Track system (Competitive vs. Equity)
  with cycle-level equity quota and strict T1→T2→T3 interleaving.
- **Pulse Service** — weekly micro-goals, evidence pins, Sunday
  reflections, supervisor endorsements.
- **Unified Assessment Service** — static department objectives, company
  objective creation, merging, academic supervisor approval workflow.
- **Rotation Benefits Engine** — end-of-internship performance reports,
  reputation badge updates, benefit banners.

> Note: Section 3.5/3.6 of the source PDF describes the backend
> conceptually as "Express.js (TypeScript)" in one early paragraph, but
> section 3.8 (Tools and Technologies) is explicit and consistent throughout
> that the actual backend implementation is **Python 3.10+ with FastAPI**,
> with Uvicorn as the ASGI server, SQLAlchemy (async) as the ORM, and
> Alembic for migrations. **FastAPI is the authoritative choice** — it is
> named repeatedly with justification (performance, automatic OpenAPI docs,
> async support, Pydantic validation) and is what the rest of Chapter 3
> builds on (FastAPI's native WebSocket support, FastAPI dependency
> injection for JWT). Build on FastAPI, not Express. If the user wants to
> revisit this, raise it with them rather than silently picking one.

Data storage:

- **PostgreSQL** — relational database for persistent storage of user
  profiles, internship data, job families, competencies, weekly pulse
  entries, unified frameworks, and assessment records.
- **Redis** — in-memory store for caching Fit Scores (speeds up repeated
  matching requests), session management, and temporary data such as email
  verification codes.

Real-time functionality (monitoring alerts such as missed pulses and
flagged evidence, supervisor notifications) uses WebSocket communication.
The source PDF's architecture diagram (Figure X) labels this layer
"Socket.io (Real-time Alerts)" in the diagram itself, while the
surrounding prose names "Python's websockets library" and, later in 3.8.3,
"FastAPI's built-in WebSocket support." **Treat FastAPI's native WebSocket
support as authoritative** (it keeps the real-time layer inside the same
FastAPI process rather than adding a Node-based Socket.io dependency
alongside a Python backend) — this is consistent with the rest of the
confirmed Python/FastAPI stack. Code is version-controlled with GitHub.

## 3.6 System Modelling — Use Case Summary

Primary actors: Student, Company Representative, Industry Supervisor,
Academic Supervisor, LASU Administrator. (Chapter 1's objectives and the
roles document also formalise a Head of Department actor distinct from the
Academic Supervisor — see `/docs/roles-and-responsibilities.md` for the
full six-role breakdown used for this build.)

- **Student:** register, complete onboarding wizard, view matched
  internships and Fit Scores, take skill verification tests, apply for
  internships, set weekly micro-goals, pin evidence, complete the Sunday
  pulse, view growth dashboard, submit competency-based logbook.
- **Company Representative:** post internships, choose track (Competitive
  or Equity), view tier-balanced shortlist/candidates, accept/decline
  applications, download performance reports.
- **Industry Supervisor:** view student pulse dashboard, endorse or flag
  evidence, add coaching tips, review logbook and provide feedback, help
  create the unified assessment framework.
- **Academic Supervisor:** view aggregated pulse data, receive alerts,
  approve the unified assessment framework, monitor progress.
- **LASU Administrator:** manage users and system settings, configure Job
  Families and fair allocation parameters, generate institutional reports.

## 3.7 Database Design — Core Entities (narrative)

i. **Users & Roles** — profile and authentication data for students,
   companies, supervisors, and administrators.
ii. **Job Families & Sub-roles** — the 10 occupational families and their
    dynamic sub-roles.
iii. **Student Selections** — a student's chosen Job Family and sub-roles
     from onboarding.
iv. **Department Objectives** — static SIWES learning objectives per LASU
    department.
v. **Internships & Requirements** — company postings, required skills,
   tier, and track type (Competitive/Equity).
vi. **Weekly Pulse** — replaces the traditional logbook: micro-goals,
    evidence pins, reflections, supervisor endorsements.
vii. **Unified Frameworks** — merged assessment objectives (university +
     company) and approval status.
viii. **Company Cycle Entitlements** — tier acceptance and Fair
      Participation Score for rotation benefits.

> The full field-level schema reconstructed from the source ER diagram
> (which is cut off at the page boundary in the original PDF, with several
> tables named in prose but not fully visible in the diagram) is in
> `/docs/database-schema.md`. Use that file, not this narrative summary,
> when generating SQLAlchemy models or Alembic migrations.

## 3.7 (second) — Data Collection

Datasets supporting matching and onboarding were drawn from:

i. **NUC SIWES Guidelines and LASU Curriculum Documents** — public NUC
   website and LASU departmental handbooks, used to identify faculties,
   departments, and typical internship learning objectives.
ii. **Job Family and Sub-role Definitions** — derived from industry job
    portals (LinkedIn, Indeed, Internshala) and the NUC Benchmark Minimum
    Academic Standards (BMAS) per discipline.
iii. **Skill Requirements and Company Preferences** — simulated from a
     review of 30 real internship postings on Nigerian job boards
     (Jobberman, LinkedIn Nigeria); typical skill levels, tier
     expectations, and willingness-to-train statements were extracted and
     generalised.
iv. **Department Learning Objectives** — representative examples created
    for five major faculties (Science, Engineering, Social Sciences,
    Management Sciences, Education) based on common SIWES report
    templates.

All collected data was structured into JSON files and pre-loaded into the
database for the prototype.

**Implication for the build agent:** when seeding the database for local
development/demo purposes, structure seed data the same way — JSON fixture
files per entity (job families, department objectives, sample internship
postings) loaded via a seed script, rather than hardcoded inline in
migrations.

## 3.8 Tools and Technologies (confirmed stack)

**Design:** Figma — low-fidelity wireframes and high-fidelity mockups for
the 8-step onboarding wizard, pulse dashboard, company shortlist, and admin
panels.

**Frontend:**
- Visual Studio Code (IDE)
- React.js (component-based UI, virtual DOM, installable PWA)
- TypeScript (static typing across the frontend)
- Tailwind CSS (utility-first styling, responsive by default)
- React Router (client-side routing for role-based dashboards)
- Axios (HTTP client, with interceptors attaching JWT tokens automatically)

**Backend:**
- Python 3.10+ with FastAPI (RESTful API, automatic OpenAPI docs, async
  support, Pydantic validation)
- Uvicorn (ASGI server)
- JWT (stateless auth, enforced via FastAPI dependency injection)
- WebSockets (FastAPI native — real-time alerts, live shortlist updates)

**Database and data management:**
- PostgreSQL (relational database)
- SQLAlchemy, async (ORM)
- Alembic (migrations — e.g. adding `track_type` to internships or
  `previous_fair_score` to companies, version-controlled)
- Redis (caching, sessions, temporary verification codes)
- TablePlus / pgAdmin (manual inspection and debugging during development)

This is the complete, confirmed technology list. Do not substitute any of
these without the user's explicit sign-off, since this stack is what the
project report defends.
