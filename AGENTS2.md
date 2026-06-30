# AGENTS2.md — LASU Internship Management Platform: Extended Role Coverage

This file is a **supplement** to `AGENTS.md`. It does not replace `AGENTS.md` — all
architecture rules, tech-stack constraints, design language, colour conventions, and
domain rules defined there remain fully in force. Read `AGENTS.md` first, then read
this file.

This file exists because `AGENTS.md` under-specified three roles — **Industry
Supervisor**, **Academic Supervisor**, and **Head of Department** — and also did not
fully document the cross-role workflows that connect them (account creation, supervisor
assignment, Unified Assessment Framework handoffs). Every screen, field, action, and
state described below is derived from the uploaded design-reference PDFs and must be
treated as the visual and functional ground truth alongside `/docs/ui-spec.md`.

---

## 1. What this file adds

- Full screen inventory and layout rules for Industry Supervisor, Academic Supervisor,
  and Head of Department portals.
- The Company Representative "Manage Supervisors" flow (how an Industry Supervisor
  account is created and assigned).
- The HOD "Add Supervisor" flow (how an Academic Supervisor account is created and
  assigned).
- The cross-role Unified Assessment Framework state machine in detail.
- The Pulse review workflow from the Industry Supervisor side.
- Alert and notification content specific to each of the three roles.
- Mobile navigation patterns for each role.

---

## 2. Industry Supervisor Portal

### 2.1 Account lifecycle

The Industry Supervisor has **no self-registration screen**. Their account is always
created by a Company Representative:

1. Company Rep navigates to **Manage Supervisors → Add New Supervisor**.
2. Rep enters: Full Name, Work Email, Department.
3. System sends an invitation email to the work address.
4. Supervisor receives the email and lands on the **Activate Your Supervisor Account**
   screen.

**Activate Supervisor Account screen** (`/activate?token=...`):
- Header: LASU Internship Portal logo.
- Summary card (read-only): Full Name, Work Email (pre-filled from invitation data).
- Password creation fields: New Password + Confirm Password, each with show/hide toggle.
- Password rules listed inline: at least 8 characters · at least one number · at least
  one special character. Each rule shows a filled/empty radio indicator that turns green
  as the rule is satisfied.
- Primary CTA: **Activate Account** (full-width, black).
- Footer: "© 2024 Lagos State University. All Rights Reserved. Privacy Policy · Support
  · Contact Us".
- On successful activation the supervisor is redirected to their dashboard.

### 2.2 Navigation (mobile)

Bottom tab bar, 5 items:
`Home` · `Interns` · `Frameworks` · `Alerts` · `Profile`

On desktop: left sidebar equivalent (same 5 items).

### 2.3 Home (Dashboard)

Route: `/supervisor/home`

Header:
- Avatar + "Welcome back, [First Name]"
- Sub-line: "You have [N] students requiring attention today."
- Two stat tiles side-by-side: **Active Interns** (count) · **Total Hours Verified**
  (e.g. "160h").

**Critical Tasks** section — two possible cards:
- **Pending Pulse Reviews** card (amber border): "[N] Pending Reviews for this week."
  Action button: **Review Now**.
- **Framework Approvals** card (amber border): "[N] Assessment Framework needs
  approval." Action button: **View Framework**.

**Insights** section:
- **Student Growth & Analytics** card (teal accent button): "Track intern performance
  trends and skill development progress." Action button: **View Analytics** (teal,
  filled).

**Assigned Students** section — header + "See All →" link:
Each student card shows:
- Avatar · Name · Department/Degree
- "Week X of Y" progress line with percentage bar
- Status badge: `ON TRACK` (teal) · `LATE LOGBOOK` (red) · `STARTING` (grey)

**Recent Logbook Entries** section:
Each entry row shows:
- Status icon (green check = Approved, amber circle = Awaiting Verification) · "Student
  Name – Week N [Title]" · "Approved X hours ago" or "Awaiting Supervisor Verification"
  · three-dot overflow menu.

### 2.4 Interns (Student Roster)

Route: `/supervisor/interns`

Title: **Students Growth** (note: matches design exactly — "Growth" not "List").
Sub-label: `INDUSTRY SUPERVISOR` in small caps above the title.
Search bar: "Search interns by name or ID..."

Each intern card shows:
- Avatar (or placeholder icon if none) · Name · Department · Level (e.g. "400L")
- Status badge: `Active` (green) · `Wk N Review` (grey) · `Late Entry` (amber)
- Progress bar labelled "Logbook Progress" with week count (e.g. "Wk 12 / 12")

Tapping a card opens the **Individual Student Profile** (see §2.5).

