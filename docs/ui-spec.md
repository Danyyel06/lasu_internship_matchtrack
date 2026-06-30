# UI Specification — LASU Internship Management and Development Platform
# Version: Final | All Roles | All Screens

This document is the screen-by-screen UI specification for every role on the
platform. The build agent must read the relevant section of this document
before building any screen. "Looks roughly right" is not acceptable — match
the described layout, fields, actions, and states exactly.

---

## DESIGN LANGUAGE (applies to every screen across all roles)

- Flat and modern. No gradients, no heavy drop shadows.
- Cards: 12px border radius, subtle 1px borders, generous whitespace.
- Primary colour: deep blue — buttons, nav highlights, primary actions.
- Teal green: success states, Equity Track badge, progress indicators.
- Amber: warnings, pending states.
- Red: missed pulses, flagged evidence, danger/destructive actions.
- Typography: Inter (or equivalent clean sans-serif). Headings medium weight,
  body text regular weight.
- Every screen must work on both desktop and mobile.
- Student, Company Rep, Industry Supervisor, Head of Department, Academic
  Supervisor: left sidebar on desktop → collapses to bottom tab bar on mobile
  (5 most important items + More).
- Super Admin: permanent fixed left sidebar on desktop (never collapses).
  Mobile: 4-tab bottom bar (Dashboard, Verify, Users, Profile). Remaining
  screens accessible via Quick Access section on dashboard.

---

## PART ONE: STUDENT

### Who They Are
Students are the largest group and the heart of the system. A student
registers via an 8-step onboarding wizard that builds their complete academic
and professional profile. Once submitted, the system generates a Fit Score
(a number out of 100 reflecting how well-prepared the student is for their
chosen field) and immediately begins matching them to available internships.

---

### Screen 1 — Landing Page

Public page, visible before login.

**Top navigation bar:**
- Platform logo on the left
- "Log In" and "Get Started" buttons on the right

**Hero section:**
- Large headline: "Connecting LASU Students to the Right Internships"
- Two-line subtext explaining the platform
- Two CTA buttons: "I am a Student" and "I am a Company"

**Features section:**
- Four cards: Smart Matching, Digital Logbook, Real-Time Progress Tracking,
  Unified Assessment
- Each card: icon + title + two lines of description

**Footer:**
- LASU logo
- Links: Contact, Privacy Policy, SIWES Guidelines

---

### Screen 2 — Login Page

Centred card on light gray background.

**Elements:**
- Platform logo at top
- Email input field
- Password input field with show/hide toggle
- Full-width blue "Log In" button
- "Forgot Password" link below button
- Divider
- "Register as a Student" link
- "Register as a Company" link
- Small note: "Academic supervisors and administrators are registered by LASU
  admin."

---

### Screen 3 — Student Registration: 8-Step Onboarding Wizard

Progressive 8-step wizard. Progress bar at top showing current step. Back
and Next buttons at bottom of each step. Step title displayed above form.

**Step 1 — Personal Information:**
- First name
- Last name
- Matric number
- Email
- Phone number
- Password
- Confirm password

**Step 2 — Academic Information:**
- Faculty (dropdown)
- Department (dropdown, filters based on chosen faculty)
- Academic level
- CGPA (decimal, 0.00–5.00)
- Student ID upload

**Step 3 — Job Family Selection:**
- 10 job family cards in a 2-column grid
- Each card: icon + label
- Families: Software and Technology, Engineering and Manufacturing, Business
  and Management, Finance and Accounting, Health and Life Sciences, Media and
  Communications, Education and Social Services, Architecture and Built
  Environment, Science and Research, Legal and Compliance
- Single selection only — one card tap selects it

**Step 4 — Sub-Role Selection:**
- 6–10 sub-role options as selectable chips (data-driven from the selected
  Job Family)
- Example for Software and Technology: Frontend Developer, Backend Developer,
  Mobile Developer, Data Analyst, Cybersecurity Analyst, UI/UX Designer,
  DevOps Engineer
- Single selection
- Short description of selected sub-role appears below the chips

