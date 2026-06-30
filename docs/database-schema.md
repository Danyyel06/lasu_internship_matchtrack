# Database Schema Reference — LASU Internship Platform

This is a field-level reconstruction of the entity-relationship diagram in
Chapter 3, Section 3.7 of the project report. The original diagram is cut
off at the bottom of the page in the source PDF — several tables visible in
the diagram have columns that run past the page edge, and a few tables
named in the surrounding prose (Unified Frameworks, Company Cycle
Entitlements) are not fully visible in the diagram crop at all.

**Legend for what follows:**
- Tables and fields marked `[CONFIRMED]` are read directly from the visible
  diagram in the source PDF.
- Tables and fields marked `[INFERRED]` are not visible in the diagram but
  are required by the Functional Requirements (3.3.1), the module
  descriptions (3.4), or the Roles and Responsibilities document, and have
  been added so the schema is actually buildable end to end.
- Where a confirmed table's columns clearly continue past the page edge,
  that is noted, and a reasonable continuation is proposed and marked
  `[INFERRED — continuation]`.

If you defend this project and a supervisor asks about a specific column,
the `[CONFIRMED]` ones are a direct match to your submitted diagram. The
`[INFERRED]` ones are reasonable engineering completions of a diagram that
was cut off — treat them as a starting draft, not gospel, and adjust freely
if you and your supervisor want something different.

This file is what the build agent should treat as the source of truth for
SQLAlchemy models and Alembic migrations — more authoritative than the
narrative entity list in `chapter-3-architecture.md`.

---

## 1. `users` [CONFIRMED]

The root authentication table. Every person in the system — regardless of
role — has exactly one row here.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| email | VARCHAR(100) | NOT NULL, unique |
| passwordHash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | NOT NULL — enum-like: student, company_rep, industry_supervisor, head_of_department, academic_supervisor, super_admin |
| firstName | VARCHAR(50) | NOT NULL |
| lastName | VARCHAR(50) | NOT NULL |
| isVerified | BOOLEAN | account email-verified flag |
| createdAt | TIMESTAMP | |

**`[INFERRED]` addition:** `role` as a free VARCHAR is what's drawn, but
given RBAC is a named non-functional requirement, implement this as a
proper Postgres ENUM type (`user_role`) at the database level, not just an
unconstrained string, so invalid roles are impossible at the data layer.

---

## 2. `students` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id, 0..1 relationship in diagram |
| matricNo | VARCHAR(20) | NOT NULL, unique |
| faculty | VARCHAR(100) | NOT NULL |
| department | VARCHAR(100) | NOT NULL |
| level | INTEGER | |
| cgpa | DECIMAL(3,2) | |