### 2.5 Individual Student Profile

Route: `/supervisor/interns/:studentId`

Top card:
- Student avatar · Name · Department/Degree · Level · Matric Number · Email
- Current CGPA display (e.g. "4.25") with badge e.g. `Top 10% Cohort`

**Verified Skill Profile** section:
- Caption: "Competencies validated through practical assessments and supervisor
  endorsements during placement."
- Skill tags (truncated, expandable).

**Growth Dashboard** section — contains two sub-cards:
1. **Skill Progression Velocity** bar chart (week-over-week bars from Wk 1 to current).
   Export button: **Export Report**.
2. **Core Competency Assessment** table:
   - Technical Execution (score /5 as progress bar)
   - Problem Solving (score /5)
   - Communication (score /5)
   - "Verified Endorsements" count with avatar icons.

**Pulse Submissions Timeline** section:
Each week entry shows:
- Circle status icon (green = Approved, amber = Pending Review, grey = Upcoming/Not
  Started) · "Week N Field Report" · short excerpt · Submitted date · status badge.

**Unified Assessment Framework** mini-card:
- Title + status badge (e.g. dark badge = Approved/Live)
- "Current Stage: [STAGE]" with overall percentage
- Horizontal stage pills: ONBOARDING · EXECUTION · MID-TERM · FINAL, each with
  substatus (Completed / In-Progress / Awaiting / Locked).

### 2.6 Frameworks (Assessment Framework Management)

Route: `/supervisor/frameworks`

Header: **Assessment Frameworks**

**Framework Overview** info card:
"The Assessment Framework unifies Lagos State University's academic objectives with our
company's practical training goals. As a supervisor, your role is to guide interns in
mapping their specific projects to these dual objectives..."

**Assigned Interns** list — one card per intern:
Each card: Name · Role title · Progress bar · Status badge:
- `Pending` (amber) → CTA: **Manage Framework →**
- Dark/black badge (in-progress) → CTA: **Manage Framework →**
- `Submitted` (amber) → CTA: **Review Submission** (filled black)
- `Approved` (teal) → CTA: **View Framework** (outline)

Tapping **Manage Framework** opens the **Framework Building** screen (§2.6.1).
Tapping **Review Submission** opens the **Framework Review** screen (§2.6.2).

#### 2.6.1 Framework Building screen

Route: `/supervisor/frameworks/:internId/build`

This is a two-step flow indicated by a step indicator at the top:
`Step 1: Review LASU Objectives` → **Step 2: Add Company Goals** (bold = current step)
with a green progress bar beneath.

If the Academic Supervisor has requested changes, a red banner appears at the very top:
> ⚠ **Changes Requested by Academic Supervisor**
> "[Exact comment text from supervisor]"

Top identity card (read-only):
- Avatar initials · Student Name · Role · Department
- Status tag: e.g. `Framework Building`

**LASU Learning Objectives** card (read-only):
- Caption explaining that these are university-set and the company goals should provide
  practical paths to achieve them.
- Each objective listed with a green checkmark icon.

**Company-Specific Objectives** card (editable):
- Caption: "Define the practical goals the intern will work towards during their
  placement. You can add up to 10 goals. Ensure these complement the university
  objectives listed."
- Each goal: label "Goal Statement N" + textarea.
- If a goal was flagged by the Academic Supervisor, red inline error below that
  textarea: "Please revise: [reason]".
- **+ Add Another Goal** button (dashed outline).
- Footer buttons: **Save Draft** (outline) · **Submit Framework** (black, filled).

#### 2.6.2 Framework Review screen (after Acad. Sup. sends for revision)

Same layout as §2.6.1 but:
- Red banner always shown with the supervisor's comment.
- Flagged goals show the inline red error text.

### 2.7 Pulse Review

Route: `/supervisor/pulse`

This screen is reached from the Home "Review Now" CTA or from the Interns list.

**Intern identity row** (top, read-only):
- Avatar · Name · Role · Current week badge (e.g. `Week 8 Review`)

For each goal in that week's pulse, a goal card shows:
- Goal text (bold title) · Category label (e.g. `BACKEND DEVELOPMENT`, `DATABASE
  MANAGEMENT`, `QUALITY ASSURANCE`) · Hit/Miss badge (green `Hit` or red `Missed`)
- **Student Reflection** sub-card (grey background): student's reflection text in
  quotes.
- **Evidence** sub-card: file icon · filename · description · download icon (↓).
- **Endorse / Flag** button pair (green filled Endorse · amber outlined Flag).
- **Coaching Tip** textarea: "Write a coaching tip..." · character counter "0/200".

