# AGENTS.md — LASU Internship Management and Development Platform
# Single Source of Truth — Supersedes all previous AGENTS.md and AGENTS2.md files

This file is read automatically by every Antigravity agent mission run inside
this project folder. It is the **single source of truth** for architecture,
design language, domain rules, functional requirements, role portals, cross-role
workflows, database conventions, and everything an agent needs to build or extend
this project correctly.

Read this file **in full** before planning any mission. Do not begin writing code,
creating migrations, or scaffolding screens until you have read every section below.
For UI work, also read the matching section of `/docs/ui-spec.md` and the
corresponding folder under `/design-reference/`. For data model or business logic
work, also read `/docs/chapter-3-architecture.md` and `/docs/database-schema.md`.

If anything in a prompt contradicts this file, **this file wins** unless the user
explicitly overrides it in that same prompt.

---

## 1. What this project is

A Progressive Web Application for Lagos State University (LASU) that digitises the
entire SIWES (Student Industrial Work Experience Scheme) internship lifecycle:
student onboarding via an 8-step adaptive wizard, intelligent skill-based matching,
dual-track fair allocation between strong and developing students, bi-weekly evidence
logging with KYC-anchored photo proof and AI-generated scenario quizzes, a Monthly
Endorsement workflow for industry supervisors, and a unified assessment framework
that merges university learning objectives with the final approval process. It
replaces paper applications, paper logbooks, and uncoordinated communication between
students, host companies, and university staff.

There are **six distinct user roles**. Each role has its own dashboard, its own
navigation, and only the features and screens it is entitled to. Nothing about the
UI, permissions, or data access should ever be merged across roles except shared
low-level components (Button, Card, Modal, Badge, Input, Avatar, etc.).

### The six roles

**1. Student** — completes the 8-step onboarding wizard, verifies skills through
diagnostic tasks, receives ranked Fit Score-based internship recommendations with
gap analysis, applies for internships, and once placed, submits structured bi-weekly
evidence logs every Wednesday and Saturday (each containing four capped fields: Focus
Area, Core Action, The Blocker, The Takeaway), takes an AI-generated scenario quiz
after each Saturday log, and can view their own Monthly Review endorsements.

**2. Company Representative** — registers the company, awaits Super Admin
verification, posts internships with a Competitive or Equity Track designation,
reviews tier-balanced applicant shortlists produced by the Fair Allocation Engine,
accepts or declines applicants, registers Industry Supervisors via invitation,
assigns them to accepted interns, and monitors interns at a high level. Does not
see pulse or log content, framework detail, or per-student assessment data.

**3. Industry Supervisor** — account is created by invitation from a Company
Representative; never self-registers. Reviews each month's compiled student log
activity (the "Monthly Digest") and performs a **one-action Monthly Review**: either
**Endorse** (marking the month's progress satisfactory and locking the review) or
**Flag** (providing a mandatory brief comment and triggering an early-warning alert
to both the Academic Supervisor and the student). Has no access to internship
postings, applicant shortlists, company admin features, or the Unified Assessment
Framework building screens. Their portal is entirely student-facing.

**4. Head of Department (HOD)** — registers directly, verified by Super Admin,
adds Academic Supervisors via invitation, assigns them to placed students from their
department, monitors placement statistics and departmental reports, views log
submission compliance at aggregate level. Has no access to individual log content,
framework detail, or internship postings.

**5. Academic Supervisor** — account is created by invitation from a Head of
Department; never self-registers. Reviews the Unified Assessment Framework for each
assigned student (approves or requests changes). Monitors student log submissions
via the **Thumbnail Wall** (a masonry CSS grid of all KYC photo artifacts submitted
in the current period), drills into individual student records to see the photo
carousel, structured text reflections, and AI quiz scores. Receives early-warning
alerts when a student misses two or more consecutive bi-weekly log submissions.
Records interventions via "Log Contact." Does not leave per-evidence inline
feedback — that channel no longer exists in this system.

**6. Super Admin** — verifies Company Representative and Head of Department accounts,
manages all platform users, configures Job Families and Fair Allocation settings,
sets cycle dates and thresholds, generates institutional reports, and sets the
missed-log alert threshold (default: 2 consecutive missed submissions). Never
touches individual student logs, quiz content, or assessment frameworks directly.

---

## 2. Architecture — do not deviate without asking the user first

- **Frontend:** React.js + TypeScript, styled with Tailwind CSS. Built and packaged
  as an installable Progressive Web Application (service worker + manifest.json),
  responsive across desktop and mobile.

- **Routing:** React Router, with role-based protected routes. A logged-in user
  must never be able to navigate to a route belonging to another role, even by
  typing the URL directly. Every protected route is guarded by a client-side role
  check AND a server-side FastAPI dependency — both layers are mandatory.

- **HTTP client:** Axios, with a request interceptor that automatically attaches the
  JWT access token to every authenticated call, and a response interceptor that
  handles 401s by attempting a token refresh and, if that fails, redirecting to
  the login page.

- **Backend:** Python 3.11.9+, FastAPI, served by Uvicorn (ASGI). RESTful API,
  versioned under `/api/v1/`. Automatic OpenAPI docs enabled at `/docs`.

- **Data validation:** Pydantic models for every request and response body. No raw
  dicts crossing the API boundary.

- **ORM:** SQLAlchemy, async mode, for all database access. No synchronous
  SQLAlchemy patterns anywhere in the codebase.

- **Migrations:** Alembic. Every schema change must be a migration file, never a
  manual `ALTER TABLE` run outside version control. Migrations must be reversible.

- **Primary database:** PostgreSQL. ACID-compliant, relational integrity enforced
  with real foreign keys and check constraints, not just application-level logic.
  JSONB columns are used for variable-structure data (e.g. log field content,
  job family weights, internship objective lists) so that flexible structures are
  stored natively without additional junction tables.

- **Cache / ephemeral store:** Redis. Used for: caching computed Fit Scores (24-hour
  TTL), session/token blacklisting, email verification codes, and any other
  short-lived key-value data. Fit Score cache entries are invalidated whenever a
  student's profile changes meaningfully.

- **Real-time layer:** FastAPI's native WebSocket support. Used for: early-warning
  alerts when a student misses a bi-weekly log submission, live updates to a
  company's applicant shortlist, and Monthly Review endorsement notifications.
  Do not introduce a separate message-broker dependency (Kafka, RabbitMQ, etc.) —
  FastAPI's built-in WebSockets are sufficient at this scale.

- **Auth:** JWT, stateless. Access token + refresh token pattern. Role-based access
  control (RBAC) enforced server-side on every protected endpoint via a FastAPI
  dependency. The frontend role check is a UX convenience only — it is never the
  security boundary.

- **Backend service structure:** The FastAPI application is organised into the
  following core services, each in its own module:

  | Service | Responsibility |
  |---|---|
  | Authentication Service | JWT issuance, token refresh, bcrypt password hashing, RBAC dependency injection |
  | Matching Engine | Category-aware Weighted Sum Model (WSM) Fit Score computation; Redis cache management |
  | Fair Allocation Engine | Dual-Track logic; T1→T2→T3 interleaving; cycle-level equity quota enforcement |
  | Bi-Weekly Log Service | Wednesday and Saturday structured check-in intake; KYC photo artifact storage; server-side WAT timestamping; missed-log detection and alert dispatch |
  | AI Quiz Service | Post-Saturday scenario quiz generation from that week's log content; locked-screen enforcement (Window Blur / Page Visibility API response); quiz attempt recording and scoring |
  | Monthly Endorsement Service | Monthly Digest compilation; Endorse / Flag action processing; early-warning alert dispatch to Academic Supervisor and student on Flag |
  | Rotation Benefits Engine | End-of-internship performance report generation (CSV / printable HTML); reputation badge updates (Fair Participation Score, Intern Satisfaction, Full-Time Offer Rate); benefit banner content delivery |
  | Notification Service | In-app notification bell dispatch to all roles; WebSocket real-time push for critical alerts |
  | Framework Service | Unified Assessment Framework state machine; dispatch of LASU objectives to framework on placement confirmation; Academic Supervisor approve / request-changes workflow |

- **Version control:** Git. Meaningful commit messages per logical change, not one
  giant commit per mission. Monorepo structure with `/frontend` and `/backend` as
  the two top-level directories.

---

## 3. Design language

These rules apply to every screen, across every role, without exception.

- Flat, modern visual style. No gradients, no heavy drop shadows. Cards use subtle
  1px borders, 12px border radius, and generous internal padding.

- **Colour palette:**
  - Primary / CTA / active nav: **deep blue** (also rendered as a deep purple-blue
    in some screens — use consistently with the design files).
  - Success / Equity Track / progress / on-track: **teal green**.
  - Warning / pending / amber state: **amber**.
  - Danger / missed log / flagged review / destructive actions: **red**.
  - Neutral / locked / completed secondary: **dark grey / near-black**.

- **Typography:** Inter (or a comparable clean sans-serif). Headings medium weight,
  body text regular weight. Use consistent size scales — do not introduce arbitrary
  font sizes outside the established type scale.

- **Status badges** must use the same colour mapping everywhere across every role
  and every screen. Never invent a new colour for a known status type in a different
  part of the app. Reference colour constants, not hardcoded hex strings.

- **Responsive navigation pattern:**
  - For Student, Company Representative, Industry Supervisor, Head of Department,
    and Academic Supervisor: a left sidebar on desktop that collapses into a
    bottom tab bar on mobile (4-5 items, with a "More" overflow for anything beyond
    5).
  - For Super Admin: a **permanent, non-collapsing** left sidebar on desktop. On
    mobile: a four-tab bottom bar (Dashboard, Verify, Users, Profile), with
    remaining admin screens reachable through a "Quick Access" section on the
    dashboard.

- Screen layout must always be checked against `/docs/ui-spec.md` for the relevant
  role before marking a screen complete. "Looks roughly right" is not the bar.

---

## 4. Core domain rules — hard constraints

These are the rules most likely to be oversimplified or misunderstood. Every one of
them is a hard constraint, not a suggestion. If a requirement below conflicts with
something in a prompt, raise the conflict with the user rather than silently
simplifying.

---

### 4.1 Fit Score — Weighted Sum Model

A category-aware Weighted Sum Model calculates each student's Fit Score.
Weights are distributed across four components: CGPA, Verified Skills, Project
Experience, and Coursework. The weight distribution **varies by Job Family**
(e.g. Software and Technology weights Skills heavily; Legal and Compliance weights
Coursework more). Weights for any given Job Family must always sum to exactly 100% —
the Super Admin's Job Family configuration screen enforces this with a live total
indicator that turns red and disables the Save button whenever the sum deviates
from 100.

The Fit Score produces a tier assignment:
- **Tier 1 (T1):** High Fit Score band.
- **Tier 2 (T2):** Medium Fit Score band.
- **Tier 3 (T3):** Lower Fit Score band.

Tier bands and the exact numeric thresholds separating them are set by the Super
Admin in Fair Allocation Settings. The Fit Score is recalculated whenever a
student's profile changes meaningfully (CGPA update, new verified skill, new
project). Computed scores are cached in Redis with a 24-hour TTL. On a cache hit
the score must be returned in under 20 milliseconds; a cache miss triggers
recomputation followed by a cache write.