**Step 5 — Skills Self-Assessment:**
- 8–12 relevant skills generated dynamically based on chosen Job Family and
  sub-role
- For each skill: 5-point scale selector shown as radio pills in a row —
  Beginner, Elementary, Intermediate, Advanced, Expert

**Step 6 — Coursework and Projects:**
- Sub-section 1: relevant university courses as multi-select checkboxes
- Sub-section 2: list builder for up to 3 projects, each with:
  - Project title
  - Short description (max 100 characters)
  - Tag input for technologies/skills used
- Sub-section 3: optional up to 3 certifications, each with:
  - Certification name
  - Issuing body

**Step 7 — Internship Preferences:**
- Preferred location (text field with remote toggle)
- Preferred duration (dropdown)
- Preferred stipend range (two numeric inputs: min and max, in Naira)
- Track preference: two large card-style radio buttons:
  - Competitive Track
  - Equity and Developmental Track
  - "Open to Both" checkbox below the cards

**Step 8 — Review and Submit:**
- Read-only summary of all entered information in expandable sections (one
  per step, each with an "Edit" link that returns to that step)
- "Submit Profile" button at bottom
- Note: "Your Fit Score will be calculated and your matched internships will
  be available within 30–60 minutes."

---

### Screen 4 — Student Dashboard Home

**Sidebar navigation (desktop):**
Home, My Profile and Fit Score, Browse Internships, My Applications, Pulse
Dashboard, Growth Dashboard, Notifications, Settings, Log Out

**Mobile:** bottom tab bar — 5 most important items + More

**Main content:**
- Welcome message using student's first name
- Three metric cards:
  1. Fit Score — large number inside a circular progress ring, labelled "Your
     Match Readiness Score"
  2. Number of active applications
  3. Internship status badge: "Not Placed", "Placed", or "Completed"

- Recommended Internships section: top 3 matched internship cards,
  scrollable horizontally on mobile. Each card shows:
  - Company name and logo
  - Internship title
  - Location and duration
  - Track badge
  - Personalised match percentage
  - Gap indicator line
  - "View and Apply" button

- Two sections side by side on desktop, stacked on mobile:
  - Left: "This Week's Pulse" — prompts to set goals if not set; shows mini
    summary of 3 micro-goals with hit/miss icons if already set
  - Right: "Upcoming Deadlines" — application deadlines in next 7 days

- Notifications Feed: 3–5 most recent system notifications

---

### Screen 5 — Browse Internships Page

**Left filter sidebar:**
- Keyword search bar
- Job Family filter (checkboxes for all 10 families)
- Track type filter
- Location filter with remote toggle
- Duration filter
- Stipend range: dual-handle slider
- "Apply Filters" and "Clear All" buttons

**Cards grid (right):**
- 2 columns on desktop, 1 on mobile
- Each card: company logo, company name, internship title, location and
  duration (with icons), track badge, posting date, stipend, personalised
  match percentage (in green text), "View Details" button, "Quick Apply"
  button
- Sorting bar above grid: Best Match, Most Recent, Deadline, Stipend
- Pagination at bottom

---

### Screen 6 — Internship Detail Page

Two-column layout: main content 70% left, sticky panel 30% right.

**Left column:**
- Company name and logo
- Internship title
- Tags row: location, duration, stipend, track type, deadline
- About This Internship (rich text)
- What You Will Do (list)
- Requirements with skill level indicators
- About the Company
- Fit Analysis section:
  - Overall match percentage
  - Green checkmarks column: skills the student meets
  - Red indicators column: skill gaps with exact level differences shown

**Sticky right panel:**
- Company logo and name
- Deadline countdown
- Track badge
- Large blue "Apply Now" button
- "Save for Later" outline button

---

### Screen 7 — My Applications Page

Status filtering tabs at top: All, Pending, Under Review, Accepted, Declined

Each application row:
- Company name and logo
- Internship title
- Applied date
- Status badge
- If accepted: "View Placement Details" button

---

### Screen 8 — Pulse Dashboard