Footer of the full review:
- Primary CTA: **Submit Feedback** (black, full-width).
- Secondary CTA: **Save Draft** (outline, full-width).
- Caption: "ⓘ Your feedback is immediately visible to the student on their Pulse
  Dashboard."

### 2.8 Alerts (Notifications)

Route: `/supervisor/alerts`

Tabs: **All** · **Unread**

Notification types seen in designs:
| Icon | Event | Example text |
|---|---|---|
| Person+ | New intern assigned | "New Intern Assigned: [Name] has been added to your supervision list." |
| Cap/graduation | Department objectives received | "Objectives Received: Department objectives for [Dept] are ready. Please build the framework for [Student]." |
| Logbook icon | Pulse submitted | "Pulse Submitted: [Student] has submitted his Week N Pulse for review." |
| Warning triangle (red) | Missing pulse | "Missing Pulse: [Student] has missed his Week N Pulse submission deadline." |
| Chat bubble | Framework feedback | "Framework Feedback: The Academic Supervisor requested changes to the Assessment Framework for [Student]." |
| Green check circle | Framework approved | "Framework Approved: The Assessment Framework for [Student] has been approved and is now live." |

Read notifications are displayed at reduced opacity. Unread have a bold title and a
blue dot.
Settings (gear icon) in top-right of header.

### 2.9 Profile

Route: `/supervisor/profile`

**Account Information** card:
- Full Name (editable text field)
- Email (editable)
- Phone Number (editable)
- Department (editable)

**Professional Details** card:
- LinkedIn URL (editable)
- Mentorship Philosophy (multi-line textarea)

**Workplace & Security** card (navigation rows):
- Change Password →
- Notification Preferences →

**Help & Support** card:
- University Guidelines (external link →)
- Support Center →
- Sign Out (red text)

Primary CTA at bottom: **Update Profile** (black, full-width).

---

## 3. Academic Supervisor Portal

### 3.1 Account lifecycle

The Academic Supervisor has **no self-registration screen**. Their account is always
created by a Head of Department:

1. HOD navigates to **Manage Supervisors → Add New Supervisor**.
2. HOD enters: Full Name, Official Title, Official University Email (must be
   `@lasu.edu.ng` or equivalent institutional domain).
3. An information note is shown: "An invitation email will be sent to this address for
   the lecturer to set their password and activate their account."
4. CTA: **Send Invitation** (full-width, black, with send icon).
5. Supervisor receives the email and lands on the **Activate Your Account** screen.

**Activate Account screen** (`/activate?token=...`):
- Header: InternLink logo + wordmark.
- Heading: **Activate Your Account**
- Sub-text: "Welcome to the Academic Supervisor Portal. Please verify your details
  below and set a secure password to activate your access."
- Summary card (read-only): avatar icon · NAME row · EMAIL row.
- Create Password field + Confirm Password field (each with show/hide toggle).
- Password rules: "Minimum 8 characters · Include at least one number or symbol"
  (shown in a grey info box).
- CTA: **Activate Account →** (black, full-width).
- Footer: "By activating, you agree to the Portal Terms of Service."

### 3.2 Navigation (mobile)

Bottom tab bar, 5 items:
`Home` · `Pulse` · `Frameworks` · `Alerts` · `Profile`

On desktop: equivalent left sidebar.

### 3.3 Home (Dashboard)

Route: `/academic-supervisor/home`

**Action Required** banner (black, appears when frameworks need approval):
- "! Action Required — You have frameworks awaiting your review and approval."

Two stat tiles:
- **Total Students** (count + person icon)
- **Pulse Submissions** (e.g. "10 / 12 — Current Week")

**Alerts** section:
Each alert card is either:
- Red bordered (critical): Student avatar · Name · Department · flag icon (🚩) ·
  "Missed Week N Pulse Submission." 
- Standard: Notifications widget linking to the full notification centre.
  Button: **Go to Center →** (black).

**All Students** section — a card per student:
- Avatar · Name · Role · Company
- "Week N" label · Pulse Status badge: `● Pulse Submitted` (green) · `● Pending
  Review` (amber)
- Two action buttons: **Pulse Overview** (outline) · **Full Profile** (outline).

### 3.4 Pulse (Pulse Overview)

Route: `/academic-supervisor/pulse`

Header: **Pulse Overview** · Week selector dropdown ("Week N ↓") top-right.
Sub-caption: "Activity across your [N] active placements."

Each student card:
- Avatar · Full Name (Last, First format) · Role @ Company
- Status badge (top-right): `On Track` (green) · `Needs Attention` (red/amber)
- **Goals Set**: "N / wk"
- **Completion**: percentage + progress bar (green for high, red for low)
- Sunday Reflection status: green badge "✔ Sunday Reflection Submitted" OR red badge
  "⚠ Reflection Overdue"
