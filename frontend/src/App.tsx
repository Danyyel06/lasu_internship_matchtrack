import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import StudentRegister from './pages/register/StudentRegister';
import CompanySignUp from './pages/register/CompanySignUp';
import OnboardingWizard from './pages/student/OnboardingWizard';
import CompanyOnboardingWizard from './pages/company/CompanyOnboardingWizard';
import CompanyDashboardHome from './pages/company/DashboardHome';
import PostInternship from './pages/company/PostInternship';
import ManagePostings from './pages/company/ManagePostings';
import ApplicationsReceived from './pages/company/ApplicationsReceived';
import MyInterns from './pages/company/MyInterns';
import StudentDashboardHome from './pages/student/DashboardHome';
import BrowseInternships from './pages/student/BrowseInternships';
import InternshipDetail from './pages/student/InternshipDetail';
import MyApplications from './pages/student/MyApplications';
import StudentLayout from './layouts/StudentLayout';
import CompanyLayout from './layouts/CompanyLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import GrowthDashboard from './pages/student/GrowthDashboard';

// New: Evidence Log (replaces Pulse)
import LogDashboard from './pages/student/LogDashboard';
import LogCheckinForm from './pages/student/LogCheckinForm';
import AIQuiz from './pages/student/AIQuiz';

import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import AccountActivation from './pages/supervisor/AccountActivation';
import SupervisorInterns from './pages/supervisor/Interns';
import InternProfile from './pages/supervisor/InternProfile';
import SupervisorAlerts from './pages/supervisor/Alerts';
import SupervisorProfile from './pages/supervisor/Profile';
import ManageSupervisors from './pages/company/ManageSupervisors';
import CompanyProfile from './pages/company/Profile';

// New: Monthly Review (replaces Frameworks for supervisor)
import MonthlyReviewList from './pages/supervisor/MonthlyReviewList';
import MonthlyDigest from './pages/supervisor/MonthlyDigest';

// Phase 5 Imports
import HodLayout from './layouts/HodLayout';
import HodRegistration from './pages/hod/Registration';
import HodDashboard from './pages/hod/Dashboard';
import HodStudents from './pages/hod/Students';
import HodSupervisors from './pages/hod/Supervisors';
import HodAlerts from './pages/hod/Alerts';
import HodReports from './pages/hod/Reports';
import HodProfile from './pages/hod/Profile';

import AcademicSupervisorLayout from './layouts/AcademicSupervisorLayout';
import AcadSupActivation from './pages/academic-supervisor/AccountActivation';
import AcadSupDashboard from './pages/academic-supervisor/Dashboard';
import AcadSupAlerts from './pages/academic-supervisor/Alerts';
import AcadSupProfile from './pages/academic-supervisor/Profile';
import AcadSupStudentProfile from './pages/academic-supervisor/StudentProfile';
import AcadSupLogIntervention from './pages/academic-supervisor/LogIntervention';

// New: Log Wall (replaces Pulse + Frameworks for academic supervisor)
import LogWall from './pages/academic-supervisor/LogWall';

// Phase 6 Super Admin Imports
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminLogin from './pages/super-admin/Login';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminVerifyAccounts from './pages/super-admin/VerifyAccounts';
import SuperAdminManageUsers from './pages/super-admin/ManageUsers';
import SuperAdminJobFamilies from './pages/super-admin/JobFamilies';
import SuperAdminFairAllocation from './pages/super-admin/FairAllocation';
import SuperAdminReports from './pages/super-admin/Reports';
import SuperAdminSystemSettings from './pages/super-admin/SystemSettings';
import SuperAdminNotifications from './pages/super-admin/Notifications';
import SuperAdminProfile from './pages/super-admin/Profile';