Weekly digital logbook. Week navigation bar at top: current week number and
date range, previous and next arrows.

**Monday Goal-Setting card:**
- 3 goal input slots, each with:
  - Text input for the goal
  - Skill tag selector
- "Save Goals" button
- If goals already set: shows 3 goals in read-only format

**Evidence Pins section:**
- "+ Add Evidence" button → opens modal with:
  - Goal selector
  - URL input OR file upload tab
  - Short description field
  - Skill tag
- Already-pinned evidence as cards showing: link/file name, goal and skill
  tagged, date added, Industry Supervisor endorse/flag status as icons

**Sunday Pulse Check card:**
- 3 goals each with hit/miss toggle
- One-sentence reflection textarea with live 140-character counter
- "Submit Reflection" button
- If not yet Sunday: card is grayed out with label "Available on Sunday"

**Supervisor Feedback section:**
- Coaching tips and endorsements from Industry Supervisor for current week
- Each showing: supervisor name, date, their note

---

### Screen 9 — Growth Dashboard

Visual record of development across entire internship.

**Top: 4 summary cards:**
1. Goals Set (cumulative total)
2. Goals Hit (with hit rate percentage)
3. Evidence Pins (total)
4. Weeks Completed (out of total weeks)

**Skill Growth Chart:**
- Line chart: week numbers on x-axis, skill levels 1–5 on y-axis
- One line per tracked skill
- Toggle buttons to show/hide individual skills

**Goals Hit vs Missed bar chart:**
- One bar group per week: green for hit, red for missed

**Competency Rubric card:**
- Each skill with a 5-level progress bar
- Current level highlighted
- Target level marker
- Label showing Industry Supervisor's endorsement status

**Unified Assessment Framework Progress:**
- Accordion listing all learning objectives
- Status per objective: Not Started, In Progress, or Completed

---

### Screen 10 — Notifications Page

Filter tabs: All, Unread, Applications, Pulse, Alerts

Each notification:
- Type icon
- Notification text
- Relative timestamp

"Mark All as Read" button at top right. Clicking any notification navigates
to the relevant page.

---

### Screen 11 — Profile and Settings

Sections:
- Personal Information (editable fields)
- Change Password
- Notification Preferences (per-category toggle switches)
- My Profile Preview tab — exactly how the student's profile appears to
  companies during application review: Fit Score, verified skills, job family
  and sub-role, projects, certifications

---

## PART TWO: COMPANY REPRESENTATIVE

### Who They Are
The Company Representative handles everything on the company side: registers
the company, posts opportunities, evaluates applicants, makes placement
decisions, creates Industry Supervisor accounts, and assigns supervisors to
accepted interns. Once a student is accepted and a supervisor is assigned,
the Company Rep steps back from day-to-day student experience.

---

### Screen 1 — Company Registration

Two-step form.

**Step 1:**
- Company name
- Industry
- Company size
- Website URL
- Optional LinkedIn URL
- Office address, city, state
- File upload: company logo
- File upload: CAC registration certificate

**Step 2:**
- Contact person full name
- Job title
- Work email
- Phone number
- Password + confirm password
- Terms and conditions checkbox

On submit: confirmation screen explaining account is under review by LASU
Super Admin and will be approved within 48 hours.

---

### Screen 2 — Company Dashboard Home

**Left sidebar:** Home, Post Internship, Manage Postings, Applications
Received, My Interns, Manage Supervisors, Performance Reports, Company
Profile, Notifications, Settings

**Main content:**
- Welcome heading with company name and Verified badge
- Four metric cards: Active Postings, Total Applicants, Interns Currently
  Placed, Fair Participation Score

- Fair Participation Score card (full content width):
  - Score inside a coloured ring: green above 70, amber 40–70, red below 40
  - Three reputation badge icons: Fair Participation Score, Intern
    Satisfaction (out of 5), Full-Time Offer Rate (percentage)
  - Note: "This score is visible to all LASU students. A higher score
    attracts stronger applicants."