- CTA: **View Details** (outline, full-width).

#### 3.4.1 Weekly Pulse Detail

Route: `/academic-supervisor/pulse/:studentId/week/:weekId`

Top: back arrow · "Weekly Pulse Detail" · three-dot overflow.

Student identity mini-card:
- Avatar · Name · Week badge (e.g. `Week 6`) · Department

Overall completion card:
- "N/N Goals Met" bold count · percentage circle (e.g. 100%) · status label
  (e.g. `EXCELLENT STANDING` in teal).

Performance Trend badge: e.g. "Consistent" (dark card).

**Weekly Goals** card (marked `COMPLETED`):
Each goal row: green checkmark · Goal text · "Completed on [Day], [Time]"

**Student Reflection** card:
- Quote block with student's weekly reflection text (paragraph length — this is the
  extended view, not the 140-char limit — the 140-char limit is enforced at submission,
  what is shown here is the submitted text).

**Industry Feedback** section:
- Star rating (read-only) · Supervisor avatar + name + title
- Feedback text in quotes.
- Skill tags endorsed: e.g. `Problem Solver` · `Team Player` · `Punctual`

Footer action buttons (Academic Supervisor **does not** leave their own inline pulse
feedback — these buttons are for their own workflow management):
- **Approve Weekly Pulse** (teal/dark, full-width)
- **Request Clarification** (outline, full-width)

**Note for implementation:** The Academic Supervisor cannot endorse/flag individual
pieces of evidence — that is exclusively the Industry Supervisor's channel. Approve /
Request Clarification here refers to the supervisor logging their review state of the
overall submission, not adding per-evidence feedback.

### 3.5 Frameworks (Assessment Framework Approval)

Route: `/academic-supervisor/frameworks`

Header: **Assessment Frameworks**
Sub-caption: "Review and approve student internship objectives and frameworks."

Each student row in the list:
- Student Name · Matric Number · Status badge · Department/Subject abbreviation

Status badge colours:
- `Pending Your Approval` — amber
- `Awaiting Industry Sup.` — grey
- `Changes Requested` — red/amber
- `Approved` — green

Tapping a row expands or navigates to the full **Framework Detail + Decision** screen.

#### 3.5.1 Framework Detail + Decision screen

Route: `/academic-supervisor/frameworks/:studentId`

Identity card (top):
- Student name + matric · status badge (e.g. `Pending Your Approval`) ·
  Role / Company / Duration

**SIWES University Goals** section (header with cap icon):
Each objective numbered 1, 2, 3... with title + description paragraph.

**Company-Specific Objectives** section (header with grid icon):
Each objective: bold title · description paragraph · skill tags (e.g. `REACT`,
`TAILWIND CSS`).

**Supervisor Feedback** input:
- Textarea: "Provide actionable feedback on the proposed framework..."
- Caption: "Optional for approval. Required for changes."

Footer action buttons:
- **Request Changes** (outline, full-width)
- **Approve Framework** (black, full-width)

On **Approve Framework**: framework status becomes `Approved` and goes live immediately
on the student's, Industry Supervisor's, and Academic Supervisor's dashboards.

On **Request Changes**: the written feedback is sent back to the Industry Supervisor
as a notification and the framework status becomes `Changes Requested`.

### 3.6 Alerts (Critical Alerts)

Route: `/academic-supervisor/alerts`

Header: **Critical Alerts**
Sub-caption: "Students requiring immediate intervention for missed pulses."
Badge at top: `⚠ N High Priority Alerts` (red pill).

Each alert card:
- Avatar initials · Name · Department · `⚠ Critical` badge (red)
- **PRIMARY ALERT** label (red small-caps)
- Alert type heading: e.g. **Consecutive Missed Pulses**
- Alert description: "Student has missed N consecutive weekly logbook submissions."
- Metadata: "Weeks Missed: N" · "Last Submission: [Date]"
- Two CTA buttons: **View Student** (outline) · **Log Contact** (black filled)

#### 3.6.1 Log Contact (Log Intervention) screen

Route: `/academic-supervisor/alerts/:studentId/log`

Header: ← **Log Intervention** · three-dot overflow.

Student identity card (read-only):
- Avatar initials · "INTERVENTION FOR" label · Student Name · Matric number

Info box:
"ⓘ Logging a contact adds a timestamped note to the student's record visible to the
HOD. It does not automatically resolve red flags."

Fields:
- **Contact Method** dropdown: "Select method" (e.g. Phone Call, In-Person, Email,
  WhatsApp)