---

### 4.2 Dual-Track Fair Allocation

Every internship posting is designated as either **Competitive Track** or
**Equity and Developmental Track** at the time of posting. This designation cannot
be changed after students have begun applying.

**Competitive Track:**
Only students who meet all required skill levels for that posting are included in
the company's applicant shortlist. Students who fall short on even one required
skill are filtered out entirely at the database query level — they are never shown
to the company.

**Equity and Developmental Track:**
Students from all three tiers (T1, T2, T3) are eligible. The Fair Allocation
Engine enforces **forced T1 → T2 → T3 interleaving** in the order candidates are
presented to the company (T1 first candidate, T2 second, T3 third, T1 fourth, and
so on). Additionally, a **cycle-level minimum equity quota** (dynamically calculated
at 15–25% of total slots offered across the cycle, informed by the company's
previous Fair Participation Score) must be satisfied across the company's Equity
Track postings as a whole — not necessarily on every single posting in isolation.

A company only ever sees applicants from the tiers it has agreed to accept for a
given track. Every recommendation card includes a **gap analysis panel**: skills
the student meets are shown in green; skills where they fall short are shown in red
with the exact level difference (e.g. "+2 levels needed").

Do not approximate the interleaving with a random shuffle. The T1→T2→T3 order is
structurally enforced by the Fair Allocation Engine.

---

### 4.3 Bi-Weekly Evidence Log (replaces the old Weekly Pulse)

The paper logbook and the old weekly goal/reflection/evidence pulse system have been
**replaced entirely** by the Bi-Weekly Evidence Log. There is no weekly goal-setting
step, no Sunday reflection, no per-goal evidence pinning, and no per-goal coaching
tip from the Industry Supervisor. Any code, routes, or database tables that
implement the old pulse system must be replaced, not extended.

The new system works as follows:

**Wednesday check-in:**
The student submits a structured log entry with exactly four capped fields:
1. **Focus Area** — what area of work they focused on that day.
2. **Core Action** — the primary action taken.
3. **The Blocker** — any obstacle or challenge encountered.
4. **The Takeaway** — the key thing learned or concluded.

**Saturday check-in:**
The student submits another structured log entry with the same four capped fields
as the Wednesday entry.

**KYC photo capture (both check-ins):**
Each check-in requires the student to take a live photo using the device's rear
camera. Gallery uploads are **explicitly blocked** — the system must use the
browser's camera API constrained to `facingMode: "environment"` (rear camera) and
must not provide any gallery or file-picker fallback. This is an anti-fraud
requirement. The photo is uploaded immediately on capture and stored in the
`artifacts` table with a **server-generated West Africa Time (WAT) timestamp**.
The server timestamp is authoritative — client-side timestamps are not trusted for
artifact records.

**AI Scenario Quiz (after Saturday log only):**
Once the student submits their Saturday log entry, the AI Quiz Service generates a
5-question scenario-based quiz derived from the content of that week's two log
entries (Wednesday + Saturday). The quiz is unlocked only after the Saturday log is
submitted. The following anti-cheat rules apply:
- The quiz runs in a **locked-screen mode**.
- The system listens for both the `window blur` event and the Page Visibility API
  (`visibilitychange`) to detect tab-switching or app-switching.
- Switching away from the quiz tab/window during an active attempt **automatically
  fails that attempt** with no retry within the same session.
- This behaviour must be implemented in the browser using native DOM events — do not
  rely on browser extensions or backend polling alone.

**Storage:**
All log entries are stored in the `weekly_logs` table with separate columns for
Wednesday and Saturday field content (stored as JSONB). All photo artifacts are
stored in the `artifacts` table, foreign-keyed to the corresponding log entry, with
a server-generated WAT timestamp. AI quiz attempts (questions, student answers,
correct answers, scores) are stored in the `ai_quiz_attempts` table, foreign-keyed
to the corresponding `weekly_logs` row.

**Submission windows and missed-log detection:**
The Wednesday check-in window opens on Wednesday and closes at end-of-day Wednesday.
The Saturday check-in window opens on Saturday and closes at end-of-day Saturday.
If a student fails to submit either check-in, that counts as one missed submission.
If a student misses **two or more consecutive** bi-weekly submissions (either check-in
counts), the Bi-Weekly Log Service triggers an early-warning alert to the assigned
Academic Supervisor. The consecutive-miss threshold is configurable by the Super
Admin in System Settings (default: 2). The alert must be triggered within 24–48
hours of the missed deadline.

---

### 4.4 Monthly Endorsement by Industry Supervisor

At the end of each calendar month, the Monthly Endorsement Service compiles each
student's bi-weekly log submissions for that month into a read-only **Monthly
Digest** visible to their assigned Industry Supervisor. The Monthly Digest shows all
submitted Wednesday and Saturday log field content and the corresponding AI quiz
scores for that month.

The Industry Supervisor is restricted to **exactly two actions** on the Monthly
Digest:

**Endorse:**
Marks the month's progress as satisfactory. Locks the Monthly Review so it cannot
be altered. The endorsement is immediately visible on the Academic Supervisor's
dashboard. A notification is dispatched to the student confirming the endorsement.
No other feedback is captured — the Industry Supervisor does not write per-log
comments or per-field coaching tips.

**Flag:**
Indicates a concern with the month's progress. When the Industry Supervisor selects
Flag, the system presents a mandatory short comment field. The comment is required
before the Flag action can be submitted. On submission, the system immediately
dispatches an **early-warning alert** to both the **Academic Supervisor** and the
**student**. The alert includes the Industry Supervisor's comment verbatim.

The Industry Supervisor may not: endorse or flag individual log entries (only the
monthly digest as a whole), write per-entry coaching tips, set or edit assessment
objectives, or perform any other review action beyond Endorse/Flag.

The monthly_endorsements table tracks: student_id, industry_supervisor_id,
month_year (e.g. "2026-05"), action (ENDORSED / FLAGGED), flag_comment (nullable),
created_at (WAT timestamp), and is_locked (boolean set to true on submission).

---

### 4.5 Academic Supervisor Monitoring

The Academic Supervisor monitors their assigned students through the
**Thumbnail Wall** — a masonry CSS grid displaying all KYC photo artifacts submitted
by assigned students in the current period. Each thumbnail represents one artifact
upload. The grid allows the supervisor to visually audit photo compliance at a
glance. Clicking any thumbnail opens a **drill-down modal** containing:
- A swipeable image carousel showing the Wednesday and Saturday photos for that
  submission week.
- The structured text reflections (all four fields) for both the Wednesday and
  Saturday check-ins.
- The AI quiz score for that week, displayed as a colour-coded block (green for
  pass, red for fail), with an accordion that expands to show each question, the
  student's answer, and the correct answer.

The Academic Supervisor **does not** leave per-evidence inline feedback (no
endorse/flag on individual log entries — that channel no longer exists). Their
intervention tool is **Log Contact**: a timestamped note recording the method of
contact, date, and discussion outcome, visible to the HOD. Log Contact entries do
not automatically clear missed-log alerts.

The Academic Supervisor **does** have approve / request-clarification controls on the
overall weekly pulse view (§7.3.4 below) — these are workflow management actions
for logging their review state of a submission, not per-evidence annotations.

---

### 4.6 Missed-Log Alert Escalation

When the consecutive-miss threshold is reached for a student:

1. The Bi-Weekly Log Service generates a **Critical alert** visible in the
   Academic Supervisor's Alerts screen.
2. The alert shows: student name, department, count of consecutive missed
   submissions, date of last successful submission.
3. The Academic Supervisor can tap **Log Contact** → records method, date, and
   notes → entry is timestamped and visible to HOD.
4. The HOD sees this in their Notifications feed as a "Missed Log Alert" with a
   red left-border card and a **Review Students** CTA.
