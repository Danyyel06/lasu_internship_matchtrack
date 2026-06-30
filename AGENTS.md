# AGENTS.md — LASU Internship Management and Development Platform

This file is read automatically by every Antigravity agent mission run inside
this project folder. It is the single source of truth for architecture,
design language, domain rules, and conventions. If anything in a prompt
contradicts this file, this file wins unless the user explicitly says
otherwise in that prompt.

Read this file in full before planning any mission. For UI work, also read
the relevant section of /docs/ui-spec.md and look at the matching folder
under /design-reference/ before writing any code. For data model or business
logic work, also read /docs/chapter-3-architecture.md and
/docs/database-schema.md.

---

## 1. What this project is

A Progressive Web Application for Lagos State University (LASU) that
digitises the entire SIWES (Student Industrial Work Experience Scheme)
internship lifecycle: student onboarding, intelligent matching, fair
allocation between strong and developing students, weekly progress
monitoring (the "Pulse"), and a unified assessment framework that merges
university and company learning objectives. It replaces paper applications,
paper logbooks, and uncoordinated communication between students, host
companies, and university staff.

There are six distinct user roles. Each role has its own dashboard, its own
navigation, and only the features and screens it is entitled to. Nothing
about the UI, permissions, or data access should ever be merged across
roles except shared low-level components (Button, Card, Modal, Badge,
Input, Avatar, etc.).

The six roles:

1. **Student** — builds a profile, gets matched to internships, applies,
   and once placed, submits weekly "Pulse" check-ins instead of a paper
   logbook.
2. **Company Representative** — registers the company, posts internships,
   reviews and accepts/declines applicants, registers Industry Supervisors,
   assigns them to accepted interns, and monitors interns at a high level.
3. **Industry Supervisor** — added by a Company Representative. Builds the
   company side of the Unified Assessment Framework, reviews weekly pulse
   submissions, and endorses/flags evidence with coaching tips. Entirely
   student-facing; no access to postings or company admin features.
4. **Head of Department** — the academic mirror of the Company
   Representative. Registers, gets verified, adds Academic Supervisors,
   assigns them to placed students from their department, and reviews
   departmental reports. No access to pulse content or framework approval.
5. **Academic Supervisor** — added by a Head of Department. Approves or
   requests changes to the Unified Assessment Framework, monitors pulse
   submissions from the university side, and receives missed-pulse alerts.
   No access to postings, applications, or company data.
6. **Super Admin** — verifies company and Head of Department accounts,
   manages all users, configures Job Families and Fair Allocation settings,
   sets cycle dates and thresholds, and generates institutional reports.
   Never touches individual students, pulse content, or assessment
   frameworks directly.

---

## 2. Architecture — do not deviate without asking the user first

- **Frontend:** React.js + TypeScript, styled with Tailwind CSS. Built and
  packaged as an installable Progressive Web Application (service worker +
  manifest.json), responsive across desktop and mobile.
- **Routing:** React Router, with role-based protected routes. A logged-in
  user must never be able to navigate to a route belonging to another role,
  even by typing the URL directly.
- **HTTP client:** Axios, with a request interceptor that automatically
  attaches the JWT access token to every authenticated call, and a response
  interceptor that handles 401s by redirecting to login.
- **Backend:** Python 3.10+, FastAPI, served by Uvicorn (ASGI). RESTful API,
  versioned under `/api/v1/`. Automatic OpenAPI docs enabled.
- **Data validation:** Pydantic models for every request and response body.
  No raw dicts crossing the API boundary.
- **ORM:** SQLAlchemy, async mode, for all database access.
- **Migrations:** Alembic. Every schema change must be a migration, never a
  manual `ALTER TABLE` run by hand outside version control.
- **Primary database:** PostgreSQL. ACID-compliant, relational integrity
  enforced with real foreign keys, not just application-level checks.
- **Cache / ephemeral store:** Redis, used for caching computed Fit Scores,
  session/token blacklisting if needed, and short-lived data such as email
  verification codes.
- **Real-time layer:** FastAPI's native WebSocket support, used for
  early-warning alerts (e.g. a student missing a pulse) and live updates to
  a company's applicant shortlist. Do not introduce a separate
  message-broker dependency for this — FastAPI's built-in WebSockets are
  sufficient at this scale.
- **Auth:** JWT, stateless. Access token + refresh token pattern.
  Role-based access control (RBAC) enforced server-side on every protected
  endpoint via a FastAPI dependency, never trusted from the frontend alone.