- **Date of Contact** date picker (pre-filled to today)
- **Intervention Notes** textarea: "Describe the discussion and specific outcomes..."

CTA: **Save Log Entry** (black, full-width)
Secondary: Cancel (text link)

This log entry is visible to the HOD but does **not** automatically clear the alert
or resolve missed-pulse flags — the alert clears only when the student submits again
and meets the threshold configured by Super Admin.

#### 3.6.2 General Alerts screen (separate from Critical Alerts)

Route: `/academic-supervisor/alerts/all`

Tabs: **All Alerts** · **Action Required (N)** · **System Updates**

Each alert grouped by date (TODAY / YESTERDAY / older dates):

Alert types:
| Left accent | Type | Example |
|---|---|---|
| None | Framework Pending Approval | "Student [Name] has submitted Phase 2 of their industrial attachment framework for your review." CTA: **Review Now** |
| Red | Missed Pulse Check | "N students under your supervision missed this week's mandatory Pulse Check-in." |
| None | Framework Resubmitted | "Student [Name] has addressed your comments and resubmitted..." CTA: **Review Changes** |
| None | Portal Maintenance | System message |
| None | New Students Assigned | "[N] new students from [Dept] have been assigned to your supervision cohort." |

### 3.7 Profile

Route: `/academic-supervisor/profile`

Top card:
- Avatar (with edit pencil overlay)
- Name (bold, large)
- Title + Department (e.g. "Senior Lecturer, Computer Engineering")
- Status badges: `Active Supervisor` · `Faculty of Engineering`

Three stat tiles (horizontal row):
- Total Students count
- Active Now count (green left border accent)
- Completed count

**Academic Supervision Handbook** card (dark/black background):
- "Review the official university guidelines for student internship mentorship and
  grading protocols."
- CTA: **View Handbook** (outline + external link icon)

**Personal Information** card:
- Email Address (display only)
- Phone Number (display only)
- Office Location (display only)
- Faculty / Department (display only)

**Account Settings** card (navigation rows):
- Edit Profile →
- Change Password →
- Notification Preferences →

**Sign Out** (red, full-width, bottom of page)

Footer: "LASU InternLink v2.4.0 · Logged in as [Name]"

---

## 4. Head of Department Portal

### 4.1 Account lifecycle

The HOD registers directly on the platform, but their account must be verified by the
Super Admin before they can access any features beyond their unverified state.

The Super Admin verifies HOD accounts under **Verify Accounts → Heads of Department**
tab (symmetric to the Companies tab).

Once verified, the HOD's dashboard shows a `✔ Verified` green badge in the header.

### 4.2 Navigation (mobile)

Bottom tab bar, 5 items:
`Home` · `Students` · `Supervisors` · `Alerts` · `Profile`

On desktop: equivalent left sidebar (same 5 items + hamburger for menu).

### 4.3 Home (Dashboard)

Route: `/hod/home`

Header:
- "Welcome back, Prof. [Name]" · Department name · `✔ Verified` green badge
- CTA: **New Posting** (dark, small) — navigates to quick-access placement posting.

Four stat tiles in a 2×2 grid:
- **Total Registered** (students count) + person-group icon
- **Placed Students** (count, teal) + briefcase icon
- **Searching** (count, amber) + search icon
- **Active Roles** (count) + trend-up icon

**Departmental Reports** promo card (dark/black background, full-width):
- Chart icon · "Departmental Reports" · "View detailed academic & placement analytics"
- Chevron → navigates to Reports screen.

**Action Required** section (amber warning icon in header):
Each unassigned student card:
- Student name · Company – Role (e.g. "Sterling Bank – IT Intern") · `Unassigned`
  badge (red)
- CTA: **Assign Supervisor** (black, full-width with person+ icon)

**Placement Activity Feed** section:
- Header + "View All Activity" text link
- Each entry: avatar · event description · time ago
- Example events: "[Student] accepted an offer at [Company]", "Dr. [Name] approved N
  logbook entries for 400L students", "[Student] started searching for placement in
  [Job Family]"

### 4.4 Students

Route: `/hod/students`

Title: **My Department Students**
Sub-caption: "Manage and monitor [Department] internship placements."

Search: "Search by name or matric number..."
Filter tabs (horizontal scroll): **All** · **Placed** · **Unplaced** · **Completed**

Each student card:
- Avatar · Name · Matric · Level (e.g. 400L) · Status badge:
  - `Placed` (green)
  - `Unplaced` (red/salmon)
  - `Completed` (amber/brown)
- Company name + icon (or "No placement yet" greyed out)
- "Sup: [Supervisor Name]" line
- CTA: **View Student** (outline, full-width)