- Active Postings table: columns for Internship Title, Track, Applications,
  Slots, Deadline, Status, Actions (View Applicants, Edit, Close)

---

### Screen 3 — Post Internship Page

**Form fields:**
- Internship title
- Job Family
- Sub-role (dynamically updated based on Job Family)
- Location with remote toggle
- Duration
- Number of slots
- Start date (date picker)
- Application deadline (date picker)
- Stipend: yes/no radio — if yes, reveals Naira amount field
- Rich text description area
- Responsibilities list builder (up to 8 items)
- Required skills section: each skill has a name field and a required level
  selector (1–5)

**Track type selection:**
- Two large card-style radio buttons:
  - Competitive Track: trophy icon, explains only students meeting skill
    requirements will be shortlisted
  - Equity and Developmental Track: seedling icon, explains students across
    all ability tiers are accepted
- Selecting Equity shows: the equity quota for the current cycle + a teal
  benefit banner explaining rewards of Equity Track participation

- Full-width blue "Post Internship" button at bottom

---

### Screen 4 — Manage Postings Page

All postings ever created, organised into tabs: Active, Closed, Draft, All.

Each posting: same table columns as dashboard. Actions: edit active
postings, close early, or review archived ones.

---

### Screen 5 — Applications Received Page

Posting selector at top (switches between different internship postings).

Filter tabs: All Applicants, Competitive Pool, Equity Pool, Shortlisted,
Accepted, Declined

Each applicant card:
- Avatar, name, department and level
- Fit Score badge
- Tier badge (Tier 1: blue, Tier 2: teal, Tier 3: amber)
- Track
- Top 3 matching skills as green pills
- Skill gaps as red pills
- "View Full Profile" button
- "Accept" and "Decline" buttons

Equity Pool tab: banner reminding Company Rep that shortlist must include a
balanced mix across all 3 tiers.

---

### Screen 6 — Student Full Profile View

Read-only evaluation view:
- Student name, department, level, CGPA at top
- Fit Score for this specific internship: large number with coloured ring
- Fit Analysis: green checkmarks for met skills, red indicators for gaps
  (exact level differences shown)
- Full verified skill profile
- Projects (titles and descriptions)
- Relevant coursework
- Certifications
- "Accept" and "Decline" buttons at bottom

---

### Screen 7 — My Interns Page

Active interns as cards: 2-column grid on desktop, 1-column on mobile.

Each card:
- Student name and avatar
- Department and university
- Internship role
- Current week number
- Weekly pulse status (green tick or amber warning)
- Mini list of current week goals with hit/miss icons
- Assigned Industry Supervisor name
- Links: "View Pulse Summary" and "Download Progress Report"

**If no supervisor assigned:** red warning banner on card reading "No
supervisor assigned — this intern cannot begin their weekly pulse until a
supervisor is assigned" + "Assign Supervisor" button directly on the card.

---

### Screen 8 — Assign Supervisor to Intern

Modal triggered from My Interns page.

- Intern's name and role shown at top
- Dropdown: all registered Industry Supervisors with names and job titles
- "Confirm Assignment" button

On confirm: system automatically notifies the assigned Industry Supervisor,
sends the student's department learning objectives to the supervisor, and
notifies the student of who their supervisor is.

If no supervisors registered yet: modal shows message with link to Manage
Supervisors page.

---

### Screen 9 — Manage Supervisors Page

Table: Name, Job Title, Work Email, Interns Currently Assigned, Actions
(Edit, Remove)

"Add New Supervisor" button at top → form: supervisor's full name, job
title, work email. Platform sends invitation email with password-set link.

Supervisors invited but not yet activated: "Pending" label + "Resend
Invitation" link.

---

### Screen 10 — Performance Reports Page

Three sections below filter controls at top:
1. Reputation metrics: Fair Participation Score (with breakdown), Intern
   Satisfaction rating, Full-Time Offer Rate
2. Downloadable end-of-cycle performance reports: Download button per report
   (CSV or printable HTML)
3. Line chart: Fair Participation Score trend across multiple cycles

---