**`[INFERRED — continuation]`** the visible table is narrow and likely
continues past the page edge given FR1.1 ("collect student personal and
academic information") implies more than six fields. Add:

| Column | Type | Notes |
|---|---|---|
| phoneNumber | VARCHAR(20) | |
| dateOfBirth | DATE | |
| gender | VARCHAR(20) | |
| profilePhotoUrl | VARCHAR(255) | |
| preliminaryFitScore | DECIMAL(5,2) | computed at end of onboarding wizard per FR1.4 |
| onboardingCompletedAt | TIMESTAMP | NULL until wizard finished |
| currentTier | VARCHAR(10) | T1/T2/T3 — derived from Fit Score banding, used by the Fair Allocation Engine |

---

## 3. `companies` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id, 0..1 |
| companyName | VARCHAR(200) | NOT NULL |
| registrationNo | VARCHAR(50) | |
| industry | VARCHAR(100) | |
| isAdminVerified | BOOLEAN | gatekeeps whether the company can post internships (FR3.1) |
| previousFairScore | DECIMAL(5,2) | feeds the dynamic 15-25% equity quota calculation (FR3.4) |

**`[INFERRED — continuation]`** likely continues past the page edge. Add:

| Column | Type | Notes |
|---|---|---|
| companyAddress | VARCHAR(255) | |
| companyWebsite | VARCHAR(255) | |
| companyLogoUrl | VARCHAR(255) | |
| companySize | VARCHAR(50) | e.g. "1-50", "51-200" — for student-facing company profile |
| internSatisfactionScore | DECIMAL(5,2) | feeds FR4.4 reputation badge |
| fullTimeOfferRate | DECIMAL(5,2) | feeds FR4.4 reputation badge |
| createdAt | TIMESTAMP | |

---

## 4. `job_families` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL — one of the 10 Job Families |
| description | TEXT | |
| default_weights | JSONB | the WSM weight distribution for this family, e.g. `{"cgpa": 20, "skills": 40, "projects": 25, "coursework": 15}` — must sum to 100, validated at the application layer |

This table is what makes Job Family weighting (FR5.1) and Super Admin's Job
Family configuration screen data-driven instead of hardcoded.

**`[INFERRED]` companion table — `sub_roles`:** the diagram does not show a
separate sub-roles table, but FR1.2 explicitly requires "relevant sub-roles
(single-select)" displayed after a Job Family is chosen, and section 4 of
AGENTS.md states each family has 6-10 sub-roles. A `job_families.name`
column alone cannot hold this, so:

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| job_family_id | INTEGER | FK → job_families.id |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | |

---

## 5. `department_objectives` [CONFIRMED, partially visible]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| department_code | VARCHAR(20) | visible field, cut off after this in the source diagram |

**`[INFERRED — continuation]`** required by FR7.1 ("store static internship
learning objectives for each LASU department"):

| Column | Type | Notes |
|---|---|---|
| department_name | VARCHAR(100) | NOT NULL |
| faculty | VARCHAR(100) | |
| objective_text | TEXT | NOT NULL — one row per individual objective, not one row per department, so a department can have many objectives |
| display_order | INTEGER | controls the order objectives appear in when merged into the Unified Framework |
| created_by_admin_id | INTEGER | FK → users.id (Super Admin who configured it) |
| createdAt | TIMESTAMP | |

---

## 6. `student_job_family_selections` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| student_id | INTEGER | FK → students.id |
| job_family_id | INTEGER | FK → job_families.id |
| selected_sub_role_ids | INTEGER[] | array of `sub_roles.id` — note: FR1.2 says single-select for sub-role, so in practice this array will typically hold one value; kept as an array in case the requirement evolves to allow more than one |

---

## 7. `student_skills` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| student_id | INTEGER | FK → students.id |
| skill_name | VARCHAR(100) | NOT NULL |
| claimed_level | INTEGER | 1-5 scale, self-assessment (FR2.1) |
| verified_level | INTEGER | 1-5 scale, from diagnostic test (FR2.2/2.3) |
| test_score | INTEGER | raw score backing verified_level |

---

## 8. `internships` [CONFIRMED, cut off]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| company_id | INTEGER | FK → companies.id, 0..1 |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | visible field, table cut off after this point in the source diagram |

**`[INFERRED — continuation]`** required by FR3.2-FR3.4:

| Column | Type | Notes |
|---|---|---|
| location | VARCHAR(150) | |
| duration_weeks | INTEGER | |
| stipend | DECIMAL(10,2) | NULL if unpaid |
| application_deadline | DATE | |
| job_family_id | INTEGER | FK → job_families.id |
| sub_role_id | INTEGER | FK → sub_roles.id |
| track_type | VARCHAR(20) | "competitive" or "equity" (FR3.4) |
| total_slots | INTEGER | total intern slots for this posting |
| accepted_tiers | VARCHAR(10)[] | which of T1/T2/T3 this company has agreed to accept for this posting (feeds FR5.3) |
| status | VARCHAR(20) | draft / open / closed / filled |
| createdAt | TIMESTAMP | |

---

## 9. `internship_requirements` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| internship_id | INTEGER | FK → internships.id |
| skill_name | VARCHAR(100) | NOT NULL |
| required_level | INTEGER | 1-5 scale |
| is_mandatory | BOOLEAN | distinguishes hard requirements from nice-to-haves; affects Competitive Track filtering and gap analysis (FR5.4) |

---

## 10. `weekly_pulse` [CONFIRMED]

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| internship_id | INTEGER | FK → internships.id, 0..1 — note: in practice this should logically reference the specific placement/application, see `applications` below |
| week_number | INTEGER | NOT NULL |
| micro_goals | JSONB | array of 1-3 goal objects, each with goal text + linked skill (FR6.1) |
| pin_links | TEXT[] | URLs pinned as evidence (FR6.2) |
| hit_miss | BOOLEAN | Sunday hit/miss toggle (FR6.3) |
| reflection | VARCHAR(200) | capped at 140 chars at the application layer (column sized slightly larger for safety) |
| supervisor_endorsements | JSONB | array of endorsement/flag/coaching-tip objects per pinned evidence item (FR6.5) |
| flagged | BOOLEAN | true if any evidence item was flagged rather than endorsed |
| submitted_at | TIMESTAMP | |

**`[INFERRED]` correction:** the diagram links `weekly_pulse` to
`internship_id` directly, but a single internship posting can have many
accepted students (multiple slots). To correctly attribute pulses to one
specific student's placement rather than the posting as a whole, an
`applications` table is required as the actual link — see table 12 below.
When building, `weekly_pulse.application_id` (not `internship_id`) should be
the real foreign key; `internship_id` can remain as a denormalised
convenience column for faster queries if useful, but must not be the only
link.

---

## 11. `unified_frameworks` [INFERRED — named in prose, not visible in diagram]

Required by FR7.1-FR7.7 and explicitly named as a top-level entity in
Section 3.7(vii) of the report ("Stores the merged assessment objectives
(university + company) and approval status"), but not visible in the
diagram crop available from the source PDF.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| application_id | INTEGER | FK → applications.id — one framework per placed student |
| university_objectives | JSONB | array of objective text pulled from `department_objectives` at time of placement |
| company_objectives | JSONB | array of up to 10 objective text entries authored by the Industry Supervisor (FR7.3) |
| status | VARCHAR(20) | pending_company / pending_academic_review / changes_requested / approved |
| academic_supervisor_comments | TEXT | populated when status = changes_requested |
| submitted_by_industry_supervisor_at | TIMESTAMP | |
| approved_by_academic_supervisor_id | INTEGER | FK → users.id, NULL until approved |
| approved_at | TIMESTAMP | NULL until approved |

---

## 12. `company_cycle_entitlements` [INFERRED — named in prose, not visible in diagram]

Required by Section 3.7(viii) ("Tracks tier acceptance and fair
participation score for rotation benefits") and FR4.1/FR4.4, but not
visible in the diagram crop.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| company_id | INTEGER | FK → companies.id |
| cycle_id | INTEGER | FK → internship_cycles.id (see table 14) |
| total_slots_offered | INTEGER | across all this company's postings in the cycle |
| equity_quota_required | DECIMAL(5,2) | the dynamic 15-25% figure calculated for this company this cycle |
| equity_quota_met | BOOLEAN | computed at cycle close |
| fair_participation_score | DECIMAL(5,2) | feeds next cycle's `companies.previousFairScore` |

---

## 13. `applications` [INFERRED — structurally required, not optional]

Not named explicitly as a top-level entity in Section 3.7's list, but
required for the platform to function at all — there must be a record of a
specific student applying to (and being accepted/declined for) a specific
internship. Several other tables (`weekly_pulse`, `unified_frameworks`)
logically depend on this existing.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| student_id | INTEGER | FK → students.id |
| internship_id | INTEGER | FK → internships.id |
| fit_score | DECIMAL(5,2) | the Fit Score at time of application/recommendation |
| tier_at_application | VARCHAR(10) | T1/T2/T3 snapshot |
| status | VARCHAR(20) | recommended / applied / shortlisted / accepted / declined / withdrawn |
| industry_supervisor_id | INTEGER | FK → users.id, assigned once accepted |
| academic_supervisor_id | INTEGER | FK → users.id, assigned once accepted |
| appliedAt | TIMESTAMP | |
| decidedAt | TIMESTAMP | NULL until company decides |

---

## 14. `internship_cycles` [INFERRED — structurally required]

Needed because the Fair Allocation Engine and equity quota are explicitly
described as cycle-level concepts ("cycle-level minimum Equity quota,"
"cycle-level quota enforcement"), so a concrete cycle entity must exist for
those calculations to attach to.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | e.g. "2026 SIWES Cycle" |
| start_date | DATE | |
| end_date | DATE | |
| is_active | BOOLEAN | only one cycle should be active at a time |

---

## 15. `head_of_departments` and `academic_supervisor_assignments` [INFERRED]

The Roles and Responsibilities document and Chapter 1's objectives describe
a Head of Department role distinct from Academic Supervisor (HoD registers,
gets verified, and adds Academic Supervisors from their department; Academic
Supervisors are then assigned to specific placed students). This structure
is not shown in the available diagram crop but is required for that
workflow to exist.

`head_of_departments`:

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id |
| department | VARCHAR(100) | NOT NULL |
| faculty | VARCHAR(100) | |
| isAdminVerified | BOOLEAN | mirrors `companies.isAdminVerified` — gatekeeps ability to add Academic Supervisors |

`academic_supervisor_profiles`:

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id |
| head_of_department_id | INTEGER | FK → head_of_departments.id — who added/manages this supervisor |
| department | VARCHAR(100) | |

`industry_supervisor_profiles` (the company-side equivalent):

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id |
| company_id | INTEGER | FK → companies.id — who added/manages this supervisor |

---

## 16. `audit_logs` [INFERRED — required by NFR8]

Required by Non-Functional Requirement 8 (Compliance and Auditability):
"must log critical actions... for SIWES compliance and dispute resolution."

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id — who performed the action |
| action_type | VARCHAR(100) | e.g. "application_status_changed", "framework_approved", "evidence_flagged" |
| entity_type | VARCHAR(50) | which table the action affected |
| entity_id | INTEGER | which row |
| metadata | JSONB | before/after values or other context |
| createdAt | TIMESTAMP | |

---

## Relationship summary (for the agent building SQLAlchemy models)

```
users (1) ──── (0..1) students
users (1) ──── (0..1) companies
users (1) ──── (0..1) head_of_departments
users (1) ──── (0..1) academic_supervisor_profiles
users (1) ──── (0..1) industry_supervisor_profiles

job_families (1) ──── (*) sub_roles
job_families (1) ──── (*) internships

students (1) ──── (*) student_job_family_selections
students (1) ──── (*) student_skills
students (1) ──── (*) applications

companies (1) ──── (*) internships
companies (1) ──── (*) industry_supervisor_profiles
companies (1) ──── (*) company_cycle_entitlements

internships (1) ──── (*) internship_requirements
internships (1) ──── (*) applications

applications (1) ──── (*) weekly_pulse
applications (1) ──── (0..1) unified_frameworks

head_of_departments (1) ──── (*) academic_supervisor_profiles

internship_cycles (1) ──── (*) company_cycle_entitlements

department_objectives (*) ──── (1) [referenced by department name/code
    when building unified_frameworks.university_objectives at placement time]
```

---

## Build order for migrations (mirrors the phased build plan in the guide)

1. `users`
2. `job_families`, `sub_roles`
3. `students`, `student_job_family_selections`, `student_skills`
4. `companies`, `internship_cycles`
5. `internships`, `internship_requirements`
6. `applications`
7. `head_of_departments`, `academic_supervisor_profiles`,
   `industry_supervisor_profiles`
8. `department_objectives`, `unified_frameworks`
9. `weekly_pulse`
10. `company_cycle_entitlements`
11. `audit_logs`

Each numbered group above is a sensible single Alembic migration (or small
set of migrations) — don't try to create every table in one giant
migration, since several depend on foreign keys from earlier groups.
