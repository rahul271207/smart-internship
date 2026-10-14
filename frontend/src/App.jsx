import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Landing from "./pages/public/Landing";
import { About, Contact, HowItWorks } from "./pages/public/StaticPages";
import { Login, Register } from "./pages/auth/AuthPages";
import {
  ApplicationsPage,
  HistoryPage,
  InternshipDetail,
  InternshipDiscovery,
  MatchAnalysisPage,
  PreferencesPage,
  ResultsPage,
  ResumePage,
  StudentDashboard,
  StudentProfile,
  StudentSettings,
} from "./pages/student/StudentPages";
import {
  InternshipForm,
  OrgDashboard,
  OrgInternshipDetail,
  OrgInternships,
  OrgSettings,
  OrgStats,
} from "./pages/organization/OrgPages";
import {
  AdminApplications,
  AdminAudit,
  AdminConfig,
  AdminDashboard,
  AdminEligibility,
  AdminInternships,
  AdminMatching,
  AdminOrganizations,
  AdminResults,
  AdminSettings,
  AdminSimulation,
  AdminStudents,
  AdminWaitlist,
  AllocationControl,
} from "./pages/admin/AdminPages";

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-sm text-slate-500">Loading session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register role="student" />} />
        <Route path="/register/organization" element={<Register role="organization" />} />
      </Route>

      <Route
        path="/student"
        element={
          <Protected roles={["student"]}>
            <DashboardLayout role="student" />
          </Protected>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="profile/edit" element={<StudentProfile editable />} />
        <Route path="internships" element={<InternshipDiscovery />} />
        <Route path="internships/:id" element={<InternshipDetail />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="matches" element={<MatchAnalysisPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      <Route
        path="/org"
        element={
          <Protected roles={["organization"]}>
            <DashboardLayout role="organization" />
          </Protected>
        }
      >
        <Route index element={<OrgDashboard />} />
        <Route path="internships/new" element={<InternshipForm />} />
        <Route path="internships" element={<OrgInternships />} />
        <Route path="internships/:id" element={<OrgInternshipDetail />} />
        <Route path="stats" element={<OrgStats />} />
        <Route path="settings" element={<OrgSettings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <Protected roles={["admin"]}>
            <DashboardLayout role="admin" />
          </Protected>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="organizations" element={<AdminOrganizations />} />
        <Route path="internships" element={<AdminInternships />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="eligibility" element={<AdminEligibility />} />
        <Route path="matching" element={<AdminMatching />} />
        <Route path="allocation" element={<AllocationControl />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="waitlist" element={<AdminWaitlist />} />
        <Route path="simulation" element={<AdminSimulation />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="config" element={<AdminConfig />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