// Placeholder Pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <h2 className="text-2xl font-bold text-neutral-400">{title}</h2>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public / Entry Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/register/student" element={<StudentRegister />} />
      <Route path="/register/company" element={<CompanySignUp />} />
      
      {/* Student Onboarding (no sidebar) */}
      <Route path="/student/onboarding" element={<OnboardingWizard />} />

      {/* Company Onboarding (no sidebar) */}
      <Route path="/company/onboarding" element={<CompanyOnboardingWizard />} />

      {/* Supervisor Account Activation */}
      <Route path="/supervisor/activate" element={<AccountActivation />} />
      <Route path="/academic-supervisor/activate" element={<AcadSupActivation />} />
      <Route path="/hod/register" element={<HodRegistration />} />

      {/* Student Protected Routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboardHome />} />
        <Route path="browse" element={<BrowseInternships />} />
        <Route path="browse/:id" element={<InternshipDetail />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="profile" element={<Placeholder title="My Profile & Fit Score" />} />
        <Route path="log" element={<LogDashboard />} />
        <Route path="log/submit/:checkInType" element={<LogCheckinForm />} />
        <Route path="log/quiz/:logId" element={<AIQuiz />} />
        <Route path="growth" element={<GrowthDashboard />} />
      </Route>

      {/* Company Protected Routes */}
      <Route path="/company" element={<CompanyLayout />}>
        <Route path="dashboard" element={<CompanyDashboardHome />} />
        <Route path="post-internship" element={<PostInternship />} />
        <Route path="edit-internship/:id" element={<PostInternship />} />
        <Route path="postings" element={<ManagePostings />} />
        <Route path="applications" element={<ApplicationsReceived />} />
        <Route path="interns" element={<MyInterns />} />
        <Route path="supervisors" element={<ManageSupervisors />} />
        <Route path="reports" element={<Placeholder title="Performance Reports" />} />
        <Route path="profile" element={<CompanyProfile />} />
      </Route>

      {/* Supervisor Protected Routes */}
      <Route path="/supervisor" element={<SupervisorLayout />}>
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="interns" element={<SupervisorInterns />} />
        <Route path="interns/:id" element={<InternProfile />} />
        <Route path="monthly-review" element={<MonthlyReviewList />} />
        <Route path="monthly-review/:studentId/:monthYear" element={<MonthlyDigest />} />
        <Route path="alerts" element={<SupervisorAlerts />} />
        <Route path="profile" element={<SupervisorProfile />} />
      </Route>

      {/* HOD Protected Routes */}
      <Route path="/hod" element={<HodLayout />}>
        <Route path="home" element={<HodDashboard />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="supervisors" element={<HodSupervisors />} />
        <Route path="alerts" element={<HodAlerts />} />
        <Route path="reports" element={<HodReports />} />
        <Route path="profile" element={<HodProfile />} />
      </Route>

      {/* Academic Supervisor Protected Routes */}
      <Route path="/academic-supervisor" element={<AcademicSupervisorLayout />}>
        <Route path="home" element={<AcadSupDashboard />} />
        <Route path="log-wall" element={<LogWall />} />
        <Route path="alerts" element={<AcadSupAlerts />} />
        <Route path="alerts/:studentId/log" element={<AcadSupLogIntervention />} />
        <Route path="profile" element={<AcadSupProfile />} />
        <Route path="student/:id" element={<AcadSupStudentProfile />} />
      </Route>

      {/* Super Admin Routes */}
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      <Route path="/super-admin" element={<SuperAdminLayout />}>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="verify" element={<SuperAdminVerifyAccounts />} />
        <Route path="users" element={<SuperAdminManageUsers />} />
        <Route path="job-families" element={<SuperAdminJobFamilies />} />
        <Route path="fair-allocation" element={<SuperAdminFairAllocation />} />
        <Route path="reports" element={<SuperAdminReports />} />
        <Route path="settings" element={<SuperAdminSystemSettings />} />
        <Route path="notifications" element={<SuperAdminNotifications />} />
        <Route path="profile" element={<SuperAdminProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