### Screen 11 — Company Profile Page

- Live preview of company profile card as students see it (at top)
- Editable form: company name, industry, size, website, LinkedIn URL, office
  address, company bio, logo
- Reputation badges: read-only
- "Save Changes" button at bottom

---

### Screen 12 — Notifications Page

Notifications cover: new student applications, students accepting/declining
offers, supervisor account activations, intern missed pulse alerts (summary
level), system messages.

Each notification: icon, text, timestamp. Clicking navigates to relevant
page.

---

## PART THREE: INDUSTRY SUPERVISOR

### Who They Are
A staff member at the host organisation added by the Company Representative
and assigned to one or more interns. Responsible for: building the company
side of the Unified Assessment Framework, reviewing weekly pulse submissions
and leaving feedback, and monitoring overall student progress. No access to
internship postings, applications, company metrics, or administrative
features.

---

### Screen 1 — Account Activation

Received via email invitation after Company Rep adds their email.

- Name and email pre-filled (read-only)
- Create password
- Confirm password
- "Activate Account" button

---

### Screen 2 — Industry Supervisor Dashboard Home

**Left sidebar:** My Interns, Pulse Reviews, Assessment Frameworks,
Notifications, Settings

**Main content:**
- Heading: "Interns Under Your Supervision"
- Each student as a row:
  - Name and avatar
  - Internship role
  - Current week
  - Pulse status for current week: green (submitted), amber (late), red
    (missing)
  - Date of last activity
  - "Review This Week's Pulse" button
  - Students with 2+ consecutive missed pulses: row highlighted with red
    border + warning label

- Prominent action-required banner if any student has incomplete Unified
  Assessment Framework: "Action Required: You have students whose assessment
  framework has not been completed yet" with link to Assessment Frameworks
  page.

---

### Screen 3 — Assessment Frameworks Page

Lists all assigned students and framework status per student:
- Pending (supervisor has not yet created company objectives)
- In Progress (started but not submitted)
- Submitted (merged framework sent to Academic Supervisor)
- Approved (Academic Supervisor approved, now live)

**Framework building view (on click):**
- Left side: read-only panel of university department learning objectives
  (arrived automatically when student was assigned)
- Right side: form where Industry Supervisor writes up to 10 company-specific
  objectives
- "Submit Framework" button → platform merges both sets, sends combined
  framework to Academic Supervisor

If Academic Supervisor requests changes: their comments appear here and
the supervisor can revise and resubmit.

Once approved: framework appears as read-only live document.

---

### Screen 4 — Pulse Review Page

Accessed via "Review This Week's Pulse" next to any student.

Top: student name, role, current week.

For each of the student's 3 micro-goals — a card showing:
- Goal text
- Linked skill
- Student's hit/miss toggle
- Student's Sunday reflection
- Pinned evidence within the goal card: URL or file link, student's
  description, skill tagged
- Two action buttons per piece of evidence: "Endorse" (green), "Flag"
  (amber)
- Text input below each piece of evidence: optional coaching tip (max 200
  characters)

"Submit Feedback" button at bottom. Supervisor can save a draft but must
review all goals before submitting.

---

### Screen 5 — Student Profile View

Read-only, progress-focused.

- Student basic info: name, department, level, CGPA
- Verified skill profile
- Read-only version of student's Growth Dashboard: skill growth line chart,
  goals hit vs missed bar chart, competency rubric card, full history of all
  pulse submissions
- Unified Assessment Framework at bottom: objective completion statuses

Nothing on this screen is editable.

---

### Screen 6 — Notifications Page

Notifications cover: new student being assigned, automatic arrival of
department objectives signalling a framework needs to be built, student
submitting weekly pulse awaiting review, reminders when a student misses a
deadline, Academic Supervisor feedback on a submitted framework, confirmation
when a framework is approved.

---

## PART FOUR: HEAD OF DEPARTMENT

### Who They Are
The administrative gatekeeper for the academic side. Mirrors the Company
Representative on the company side. Registers the department, gets verified
by Super Admin, creates Academic Supervisor accounts, and assigns them to
placed students. Does not review pulses, leave student feedback, or approve
assessment frameworks.