5. The Company Representative receives a notification: "Alert: [N] interns have
   missed consecutive bi-weekly log submissions."
6. The Industry Supervisor's Home dashboard shows a red-bordered intern card
   labelled `● Overdue`.
7. When the Industry Supervisor Flags a Monthly Review, a **separate** early-warning
   alert is dispatched immediately to both the Academic Supervisor and the student,
   regardless of whether the consecutive-miss threshold has been reached.
8. Alerts do **not** auto-resolve. They clear only when the student submits again
   and the consecutive-miss counter resets below the Super Admin-configured
   threshold.

---

### 4.7 Unified Assessment Framework

The Unified Assessment Framework (UAF) is a four-state document created
automatically when a student is placed. Its purpose is to give the student and their
Academic Supervisor a shared reference for what the internship should achieve from
an academic standpoint.

**Important change from the previous system:** The Industry Supervisor **no longer**
writes company-specific objectives into the framework. The framework is now driven
entirely by the LASU department learning objectives configured by the Super Admin.
The Framework Service is responsible for:

1. **INITIAL:** When a placement is confirmed (company accepts a student), the
   Framework Service automatically attaches the student's department's LASU learning
   objectives to a new framework record and notifies the Academic Supervisor that a
   framework is awaiting their review.

2. **PENDING_ACADEMIC_APPROVAL:** The Academic Supervisor reviews the framework
   and either approves it or requests changes with written comments.

3. **CHANGES_REQUESTED:** If changes are requested, the framework status moves to
   CHANGES_REQUESTED. A notification is dispatched to the relevant parties.
   In this simplified model, the Super Admin or a system operator may update
   department objectives in response. The Academic Supervisor then re-reviews.

4. **APPROVED:** Once approved, the framework becomes read-only and immediately
   visible on the student's dashboard and the Academic Supervisor's dashboard.
   No further edits are permitted by any role.

State machine:
```
INITIAL (auto-created on placement)
    │
    ▼ Framework Service dispatches LASU dept. objectives
PENDING_ACADEMIC_APPROVAL
    │
    ├──▶ Academic Supervisor approves  ──▶  APPROVED (read-only, live)
    │
    └──▶ Academic Supervisor requests changes
              │
              ▼
         CHANGES_REQUESTED
              │
              ▼ (Super Admin / system updates objectives; re-notifies Acad. Sup.)
         PENDING_ACADEMIC_APPROVAL  (loop back)
```

State visibility per role:

| State | Student | Industry Sup. | Academic Sup. | Company Rep | HOD |
|---|---|---|---|---|---|
| PENDING_ACADEMIC_APPROVAL | "Pending Approval" badge | Framework visible (read-only reference) | "Pending Your Approval" + action | — | — |
| CHANGES_REQUESTED | "Changes Requested" badge | Framework visible (read-only) | "Changes Requested" badge | — | — |
| APPROVED | Framework visible (read-only) | Framework visible (read-only) | Framework visible + Approved badge | Quick-link summary only | — |

The Company Representative **does not** see framework content. The HOD **does not**
see framework content. Neither role has any action on the framework.

Do not rebuild the old objective-setting flow for Industry Supervisors. Do not add
a framework editing screen to the Industry Supervisor portal.

---

### 4.8 Job Families — data-driven, never hardcoded

There are 10 Job Families:
Software and Technology · Engineering and Manufacturing · Business and Management ·
Finance and Accounting · Health and Life Sciences · Media and Communications ·
Education and Social Services · Architecture and Built Environment ·
Science and Research · Legal and Compliance

Each has 6–10 sub-roles. The Super Admin can edit names, descriptions, sub-roles,
and WSM weights for any Job Family, and add or remove families entirely. If any of
this is hardcoded as UI strings or enum values instead of loaded from the
`job_families` / `sub_roles` tables, the Super Admin configuration screens become
non-functional. Always model this as data.

---

### 4.9 Student Onboarding — 8-Step Adaptive Wizard

The student onboarding wizard collects the structured profile data needed to compute
the preliminary Fit Score. The eight steps are:

1. **Personal Information** — name, matric number, phone number, department, level.
2. **Academic Details** — CGPA (validated: 0.0–5.0), graduation year, faculty.
3. **Job Family Selection** — the student selects one of the 10 Job Families from
   a visually presented card grid. Selection triggers dynamic adaptation in all
   subsequent steps.
4. **Sub-Role Selection** — after Job Family selection, the relevant sub-roles are
   fetched from the `sub_roles` table and presented as single-select options.
5. **Skill Self-Assessment** — skills relevant to the selected Job Family are
   presented. The student rates each on a 5-level scale. These are self-declared
   and become the baseline for the skill verification diagnostic.
6. **Project Experience** — the student declares relevant projects, each with a
   title, description, technologies/skills used, and a duration.
7. **Coursework Declaration** — relevant completed courses, linked to the Job
   Family's coursework component, are declared.
8. **Profile Review + Fit Score Display** — a read-only summary of all entered
   data is shown. On confirmation, the backend computes the preliminary Fit Score
   using the Job Family's weight distribution from the database, assigns a Tier,
   and displays the result as a numerical score with T1/T2/T3 badge.