- **Version control:** Git, with meaningful commit messages per logical
  change, not one giant commit per mission.

Do not introduce a different frontend framework, a different backend
language, a different primary database, or a different auth scheme without
the user explicitly approving it first. The architecture above is what was
defended in the project's Chapter 3 and must match what gets built.

---

## 3. Design language

- Flat, modern visual style. No gradients, no heavy drop shadows.
- Cards: 12px border radius, subtle 1px borders, generous internal padding
  and whitespace between sections.
- **Primary colour:** deep blue — used for primary buttons, active nav
  items, and primary actions.
- **Success / Equity Track / progress:** teal green.
- **Warning / pending state:** amber.
- **Danger / missed pulse / flagged evidence / destructive actions:** red.
- **Typography:** Inter (or a comparable clean sans-serif). Headings medium
  weight, body text regular weight.
- **Responsive pattern:** for Student, Company Representative, Industry
  Supervisor, Head of Department, and Academic Supervisor — a left sidebar
  on desktop that collapses into a bottom tab bar on mobile, showing the
  most important 4-5 items with a "More" overflow item if needed. For
  Super Admin — a permanent, non-collapsing left sidebar on desktop; on
  mobile, a four-tab bottom bar (Dashboard, Verify, Users, Profile), with
  the remaining admin screens reachable through a "Quick Access" section
  on the dashboard rather than the tab bar itself.
- Status badges (Tier 1/2/3, application status, pulse status, framework
  status, account status) should always use consistent colour coding across
  every screen and every role — do not invent a new colour mapping for the
  same status in a different part of the app.

---

## 4. Core domain rules the agent must respect

These are the rules most likely to get flattened or oversimplified if not
stated explicitly. Treat every one of these as a hard constraint, not a
suggestion.

**Fit Score (Weighted Sum Model):**
A category-aware Weighted Sum Model calculates each student's Fit Score.
Weights are distributed across CGPA, Verified Skills, Project Experience,
and Coursework, and the weight distribution varies by Job Family (e.g.
Software and Technology might weight Skills heavily, while Legal and
Compliance might weight Coursework more). Weights for a given Job Family
must always sum to 100% — the Super Admin's Job Family edit screen enforces
this with a live total indicator that turns red if it doesn't. The Fit
Score is recalculated whenever a student's profile changes meaningfully and
cached in Redis to avoid recomputing on every page load.

**Dual-Track Fair Allocation:**
Every internship posting is either Competitive Track or Equity and
Developmental Track.
- *Competitive Track:* strict skill filter. Only students who meet the
  required skill levels are shown to the company at all.
- *Equity Track:* students across all three tiers (Tier 1, Tier 2, Tier 3 —
  based on Fit Score banding) are accepted, with the system enforcing
  *forced T1 → T2 → T3 interleaving* in the order students are presented,
  and a *cycle-level minimum equity quota* (dynamic, 15-25%, calculated from
  total slots offered across the cycle and the company's previous Fair
  Participation Score) that the company must satisfy across its Equity
  Track postings as a whole, not necessarily on every single posting in
  isolation.
- A company only ever sees applicants from the tiers it has agreed to
  accept for that track.
- Every match recommendation includes a gap analysis: which required
  skills the student meets (green) and which they fall short on, with the
  exact level difference shown (red).

**Weekly Pulse (replaces the paper logbook):**
- **Monday:** student sets 1-3 SMART micro-goals, each linked to a specific
  verified skill.
- **During the week:** student can pin evidence (a URL or an uploaded file)
  to any goal, with a short description and a skill tag.
- **Sunday:** student marks each goal hit or missed and writes one
  reflection sentence, hard-capped at 140 characters.
- **After submission:** the assigned Industry Supervisor reviews the week,
  and can endorse or flag each piece of pinned evidence, plus leave an
  optional coaching tip up to 200 characters per piece of evidence.
- **Missed pulse alerting:** if a student misses two or more *consecutive*
  weekly submissions (the threshold is Super Admin-configurable, default
  two), the system automatically generates an early-warning alert visible
  to the Academic Supervisor. This must trigger within 24-48 hours of the
  missed deadline per the non-functional requirements.
- The Academic Supervisor can view everything in a student's pulse history
  and the Industry Supervisor's endorsements/flags, but does **not** leave
  their own direct feedback on individual pulse submissions — that channel
  belongs to the Industry Supervisor only. The Academic Supervisor's tool
  for direct intervention is "Log Contact," a timestamped note recorded
  outside the pulse system entirely.