---

### Screen 1 — Head of Department Registration

Form fields:
- Full name
- Official title
- Faculty
- Department
- Official university email
- Phone number
- Upload: staff ID or official confirmation letter
- Password + confirm password

On submit: confirmation screen explaining account is under review and will
be activated within 48 hours.

---

### Screen 2 — Head of Department Dashboard Home

**Left sidebar:** Home, My Department Students, Manage Academic Supervisors,
Assign Supervisors, Departmental Reports, Notifications, Settings

**Main content:**
- Welcome heading: name, department, Verified badge
- Four metric cards: Total Students Registered (from this department),
  Students Placed this cycle, Students Unplaced and actively searching,
  Students with Active Internships

- Placement Activity Feed: live list of recent events involving department
  students (student accepted by company, framework approved, red flag alert
  triggered). Each item: timestamped, links to relevant student or page.

- Action Required section: cards for every student accepted into an
  internship but not yet assigned an Academic Supervisor. Each card: student
  name, company and role, "Assign Supervisor" button directly on card.

---

### Screen 3 — My Department Students Page

Full list of all department students on the platform.

Tabs: All Students, Placed, Unplaced, Completed

Each row: student name, matric number, academic level, internship status,
assigned Academic Supervisor name (if exists), "View Student" button.

"View Student" opens high-level summary: job family, sub-role, Fit Score,
placement status. NOT the detailed pulse submission content.

---

### Screen 4 — Manage Academic Supervisors Page

Table: Name, Staff Title, Official Email, Students Currently Assigned, Edit
and Remove actions.

"Add New Supervisor" button at top → form: lecturer's full name, staff
title, official university email. Platform sends invitation email with
activation link.

Supervisors not yet activated: "Pending" label + "Resend Invitation" link.

---

### Screen 5 — Assign Supervisors Page

Two panels (side by side on desktop, stacked on mobile):

Left panel: students accepted but not yet assigned a supervisor, each
showing name, company, internship role.

Right panel: available Academic Supervisors with name, current number of
assigned students, availability status.

HoD selects a student and a supervisor → clicks "Confirm Assignment". System
notifies Academic Supervisor and the student, updates student's card.

If all supervisors are at capacity: warning prompting HoD to add more.

---

### Screen 6 — Departmental Reports Page

Filter controls at top: academic session, internship cycle.

Three report sections:
1. Overall placement statistics: total students, placement percentage, track
   breakdown, average Fit Score
2. Company engagement: which companies accepted students from this
   department and how many
3. Student progress summary: average pulse submission rate, number of
   students who triggered alerts, framework approval timing

All sections: Export as CSV or Print.

---

### Screen 7 — Notifications Page

Notifications cover: student accepted needing supervisor assigned, new
Academic Supervisor activating their account, alerts when department student
misses multiple consecutive pulses, system messages from Super Admin,
confirmation when student's framework has been approved.

---

## PART FIVE: ACADEMIC SUPERVISOR

### Who They Are
A lecturer invited and registered by the Head of Department and assigned to
one or more students. Academic equivalent of the Industry Supervisor. Covers:
reviewing and approving the Unified Assessment Framework, monitoring weekly
pulse submissions from the university side, and watching for red flags. No
access to internship postings, company metrics, or application management.

---

### Screen 1 — Account Activation

Receives email invitation after Head of Department adds their email.

- Name and email pre-filled (read-only)
- Create password
- Confirm password
- "Activate Account" button

---

### Screen 2 — Academic Supervisor Dashboard Home

**Left sidebar:** My Students, Pulse Overview, Assessment Frameworks, Alerts,
Notifications, Settings

**Top summary cards:**
1. Total assigned students
2. Students who submitted pulse this week vs those who have not

**Student list (each row):**
- Name and avatar
- Company and internship role
- Current week
- Pulse status: green (submitted), amber (late), red (missing)
- "View Pulse Overview" button
- "View Full Profile" button