Conditional field rendering is implemented entirely in React component state —
there must be no page reloads between steps. The wizard can be saved and resumed
at any step before the final submission (progress is persisted server-side in the
student's profile record with a completion status).

---

### 4.10 Skill Verification

After onboarding, students complete skill verification to confirm their
self-declared skill levels. The system administers automated diagnostic tasks
appropriate to the selected Job Family:
- **MCQ** — multiple-choice knowledge questions.
- **Coding challenges** — for Software and Technology sub-roles.
- **Scenario questions** — situational judgement questions for non-technical
  Job Families.

The diagnostic generates a **verified skill profile** that shows, for each skill:
- The self-declared level.
- The verified level (from the diagnostic).
- Any discrepancy.

Students with skill gaps are directed to recommended learning pathways. The
**verified skill level** (not the self-declared level) is what the Matching Engine
uses in Fit Score computation and gap analysis. The `skills` table stores both
self-declared and verified levels per student-skill pair.

---

### 4.11 Rotation Benefits Engine

The Rotation Benefits Engine provides incentives for companies to participate in
the Equity Track:

- When a company selects the Equity/Developmental Track on the internship posting
  form, an **inline benefit banner** appears explaining the reputation badge system
  and the value of accepting students across all three tiers. This banner is
  informational — it does not block posting.
- At the end of an internship cycle, the engine auto-generates an
  **end-of-internship performance report** per intern (CSV or printable HTML)
  containing intern metrics, team benchmarks, and a mentorship effectiveness
  summary.
- **Reputation badges** (Fair Participation Score, Intern Satisfaction rate,
  Full-Time Offer Rate) are displayed on the company's public profile, visible to
  all LASU students browsing internship listings.
- The engine updates these badges after each cycle closes, based on the company's
  track record of accepting Equity Track students and intern outcome data.

---

## 5. Functional Requirements

Every agent building a feature must map it to the FR below and implement it
completely. Partial implementations of FRs are not acceptable.

### FR1 — Student Onboarding (8-Step Wizard)

- **FR1.1:** Collect student personal and academic information with full
  server-side Pydantic validation (CGPA range 0.0–5.0; matric format checked).
- **FR1.2:** Present all 10 Job Families dynamically from the `job_families` table.
  After selection, display relevant sub-roles (single-select) from the `sub_roles`
  table for that family.
- **FR1.3:** Dynamically adapt suggested courses, skill prompts, and project
  experience fields based on the selected Job Family. Prompts come from the database,
  not from hardcoded frontend strings.
- **FR1.4:** Compute and display a preliminary Fit Score after profile completion.
  Store the score and Tier assignment in the student's profile record and cache
  in Redis.

### FR2 — Student Skill Verification

- **FR2.1:** Allow self-assessment of technical and soft skills using a 5-level
  scale, with skills surfaced based on selected Job Family.
- **FR2.2:** Administer automated diagnostic tasks per Job Family: MCQ for all
  families, coding challenges for Software and Technology, scenario questions for
  non-technical families.
- **FR2.3:** Generate and persist a verified skill profile showing both self-declared
  and verified levels, and highlighting discrepancies.
- **FR2.4:** After verification, direct students with skill gaps to recommended
  learning pathways (external links or internal resources, depending on
  configuration).

### FR3 — Company Onboarding and Internship Posting

- **FR3.1:** Company self-registration form (name, CAC registration number, TIN,
  industry, contact details, supporting documents upload). Account locked pending
  Super Admin verification.
- **FR3.2:** Post internship with: title, description, location, duration (weeks),
  stipend range (stored in NGN), application deadline, Job Family, required
  sub-role.
- **FR3.3:** Specify required verified skill levels per sub-role for the posting
  (these drive the Competitive Track filter and the gap analysis).
- **FR3.4:** Choose track type (Competitive or Equity/Developmental) per posting.
  System enforces cycle-level minimum Equity quota (dynamic 15–25% based on total
  slots offered and previous Fair Participation Score) at the cycle level across
  all of the company's Equity Track postings, not per individual posting.

### FR4 — Rotation Benefits Engine

- **FR4.1:** Require companies to accept a balanced mix of T1, T2, and T3 students
  within each Equity Track posting (enforced by the Fair Allocation Engine at cycle
  level).
- **FR4.2:** Display the Equity Track benefit banner on the posting form inline when
  Equity/Developmental Track is selected.
- **FR4.3:** Auto-generate an end-of-internship performance report (CSV or
  printable HTML) with intern metrics, team benchmarks, and mentorship
  effectiveness data.
- **FR4.4:** Display reputation badges (Fair Participation Score, Intern
  Satisfaction, Full-Time Offer Rate) on company profiles, visible to all LASU
  students.

### FR5 — Intelligent Matching and Fair Allocation

- **FR5.1:** Calculate category-aware Fit Score using the WSM with Job Family-
  specific weights from the database.
- **FR5.2:** Implement Dual-Track Fair Allocation: strict skill filter on Competitive
  Track; forced T1→T2→T3 interleaving on Equity Track with cycle-level quota
  enforcement.
- **FR5.3:** Only show a company applicants from the tiers it has agreed to accept
  for that posting's track type.
- **FR5.4:** Display a gap analysis panel on every recommendation card and every
  applicant card: green for met requirements, red for shortfall with exact level
  difference shown.

### FR6 — Bi-Weekly Evidence Log and AI Assessment

- **FR6.1:** Present a structured check-in form on Wednesday and again on Saturday,
  each containing exactly four capped text fields: Focus Area, Core Action,
  The Blocker, The Takeaway. Enforce maximum character counts per field as defined
  in the UI spec.
- **FR6.2:** Enforce live rear-camera photo capture for each check-in. Gallery
  uploads and file-picker access are explicitly blocked. The camera must be
  constrained to the rear-facing camera (`facingMode: "environment"`). The photo
  is uploaded immediately on capture; the upload timestamp is server-generated in
  WAT and stored in the `artifacts` table.
- **FR6.3:** After the Saturday log is submitted for a given week, unlock a
  5-question AI-generated scenario quiz based on the content of that week's
  Wednesday and Saturday log entries. The quiz remains locked until the Saturday
  log is submitted.
- **FR6.4:** Implement the AI quiz in locked-screen mode using the `window blur`
  event and the Page Visibility API (`visibilitychange`). Tab-switching or
  app-switching during an active quiz attempt automatically fails that attempt.
  Record the failure reason with the attempt record.
- **FR6.5:** Store all log entries in the `weekly_logs` table. Store all photo
  artifacts in the `artifacts` table with a server-generated WAT timestamp. Store
  quiz attempts (questions, student answers, correct answers, score, pass/fail,
  any failure reason) in the `ai_quiz_attempts` table, foreign-keyed to
  `weekly_logs`.

### FR7 — Monthly Review (Industry Supervisor Endorse / Flag)

- **FR7.1:** The Industry Supervisor is restricted to **two primary actions** on the
  Monthly Review: **Endorse** or **Flag**. They do not set objectives, write
  per-log coaching tips, or fill out detailed evaluation forms of any kind. Any
  such screens from a previous implementation must be removed.
- **FR7.2:** If the Industry Supervisor selects **Endorse**, the system marks the
  month's progress as satisfactory, locks the Monthly Review record
  (`is_locked = true`), and makes the endorsement visible on the Academic
  Supervisor's dashboard. A notification is dispatched to the student.
- **FR7.3:** If the Industry Supervisor selects **Flag**, the system presents a
  mandatory short comment field. The Flag cannot be submitted without a comment.
  On submission, the system immediately dispatches an early-warning alert to both
  the Academic Supervisor and the student. The alert includes the Industry
  Supervisor's comment.
- **FR7.4:** A notification is dispatched to the Industry Supervisor at the start
  of each new month alerting them that the previous month's digest is ready for
  review. This notification appears in the in-app notification bell and as a
  Critical Tasks card on their Home dashboard.

---

## 6. Non-Functional Requirements

### NFR1 — Security and Access Control
RBAC enforced server-side via FastAPI dependency injection on every protected
endpoint. Authentication is stateless JWT. All sensitive data encrypted in transit
(TLS) and at rest. Manipulating the JWT role claim client-side must have zero effect
on data access — every endpoint independently verifies the role from the decoded
server-side token.

### NFR2 — Scalability
The architecture must accommodate up to 500 students without requiring structural
redesign. Performance must not degrade as data volume increases. Redis caching of
Fit Scores ensures recommendation screens load without triggering full recomputation
on every page view.

### NFR3 — Usability
All six user groups (students, company reps, industry supervisors, academic
supervisors, HODs, super admin) must be able to use their respective portals
effectively without extensive training. The 8-step onboarding wizard must be
completable in 10–15 minutes as stated in the wizard's intro copy.

### NFR4 — Data Integrity
All inputs validated at three layers: client-side React (UX feedback), server-side
Pydantic (authoritative validation returning 422 with field-level detail), and
PostgreSQL constraints (foreign keys, check constraints, ENUM types as final
backstop). All database transactions must be ACID compliant. No malformed data
should reach the database.

### NFR5 — Reliability and Availability
99.5% uptime target during active SIWES cycle periods. Automated daily backups.
Recovery must restore the last consistent state without corruption.

### NFR6 — Maintainability
MVC / service-layer architecture with clear separation of concerns. Job Family
weights and Fair Allocation parameters must be adjustable by the Super Admin through
the UI without any code changes.

### NFR7 — Compliance and Auditability
Critical actions (application status changes, framework approvals, Monthly Review
Endorse/Flag actions, user account verification/rejection, RBAC violations) must be
logged in an `audit_logs` table with: `user_id`, `action_type`, `entity_id`,
`before_state` (JSONB), `after_state` (JSONB), and `created_at`. Logs must be
accessible to LASU administrators.

### NFR8 — Missed-Log Alert Timeliness
Early-warning alerts for consecutive missed bi-weekly log submissions must be
triggered and delivered within 24–48 hours of the missed deadline.

---

## 7. Role portals — screen-by-screen detail

---

### 7.1 Student Interface

**Navigation (desktop):** Left sidebar.
**Navigation (mobile):** Bottom tab bar — Home · Browse · Applications · Log · Profile

#### Routes

| Route | Screen |
|---|---|
| `/student/dashboard` | Student Home Dashboard |
| `/student/profile` | My Profile & Fit Score |
| `/student/internships` | Browse Internships / Recommendations |
| `/student/applications` | My Applications |
| `/student/log` | Bi-Weekly Log Dashboard |
| `/student/log/submit/:checkInType` | Check-in Submission Form (Wed / Sat) |
| `/student/log/quiz/:weekId` | AI Scenario Quiz |
| `/student/log/history` | Log History |
| `/student/growth` | Growth Dashboard |
| `/student/onboarding` | 8-Step Onboarding Wizard |

#### 7.1.1 Home Dashboard

Welcomes the student by first name. Shows:
- **Industrial Training Progress** widget: weeks completed / total, current status
  badge (`● Pending` / `● Active` / `● Completed`).
- **Profile Fit Score** gauge: numerical score with tier badge (T1/T2/T3) and a
  prompt to complete profile if score is incomplete.
- **Top Internship Matches** section: up to 3 ranked recommendation cards with
  Fit Score, track type badge, and "View All" link.
- **Upcoming Deadlines** widget: next Wednesday/Saturday log window.
- **View Pulse Check** CTA (renamed "View Log Check") linking to the log dashboard.

#### 7.1.2 Bi-Weekly Log Dashboard

Shows the current week's submission status:
- Wednesday check-in status (submitted / pending / missed).
- Saturday check-in status (submitted / pending / missed / locked — Saturday check-in
  is locked until Wednesday check-in is submitted).
- AI Quiz status (locked / unlocked / completed with score).

Each status card has a CTA: **Submit Now** (if window is open), **View Submission**
(if submitted), **Missed** (if window closed without submission — red, disabled).

Log History section shows a timeline of all previous weeks with status indicators
(green check = both submitted, amber = one missed, red = both missed).

#### 7.1.3 Check-in Submission Form

Reached from the Log Dashboard **Submit Now** CTA. Displays:
- Check-in type header: "Wednesday Check-In" or "Saturday Check-In".
- Four labelled text areas with character counters: Focus Area · Core Action ·
  The Blocker · The Takeaway.
- **Capture Photo** button: activates the device rear camera. The preview of the
  captured photo is shown inline. Retake is allowed before submission. Gallery
  upload option is not present — if a user tries to access it via browser hacks,
  the server rejects any artifact not tagged as a direct camera upload.
- **Submit Check-In** primary CTA. On submit, the photo uploads first, the server
  generates the WAT timestamp, then the log fields are saved with the artifact FK.

#### 7.1.4 AI Scenario Quiz

Unlocked after Saturday log submission. Full-screen locked mode. Header shows:
"Week N AI Quiz — 5 Questions." Timer (if configured). Each question presented one
at a time with 4 multiple-choice options. Tab-switch detection is active from the
moment the quiz screen is rendered. Auto-fail on blur/visibility change. On
completion, score is displayed with pass/fail indicator and a review accordion
showing each Q&A.

---

### 7.2 Company Representative Interface

**Navigation (desktop):** Left sidebar.
**Navigation (mobile):** Bottom tab bar — Dashboard · Post · Postings · Applications · Profile

#### Routes

| Route | Screen |
|---|---|
| `/company/dashboard` | Company Home Dashboard |
| `/company/post-internship` | Internship Posting Form |
| `/company/postings` | Manage Postings |
| `/company/applications` | Applications Received (shortlist) |
| `/company/interns` | My Interns |
| `/company/supervisors` | Manage Supervisors |
| `/company/supervisors/add` | Add New Supervisor form |
| `/company/performance-reports` | Performance Reports |
| `/company/profile` | Company Profile |

#### 7.2.1 Internship Posting Form

Fields: Placement Track selector (Competitive / Equity & Developmental) shown as
two cards at the top — selecting Equity reveals the inline benefit banner.
Then: Internship Title · Job Family dropdown (from DB) · Location · Stipend
Range (NGN min/max) · Duration (weeks) · Description textarea · Requirements
(skill levels per sub-role, dynamically generated from the selected Job Family's
sub-roles). Application Deadline date picker.

The Equity Track benefit banner explains: reputation badges, Fair Participation
Score boost, and the breadth of talent accessed through tier diversity.

#### 7.2.2 Applicant Shortlist

Tabs: **Competitive Pool** · **Equity Pool** (shown only if the posting has both).

Each applicant card shows: avatar initials · Name · Department · Fit Score ·
Tier badge · Gap Analysis summary (green met skills / red shortfall with "+N
levels needed"). Status chip (Pending / Accepted / Declined). Actions:
**Accept** (black) · **Decline** (outline).

For Equity Track postings, cards are presented in T1→T2→T3 interleaved order as
enforced by the Fair Allocation Engine. The company cannot reorder cards.

On Accept: application status updates to `accepted`, the Framework Service
dispatches the LASU objectives to a new UAF record for the student, and
notifications are sent to the student and the student's assigned Academic
Supervisor (once assigned by the HOD).

#### 7.2.3 Manage Supervisors

Lists all registered Industry Supervisors with: avatar · Name · Job Title ·
"Active Interns: N" · edit icon · delete icon.

**Quick Assign** section: Select Intern dropdown + Assign to Supervisor dropdown
+ Confirm Assignment CTA.

**Add New Supervisor** button at top: opens the Add Supervisor form with fields:
Full Name · Work Email · Department/Team. System sends an invitation email to the
work address. The supervisor activates their account via the `/activate?token=...`
route.

#### 7.2.4 Assign Supervisor to Intern (modal)

Reached from **My Interns** via **Assign Supervisor** button on an intern card.

Modal shows: intern identity row (read-only) · Select Industry Supervisor dropdown
(showing only registered supervisors for that company) · helper text · Cancel ·
Confirm Assignment. If no supervisors are registered, show empty state with a
"Manage Supervisors →" link. Do not allow the modal to proceed to assignment if
there are no registered supervisors.

---

### 7.3 Industry Supervisor Portal

The Industry Supervisor portal is entirely student-facing. It has no access to
internship postings, applicant shortlists, company admin features, or UAF objective
editing.

**Account lifecycle:** No self-registration. Account created by Company
Representative → invitation email sent → supervisor activates via
`/activate?token=...` screen (enters password, confirms professional details).

**Navigation (desktop):** Left sidebar.
**Navigation (mobile):** Bottom tab bar — Home · Interns · Monthly Review · Alerts · Profile

#### Routes

| Route | Screen |
|---|---|
| `/supervisor/home` | Home Dashboard |
| `/supervisor/interns` | Student Roster ("Students Growth") |
| `/supervisor/interns/:studentId` | Individual Student Profile |
| `/supervisor/monthly-review` | Monthly Review List |
| `/supervisor/monthly-review/:studentId/:monthYear` | Monthly Digest + Endorse/Flag |
| `/supervisor/alerts` | Alerts / Notifications |
| `/supervisor/profile` | Profile |

#### 7.3.1 Home Dashboard

Header: Avatar + "Welcome back, [First Name]." Sub-line: "You have [N] students
requiring attention today."

Stat tiles (side-by-side): **Active Interns** (count) · **Monthly Reviews Pending**
(count, replaces the old "Total Hours Verified" tile).

**Critical Tasks** section:
- **Pending Monthly Reviews** card (amber border): "[N] Monthly Digest(s) awaiting
  your review." CTA: **Review Now**.
- No "Framework Approvals" card — the Industry Supervisor no longer manages
  frameworks.

**Assigned Students** section: each card shows avatar · Name · Department · "Week
X of Y" progress bar · Status badge: `ON TRACK` (teal) · `OVERDUE LOG` (red) ·
`STARTING` (grey).

**Recent Log Submissions** section: entry rows showing student name, week,
submission type (Wednesday/Saturday), and submission date. Status icon:
green check (submitted on time) · amber circle (submitted late) · red X (missed).

#### 7.3.2 Student Roster ("Students Growth")

Title: **Students Growth** (exact wording from design — do not rename).
Sub-label: `INDUSTRY SUPERVISOR` in small caps above.
Search bar: "Search interns by name or ID..."

Each intern card: Avatar · Name · Department · Level · Status badge (`Active` /
`Wk N Log Pending` / `Late Entry`) · Progress bar labelled "Log Submission
Progress" with week count (e.g. "Wk 8 / 12").

Tapping a card opens the Individual Student Profile.

#### 7.3.3 Individual Student Profile

Top card: student avatar · Name · Department/Degree · Level · Matric · Email ·
CGPA · Tier badge.

**Verified Skill Profile** section: skill tags with verified levels.

**Growth Dashboard** section:
1. Skill Progression Velocity bar chart (week-over-week from Wk 1 to current).
   Export Report button.
2. Core Competency Assessment table: Technical Execution / Problem Solving /
   Communication — each as a score /5 progress bar with "Verified Endorsements"
   count.

**Log Submission Timeline** section (replaces old "Pulse Submissions Timeline"):
Each week entry: circle status icon (green = both submitted, amber = one submitted,
red = both missed) · "Week N — Wed/Sat Log" · submission dates · status badge.

**Monthly Review History** section: each month listed with Endorsement status
(ENDORSED — teal / FLAGGED — red) and the flag comment if applicable.

#### 7.3.4 Monthly Review

Route: `/supervisor/monthly-review`

Lists all students with a pending Monthly Review for the current month. Each card:
student name · Month label · "N of N log submissions" · CTA: **Review Digest**.

**Monthly Digest screen** (`/supervisor/monthly-review/:studentId/:monthYear`):

Top: student identity row (read-only) · Month label badge.

Digest content (read-only scrollable): For each week in the month, show the
Wednesday and Saturday log field content (Focus Area, Core Action, The Blocker,
The Takeaway) as read-only labelled panels, plus the AI quiz score for that week
as a colour-coded chip.

Action section at bottom:
- **Endorse** button (teal, full-width): marks month as satisfactory, locks
  review, notifies student and Academic Supervisor.
- **Flag** button (red outlined, full-width): opens a mandatory comment text area
  ("Brief comment explaining the concern — required.") with a **Submit Flag**
  CTA. Cannot be submitted without a comment.

Once a Monthly Review is submitted (Endorsed or Flagged), both buttons are replaced
by a read-only status card showing the action taken, the date, and the comment
(if flagged). The review is locked.

#### 7.3.5 Alerts

Route: `/supervisor/alerts`

Tabs: **All** · **Unread**

Notification types:
| Event | Example text |
|---|---|
| New intern assigned | "New Intern Assigned: [Name] has been added to your supervision list." |
| Monthly Digest ready | "Monthly Review Ready: [Name]'s April digest is ready for your review." |
| Log submitted | "Log Submitted: [Student] has submitted their Week N [Wednesday/Saturday] log." |
| Missed log (red) | "Overdue Log: [Student] has missed their Week N [Wednesday/Saturday] log submission." |
| Framework updated (reference only) | "Framework Updated: The assessment framework for [Student] is now live." |

#### 7.3.6 Activate Supervisor Account Screen

Route: `/activate?token=...`

Renders for both Industry Supervisors (invited by Company Rep) and Academic
Supervisors (invited by HOD). Shows:
- Logo header.
- Heading: **Activate Your Supervisor Account** (Industry Sup.) or
  **Activate Your Account** (Academic Sup.).
- Read-only summary card: Full Name · Work/University Email.
- New Password + Confirm Password fields (each with show/hide toggle).
- Inline password rules: minimum 8 characters · at least one number · at least one
  special character. Each rule shows a radio indicator turning green as the rule
  is satisfied.
- **Activate Account** primary CTA (full-width, black).
- Footer: "© Lagos State University. All Rights Reserved. Privacy Policy · Support."

---

### 7.4 Academic Supervisor Portal

**Account lifecycle:** No self-registration. Account created by HOD → invitation
email → activates via `/activate?token=...` (same screen as §7.3.6).

**Navigation (desktop):** Left sidebar.
**Navigation (mobile):** Bottom tab bar — Home · Log Wall · Frameworks · Alerts · Profile

#### Routes

| Route | Screen |
|---|---|
| `/academic-supervisor/home` | Academic Supervisor Home Dashboard |
| `/academic-supervisor/log-wall` | Thumbnail Wall (replaces old Pulse Overview) |
| `/academic-supervisor/log-wall/:studentId/week/:weekId` | Weekly Log Detail (drill-down) |
| `/academic-supervisor/frameworks` | Assessment Frameworks List |
| `/academic-supervisor/frameworks/:studentId` | Framework Detail + Decision |
| `/academic-supervisor/alerts` | Critical Alerts |
| `/academic-supervisor/alerts/:studentId/log` | Log Intervention (Log Contact) |
| `/academic-supervisor/alerts/all` | General Alerts |
| `/academic-supervisor/profile` | Profile |

#### 7.4.1 Home Dashboard

**Action Required banner** (black full-width, appears when frameworks need approval):
"! Action Required — You have frameworks awaiting your review and approval."

Stat tiles:
- **Total Students** (count + person icon)
- **Log Submissions** (e.g. "18 / 24 — Current Period" — where 24 = 2 check-ins
  × 12 students for that week)

**Alerts section:**
Each critical alert card: red border · Student avatar · Name · Department ·
flag icon · "Missed [N] consecutive log submissions."

General notifications widget with **Go to Center →** CTA.

**All Students section:** one card per student showing:
avatar · Name · Role · Company · "Week N" label · Log Status badge
(`● Logs Submitted` — green / `● Pending` — amber / `● Overdue` — red) ·
two CTA buttons: **Log Wall** (outline) · **Full Profile** (outline).

#### 7.4.2 Thumbnail Wall (Log Wall)

Route: `/academic-supervisor/log-wall`

Header: **Log Wall** · Period selector (current week / previous weeks) · student
filter.

The main content area is a **masonry CSS grid** of all KYC artifact photo thumbnails
submitted by assigned students in the selected period. Each thumbnail cell shows:
- The photo (from the `artifacts` table).
- Student name overlay (small, bottom-left).
- Check-in type label: "Wed" or "Sat".
- A coloured border: green for on-time submission, amber for late, red for missing
  (missing entries shown as a placeholder cell with a red "Missed" label).

Clicking a thumbnail opens the **drill-down modal**.

**Drill-down modal:**
- Header: Student name · "Week N [Wednesday / Saturday]".
- **Swipeable image carousel**: Wednesday photo and Saturday photo side-by-side,
  swipeable on mobile. Full-size view on tap.
- **Log Content panel**: the four structured text fields for both check-ins
  displayed as read-only labelled rows (Focus Area / Core Action / The Blocker /
  The Takeaway for each day).
- **AI Quiz Score panel**: colour-coded block (green chip for pass, red for fail /
  tab-switch auto-fail). An accordion expands to show each of the 5 questions,
  the student's answer, and the correct answer.
- **Monthly Review status strip**: shows the current month's Endorsement status
  (ENDORSED / FLAGGED / PENDING) for this student, read-only.
- Footer buttons (for Academic Supervisor's own workflow management, not per-entry
  annotations):
  - **Mark as Reviewed** (teal — logs the Academic Supervisor's review timestamp).
  - **Request Clarification** (outline — opens a note field for the supervisor
    to record that they have asked the student for clarification; this note is
    stored against the Academic Supervisor's record, not sent to the Industry
    Supervisor).

#### 7.4.3 Assessment Frameworks List

Route: `/academic-supervisor/frameworks`

Header: **Assessment Frameworks**
Sub-caption: "Review and approve student internship objectives and frameworks."

Each student row: Student Name · Matric · Status badge · Department abbreviation.

Status badge colours:
- `Pending Your Approval` — amber
- `Awaiting System` — grey
- `Changes Requested` — red/amber
- `Approved` — teal

#### 7.4.4 Framework Detail + Decision Screen

Route: `/academic-supervisor/frameworks/:studentId`

Identity card (top): student name + matric · status badge · role / company / duration.

**SIWES University Goals section** (cap icon header): each objective numbered,
with title and description.

**Supervisor Feedback input**: textarea ("Provide actionable feedback on the
proposed framework..."). Caption: "Optional for approval. Required for changes."

Footer actions:
- **Request Changes** (outline, full-width)
- **Approve Framework** (black, full-width)

On Approve: status → `APPROVED`, framework becomes read-only and live on student's
and Academic Supervisor's dashboards.

On Request Changes: feedback text is logged; status → `CHANGES_REQUESTED`;
notification dispatched.

#### 7.4.5 Critical Alerts

Route: `/academic-supervisor/alerts`

Header: **Critical Alerts**
Sub-caption: "Students requiring immediate intervention for missed logs."
Badge: `⚠ N High Priority Alerts` (red pill).

Each alert card:
- Avatar · Name · Department · `⚠ Critical` badge.
- Alert heading: **Consecutive Missed Log Submissions**.
- Description: "Student has missed N consecutive bi-weekly log submissions."
- Metadata: "Submissions Missed: N" · "Last Submission: [Date]".
- CTAs: **View Student** (outline) · **Log Contact** (black filled).

**Also displayed on this screen:** Industry Supervisor Flag alerts (these are
displayed as a separate card type with a yellow-border "Flag Alert" label, showing
the student name, month flagged, and the Industry Supervisor's comment).

#### 7.4.6 Log Intervention (Log Contact) Screen

Route: `/academic-supervisor/alerts/:studentId/log`

Header: ← **Log Intervention** · three-dot overflow.

Student identity card (read-only): avatar initials · "INTERVENTION FOR" label ·
Student Name · Matric.

Info box: "ⓘ Logging a contact adds a timestamped note to the student's record
visible to the HOD. It does not automatically resolve alerts."

Fields:
- **Contact Method** dropdown: Phone Call / In-Person / Email / WhatsApp
- **Date of Contact** date picker (pre-filled to today, WAT)
- **Intervention Notes** textarea

CTA: **Save Log Entry** (black, full-width). Cancel (text link).

Log entries are visible to HOD. Alert does **not** auto-clear. Alert clears only
when the student submits again and the consecutive-miss counter resets below the
Super Admin threshold.

#### 7.4.7 Profile

Top card: Avatar · Name (bold) · Title + Department ·
Status badges: `Active Supervisor` · `Faculty of [Faculty]`.

Three stat tiles: Total Students · Active Now · Completed.

**Academic Supervision Handbook** card (dark background): CTA: **View Handbook →**.

**Personal Information** card: Email · Phone · Office Location · Faculty/Department.

**Account Settings** navigation rows: Edit Profile · Change Password ·
Notification Preferences.

**Sign Out** (red, full-width).

Footer: "LASU InternLink · Logged in as [Name]"

---

### 7.5 Head of Department Portal

**Account lifecycle:** HOD self-registers directly; account is locked pending
Super Admin verification. The Super Admin verifies HOD accounts under
**Verify Accounts → Heads of Department** tab.

**Navigation (desktop):** Left sidebar.
**Navigation (mobile):** Bottom tab bar — Home · Students · Supervisors · Alerts · Profile

#### Routes

| Route | Screen |
|---|---|
| `/hod/home` | HOD Home Dashboard |
| `/hod/students` | Department Student List |
| `/hod/students/:studentId` | Student Detail (HOD view) |
| `/hod/supervisors` | Manage Academic Supervisors |
| `/hod/supervisors/add` | Add New Supervisor |
| `/hod/supervisors/assign` | Assign Supervisor to Student |
| `/hod/reports` | Departmental Reports |
| `/hod/alerts` | Notifications |
| `/hod/profile` | HOD Profile |

#### 7.5.1 Home Dashboard

Header: "Welcome back, Prof. [Name]" · Department name · `✔ Verified` green badge.
CTA: **New Posting** (dark, small — quick-access placement posting).

Four stat tiles (2×2 grid):
- **Total Registered** (count) · **Placed Students** (count, teal) ·
  **Searching** (count, amber) · **Active Roles** (count).

**Departmental Reports** promo card (dark background): navigates to Reports screen.

**Action Required** section (amber icon): each unassigned student card shows:
Student name · Company – Role · `Unassigned` badge (red) ·
CTA: **Assign Supervisor** (black, full-width).

**Placement Activity Feed**: avatar · event description · time ago (e.g. "[Student]
accepted an offer at [Company]", "Dr. [Name] reviewed log entries for [N] students").

#### 7.5.2 Students List

Title: **My Department Students**
Search: name or matric.
Filter tabs: **All** · **Placed** · **Unplaced** · **Completed**

Each card: Avatar · Name · Matric · Level · Status badge · Company name (or "No
placement yet") · Supervisor name · **View Student** CTA.

#### 7.5.3 Student Detail (HOD view)

Top card: Avatar · Name · Matric · Placement status badge.
**Platform Fit Score** card: large percentage + High/Medium/Low Match label.
**Job Family** card · **Sub-role Specialization** card.
**Current Placement** card: Host Organisation · Location · **View Organisation** button.
Assigned Academic Supervisor row: avatar initials · Name · Department.

Info notice at bottom: "ⓘ Detailed log entries and weekly submissions are actively
managed by the assigned Academic Supervisor."

The HOD **cannot** see log content or framework detail from this screen.

#### 7.5.4 Manage Academic Supervisors

Title: **Manage Supervisors**. CTA: **+ Add New Supervisor** (black, full-width).

Each supervisor card: Avatar initials · Name · Status badge (Active — green /
Pending — amber) · Title (e.g. Senior Lecturer) · Email · "Assigned Students: N/MAX".
If `Active`: Edit · Remove. If `Pending`: Resend Invite · Remove.
The N/MAX count turns amber/red when at maximum capacity.

Maximum student-per-supervisor threshold is set in Super Admin → System Settings →
Capacity → "Max Students per Academic Supervisor."

#### 7.5.5 Add New Supervisor

Fields: Full Name · Official Title · Official University Email
(`@lasu.edu.ng` or equivalent).

Info box: "ⓘ An invitation email will be sent to this address."

CTA: **▷ Send Invitation** (black, full-width).

#### 7.5.6 Assign Supervisor Screen

Route: `/hod/supervisors/assign`

**1. Select Student** section: radio-button list of unassigned students (avatar ·
Name · Company · `Unassigned` badge).

**2. Select Supervisor** section: radio-button list of supervisors (avatar ·
Name · Department · Capacity bar "N/MAX" — green for available, red for full).
If at maximum: amber warning icon + info override note.

CTA: **Confirm Assignment ✔** (black, full-width).

#### 7.5.7 Departmental Reports

Session + Cycle filter pills.
**Total Placed** stat card: percentage + trend indicator + progress bar.
**Track Breakdown** card: bar chart per Job Family/sub-role.
**Top Employers** card: ranked list.
**Bottom row tiles:** Avg Log Compliance Rate · Early Warnings (missed-log count).
CTAs: **↓ Export CSV** · **⎙ Print Report**.

#### 7.5.8 Alerts

Notification types:
- Briefcase: new placement event.
- Warning (red left border): "N students in [Dept] have missed consecutive
  bi-weekly log submissions." CTA: **Review Students**.
- Info circle: system message.
- Checkmark circle: report approved.
- Checkbox: supervisor allocation finalised.

#### 7.5.9 Profile

Avatar (with verified tick overlay) · Name · Role: "Head of Department, [Dept]" ·
`✔ Verified Account` teal badge.
Personal Information card: Email · Phone.
Departmental Details card: Faculty · Department.
**Logout** (red, full-width).

---

### 7.6 Super Admin Panel

The Super Admin portal provides system-wide configuration and oversight.

**Navigation pattern:** Permanent, non-collapsing left sidebar on desktop.
On mobile: four-tab bottom bar (Dashboard · Verify · Users · Profile), with
remaining admin screens reachable through a Quick Access section on the dashboard.

#### Routes

| Route | Screen |
|---|---|
| `/super-admin/dashboard` | Super Admin Dashboard |
| `/super-admin/verify` | Verification Queue (Companies + HODs) |
| `/super-admin/users` | Manage All Users |
| `/super-admin/job-families` | Configure Job Families |
| `/super-admin/fair-allocation` | Fair Allocation Settings |
| `/super-admin/reports` | Institutional Reports |
| `/super-admin/system-settings` | System Settings |
| `/super-admin/notifications` | Notifications |
| `/super-admin/profile` | Profile |

#### 7.6.1 Verification Queue

Tabs: **Companies** · **Heads of Department**.

Each row: Name · Email · Submitted date · Status chip (Pending) · **Review** CTA.
Clicking Review opens a side panel with: company/HOD name, registration details,
TIN/registration number, supporting documents (with View links). Footer:
**Approve** (black) · **Reject** (outline).

On Approve (Company): `companies.isAdminVerified = true`; internship posting
unlocked; notification dispatched to company.
On Reject: account flagged as declined with a logged reason.

#### 7.6.2 Job Family Configuration

Lists all 10 Job Families. Each row expands to an edit form with four weight fields:
CGPA · Verified Skills · Project Experience · Coursework, each as a numeric input.

**Live total indicator** at bottom of form: updates in real-time on keystroke. Turns
red and disables the Save button whenever the four values do not sum to exactly 100.
Sub-roles can be added, renamed, or removed from the same screen without any code
change.

#### 7.6.3 Fair Allocation Settings

- Cycle-level equity quota range (min/max percentage, default 15–25%).
- Tier band thresholds (Fit Score ranges for T1, T2, T3).
- Consecutive missed log alert threshold (default: 2).
- Maximum students per Academic Supervisor.
- Cycle dates (start/end for the current SIWES cycle).

#### 7.6.4 Institutional Reports

Report Configuration panel: Report Type dropdown · Faculty filter · Department filter.

Student Performance Overview report: Total Placed count · Total Unplaced count ·
Overall Placement Rate percentage · bar chart per faculty/department (placed/unplaced).

Equity Track Analytics view: proportion of T1/T2/T3 students placed in current
cycle, to allow Super Admin to verify the fair allocation system is producing the
intended distributional outcome.

Log Compliance report: per-department bi-weekly log submission compliance rates.

Export: **Export CSV** · **Export PDF**.

#### 7.6.5 System Settings

Missed-log alert threshold · Capacity settings · Cycle dates · LASU department
learning objectives management (add/edit/remove objectives per department — these
are the objectives that feed into the UAF dispatch). Notification preferences.

---

## 8. Cross-role workflows

---

### 8.1 Company Representative — Industry Supervisor account creation

1. Company Rep → **Manage Supervisors → + Add New Supervisor**.
2. Rep fills: Full Name · Work Email · Department/Team.
3. System sends invitation email to the work address.
4. Supervisor receives email and lands on `/activate?token=...`.
5. Supervisor sets password and activates account.
6. Supervisor is redirected to their dashboard upon activation.

If the Company Rep navigates to **My Interns** and a placed intern has no supervisor
assigned, the intern card shows an **Assign Supervisor** button. Tapping it opens the
**Assign Supervisor modal** (documented in §7.2.4). If no supervisors are registered,
the modal shows an empty state with a "Manage Supervisors →" link. Do not allow
assignment without at least one registered supervisor.

---

### 8.2 HOD — Academic Supervisor account creation

1. HOD → **Manage Supervisors → + Add New Supervisor**.
2. HOD fills: Full Name · Official Title · Official University Email.
3. System sends invitation email.
4. Supervisor activates via `/activate?token=...`.
5. HOD can then assign the supervisor to unassigned students via
   **Supervisors → Assign Supervisor** screen.

---

### 8.3 Unified Assessment Framework — state machine

(Full state machine detailed in §4.7 above.)

Trigger: Company accepts a student → Framework Service creates UAF record with
LASU department objectives for that student's department → status:
`PENDING_ACADEMIC_APPROVAL` → Academic Supervisor receives an Action Required
notification → Academic Supervisor reviews on their Frameworks screen →
Approves (status: `APPROVED`, framework locked and live) or Requests Changes
(status: `CHANGES_REQUESTED`, notification to relevant party, loop back to
`PENDING_ACADEMIC_APPROVAL` after update).

Do not implement this as a simple CRUD form. The state transitions must be enforced
as a proper server-side state machine with only the allowed transitions permitted.

---

### 8.4 Bi-Weekly Log and Monthly Review flow

1. Student submits Wednesday check-in (4 fields + rear-camera photo).
2. Student submits Saturday check-in (4 fields + rear-camera photo).
3. After Saturday submission, AI Quiz Service generates 5-question quiz and unlocks
   it for the student.
4. Student completes quiz (locked-screen, anti-cheat active).
5. At end of month, Monthly Endorsement Service compiles the month's logs and quiz
   scores into a Monthly Digest for each student.
6. Notification dispatched to each student's assigned Industry Supervisor.
7. Industry Supervisor opens Monthly Digest, reads log content and quiz scores,
   then Endorses or Flags.
8. If Endorse: Monthly Review locked, notification to student, visible on Academic
   Supervisor's dashboard.
9. If Flag: mandatory comment required, early-warning alert to Academic Supervisor
   AND student, Monthly Review locked with FLAG status.

---

### 8.5 Missed-log alert escalation

(Detailed in §4.6 above.)

The Bi-Weekly Log Service runs a scheduled check after each submission deadline
(Wednesday end-of-day and Saturday end-of-day). If a student has missed two or
more consecutive check-ins (threshold configurable in System Settings), the service:
1. Creates a Critical alert for the Academic Supervisor.
2. Dispatches a WebSocket push notification (real-time, if supervisor is online).
3. Dispatches an in-app notification to the HOD.
4. Dispatches an in-app notification to the Company Representative.
5. Updates the Industry Supervisor's Home dashboard to show the student's card
   with `● Overdue` status.

The alert does not auto-clear. It clears only when the student submits again and
the consecutive-miss counter drops below the threshold.

---

## 9. Database entities

All schema changes must be implemented as Alembic migrations. Never hand-edit the
database outside a migration. The entities below are the authoritative list —
if a feature is not represented here, add a migration.

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, email, hashed_password, role (ENUM), is_active, created_at | Role ENUM: student, company_rep, industry_supervisor, hod, academic_supervisor, super_admin |
| `students` | user_id (FK), matric_number, cgpa, department_id (FK), level, fit_score, tier, onboarding_complete | cgpa CHECK 0.0–5.0 |
| `companies` | id, user_id (FK), name, cac_number, tin, industry, is_admin_verified, fair_participation_score | |
| `departments` | id, name, faculty_id (FK) | |
| `faculties` | id, name | |
| `job_families` | id, name, description, default_weights (JSONB), is_active | default_weights: `{cgpa: N, skills: N, projects: N, coursework: N}` |
| `sub_roles` | id, job_family_id (FK), name, description | |
| `student_job_selections` | student_id (FK), job_family_id (FK), sub_role_id (FK) | student's chosen family/sub-role |
| `skills` | id, name, job_family_id (FK) | skills per Job Family |
| `student_skills` | student_id (FK), skill_id (FK), self_declared_level (1–5), verified_level (1–5 nullable) | |
| `internships` | id, company_id (FK), title, description, location, duration_weeks, stipend_min_ngn, stipend_max_ngn, deadline, track_type (ENUM: competitive/equity), job_family_id (FK), sub_role_id (FK), is_active | stipend stored as INTEGER (kobo) or DECIMAL — pick one and use consistently |
| `internship_skill_requirements` | internship_id (FK), skill_id (FK), required_level (1–5) | |
| `applications` | id, student_id (FK), internship_id (FK), status (ENUM: pending/shortlisted/accepted/declined), applied_at | |
| `placements` | id, application_id (FK), student_id (FK), internship_id (FK), industry_supervisor_id (FK nullable), academic_supervisor_id (FK nullable), start_date, end_date | |
| `industry_supervisors` | id, user_id (FK), company_id (FK), full_name, job_title, department | |
| `academic_supervisors` | id, user_id (FK), hod_id (FK), full_name, title, department_id (FK), current_student_count | |
| `hods` | id, user_id (FK), department_id (FK), is_verified | |
| `weekly_logs` | id, placement_id (FK), week_number, wed_content (JSONB nullable), sat_content (JSONB nullable), wed_submitted_at (WAT), sat_submitted_at (WAT), quiz_score (nullable), quiz_passed (boolean nullable), submission_status (ENUM) | wed/sat_content: `{focus_area, core_action, the_blocker, the_takeaway}` |
| `artifacts` | id, weekly_log_id (FK), check_in_type (ENUM: wednesday/saturday), photo_url, server_timestamp_wat, upload_source (must be 'camera') | |
| `ai_quiz_attempts` | id, weekly_log_id (FK), questions (JSONB), student_answers (JSONB), correct_answers (JSONB), score, passed, failed_due_to_tab_switch (boolean), attempted_at | |
| `monthly_endorsements` | id, placement_id (FK), industry_supervisor_id (FK), month_year (VARCHAR e.g. "2026-05"), action (ENUM: endorsed/flagged), flag_comment (nullable), created_at_wat, is_locked | |
| `unified_assessment_frameworks` | id, placement_id (FK), status (ENUM: pending_approval/changes_requested/approved), lasu_objectives (JSONB), academic_supervisor_feedback (nullable TEXT), approved_at | |
| `audit_logs` | id, user_id (FK), action_type, entity_id, entity_type, before_state (JSONB), after_state (JSONB), created_at | |
| `notifications` | id, recipient_user_id (FK), type, title, body, is_read, created_at | |
| `company_cycle_entitlements` | id, company_id (FK), cycle_id (FK), fair_participation_score, equity_slots_offered, equity_slots_filled, t1_placed, t2_placed, t3_placed | |
| `cycles` | id, name, start_date, end_date, is_active | |
| `log_contact_entries` | id, academic_supervisor_id (FK), student_id (FK), contact_method, contact_date, notes, created_at | visible to HOD, does not clear alerts |

All dates and timestamps stored as UTC in the database. WAT conversion (UTC+1) is
applied for display on the frontend and for server-generated artifact timestamps
(which are stored as WAT-labelled values in `artifacts.server_timestamp_wat` for
SIWES compliance readability).

---

## 10. API conventions

- All API routes versioned under `/api/v1/`.
- All timestamps in ISO 8601 format. Stored as UTC. Converted to WAT for display
  on the frontend where required (WAT = UTC+1, no daylight saving).
- All currency stored as **INTEGER representing kobo** (1 NGN = 100 kobo). Display
  layer converts to NGN. Do not mix kobo and NGN representations across tables.
- Every protected endpoint must declare which role(s) may call it via a FastAPI
  dependency. Server-side role check is mandatory — the frontend visibility of a
  button is not a substitute.
- Pydantic model for every request body and every response body. No raw dicts.
- HTTP status codes: 200/201 for success, 400 for client validation errors,
  401 for unauthenticated, 403 for forbidden role, 404 for not found, 422 for
  Pydantic validation errors (with field-level detail), 500 for unexpected server
  errors (no raw database detail exposed to the client on 500s).
- Axios request interceptor attaches JWT access token to every authenticated call.
  Response interceptor catches 401, attempts token refresh, redirects to login on
  refresh failure.
- Component naming: PascalCase for React components, camelCase for functions and
  variables, snake_case for database columns and Python identifiers.
- Every new screen built must be verified against the matching section of
  `/docs/ui-spec.md` before being marked complete.

---

## 11. Permissions — server-side enforcement

These must all be enforced as FastAPI dependencies, never only inferred from
frontend visibility.

| Action | Allowed roles | Forbidden for |
|---|---|---|
| Create Industry Supervisor account | Company Rep only | All others |
| Create Academic Supervisor account | HOD only | All others |
| Endorse or Flag Monthly Review | Industry Supervisor only | All others |
| Approve / Request Changes on UAF | Academic Supervisor only | All others |
| Log Contact entry | Academic Supervisor only | All others |
| View log / artifact content | Student (own) · Industry Supervisor (assigned students) · Academic Supervisor (assigned students) | HOD · Company Rep · Super Admin |
| View AI quiz content | Student (own quiz) · Academic Supervisor (via drill-down) | Industry Supervisor · HOD · Company Rep · Super Admin |
| Post internship | Company Rep (verified only) | All others |
| Accept / Decline applicants | Company Rep only | All others |
| Verify Company / HOD accounts | Super Admin only | All others |
| Configure Job Families and weights | Super Admin only | All others |
| Configure Fair Allocation settings | Super Admin only | All others |
| Configure missed-log threshold | Super Admin only | All others |
| View student Fit Score | Student (own) · Company Rep (applicants) · HOD (own department students) | Industry Supervisor · Academic Supervisor |
| Assign Academic Supervisor to student | HOD only | All others |
| Assign Industry Supervisor to intern | Company Rep only | All others |
| View / export Institutional Reports | Super Admin only | All others |
| View Departmental Reports | HOD (own department) only | All others |
| Generate end-of-internship Performance Report | Company Rep (own interns) · Super Admin | All others |

---

## 12. What NOT to do

These are the most common ways a mission can go wrong. Treat each item as a hard
prohibition.

- **Do not rebuild the old Weekly Pulse system.** There are no weekly goal cards,
  no Sunday reflection submissions, no per-goal endorse/flag, and no per-goal
  coaching tips. The old pulse tables, routes, and screens must be replaced by
  the Bi-Weekly Evidence Log and Monthly Endorsement system defined in §4.3 and
  §4.4. If an existing codebase contains pulse tables or screens, replace them;
  do not extend or keep them alongside the new system.

- **Do not give the Industry Supervisor an objective-setting screen.** The old
  UAF flow that required the Industry Supervisor to write up to 10 company-specific
  objectives has been removed. The Industry Supervisor's framework-related
  responsibility is now limited to viewing the approved framework (read-only). Do
  not rebuild the Framework Building screen (`/supervisor/frameworks/:internId/build`).

- **Do not allow gallery uploads for log photo artifacts.** The rear-camera live
  capture requirement is an anti-fraud control. Any implementation that provides
  a gallery fallback, file picker, or file upload input alongside the camera
  capture must be corrected.

- **Do not allow the AI quiz to proceed after a tab switch.** The Window Blur
  and Page Visibility API listeners are mandatory. An implementation that merely
  warns the student or logs the tab switch without auto-failing the attempt does
  not satisfy FR6.4.

- **Do not merge any two roles' dashboards, navigation, or permissions**, even
  temporarily to save development time.

- **Do not trust frontend role checks as the security boundary.** Server-side
  RBAC via FastAPI dependency is mandatory on every protected endpoint.

- **Do not let the Equity Track quota or T1→T2→T3 interleaving be approximated
  with a random shuffle.** The interleaving is structurally enforced.

- **Do not let a student, Industry Supervisor, Academic Supervisor, or HOD see or
  edit Job Family definitions, matching weights, or Fair Allocation settings.**
  Those are Super Admin only.

- **Do not build the Unified Assessment Framework as a simple CRUD form without
  the state machine.** The state transitions (PENDING_ACADEMIC_APPROVAL →
  APPROVED / CHANGES_REQUESTED → loop) are the point of the feature.

- **Do not skip writing an Alembic migration when changing the database schema.**
  Never hand-edit the database outside a migration.

- **Do not silently change the tech stack** (frontend framework, backend language,
  primary database, auth scheme) without the user explicitly approving it first.

- **Do not auto-resolve missed-log alerts** because a Log Contact entry was made.
  Log Contact notes are audit records — they do not clear alerts. Alerts clear only
  when the student submits again and the consecutive-miss counter drops below the
  threshold.

- **Do not allow the Unified Assessment Framework to be edited after reaching
  APPROVED state.** It is immediately and permanently read-only upon approval.

- **Do not allow Company Representatives to see UAF content.** They have at most
  a Quick Link to a summary on their company profile screen. They do not see the
  objectives, the approval state detail, or any academic feedback.

- **Do not allow HODs to see individual log content or framework detail.** Their
  Student Detail view explicitly states that log and framework management is the
  Academic Supervisor's domain. Their access is limited to placement metadata and
  aggregate department reports.

- **Do not skip the invitation-email / account-activation flow** for Industry
  Supervisors or Academic Supervisors. Both must activate via the emailed
  `/activate?token=...` link, not self-register directly.

- **Do not invent new screens, fields, or flows not described in this file or in
  `/docs/ui-spec.md`.** If something seems missing or ambiguous, flag it to the
  user rather than guessing silently.

---

## 13. Reference documents in this project

| Document | Purpose |
|---|---|
| `/docs/roles-and-responsibilities.md` | Full responsibility matrix for all six roles; used as the basis for permissions and use-case coverage |
| `/docs/ui-spec.md` | Screen-by-screen UI description for all six roles; used as the ground truth for every layout, field, and component |
| `/docs/chapter-3-architecture.md` | The defended system architecture, requirements, and technology choices from the project report |
| `/docs/database-schema.md` | The entity-relationship reference; starting point for all SQLAlchemy models and Alembic migrations |
| `/design-reference/` | Folders of designed screens per role (Figma exports); visual ground truth alongside `ui-spec.md` |

---

*Last updated to reflect: Bi-Weekly Evidence Log (replacing Weekly Pulse); Monthly
Endorsement (Endorse/Flag) replacing per-goal Industry Supervisor review; removal
of Industry Supervisor UAF objective-setting; Academic Supervisor Thumbnail Wall;
AI Scenario Quiz with anti-cheat; KYC rear-camera-only artifact capture; WAT
server-side timestamping; Rotation Benefits Engine; 8-step adaptive onboarding
wizard; Skill Verification diagnostic; updated database schema; updated RBAC table;
updated What NOT to do section.*