#### 4.4.1 Student Detail (HOD view)

Route: `/hod/students/:studentId`

Top card:
- Avatar · Name · Matric · Placement status badge (e.g. `● PLACED` green)

**Platform Fit Score** card:
- Large percentage (e.g. "85%") · label badge (e.g. `High Match`)

**Job Family** card: text (e.g. "Software Engineering")

**Sub-role Specialization** card: text (e.g. "Frontend Developer")

**Current Placement** card:
- "Host Organization" label · Company Name · Location
- **View Organization** button (outline)
- "Assigned Academic Supervisor" label · supervisor avatar initials · Name · Department

Info notice at bottom:
"ⓘ Detailed logbook entries and weekly pulse content are actively managed by the
assigned Academic Supervisor to ensure focused academic oversight and evaluation."

This means the HOD **cannot** see pulse content from this screen — they only see
placement metadata. Pulse content is the Academic Supervisor's domain.

### 4.5 Supervisors (Manage Academic Supervisors)

Route: `/hod/supervisors`

Title: **Manage Supervisors**
CTA: **+ Add New Supervisor** (black, full-width)

Each supervisor card:
- Avatar initials · Name · Status badge: `Active` (green) · `Pending` (amber)
- Title (e.g. "Senior Lecturer", "Lecturer I", "Professor")
- Email address (with envelope icon)
- "Assigned Students: N/MAX" (e.g. "12/15" or "Awaiting Acceptance" if pending)
- If `Active`: **✏ Edit** (outline) · **🗑 Remove** (red outline)
- If `Pending`: **▷ Resend Invite** (outline) · **×** (remove icon)

The "15/15" state (at maximum capacity) should display the count in amber/red to signal
that no more students can be assigned to that supervisor without a Super Admin
configuration change.

#### 4.5.1 Add New Supervisor screen

Route: `/hod/supervisors/add`

Header: ← **Add New Supervisor**

Fields:
- Full Name (text input, placeholder: "e.g., Dr. Amina Balogun")
- Official Title (text input, placeholder: "e.g., Senior Lecturer")
- Official University Email (text input, placeholder: "lecturer@lasu.edu.ng")

Info box:
"ⓘ An invitation email will be sent to this address for the lecturer to set their
password and activate their account."

CTA: **▷ Send Invitation** (black, full-width)

#### 4.5.2 Assign Supervisor screen

Route: `/hod/supervisors/assign` (also reachable from Action Required cards)

Header: ← **Assign Supervisor** · filter icon (top-right)

**1. Select Student** section:
- Caption: "Choose an unassigned student."
- Radio-button list of unassigned students:
  Each row: avatar initials · Name · Company (briefcase icon) · `Unassigned` badge

**2. Select Supervisor** section:
- Caption: "Assign to an available lecturer."
- Radio-button list of supervisors:
  Each row: avatar initials (coloured) · Name · Department
  - Capacity bar (green for available, red for full): e.g. "8/10 Students"
  - If at maximum: red bar + amber warning icon (⚠) + info box below:
    "ⓘ This supervisor is currently at maximum capacity. Assignment may require
    override."

CTA: **Confirm Assignment ✔** (black, full-width)

The maximum student-per-supervisor threshold is set in Super Admin → System Settings →
Capacity → "Max Students per Academic Supervisor".

### 4.6 Alerts (Notifications)

Route: `/hod/alerts`

Header: **Notifications** · **Mark all as read** button (outline, top-right)
Tabs: **All** · **Unread**

Notification types:
| Icon | Type | Example |
|---|---|---|
| Briefcase | New Placement | "Adebayo Johnson has secured a placement at TechCorp Nigeria. — Computer Science Dept." |
| Warning (red left border) | Missed Pulse Alert | "N students in [Dept] have missed their weekly logbook submission." CTA: **Review Students** |
| Info circle | System Message | "The mid-semester evaluation portal is now open for supervisors." |
| Checkmark circle | Report Approved | "Dr. [Name] approved the monthly departmental report." |
| Checkbox | Task Completed | "Supervisor allocation for [Dept] has been finalised." |

Red left border on the notification card indicates urgent/action-required items.

### 4.7 Departmental Reports

Route: `/hod/reports`

Session + Cycle filter pills at the top (e.g. `Session: 2023/2024` · `Cycle: Alpha`).

**Total Placed** stat card:
- Large percentage (e.g. "84%") · trend indicator (e.g. "+5% from last cycle")
- Progress bar: placed count / total

**Track Breakdown** card:
- Bar chart rows per Job Family/sub-role with percentage.

**Top Employers** card:
- Ranked list: company logo/icon · company name · location · student count