Students with 2+ consecutive missed submissions: row highlighted red with
flag icon.

If any framework is awaiting approval: prominent banner "Action Required:
You have frameworks awaiting your review and approval" with link to
Assessment Frameworks page.

---

### Screen 3 — Assessment Frameworks Page

Lists all assigned students with framework status per student:
- Awaiting Industry Supervisor
- Pending Your Approval
- Changes Requested
- Approved

**Framework review view (on click):**
- Merged list of objectives: university objectives and company objectives,
  each labelled by source
- "Approve Framework" button: makes framework live immediately on all
  relevant dashboards
- "Request Changes" button: opens text input for comments sent to Industry
  Supervisor

Back-and-forth continues until Academic Supervisor approves.

---

### Screen 4 — Pulse Overview Page

Week selector at top (can view any week in the internship cycle).

Table: one row per student showing:
- Name
- Goals set
- Goals hit vs missed
- Whether Sunday reflection was submitted
- Overall pulse status
- "View Details" link → opens full pulse submission as read-only view
  (Academic Supervisor can see everything student submitted and everything
  Industry Supervisor endorsed/flagged, but does NOT leave their own direct
  feedback on pulse submissions)

---

### Screen 5 — Alerts Page

Lists all students who triggered automatic warnings.

Each alert:
- Student name
- Number of weeks missed
- Date of last submission
- "View Student" button
- "Log Contact" button: lets Academic Supervisor record they reached out to
  the student outside the platform, adding a timestamped note to the
  student's record visible to the Head of Department. Logging contact does
  NOT automatically resolve the alert.

---

### Screen 6 — Student Full Profile View

Read-only, progress-focused.

Top: student name, matric number, department, level, CGPA, verified skill
profile.

Main body: complete Growth Dashboard — skill growth chart, goals hit vs
missed chart, competency rubric card, full pulse submission timeline.

Unified Assessment Framework at bottom: objective completion statuses.

Nothing editable.

---

### Screen 7 — Notifications Page

Notifications cover: new student being assigned, framework submitted by
Industry Supervisor awaiting approval, resubmitted framework after changes
requested, student missing pulse deadline, system messages from Super Admin
or Head of Department.

---

## PART SIX: SUPER ADMIN

### Who They Are
Highest authority on the platform. Verifies and manages all institutional
accounts, configures core platform settings (Job Families, fair allocation
parameters), monitors platform-wide metrics and compliance, generates
institutional reports. Does NOT interact with individual students, pulse
submissions, or assessment frameworks.

Desktop-first. Permanent fixed left sidebar that never collapses. Mobile:
4-tab bottom bar (Dashboard, Verify, Users, Profile). Other screens
accessible via Quick Access section on dashboard.

---

### Screen 1 — Login Page

Centred card on neutral background.

- Platform logo
- Email field
- Password field with show/hide toggle
- "Log In" button

No register link. No forgot password link. Super Admin account is
pre-created as part of platform setup.

---

### Screen 2 — Dashboard Home

**Permanent left sidebar:**
- Platform logo at top
- Super Admin avatar, name, role label below
- Full navigation: Dashboard, Verify Accounts, Manage Users, Configure Job
  Families, Fair Allocation Settings, Institutional Reports, System Settings,
  Notifications, Profile
- Active page highlighted blue
- Red numbered badges on sidebar links with pending items
- Log Out link at very bottom

**Main content:**
- Greeting + current internship cycle name

- Six metric cards (2 rows of 3):
  1. Total Students Registered
  2. Total Companies Verified
  3. Total Heads of Department Registered
  4. Total Active Internship Placements
  5. Students Without a Placement
  6. Platform-Wide Equity Track Compliance Rate
  - Cards with problematic values: tinted amber or red

- Pending Verifications panel: count of pending company accounts and pending
  HoD accounts, each with "Go to Queue" button. When empty: replaced by
  green confirmation line.

- Platform Activity Chart: line graph over past 30 days, 4 data series:
  New Registrations, New Internship Postings, New Placements, Active Pulse
  Submissions. Toggle buttons to show/hide individual series, hover tooltips
  for exact values.