**Unified Assessment Framework (a four-step approval workflow, not a static
document):**
1. Static department learning objectives already exist in the system per
   LASU department (configured by Super Admin in System Settings).
2. The moment an internship is approved and a student is placed, those
   department objectives are automatically sent to that student's assigned
   Industry Supervisor.
3. The Industry Supervisor writes up to 10 company-specific objectives,
   informed by but distinct from the university objectives, and submits.
4. The system merges both sets into one framework with balanced counts
   (e.g. 5 university + 5 company, or 4+4) and routes it to the student's
   Academic Supervisor.
5. The Academic Supervisor either approves it — making it immediately live
   and visible on the student's, Industry Supervisor's, and their own
   dashboard — or requests changes via written comments sent back to the
   Industry Supervisor, who revises and resubmits. This loop continues
   until approved.
6. Once live, the framework is the reference document for weekly pulse
   relevance and the final assessment at the end of the internship.

Do not simplify this into a single editable document with no approval
state machine — the multi-actor handoff and approval gate are the point of
this feature.

**Job Families and sub-roles must be data-driven, not hardcoded:**
There are 10 Job Families (Software and Technology, Engineering and
Manufacturing, Business and Management, Finance and Accounting, Health and
Life Sciences, Media and Communications, Education and Social Services,
Architecture and Built Environment, Science and Research, Legal and
Compliance), each with 6-10 sub-roles. Super Admin can edit names,
descriptions, sub-roles, and matching weights for any Job Family, and add
or remove families entirely. If any of this is hardcoded as UI strings or
enum values instead of loaded from the `job_families` / `sub_roles` tables,
the Super Admin configuration screens become non-functional. Always model
this as data.

---

## 5. Conventions

- All API routes versioned under `/api/v1/`.
- All dates and timestamps in ISO 8601, stored as UTC, converted for
  display only on the frontend.
- All currency in Nigerian Naira (NGN). Pick one consistent storage
  representation (e.g. integer kobo, or DECIMAL) the first time it's needed
  and use it everywhere afterward — do not mix representations across
  tables.
- Component naming: PascalCase for React components, camelCase for
  functions and variables, snake_case for database columns and Python.
- Every new screen built must be checked against the matching section of
  `/docs/ui-spec.md` for that specific role before being marked complete.
  "Looks roughly right" is not the bar — match the described layout,
  fields, and actions.
- Every protected backend endpoint must declare which role(s) may call it,
  and that check happens server-side via a dependency, never only inferred
  from what the frontend chooses to show or hide.
- Write Alembic migrations for every schema change. Never hand-edit the
  database outside a migration.

---

## 6. What NOT to do

- Do not invent new screens, fields, or flows that are not described in
  `/docs/ui-spec.md` or `/docs/roles-and-responsibilities.md`. If something
  seems missing or ambiguous, flag it back to the user rather than guessing
  silently.
- Do not merge or blend any two roles' dashboards, navigation, or
  permissions, even temporarily "to save time."
- Do not let the Equity Track quota or T1→T2→T3 interleaving be approximated
  with a simpler random shuffle — that defeats the actual feature.
- Do not let a student, Industry Supervisor, or any non-admin role see or
  edit Job Family definitions, matching weights, or Fair Allocation
  settings — those are Super Admin only.
- Do not trust frontend role checks as the security boundary — always
  enforce RBAC server-side too.
- Do not build the Unified Assessment Framework as a simple CRUD form
  without the approval state machine described in section 4 above.
- Do not skip writing a migration when changing the schema.
- Do not silently change the tech stack listed in section 2.

---

## 7. Reference documents in this project

- `/docs/roles-and-responsibilities.md` — full responsibilities of every
  role, used as the basis for permissions and use-case coverage.
- `/docs/ui-spec.md` — screen-by-screen UI description for all six roles,
  used as the basis for every layout, field, and component built.
- `/docs/chapter-3-architecture.md` — the defended system architecture,
  requirements, and technology choices from the project report.
- `/docs/database-schema.md` — the reconstructed entity-relationship
  reference, used as the starting point for all SQLAlchemy models and
  Alembic migrations.
- `/design-reference/` — folders of the actual designed screens per role,
  used as the visual ground truth alongside `ui-spec.md`.