**Bottom row** two tiles:
- **Avg Pulse Rate** (heart icon, teal): e.g. "4.2/5"
- **Early Warnings** (warning icon, red background): count of students with
  consecutive missed pulses

Footer CTAs:
- **↓ Export CSV** (black, full-width)
- **⎙ Print Report** (outline, full-width)

### 4.8 Profile

Route: `/hod/profile`

Top card:
- Avatar (with verified tick overlay)
- Name (large)
- Role: "Head of Department, [Department]"
- Status badge: `✔ Verified Account` (teal, rounded pill)

**Personal Information** card:
- Email Address (envelope icon)
- Phone Number (phone icon)

**Departmental Details** card:
- Faculty (building icon) · Faculty name
- Department (grid icon) · Department name

**Logout** button (red, rounded, full-width)

---

## 5. Company Representative — Manage Supervisors (Full Flow)

This flow was missing from AGENTS.md.

### 5.1 Manage Supervisors screen

Route: `/company/supervisors`

Header: **Manage Supervisors**
Sub-caption: "View and manage staff members registered as industry supervisors."

CTA: **+ Add New Supervisor** (black, full-width, with person+ icon)

**Active Staff** section with search bar:
Each supervisor card row:
- Avatar · Name · Job Title (e.g. "Senior Engineering Lead")
- "Active Interns: N" (count)
- ✏ (edit icon) · 🗑 (delete icon)

**Quick Assign** section:
- Caption: "Allocate an unassigned intern to a registered supervisor."
- **Select Intern** dropdown: "Choose pending intern..."
- **Assign to Supervisor** dropdown: "Select staff member..."
- CTA: **Confirm Assignment** (outline with person icon)

### 5.2 Add New Supervisor (Company side)

The Company Representative's "Add New Supervisor" form collects:
- Full Name
- Work Email (company domain)
- Department / Team

The system sends an invitation email → supervisor activates via the **Activate Your
Supervisor Account** screen (documented in §2.1 above).

### 5.3 Assign Supervisor to Intern (from My Interns screen)

When a Company Rep taps **Assign Supervisor** on an intern card in My Interns
(`/company/interns`), a modal/sheet appears:

**Assign Supervisor** modal:
- Intern identity row (read-only): avatar initials · Name · Role
- **Select Industry Supervisor** dropdown: "Choose a supervisor..."
- Helper text: "This supervisor will be responsible for reviewing weekly logbooks."
- Empty state (if no supervisors registered yet): icon + "You have no registered
  supervisors. Please add a supervisor first." + **Manage Supervisors →** link
- Footer: **Cancel** (outline) · **Confirm Assignment** (black)

---

## 6. Cross-Role: Unified Assessment Framework State Machine

The following states and transitions must be implemented as a proper state machine,
not a simple editable form.

```
INITIAL (auto-created when placement is confirmed)
    │
    ▼ System sends LASU dept. objectives to Industry Supervisor
AWAITING_INDUSTRY_SUBMISSION
    │
    ▼ Industry Supervisor submits company objectives
PENDING_ACADEMIC_APPROVAL
    │
    ├──▶ Academic Supervisor approves  ──▶ APPROVED (framework goes live)
    │
    └──▶ Academic Supervisor requests changes
              │
              ▼
         CHANGES_REQUESTED (Industry Supervisor receives notification with comment)
              │
              ▼ Industry Supervisor revises and resubmits
         PENDING_ACADEMIC_APPROVAL  (loop back)
```

**State visibility per role:**

| State | Student sees | Industry Sup. sees | Academic Sup. sees | Company Rep sees | HOD sees |
|---|---|---|---|---|---|
| AWAITING_INDUSTRY_SUBMISSION | "Pending Setup" | Pending badge, Build button | "Awaiting Industry Sup." | — | — |
| PENDING_ACADEMIC_APPROVAL | "Pending Approval" | "Pending Academic Approval" banner | "Pending Your Approval" | — | — |
| CHANGES_REQUESTED | "Changes Requested" | Red Changes Requested banner + comment | "Changes Requested" | — | — |
| APPROVED | Framework visible (read-only) | Framework visible (read-only) | Framework visible + Approved badge | — | — |

**Company Representative does NOT see the framework content.** They only see a
"Unified Assessment" quick-link on their Company Profile screen.

**HOD does NOT see the framework content.** Their Student Detail view explicitly
states that pulse and framework content is managed by the Academic Supervisor.

---

## 7. Cross-Role: Pulse Missed Alert Escalation

When a student misses consecutive pulse submissions (threshold set in System Settings,
default = 2):

