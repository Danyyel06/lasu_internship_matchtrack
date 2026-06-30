import re

with open("frontend/src/App.tsx", "r") as f:
    content = f.read()

# Add imports
imports = '''import StudentLayout from './layouts/StudentLayout';
import CompanyLayout from './layouts/CompanyLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import PulseDashboard from './pages/student/PulseDashboard';
import GrowthDashboard from './pages/student/GrowthDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import PulseReview from './pages/supervisor/PulseReview';
import AccountActivation from './pages/supervisor/AccountActivation';
'''
content = content.replace(\"import StudentLayout from './layouts/StudentLayout';\\nimport CompanyLayout from './layouts/CompanyLayout';\", imports)

# Replace Student placeholder routes
student_routes = '''<Route path="profile" element={<Placeholder title="My Profile & Fit Score" />} />
        <Route path="pulse" element={<PulseDashboard />} />
        <Route path="growth" element={<GrowthDashboard />} />'''
content = re.sub(r'<Route path=\"profile\" element={<Placeholder title=\"My Profile & Fit Score\" />} />\s*<Route path=\"pulse\" element={<Placeholder title=\"Pulse Dashboard\" />} />\s*<Route path=\"growth\" element={<Placeholder title=\"Growth Dashboard\" />} />', student_routes, content)

# Add supervisor routes before closing Routes
supervisor_routes = '''
      {/* Supervisor Account Activation */}
      <Route path="/supervisor/activate" element={<AccountActivation />} />

      {/* Supervisor Protected Routes */}
      <Route path="/supervisor" element={<SupervisorLayout />}>
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="interns" element={<Placeholder title="My Interns" />} />
        <Route path="pulse-review/:id" element={<PulseReview />} />
        <Route path="frameworks" element={<Placeholder title="Framework Approvals" />} />
      </Route>
    </Routes>'''

content = content.replace('</Routes>', supervisor_routes)

with open("frontend/src/App.tsx", "w") as f:
    f.write(content)