- Recent Actions log: last 10 significant system events with timestamp,
  description, and user who triggered each.

---

### Screen 3 — Verify Accounts Page

Two tabs: Companies and Heads of Department.

Each tab: table with columns for Account Name, Submitted Date, Documents,
Actions.

- Documents column: "View Documents" link → side panel slides in from right
  showing uploaded files with Download button
- Actions: "Verify" (opens confirmation modal) and "Reject" (opens modal
  with required text input for rejection reason, sent to applicant by email)

---

### Screen 4 — Manage Users Page

- Search bar + role filter dropdown at top
- Table: Name, Role (coloured pill badge), Date Joined, Status (Active /
  Pending / Suspended), Actions (View Profile, Suspend, Delete)
- Suspend: toggles status badge, replaces Suspend link with Reactivate
- Delete: two-step confirmation — Super Admin must type the word DELETE
  before action completes
- "Create New User" button at top right → modal with role selector and
  dynamic fields

---

### Screen 5 — Configure Job Families Page

List of 10 Job Families with Edit button per row and "Add New Family" button
at top.

"Edit" → dedicated full-page edit view with breadcrumb at top.

**Edit page — four sections:**
1. Family name and description fields
2. Matching weight sliders for CGPA, Skills, Projects, Coursework with live
   total indicator that turns red if total exceeds 100
3. Sub-roles list with editable rows, drag handles, delete icons, and "Add
   Sub-Role" button
4. Note: "Changes take effect from the next internship cycle"

"Save Changes" and "Cancel" buttons at top right.

---

### Screen 6 — Fair Allocation Settings Page

Single white card:
- Explanatory paragraph at top
- Number inputs: Minimum Equity Quota Percentage, Maximum Equity Quota
  Percentage
- Fair Participation Score weight sliders with live total indicator
- "Save Settings" button
- Note: "Changes take effect at the start of the next cycle."

---

### Screen 7 — Institutional Reports Page

Two-panel layout:
- Left panel (30%): filter dropdowns (Academic Session, Faculty, Department,
  Company, Track Type, Internship Cycle) + 5 selectable report types:
  Placement Report, Skill Gap Report, Company Participation Report, Student
  Progress Report, Equity Compliance Report. "Generate Report" button at
  bottom.
- Right panel (70%): generated report as tables, charts, and summary
  statistics. "Export as CSV" and "Print as HTML" buttons at top right.

---

### Screen 8 — System Settings Page

Single scrollable page, five sections divided by horizontal dividers:

1. **Internship Cycle Settings:** start and end date pickers
2. **Supervisor Capacity Settings:** number input for max students per
   Academic Supervisor
3. **Alert Threshold Settings:** number input for consecutive missed pulses
   before alert triggers (default: 2)
4. **Feature Toggles:** list of platform features each with toggle switch
   and brief inline confirmation prompt when toggled off
5. **Department Learning Objectives Management:** expandable list of
   faculties → departments → stored SIWES objectives, each editable with
   Add and Delete options and Save button per department

"Save All Changes" button at top right of page.

---

### Screen 9 — Notifications Page

Filter tabs: All, Unread, Verifications, Users, System, Reports

Each notification: type icon in coloured circle, notification text, relative
timestamp, unread dot on far left.

"Mark All as Read" button at top right.

Clicking any notification navigates to the relevant page.

---

### Screen 10 — Profile Page

Three sections divided by horizontal dividers:

1. **Personal Information:** large circular avatar with Upload Photo and
   Remove Photo options; editable fields for Full Name, Official Email, Phone
   Number; "Save Changes" button.
2. **Security Settings:** three password fields (Current Password, New
   Password, Confirm New Password) each with show/hide toggle; "Save New
   Password" button with password requirements note.
3. **Notification Preferences:** list of notification categories each with
   two toggle switches — In-App and Email. Categories: Verification Requests,
   User Management Alerts, System Errors, Report Generation Confirmations.