1. System generates an alert visible to the **Academic Supervisor** in their Alerts
   screen as a `Critical` card.
2. The alert shows: student name, department, count of weeks missed, date of last
   submission.
3. Academic Supervisor can take one action: **Log Contact** → creates a timestamped
   note visible to the HOD.
4. The HOD sees this escalation in their Notifications feed as a "Missed Pulse Alert"
   with a red left-border.
5. The Company Representative also receives a notification: "Alert: N interns have
   missed consecutive weekly pulse submissions." (visible in their Notification Centre).
6. Industry Supervisor's Home dashboard shows a red-bordered intern card labelled
   `● Overdue` with the late goal highlighted in red.
7. The alert does NOT auto-resolve — it clears only when the student submits a pulse
   and the consecutive-miss counter resets below the threshold.

---

## 8. Screen-by-Screen Navigation Summary

### Industry Supervisor (mobile bottom tabs)
| Tab | Route | Primary Content |
|---|---|---|
| Home | `/supervisor/home` | Stat tiles, Critical Tasks, Assigned Students |
| Interns | `/supervisor/interns` | Student roster with logbook progress |
| Frameworks | `/supervisor/frameworks` | Per-intern framework status + build/review |
| Alerts | `/supervisor/alerts` | Notification feed |
| Profile | `/supervisor/profile` | Account info, professional details |

### Academic Supervisor (mobile bottom tabs)
| Tab | Route | Primary Content |
|---|---|---|
| Home | `/academic-supervisor/home` | Action required banner, stats, student cards |
| Pulse | `/academic-supervisor/pulse` | Week overview → individual pulse detail |
| Frameworks | `/academic-supervisor/frameworks` | Approve/request-changes per student |
| Alerts | `/academic-supervisor/alerts` | Critical alerts (missed pulses) + general alerts |
| Profile | `/academic-supervisor/profile` | Stats, personal info, account settings |

### Head of Department (mobile bottom tabs)
| Tab | Route | Primary Content |
|---|---|---|
| Home | `/hod/home` | Stats, action required (unassigned), placement feed |
| Students | `/hod/students` | Department student list with placement status |
| Supervisors | `/hod/supervisors` | Academic supervisor management + assignment |
| Alerts | `/hod/alerts` | Notification feed |
| Profile | `/hod/profile` | Personal info, departmental details |

---

## 9. Permissions and data access — hard constraints

These must be enforced server-side (FastAPI dependencies), not just hidden in the UI.

| Action | Allowed by | Forbidden for |
|---|---|---|
| Create Industry Supervisor account | Company Rep only | Everyone else |
| Create Academic Supervisor account | HOD only | Everyone else |
| Build/submit Unified Assessment Framework objectives | Industry Supervisor only | Everyone else |
| Approve or request changes on framework | Academic Supervisor only | Everyone else |
| Endorse / Flag individual evidence items | Industry Supervisor only | Academic Supervisor, HOD, Company Rep |
| Log Contact entry | Academic Supervisor only | Everyone else |
| View pulse submission content | Student · Industry Supervisor · Academic Supervisor | HOD · Company Rep · Super Admin |
| View student Fit Score | Student (own) · Company Rep (applicants) · HOD (dept students) | Industry Supervisor · Academic Supervisor |
| Assign Academic Supervisor to student | HOD only | Everyone else |
| Assign Industry Supervisor to intern | Company Rep only | Everyone else |
| Set Max Students per Supervisor thresholds | Super Admin only | Everyone else |

---

## 10. What NOT to do (supplements to AGENTS.md §6)

- Do not allow Industry Supervisors to access internship postings, applicant lists,
  or any company administrative screen — their portal is student-facing only.
- Do not allow Academic Supervisors to leave inline pulse feedback (endorse/flag
  evidence) — that channel belongs to the Industry Supervisor alone.
- Do not allow HODs to view pulse submission content — they see only placement metadata
  and aggregate department reports.
- Do not auto-resolve missed-pulse alerts without a student submission — Log Contact
  does not clear the alert.
- Do not allow the Unified Assessment Framework to be edited by anyone after it reaches
  the APPROVED state — it becomes read-only immediately on approval.
- Do not allow Company Representatives to see the Unified Assessment Framework content
  — they have a Quick Link on their profile page but it leads to a read-only summary,
  and even that is only for their own assigned interns.
- Do not let the "Assign Supervisor" modal in the Company Rep flow proceed if there are
  no registered Industry Supervisors — show the empty state with the "Manage
  Supervisors →" link instead.
- Do not skip the invitation-email / account-activation flow for Industry Supervisors
  or Academic Supervisors — they must activate via the emailed link, not self-register
  directly.
